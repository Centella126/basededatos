const express = require('express');
const router = express.Router();
const pool = require('../db');

// Función auxiliar para obtener el primer y último día del mes
const getMonthDateRange = (year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // El día 0 del siguiente mes es el último día del mes actual
    return {
        start: startDate.toISOString().slice(0, 10),
        end: endDate.toISOString().slice(0, 10),
    };
};

// GET /api/reportes/kpis?mes=YYYY-MM
router.get('/kpis', async (req, res) => {
    const { mes } = req.query;
    let dateRange = null;
    if (mes) {
        const [year, month] = mes.split('-');
        dateRange = getMonthDateRange(parseInt(year), parseInt(month));
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Total invertido (snapshot actual, no depende del mes)
        const [inventario] = await connection.query('SELECT SUM(precio_compra * unidades_disponibles) AS totalInvertido FROM productos');

        // 2. Total ventas (filtrado por mes)
        let ventasQuery = 'SELECT SUM(cantidad * precio_unitario) AS totalVentas FROM ventas';
        if (dateRange) ventasQuery += ` WHERE fecha_venta BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
        const [ventas] = await connection.query(ventasQuery);

        // 3. Categoría más vendida (filtrada por mes)
        let categoriaQuery = `
            SELECT c.nombre_categoria FROM ventas v
            JOIN productos p ON v.producto_id = p.producto_id
            JOIN categorias c ON p.categoria_id = c.categoria_id`;
        if (dateRange) categoriaQuery += ` WHERE v.fecha_venta BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
        categoriaQuery += ` GROUP BY c.nombre_categoria ORDER BY SUM(v.cantidad * v.precio_unitario) DESC LIMIT 1`;
        const [categoriaMasVendida] = await connection.query(categoriaQuery);

        // 4. Producto más rentable (filtrado por mes)
        let productoQuery = `
            SELECT p.nombre_producto FROM ventas v
            JOIN productos p ON v.producto_id = p.producto_id
            WHERE v.precio_unitario > p.precio_compra AND p.precio_compra IS NOT NULL`;
        if (dateRange) productoQuery += ` AND v.fecha_venta BETWEEN '${dateRange.start}' AND '${dateRange.end}'`;
        productoQuery += ` ORDER BY (v.precio_unitario - p.precio_compra) DESC LIMIT 1`;
        const [productoMayorMargen] = await connection.query(productoQuery);
        
        // 5. Stock crítico (snapshot actual, no depende del mes)
        const [stockCritico] = await connection.query('SELECT nombre_producto FROM productos WHERE unidades_disponibles <= 5 ORDER BY unidades_disponibles ASC');

        await connection.commit();
        
        res.json({
            totalInvertido: parseFloat(inventario[0].totalInvertido || 0),
            totalVentas: parseFloat(ventas[0].totalVentas || 0),
            categoriaMasVendida: categoriaMasVendida[0]?.nombre_categoria || 'N/A',
            productoMayorMargen: productoMayorMargen[0]?.nombre_producto || 'N/A',
            stockCritico: { count: stockCritico.length, productos: stockCritico.map(p => p.nombre_producto) }
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error al generar reportes KPI:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    } finally {
        connection.release();
    }
});

// GET /api/reportes/graficas?mes=YYYY-MM
router.get('/graficas', async (req, res) => {
    const { mes } = req.query;
    let whereClause = '';
    if (mes) {
        const [year, month] = mes.split('-');
        const { start, end } = getMonthDateRange(parseInt(year), parseInt(month));
        whereClause = `WHERE v.fecha_venta BETWEEN '${start}' AND '${end}'`;
    }

    try {
        const [data] = await pool.query(`
            SELECT 
                c.nombre_categoria AS categoria,
                COALESCE(SUM(v.cantidad * v.precio_unitario), 0) AS totalVentas,
                COALESCE(SUM(p.unidades_disponibles * p.precio_compra), 0) AS totalInversion
            FROM categorias c
            LEFT JOIN productos p ON c.categoria_id = p.categoria_id
            LEFT JOIN ventas v ON p.producto_id = v.producto_id ${whereClause}
            GROUP BY c.nombre_categoria
            ORDER BY totalVentas DESC
        `);
        res.json(data);
    } catch (err) {
        console.error('Error al generar datos para gráficas:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});



// GET /api/reportes/analisis-rapido
router.get('/analisis-rapido', async (req, res) => {
    try {
        const { mes } = req.query;
        let whereVentas = '';
        if (mes) {
            const [year, month] = mes.split('-');
            const startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
            const endDate = new Date(year, month, 0).toISOString().slice(0, 10);
            whereVentas = `WHERE v.fecha_venta BETWEEN '${startDate}' AND '${endDate}'`;
        }

        // 1. Categorías con ventas < inversión (filtrado por mes)
        const [categoriasEnRiesgo] = await pool.query(`
            SELECT categoria, totalVentas, totalInversion FROM (
                SELECT 
                    c.nombre_categoria AS categoria,
                    COALESCE(SUM(v.cantidad * v.precio_unitario), 0) AS totalVentas,
                    COALESCE(SUM(p.unidades_disponibles * p.precio_compra), 0) AS totalInversion
                FROM categorias c
                LEFT JOIN productos p ON c.categoria_id = p.categoria_id
                LEFT JOIN ventas v ON p.producto_id = v.producto_id ${whereVentas}
                GROUP BY c.nombre_categoria
            ) AS t
            WHERE t.totalVentas < t.totalInversion
        `);

        // 2. Productos con ventas bajas (filtrado por mes)
        const [productosBajasVentas] = await pool.query(`
            SELECT p.nombre_producto, COUNT(v.venta_id) AS numero_ventas
            FROM productos p
            LEFT JOIN ventas v ON p.producto_id = v.producto_id ${whereVentas}
            GROUP BY p.producto_id, p.nombre_producto
            HAVING numero_ventas <= 2
            ORDER BY numero_ventas ASC
            LIMIT 5
        `);

        // 3. Productos top en ventas (filtrado por mes)
        const [productosTop] = await pool.query(`
            SELECT p.nombre_producto, SUM(v.cantidad * v.precio_unitario) AS totalVendido
            FROM ventas v
            JOIN productos p ON v.producto_id = p.producto_id
            ${whereVentas}
            GROUP BY p.nombre_producto
            ORDER BY totalVendido DESC
            LIMIT 5
        `);

        // 4. Clientes con mayor adeudo (no depende del mes)
        const [clientesConAdeudo] = await pool.query(`
            SELECT c.nombre, (COALESCE(ventas_totales, 0) - COALESCE(abonos_totales, 0)) AS saldo
            FROM clientes c
            LEFT JOIN (
                SELECT cliente_id, SUM(cantidad * precio_unitario) AS ventas_totales
                FROM ventas GROUP BY cliente_id
            ) v ON c.cliente_id = v.cliente_id
            LEFT JOIN (
                SELECT cliente_id, SUM(monto_abono) AS abonos_totales
                FROM abonos GROUP BY cliente_id
            ) a ON c.cliente_id = a.cliente_id
            HAVING saldo > 0.01
            ORDER BY saldo DESC
            LIMIT 5
        `);

        res.json({
            categoriasEnRiesgo,
            productosBajasVentas,
            productosTop,
            clientesConAdeudo
        });

    } catch (err) {
        console.error('Error al generar análisis rápido:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;