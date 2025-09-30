const express = require('express');
const router = express.Router();
// Reutilizamos el pool de conexión a la base de datos
const pool = require('../db'); 

// POST /api/clientes/agregar
// Esta ruta agrega un nuevo cliente a la base de datos.
router.post('/agregar', async (req, res) => {
  try {
    const { 
      nombre, 
      telefono, 
      domicilio
    } = req.body;

    // Validación: El nombre es obligatorio según el esquema de la tabla.
    if (!nombre) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre del cliente es obligatorio.' 
      });
    }

    // Opcional: Verificar si el cliente ya existe por nombre
    const [existing] = await pool.query(
        'SELECT * FROM clientes WHERE nombre = ?',
        [nombre]
    );

    if (existing.length > 0) {
        return res.status(409).json({
            success: false,
            error: 'Ya existe un cliente con este nombre.'
        });
    }

    // Insertar el nuevo cliente
    const [result] = await pool.query(
      `INSERT INTO clientes (nombre, telefono, domicilio) 
       VALUES (?, ?, ?)`,
      // Los campos 'telefono' y 'domicilio' pueden ser null si vienen vacíos
      [nombre, telefono || null, domicilio || null] 
    );

    res.status(201).json({ // 201 Created
      success: true, 
      message: 'Nuevo cliente agregado correctamente.',
      clienteId: result.insertId
    });

  } catch (err) {
    console.error('Error detallado al agregar cliente:', err); 
    res.status(500).json({ 
        success: false, 
        error: 'Error interno del servidor al agregar el cliente.' 
    });
  }
});

module.exports = router;