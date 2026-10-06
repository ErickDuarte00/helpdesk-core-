/**
 * ARCHIVO: src/app.js
 * DESCRIPCIÓN: Punto de entrada principal del servidor backend de Helpdesk.
 * Configura middlewares esenciales (CORS, JSON parser), monta los enrutadores
 * de la API y levanta el servicio HTTP de Express.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import userRoutes from './routes/user.routes.js'; // <-- Importar rutas de usuarios

// Carga las variables de entorno desde el archivo .env
dotenv.config();

// Inicialización de la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());          // Habilita el intercambio de recursos de origen cruzado (CORS)
app.use(express.json());  // Permite parsear cuerpos de peticiones en formato JSON

// Registro de rutas y módulos de la API REST
app.use('/api/auth', authRoutes);     // Endpoints de autenticación y usuarios
app.use('/api/tickets', ticketRoutes); // Endpoints de gestión de tickets
app.use('/api/users', userRoutes); // <-- Registrar endpoint de usuarios

// Endpoint de verificación de salud y disponibilidad del servicio
app.get('/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime() });
});

// Inicio del servidor HTTP
app.listen(PORT, () => {
    console.log(`Servidor Helpdesk corriendo en http://localhost:${PORT}`);
});