const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/ventas/agregar -> Registra una nueva venta
router.post('/agregar', async (req, res) => {
  const connection = await pool.getConnection(); 
  try {
    const { producto_id, cliente_id, fecha_venta, cantidad, precio_unitario } = req.body;
    if (!producto_id || !cliente_id || !fecha_venta || !cantidad || !precio_unitario) {
      return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
    }

    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT unidades_disponibles FROM productos WHERE producto_id = ? FOR UPDATE',
      [producto_id]
    );

    const stockActual = rows[0].unidades_disponibles;
    if (stockActual < cantidad) {
      await connection.rollback(); 
      return res.status(400).json({ success: false, error: `Stock insuficiente. Disponible: ${stockActual}` });
    }

    await connection.query(
      'UPDATE productos SET unidades_disponibles = unidades_disponibles - ? WHERE producto_id = ?',
      [cantidad, producto_id]
    );

    await connection.query(
      'INSERT INTO ventas (producto_id, cliente_id, fecha_venta, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?)',
      [producto_id, cliente_id, fecha_venta, cantidad, precio_unitario]
    );

    await connection.commit(); 
    res.status(201).json({ success: true, message: 'Venta registrada con éxito.' });
  } catch (err) {
    await connection.rollback(); 
    console.error('Error al registrar venta:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor al procesar la venta.' });
  } finally {
    connection.release(); 
  }
});

// GET /api/ventas -> Listar todas las ventas
router.get('/', async (req, res) => {
  try {
    const [ventas] = await pool.query(
      `SELECT v.venta_id, v.cantidad, v.precio_unitario, p.nombre_producto, c.nombre AS cliente
       FROM ventas v
       JOIN productos p ON v.producto_id = p.producto_id
       JOIN clientes c ON v.cliente_id = c.cliente_id
       ORDER BY v.fecha_venta DESC`
    );
    res.json(ventas);
  } catch (err) {
    console.error('Error al obtener ventas:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor al obtener ventas.' });
  }
});

// DELETE /api/ventas/:id -> Elimina una venta
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.beginTransaction();
    const [ventaRows] = await connection.query(
      'SELECT producto_id, cantidad FROM ventas WHERE venta_id = ? FOR UPDATE',
      [id]
    );

    if (ventaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Venta no encontrada.' });
    }

    const { producto_id, cantidad } = ventaRows[0];
    await connection.query(
      'UPDATE productos SET unidades_disponibles = unidades_disponibles + ? WHERE producto_id = ?',
      [cantidad, producto_id]
    );

    await connection.query('DELETE FROM ventas WHERE venta_id = ?', [id]);
    await connection.commit();
    res.json({ success: true, message: 'Venta eliminada correctamente.' });
  } catch (err) {
    await connection.rollback();
    console.error('Error al eliminar venta:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor al eliminar la venta.' });
  } finally {
    connection.release();
  }
});

// ****** NUEVA RUTA PARA OBTENER VENTAS POR CLIENTE ******
router.get('/cliente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [ventas] = await pool.query(
          `SELECT 
              v.venta_id,
              v.producto_id,
              v.cliente_id,
              v.fecha_venta,
              v.cantidad,
              v.precio_unitario,
              p.nombre_producto,
              c.nombre AS cliente
          FROM ventas v
          JOIN productos p ON v.producto_id = p.producto_id
          JOIN clientes c ON v.cliente_id = c.cliente_id
          ORDER BY v.fecha_venta DESC`
        );
        res.json(ventas);
    } catch (err) {
        console.error('Error al obtener el historial de ventas del cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ****** NUEVA RUTA PARA FILTRAR VENTAS ******
// GET /api/ventas/filtrar?fechaInicio=...&fechaFin=...&clienteId=...&productoId=...
router.get('/filtrar', async (req, res) => {
    try {
        const { fechaInicio, fechaFin, clienteId, productoId } = req.query;

        let query = `
            SELECT 
                v.venta_id, 
                v.fecha_venta, 
                c.nombre AS cliente, 
                p.nombre_producto, 
                v.cantidad, 
                v.precio_unitario, 
                (v.cantidad * v.precio_unitario) AS subtotal
            FROM ventas v
            JOIN clientes c ON v.cliente_id = c.cliente_id
            JOIN productos p ON v.producto_id = p.producto_id
            WHERE 1=1 
        `; // "WHERE 1=1" es un truco para poder añadir cláusulas AND fácilmente

        const params = [];

        if (fechaInicio && fechaFin) {
            query += ' AND v.fecha_venta BETWEEN ? AND ?';
            params.push(fechaInicio, fechaFin);
        }
        if (clienteId) {
            query += ' AND v.cliente_id = ?';
            params.push(clienteId);
        }
        if (productoId) {
            query += ' AND v.producto_id = ?';
            params.push(productoId);
        }

        query += ' ORDER BY v.fecha_venta DESC';

        const [ventas] = await pool.query(query, params);
        res.json(ventas);

    } catch (err) {
        console.error('Error al filtrar ventas:', err);
        res.status(500).json({ error: 'Error interno del servidor al filtrar ventas.' });
    }
});



// PUT /api/ventas/:id -> Modificar venta
router.put('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { producto_id, cliente_id, fecha_venta, cantidad, precio_unitario } = req.body;

    await connection.beginTransaction();

    // Obtener venta actual
    const [ventaRows] = await connection.query(
      'SELECT producto_id, cantidad FROM ventas WHERE venta_id = ? FOR UPDATE',
      [id]
    );

    if (ventaRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Venta no encontrada.' });
    }

    const ventaActual = ventaRows[0];

    // Ajustar stock del producto anterior
    await connection.query(
      'UPDATE productos SET unidades_disponibles = unidades_disponibles + ? WHERE producto_id = ?',
      [ventaActual.cantidad, ventaActual.producto_id]
    );

    // Verificar stock del nuevo producto
    const [prodRows] = await connection.query(
      'SELECT unidades_disponibles FROM productos WHERE producto_id = ? FOR UPDATE',
      [producto_id]
    );
    if (prodRows[0].unidades_disponibles < cantidad) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Stock insuficiente para este producto.' });
    }

    // Ajustar stock del nuevo producto
    await connection.query(
      'UPDATE productos SET unidades_disponibles = unidades_disponibles - ? WHERE producto_id = ?',
      [cantidad, producto_id]
    );

    // Actualizar la venta
    await connection.query(
      'UPDATE ventas SET producto_id = ?, cliente_id = ?, fecha_venta = ?, cantidad = ?, precio_unitario = ? WHERE venta_id = ?',
      [producto_id, cliente_id, fecha_venta, cantidad, precio_unitario, id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Venta modificada correctamente.' });
  } catch (err) {
    await connection.rollback();
    console.error('Error al modificar venta:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});


module.exports = router;
