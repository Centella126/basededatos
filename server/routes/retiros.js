const express = require('express');
const router = express.Router();
const pool = require('../db');

// Ruta para registrar un nuevo retiro de ganancia
// POST /api/retiros
router.post('/', async (req, res) => {
    const { monto } = req.body;

    if (!monto || parseFloat(monto) <= 0) {
        return res.status(400).json({ error: 'El monto a retirar debe ser mayor que cero.' });
    }

    try {
        const query = 'INSERT INTO retiros (monto_retiro, fecha_retiro) VALUES (?, CURDATE())';
        await pool.query(query, [parseFloat(monto)]);
        
        res.status(201).json({ success: true, message: `Se ha registrado un retiro de $${monto}` });
    } catch (err) {
        console.error('Error al registrar el retiro:', err);
        res.status(500).json({ error: 'Error interno del servidor al registrar el retiro.' });
    }
});

module.exports = router;