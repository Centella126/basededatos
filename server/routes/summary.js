const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const [summary] = await pool.query(`
      SELECT
        -- Suma de todas las ventas (Ingreso Bruto)
        (SELECT IFNULL(SUM(precio_unitario * cantidad), 0) FROM ventas) AS totalVentas,
        
        -- Suma de todos los abonos (Dinero recibido)
        (SELECT IFNULL(SUM(monto_abono), 0) FROM abonos) AS totalAbonos,
        
        -- Saldo por cobrar (Total Ventas - Total Abonos)
        ((SELECT IFNULL(SUM(precio_unitario * cantidad), 0) FROM ventas) - (SELECT IFNULL(SUM(monto_abono), 0) FROM abonos)) AS totalPorCobrar,
        
        -- Inversión total en el stock actual
        (SELECT IFNULL(SUM(precio_compra * unidades_disponibles), 0) FROM productos) AS totalInvertidoEnProductos,
        
        -- Ganancia Neta Disponible para Retirar (nunca será negativa)
        -- Fórmula: GREATEST(0, Total Abonos - Costo de Productos Vendidos - Total Retiros)
        GREATEST(0, (
            (SELECT IFNULL(SUM(monto_abono), 0) FROM abonos) - 
            (SELECT IFNULL(SUM(v.cantidad * p.precio_compra), 0) 
             FROM ventas v 
             JOIN productos p ON v.producto_id = p.producto_id) -
            (SELECT IFNULL(SUM(monto_retiro), 0) FROM retiros)
        )) AS totalGananciaPorDia
    `);

    // El resultado de la consulta ya es un objeto con todos los valores
    res.json(summary[0]);

  } catch (err) {
    console.error('Error al obtener el resumen financiero:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;