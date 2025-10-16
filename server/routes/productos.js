const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/productos/barcode/:barcode
// Devuelve un producto basado en su código de barras.
router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const [productos] = await pool.query(
      'SELECT * FROM productos WHERE codigo_barras = ?',
      [barcode]
    );
    if (productos.length > 0) {
      res.json({ success: true, producto: productos[0] });
    } else {
      res.json({ success: false, message: 'Producto no encontrado' });
    }
  } catch (err) {
    console.error('Error al buscar producto por código de barras:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/productos
// Devuelve una lista de todos los productos con su categoría para poblar el selector.
router.get('/', async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT 
        p.producto_id, 
        p.nombre_producto, 
        p.precio_compra, 
        p.codigo_barras, 
        p.unidades_disponibles,
        c.categoria_id, 
        c.nombre_categoria 
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.categoria_id
      ORDER BY p.nombre_producto ASC
    `);
    res.json(productos);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener la lista de productos' });
  }
});


// POST /api/productos/agregar
// Maneja la creación de nuevos productos o la actualización del stock de uno existente.
router.post('/agregar', async (req, res) => {
  try {
    const { 
      producto_id,         // ID para identificar productos existentes
      codigo_barras, 
      nombre_producto, 
      nombre_categoria,
      categoria_id,        // ID para usar una categoría existente
      precio_compra, 
      unidades 
    } = req.body;

    // --- LÓGICA DE ACTUALIZACIÓN ---
    // Si el frontend envía un producto_id, significa que es un producto existente.
    if (producto_id) {
      await pool.query(
        'UPDATE productos SET unidades_disponibles = unidades_disponibles + ?, precio_compra = ? WHERE producto_id = ?',
        [unidades, precio_compra, producto_id]
      );
      return res.json({ success: true, message: 'Stock de producto existente actualizado.' });
    }

    // --- LÓGICA DE CREACIÓN ---
    // Si no hay producto_id, es un producto nuevo.

    // 1. Validar que no exista otro producto con el mismo nombre.
    const [existingByName] = await pool.query('SELECT * FROM productos WHERE nombre_producto = ?', [nombre_producto]);
    if (existingByName.length > 0) {
      return res.status(409).json({ success: false, error: 'Ya existe un producto con este nombre.' });
    }

    // 2. Manejar la categoría (usar existente o crear nueva).
    let final_categoria_id = categoria_id;
    if (!final_categoria_id) { // Si no se proveyó un ID de categoría, es una nueva.
      const [newCat] = await pool.query('INSERT INTO categorias (nombre_categoria) VALUES (?)', [nombre_categoria]);
      final_categoria_id = newCat.insertId;
    }
    
    // 3. Insertar el nuevo producto en la base de datos.
    const [result] = await pool.query(
      `INSERT INTO productos (nombre_producto, categoria_id, unidades_disponibles, precio_compra, codigo_barras) VALUES (?, ?, ?, ?, ?)`,
      [nombre_producto, final_categoria_id, unidades, precio_compra, codigo_barras || null] 
    );

    res.status(201).json({ success: true, message: 'Nuevo producto agregado correctamente.', productoId: result.insertId });

  } catch (err) {
    // Captura de errores generales para la base de datos o el servidor.
    console.error('Error detallado al agregar/actualizar producto:', err); 
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// DELETE /api/productos/:id
// Elimina un producto por su ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificamos si el producto existe antes de eliminar
    const [producto] = await pool.query('SELECT * FROM productos WHERE producto_id = ?', [id]);
    if (producto.length === 0) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado.' });
    }

    // Eliminamos el producto
    const [result] = await pool.query('DELETE FROM productos WHERE producto_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'No se pudo eliminar el producto.' });
    }

    res.json({ success: true, message: 'Producto eliminado correctamente.' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});

// PUT /api/productos/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_producto, codigo_barras, categoria_id, nombre_categoria, precio_compra, unidades_disponibles } = req.body;

    let final_categoria_id = categoria_id;

    // Si no existe categoria_id pero sí nombre_categoria, creamos nueva
    if (!final_categoria_id && nombre_categoria) {
      const [newCat] = await pool.query('INSERT INTO categorias (nombre_categoria) VALUES (?)', [nombre_categoria]);
      final_categoria_id = newCat.insertId;
    }

    await pool.query(
      `UPDATE productos 
       SET nombre_producto = ?, codigo_barras = ?, categoria_id = ?, precio_compra = ?, unidades_disponibles = ? 
       WHERE producto_id = ?`,
      [nombre_producto, codigo_barras || null, final_categoria_id, precio_compra, unidades_disponibles, id]
    );

    res.json({ success: true, message: 'Producto actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    res.status(500).json({ success: false, error: 'Error interno del servidor.' });
  }
});



module.exports = router;