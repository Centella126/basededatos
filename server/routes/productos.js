const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/productos/agregar
// Esta ruta maneja la lógica para agregar un nuevo producto o actualizar uno existente.
router.post('/agregar', async (req, res) => {
  try {
    const { 
      codigo_barras, 
      nombre_producto, 
      nombre_categoria, 
      precio_compra, 
      unidades 
    } = req.body;

    // --- LÓGICA DEL DIAGRAMA ---

    // 1. FLUJO CON CÓDIGO DE BARRAS
    // Si se proporciona un código de barras, buscamos si el producto ya existe.
    if (codigo_barras) {
      const [rows] = await pool.query(
        'SELECT * FROM productos WHERE codigo_barras = ?',
        [codigo_barras]
      );

      // Si el producto existe, actualizamos su stock y precio.
      if (rows.length > 0) {
        const productoExistente = rows[0];
        await pool.query(
          'UPDATE productos SET unidades_disponibles = unidades_disponibles + ?, precio_compra = ? WHERE producto_id = ?',
          [unidades, precio_compra, productoExistente.producto_id]
        );
        
        return res.json({ 
          success: true, 
          message: `Stock de '${productoExistente.nombre_producto}' actualizado.` 
        });
      }
    }

    // 2. FLUJO MANUAL O CÓDIGO DE BARRAS NUEVO
    // Antes de crear un producto, verificamos si ya existe uno con el mismo nombre
    // para evitar duplicados en la entrada manual.
    const [existingByName] = await pool.query(
        'SELECT * FROM productos WHERE nombre_producto = ?',
        [nombre_producto]
    );

    if (existingByName.length > 0) {
        return res.status(409).json({ // 409 Conflict: indica un conflicto con el estado actual del recurso.
            success: false,
            error: 'Ya existe un producto con este nombre. Búscalo en la lista para actualizarlo.'
        });
    }

    // 3. MANEJO DE CATEGORÍAS
    // Buscamos si la categoría ya existe por su nombre.
    let [catRows] = await pool.query('SELECT categoria_id FROM categorias WHERE nombre_categoria = ?', [nombre_categoria]);
    let final_categoria_id;

    if (catRows.length > 0) {
      // Si existe, usamos su ID.
      final_categoria_id = catRows[0].categoria_id;
    } else {
      // Si no existe, la creamos y obtenemos el nuevo ID.
      const [newCat] = await pool.query(
        'INSERT INTO categorias (nombre_categoria) VALUES (?)',
        [nombre_categoria]
      );
      final_categoria_id = newCat.insertId;
    }
    
    // 4. INSERTAR EL NUEVO PRODUCTO
    // Finalmente, guardamos el nuevo producto en la base de datos.
    const [result] = await pool.query(
      `INSERT INTO productos (nombre_producto, categoria_id, unidades_disponibles, precio_compra, codigo_barras) 
       VALUES (?, ?, ?, ?, ?)`,
      // Asigna null si el código de barras es un string vacío "" o no viene del frontend
      [nombre_producto, final_categoria_id, unidades, precio_compra, codigo_barras || null] 
    );

    res.status(201).json({ // 201 Created: indica que el recurso se creó con éxito.
      success: true, 
      message: 'Nuevo producto agregado correctamente.',
      productoId: result.insertId
    });

  } catch (err) {
    // Capturamos cualquier error de la base de datos o del servidor y lo mostramos en la consola.
    console.error('Error detallado al agregar producto:', err); 
    res.status(500).json({ success: false, error: 'Error interno del servidor al agregar el producto.' });
  }
});

module.exports = router;