const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper para obtener un único valor numérico de una consulta
async function scalar(query, params = []){
  const [rows] = await pool.query(query, params);
  if (!rows || rows.length === 0) return 0;
  const val = Object.values(rows[0])[0];
  return val === null ? 0 : Number(val);
}

// Endpoint: /api/summary
router.get('/', async (req, res) => {
  try {
    // 1. Total de ventas (precio de venta)
    const totalVentas = await scalar('SELECT IFNULL(SUM(subtotal), 0) AS totalVentas FROM ventas');

    // 2. Total de abonos recibidos
    const totalAbonos = await scalar('SELECT IFNULL(SUM(monto_abono), 0) AS totalAbonos FROM abonos');

    // 3. Total por cobrar
    const totalPorCobrar = Math.max(0, totalVentas - totalAbonos);

    // 4. Total invertido en inventario actual
    const totalInvertidoEnProductos = await scalar('SELECT IFNULL(SUM(precio_compra * unidades_disponibles), 0) AS totalInvertido FROM productos');

    // --- LÓGICA EXACTA PARA "GANANCIA DEL DÍA" ---

    // 1. Ganancia neta acumulada HASTA AYER (considerando retiros pasados)
    const abonosHastaAyer = await scalar('SELECT IFNULL(SUM(monto_abono), 0) FROM abonos WHERE DATE(fecha_abono) < CURDATE()');
    const costoVentasHastaAyer = await scalar(
      `SELECT IFNULL(SUM(v.cantidad * p.precio_compra), 0) FROM ventas v JOIN productos p ON v.producto_id = p.producto_id WHERE DATE(v.fecha_venta) < CURDATE()`
    );
    const retirosHastaAyer = await scalar('SELECT IFNULL(SUM(monto_retiro), 0) FROM retiros WHERE DATE(fecha_retiro) < CURDATE()');
    const gananciaNetaAyer = abonosHastaAyer - costoVentasHastaAyer - retirosHastaAyer;

    // 2. Ganancia neta acumulada HASTA HOY (considerando TODOS los retiros)
    const costoVentasHastaHoy = await scalar(
      `SELECT IFNULL(SUM(v.cantidad * p.precio_compra), 0) FROM ventas v JOIN productos p ON v.producto_id = p.producto_id`
    );
    const totalRetiros = await scalar('SELECT IFNULL(SUM(monto_retiro), 0) FROM retiros');
    const gananciaNetaHoy = totalAbonos - costoVentasHastaHoy - totalRetiros;

    // 3. La ganancia real (positiva) de ayer y hoy
    const gananciaRealAyer = Math.max(0, gananciaNetaAyer);
    const gananciaRealHoy = Math.max(0, gananciaNetaHoy);

    // 4. La "Ganancia del Día" es el incremento de hoy
    const totalGananciaPorDia = gananciaRealHoy - gananciaRealAyer;
    
    // --- FIN DE LA LÓGICA ---

    res.json({
      totalVentas: Number(totalVentas.toFixed(2)),
      totalAbonos: Number(totalAbonos.toFixed(2)),
      totalPorCobrar: Number(totalPorCobrar.toFixed(2)),
      totalInvertidoEnProductos: Number(totalInvertidoEnProductos.toFixed(2)),
      totalGananciaPorDia: Number(totalGananciaPorDia.toFixed(2))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

module.exports = router;