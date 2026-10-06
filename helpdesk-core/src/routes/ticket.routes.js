/**
 * ARCHIVO: src/routes/ticket.routes.js
 * DESCRIPCIÓN: Definición de rutas y endpoints para la gestión integral de tickets.
 * Incluye consulta de métricas (dashboard), CRUD de tickets, adición de comentarios,
 * actualización de estados/asignación y control de acceso basado en roles (RBAC).
 */

import { Router } from 'express';
import {
    getDashboardStats,
    createTicket,
    getTickets,
    getTicketById,
    updateTicketStatus,
    addComment,
    deleteTicket
} from '../controllers/ticket.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Middleware global del router: todas las rutas requieren autenticación previa con JWT
router.use(authenticateToken);

// Métricas generales y KPIs del sistema para paneles de control
router.get('/dashboard', getDashboardStats);

// Listado general de tickets (soporta filtros y control por rol) y creación de tickets
router.get('/', getTickets);
router.post('/', createTicket);

// Detalle específico de un ticket (incluye historial y comentarios)
router.get('/:id', getTicketById);

// Agregar un comentario o nota a un ticket existente
router.post('/:id/comments', addComment);

// Actualización de estado y asignación de ticket: acceso restringido a 'tecnico' y 'admin'
router.patch('/:id/status', authorizeRoles('tecnico', 'admin'), updateTicketStatus);

// Eliminación de un ticket: acceso restringido exclusivamente al rol 'admin'
router.delete('/:id', authorizeRoles('admin'), deleteTicket);

export default router;