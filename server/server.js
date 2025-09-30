const express = require('express');
const cors = require('cors');
//const dotenv = require('dotenv');
//dotenv.config();

const summaryRoute = require('./routes/summary');
const productosRoute = require('./routes/productos');
const clientesRoute = require('./routes/clientes'); // <--- AÑADIR ESTA LÍNEA

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/summary', summaryRoute);
app.use('/api/productos', productosRoute);
app.use('/api/clientes', clientesRoute); // <--- AÑADIR ESTA LÍNEA

// **ESTA ES LA RUTA QUE FALTA**
app.get('/', (req, res) => {
    // Puedes enviar un mensaje simple o un archivo HTML
    res.send('¡La API está funcionando! Usa las rutas /api/...'); 
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));