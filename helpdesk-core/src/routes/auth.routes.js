/**
 * ARCHIVO: src/routes/auth.routes.js
 * DESCRIPCIÓN: Definición de rutas para el módulo de autenticación y usuarios.
 * Expone endpoints públicos para registro y login, y endpoints protegidos por JWT
 * y control de acceso basado en roles (RBAC).
 */

import { Router } from 'express';
import { register, login, getProfile, getAllUsers } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/register', register); // Registro de nuevos usuarios
router.post('/login', login);       // Autenticación y generación de JWT

// Ruta protegida: Obtener información del usuario autenticado
router.get('/profile', authenticateToken, getProfile);

// Ruta protegida con RBAC: Lista de usuarios (acceso exclusivo para rol 'admin')
router.get('/users', authenticateToken, authorizeRoles('admin'), getAllUsers);

export default router;
