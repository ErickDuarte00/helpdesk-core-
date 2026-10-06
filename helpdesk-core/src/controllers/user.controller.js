/**
 * ARCHIVO: src/controllers/user.controller.js
 * DESCRIPCIÓN: Controlador para la administración de usuarios con soporte para Soft Delete.
 */

import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

// 1. Obtener todos los usuarios con su estado de actividad
export const getUsers = async (req, res) => {
    const { role, active_only } = req.query;

    try {
        let query = `
      SELECT id, name, email, role, is_active, created_at 
      FROM users 
    `;
        const conditions = [];
        const params = [];
        let idx = 1;

        // Filtro por rol (ej: para asignar técnicos)
        if (role) {
            conditions.push(`LOWER(role) = $${idx++}`);
            params.push(role.toLowerCase().trim());
        }

        // Filtro opcional para obtener solo activos (ej: dropdown de asignación en tickets)
        if (active_only === 'true') {
            conditions.push(`is_active = true`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        query += ` ORDER BY id ASC;`;

        const result = await pool.query(query, params);
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error en getUsers:', error);
        res.status(500).json({ error: 'Error al consultar usuarios.' });
    }
};

// 2. Crear nuevo usuario
export const createUserByAdmin = async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const validRoles = ['empleado', 'tecnico', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
        return res.status(400).json({ error: 'Rol inválido. Opciones: empleado, tecnico, admin.' });
    }

    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, name, email, role, is_active, created_at`,
            [name.trim(), email.trim(), passwordHash, role.toLowerCase().trim()]
        );

        res.status(201).json({
            message: 'Usuario creado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error en createUserByAdmin:', error);
        res.status(500).json({ error: 'Error interno al registrar el usuario.' });
    }
};

// 3. SOFT DELETE: Desactivar o Activar usuario
export const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body; // true o false

    // Impedir que el admin en sesión se desactive a sí mismo
    if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta de administrador.' });
    }

    try {
        const result = await pool.query(
            `UPDATE users 
       SET is_active = $1 
       WHERE id = $2 
       RETURNING id, name, is_active`,
            [is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        const actionText = is_active ? 'reactivado' : 'desactivado';
        res.json({
            message: `Usuario "${result.rows[0].name}" ${actionText} correctamente.`,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error en toggleUserStatus:', error);
        res.status(500).json({ error: 'Error al cambiar estado del usuario.' });
    }
};

// 4. ELIMINACIÓN PERMANENTE: Solo si no tiene historial (tickets o comentarios)
export const deleteUserIfEmpty = async (req, res) => {
    const { id } = req.params;

    // Evitar que el administrador se elimine a sí mismo
    if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta.' });
    }

    try {
        // 1. Verificar si tiene tickets creados, asignados o comentarios
        const checkQuery = `
      SELECT 
        (SELECT COUNT(*) FROM tickets WHERE created_by = $1) AS tickets_creados,
        (SELECT COUNT(*) FROM tickets WHERE assigned_to = $1) AS tickets_asignados,
        (SELECT COUNT(*) FROM ticket_comments WHERE user_id = $1) AS comentarios
    `;
        const checkRes = await pool.query(checkQuery, [id]);
        const { tickets_creados, tickets_asignados, comentarios } = checkRes.rows[0];

        const totalRegistros =
            parseInt(tickets_creados, 10) +
            parseInt(tickets_asignados, 10) +
            parseInt(comentarios, 10);

        // Si tiene registros vinculados, se bloquea el borrado físico
        if (totalRegistros > 0) {
            return res.status(400).json({
                error: `El usuario no se puede borrar permanentemente porque tiene historial (${tickets_creados} creados, ${tickets_asignados} asignados, ${comentarios} comentarios). Usa la opción "Desactivar".`
            });
        }

        // 2. Si está limpio, proceder con la eliminación definitiva de la base de datos
        const deleteRes = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id, name',
            [id]
        );

        if (deleteRes.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({
            message: `Usuario "${deleteRes.rows[0].name}" eliminado definitivamente del sistema.`
        });
    } catch (error) {
        console.error('Error en deleteUserIfEmpty:', error);
        res.status(500).json({ error: 'Error interno al intentar eliminar el usuario.' });
    }
};