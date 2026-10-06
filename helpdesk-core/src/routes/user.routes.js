/**
 * ARCHIVO: src/routes/user.routes.js
 * DESCRIPCIÓN: Rutas de la API para la gestión de usuarios.
 * Protegidas mediante JWT y restringidas exclusivamente al rol 'admin'.
 */

import { Router } from 'express';
import {
    getUsers,
    createUserByAdmin,
    toggleUserStatus,
    deleteUserIfEmpty // <-- Importar
} from '../controllers/user.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', getUsers);
router.post('/', createUserByAdmin);
router.patch('/:id/status', toggleUserStatus);

// Eliminar permanentemente solo si no tiene tickets asociados
router.delete('/:id', deleteUserIfEmpty);

export default router;