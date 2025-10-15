// Conexión usando mysql2/promise
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  
  // 📢 AGREGAR CONFIGURACIÓN SSL
  // TiDB Cloud requiere SSL para conexiones públicas.
  ssl: {
    // Esto fuerza el cifrado y usa los certificados raíz predeterminados de Node.js.
    // Esto es suficiente para TiDB Serverless.
    rejectUnauthorized: true 
  },

  // Configuración del Pool (la dejamos igual)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;