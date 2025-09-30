const express = require('express');
const router = express.Router();
const pool = require('../db');

// Helper to get single numeric value from query
async function scalar(query, params = []){
  const [rows] = await pool.query(query, params);
  if (!rows || rows.length === 0) return 0;
  const val = Object.values(rows[0])[0];
  return val === null ? 0 : Number(val);
}

// Endpoint: /api/summary
router.get('/', async (req, res) => {
  try {
    // 1. Total dinero Ventas (sumatoria de subtotal)
    const totalVentas = await scalar('SELECT IFNULL(SUM(subtotal),0) AS totalVentas FROM ventas');

    // 2. Total abonos recibidos
    const totalAbonos = await scalar('SELECT IFNULL(SUM(monto_abono),0) AS totalAbonos FROM abonos');

    // 3. Total dinero por cobrar
    const totalPorCobrar = Number((totalVentas - totalAbonos).toFixed(2));

    // 4. Total dinero invertido en productos (sumatoria de precio_compra de productos)
    const totalInvertidoEnProductos = await scalar('SELECT IFNULL(SUM(precio_compra),0) AS totalInvertido FROM productos');

    // 5. Total costo de los productos vendidos (sum of precio_compra * cantidad for sold products)
    const totalCostoVendidos = await scalar(
      `SELECT IFNULL(SUM(v.cantidad * p.precio_compra),0) AS totalCosto
       FROM ventas v
       JOIN productos p ON v.producto_id = p.producto_id`
    );

    // 6. Cálculo de "ganancia" basado en abonos vs costo de lo vendido, con control por día.
    // Definimos ganancia acumulada hasta hoy = abonos hasta hoy - costo de vendidos hasta hoy
    // y ganancia acumulada hasta ayer = abonos hasta ayer - costo de vendidos hasta ayer
    // Ganancia por día = max(0, acumulado_hoy - acumulado_ayer)

    // Abonos hasta hoy / ayer
    const abonosHastaHoy = await scalar('SELECT IFNULL(SUM(monto_abono),0) AS s FROM abonos WHERE fecha_abono <= CURDATE()');
    const abonosHastaAyer = await scalar('SELECT IFNULL(SUM(monto_abono),0) AS s FROM abonos WHERE fecha_abono < CURDATE()');

    // Costo de vendidos hasta hoy / ayer: join ventas con productos y filtrar por fecha_venta
    const costoHastaHoy = await scalar(
      `SELECT IFNULL(SUM(v.cantidad * p.precio_compra),0) AS s
       FROM ventas v
       JOIN productos p ON v.producto_id = p.producto_id
       WHERE v.fecha_venta <= CURDATE()`
    );
    const costoHastaAyer = await scalar(
      `SELECT IFNULL(SUM(v.cantidad * p.precio_compra),0) AS s
       FROM ventas v
       JOIN productos p ON v.producto_id = p.producto_id
       WHERE v.fecha_venta < CURDATE()`
    );

    const acumuladoHoy = Number((abonosHastaHoy - costoHastaHoy).toFixed(2));
    const acumuladoAyer = Number((abonosHastaAyer - costoHastaAyer).toFixed(2));

    // Reglas del usuario:
    // - Mientras total abonos recibidos sea menor que la sumatoria de los precios de compra (costo total vendido) -> ganancia = 0
    // - Cuando abonos > costo, empieza a salir la ganancia.
    // - Para el "Total Ganancia por día" queremos la diferencia entre acumuladoHoy y acumuladoAyer, pero no menor que 0.

    let totalGananciaPorDia = 0;
    if (acumuladoHoy > 0) {
      totalGananciaPorDia = Math.max(0, Number((acumuladoHoy - acumuladoAyer).toFixed(2)));
    } else {
      totalGananciaPorDia = 0;
    }

    // Asegurar que no sea mayor que acumuladoHoy
    if (totalGananciaPorDia > acumuladoHoy) totalGananciaPorDia = acumuladoHoy;

    res.json({
      totalVentas: Number(totalVentas.toFixed(2)),
      totalAbonos: Number(totalAbonos.toFixed(2)),
      totalPorCobrar: Number(totalPorCobrar.toFixed(2)),
      totalInvertidoEnProductos: Number(totalInvertidoEnProductos.toFixed(2)),
      totalCostoVendidos: Number(totalCostoVendidos.toFixed(2)),
      acumuladoHoy,
      acumuladoAyer,
      totalGananciaPorDia
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
});

module.exports = router;