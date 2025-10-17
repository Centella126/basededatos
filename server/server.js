const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const summaryRoute = require('./routes/summary');
const productosRoute = require('./routes/productos');
const categoriasRoute = require('./routes/categorias');
const clientesRoute = require('./routes/clientes');
const abonosRoute = require('./routes/abonos');
const ventasRoute = require('./routes/ventas'); 
const reportesRoute = require('./routes/reportes'); 
const retirosRouter = require('./routes/retiros');
const loginRoute = require('./routes/login');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/summary', summaryRoute);
app.use('/api/productos', productosRoute);
app.use('/api/categorias', categoriasRoute); 
app.use('/api/clientes', clientesRoute); 
app.use('/api/abonos', abonosRoute);
app.use('/api/ventas', ventasRoute); 
app.use('/api/reportes', reportesRoute); 
app.use('/api/retiros', retirosRouter);
app.use('/api/login', loginRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));