const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/categorias
// Devuelve una lista de todas las categorías.
router.get('/', async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT * FROM categorias ORDER BY nombre_categoria ASC');
    res.json(categorias);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener la lista de categorías' });
  }
});

module.exports = router;