const express = require('express');
const cors = require('cors');
//const dotenv = require('dotenv');
//dotenv.config();

const summaryRoute = require('./routes/summary');
const productosRoute = require('./routes/productos');
const categoriasRoute = require('./routes/categorias');
const clientesRoute = require('./routes/clientes');
const abonosRoute = require('./routes/abonos');
const ventasRoute = require('./routes/ventas'); 
const reportesRoute = require('./routes/reportes'); 

const app = express();
//app.use(cors());
// 📢 CAMBIO CLAVE: Configuración explícita y permisiva de CORS
// Esto asegura que acepte peticiones de CUALQUIER dominio (Vercel)
// y maneje correctamente los métodos HTTP que usas (GET, POST).
app.use(cors({
    origin: '*', // Permite cualquier origen
    methods: ['GET', 'POST', 'OPTIONS'], // Permite los métodos necesarios
    allowedHeaders: ['Content-Type', 'Authorization'] // Permite las cabeceras comunes
}));
app.use(express.json());

app.use('/api/summary', summaryRoute);
app.use('/api/productos', productosRoute);
app.use('/api/categorias', categoriasRoute); 
app.use('/api/clientes', clientesRoute); 
app.use('/api/abonos', abonosRoute);
app.use('/api/ventas', ventasRoute); 
app.use('/api/reportes', reportesRoute); 

// RUTA DE VERIFICACIÓN (SOLO GET)
app.get('/', (req, res) => { 
    res.send('¡La API está funcionando! Usa las rutas /api/...'); 
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));