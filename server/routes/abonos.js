// server/routes/abonos.js

const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/abonos/agregar -> Guarda un nuevo abono en la base de datos
router.post('/agregar', async (req, res) => {
  try {
    const { cliente_id, fecha_abono, monto_abono } = req.body;

    if (!cliente_id || !fecha_abono || !monto_abono) {
      return res.status(400).json({ success: false, error: 'Faltan datos. Se requiere cliente, fecha y monto.' });
    }

    await pool.query(
      'INSERT INTO abonos (cliente_id, fecha_abono, monto_abono) VALUES (?, ?, ?)',
      [cliente_id, fecha_abono, monto_abono]
    );

    res.status(201).json({ success: true, message: 'Abono registrado correctamente.' });
  } catch (err) {
    console.error('Error al registrar abono:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// GET /api/abonos -> Lista de abonos con cliente
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.abono_id, a.fecha_abono, a.monto_abono, c.nombre AS cliente
      FROM abonos a
      LEFT JOIN clientes c ON a.cliente_id = c.cliente_id
      ORDER BY a.fecha_abono DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener abonos:', err);
    res.status(500).json({ error: 'Error al obtener la lista de abonos.' });
  }
});

// DELETE /api/abonos/:id -> Elimina un abono por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query('DELETE FROM abonos WHERE abono_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Abono no encontrado.' });
    }

    res.json({ success: true, message: 'Abono eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar abono:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});


// ****** NUEVA RUTA PARA OBTENER ABONOS POR CLIENTE ******
router.get('/cliente/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [abonos] = await pool.query(
            'SELECT fecha_abono, monto_abono FROM abonos WHERE cliente_id = ? ORDER BY fecha_abono DESC',
            [id]
        );
        res.json(abonos);
    } catch (err) {
        console.error('Error al obtener el historial de abonos del cliente:', err);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

// PUT /api/abonos/modificar/:id -> Modifica un abono existente
router.put('/modificar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha_abono, monto_abono } = req.body;

    if (!fecha_abono || !monto_abono) {
      return res.status(400).json({ success: false, error: 'Faltan datos. Se requiere fecha y monto.' });
    }

    const [result] = await pool.query(
      'UPDATE abonos SET fecha_abono = ?, monto_abono = ? WHERE abono_id = ?',
      [fecha_abono, monto_abono, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Abono no encontrado.' });
    }

    res.json({ success: true, message: 'Abono actualizado correctamente.' });
  } catch (err) {
    console.error('Error al modificar abono:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});


module.exports = router;
