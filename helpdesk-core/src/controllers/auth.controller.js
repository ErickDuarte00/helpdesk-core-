/**
 * ARCHIVO: src/controllers/auth.controller.js
 * DESCRIPCIÓN: Controlador de autenticación y gestión de usuarios.
 * Maneja el registro seguro con hash de contraseñas (bcrypt), el inicio de sesión
 * mediante tokens firmados (JWT), y la consulta de perfiles y usuarios.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

/**
 * REGISTRO DE USUARIO
 * Crea un nuevo usuario validando datos obligatorios, roles permitidos,
 * unicidad de correo y encriptando la contraseña con salt rounds de factor 10.
 */
export const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    // Validación básica de campos requeridos
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    // Lista blanca de roles permitidos en el sistema
    const validRoles = ['empleado', 'tecnico', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol no válido. Permitidos: empleado, tecnico, admin.' });
    }

    try {
        // Comprobar si el correo ya existe en la base de datos
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        // Generar salt y hashear contraseña de forma segura (cost factor 10)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insertar el nuevo usuario y retornar sus datos (excluyendo el hash por seguridad)
        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash, role]
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error en register:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

/**
 * INICIO DE SESIÓN (LOGIN)
 * Valida credenciales, comprueba la contraseña contra el hash almacenado
 * y genera un token JWT firmado válido por 8 horas con los datos del usuario en el payload.
 */
// Reemplaza o ajusta la función login en src/controllers/auth.controller.js
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Correo y contraseña requeridos.' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const user = result.rows[0];

        // Validación de Soft Delete: Impedir acceso a cuentas desactivadas
        if (user.is_active === false) {
            return res.status(403).json({
                error: 'Esta cuenta ha sido desactivada. Comunícate con el Administrador.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Autenticación exitosa',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

/**
 * PERFIL DEL USUARIO AUTENTICADO
 * Obtiene la información del usuario autenticado a partir del ID resuelto por el middleware JWT.
 */
export const getProfile = async (req, res) => {
    try {
        // Consultar usuario por ID obtenido del token decodificado
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error en getProfile:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

/**
 * OBTENER TODOS LOS USUARIOS
 * Lista todos los usuarios registrados en el sistema ordenados por fecha de creación descendente.
 */
export const getAllUsers = async (req, res) => {
    try {
        // Consultar todos los usuarios sin exponer la contraseña hasheada
        const result = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
};