const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const [clientes] = await pool.query('SELECT cliente_id, nombre FROM clientes ORDER BY nombre ASC');
    res.json(clientes);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error al obtener la lista de clientes' });
  }
});

// =================================================================
// NUEVA RUTA: OBTENER CLIENTES CON SALDO DEUDOR (MOVIDA Y CORREGIDA)
// =================================================================
router.get('/con-saldo', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.cliente_id, 
        c.nombre, 
        c.telefono,
        COALESCE((SELECT SUM(a.monto_abono) FROM abonos a WHERE a.cliente_id = c.cliente_id), 0) as total_abonado,
        (COALESCE((SELECT SUM(v.cantidad * v.precio_unitario) FROM ventas v WHERE v.cliente_id = c.cliente_id), 0) - COALESCE((SELECT SUM(ab.monto_abono) FROM abonos ab WHERE ab.cliente_id = c.cliente_id), 0)) as saldo_deudor
      FROM clientes c
      GROUP BY c.cliente_id, c.nombre, c.telefono
      HAVING saldo_deudor > 0
      ORDER BY c.nombre;
    `;
    // CORRECCIÓN: Se cambió 'db.query' por 'pool.query' para que coincida con el resto del archivo.
    const [clientes] = await pool.query(query);
    res.json(clientes);
  } catch (error) {
    console.error("Error al obtener clientes con saldo:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

// POST /api/clientes/agregar -> AHORA DEVUELVE EL NUEVO CLIENTE
router.post('/agregar', async (req, res) => {
  try {
    const { nombre, telefono, domicilio } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
    }
    const [result] = await pool.query(
      'INSERT INTO clientes (nombre, telefono, domicilio) VALUES (?, ?, ?)',
      [nombre, telefono || null, domicilio || null]
    );

    const nuevoCliente = {
        cliente_id: result.insertId,
        nombre: nombre
    };

    res.status(201).json({ 
        success: true, 
        message: 'Cliente agregado correctamente.', 
        cliente: nuevoCliente
    });

  } catch (err) {
    console.error('Error al agregar cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// DELETE /api/clientes/:id -> Elimina un cliente
router.delete('/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    // Iniciamos transacción
    await connection.beginTransaction();

    // Comprobamos si el cliente tiene ventas
    const [ventas] = await connection.query('SELECT venta_id FROM ventas WHERE cliente_id = ?', [id]);
    if (ventas.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'El cliente tiene ventas asociadas y no puede eliminarse.' });
    }

    // Eliminamos el cliente
    const [result] = await connection.query('DELETE FROM clientes WHERE cliente_id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Cliente no encontrado.' });
    }

    await connection.commit();
    res.json({ success: true, message: 'Cliente eliminado correctamente.' });

  } catch (err) {
    await connection.rollback();
    console.error('Error al eliminar cliente:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor al eliminar el cliente.' });
  } finally {
    connection.release();
  }
});

// GET /api/clientes/:id/detalles
router.get('/:id/detalles', async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener datos personales del cliente
        const [clienteRows] = await connection.query('SELECT nombre, telefono, domicilio FROM clientes WHERE cliente_id = ?', [id]);
        if (clienteRows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        const cliente = clienteRows[0];

        // 2. Calcular el total comprado (suma de subtotales de ventas)
        const [ventasRows] = await connection.query('SELECT SUM(cantidad * precio_unitario) AS totalComprado FROM ventas WHERE cliente_id = ?', [id]);
        const totalComprado = ventasRows[0].totalComprado || 0;

        // 3. Calcular el total abonado (suma de montos de abonos)
        const [abonosRows] = await connection.query('SELECT SUM(monto_abono) AS totalAbonado FROM abonos WHERE cliente_id = ?', [id]);
        const totalAbonado = abonosRows[0].totalAbonado || 0;

        await connection.commit();

        // 4. Calcular saldo y enviar todo junto
        res.json({
            ...cliente,
            totalComprado: parseFloat(totalComprado),
            totalAbonado: parseFloat(totalAbonado),
            saldoDeudor: parseFloat(totalComprado) - parseFloat(totalAbonado)
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error al obtener detalles del cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor al obtener detalles del cliente' });
    } finally {
        connection.release();
    }
});


// ****** NUEVA RUTA: OBTENER UN SOLO CLIENTE POR ID ******
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [cliente] = await pool.query('SELECT * FROM clientes WHERE cliente_id = ?', [id]);
        if (cliente.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        res.json(cliente[0]);
    } catch (err) {
        console.error('Error al obtener el cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// ****** NUEVA RUTA: MODIFICAR UN CLIENTE ******
router.put('/modificar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, telefono, domicilio } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es obligatorio.' });
        }

        const [result] = await pool.query(
            'UPDATE clientes SET nombre = ?, telefono = ?, domicilio = ? WHERE cliente_id = ?',
            [nombre, telefono, domicilio, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }
        res.json({ success: true, message: 'Cliente actualizado correctamente.' });

    } catch (err) {
        console.error('Error al modificar el cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;