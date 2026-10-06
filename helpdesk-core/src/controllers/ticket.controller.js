import { pool } from '../config/db.js';

// 1. MÉTRICAS DEL DASHBOARD
export const getDashboardStats = async (req, res) => {
    try {
        // Solo el empleado ve sus propias métricas aisladas.
        // El técnico y el admin ven las estadísticas globales de toda la empresa.
        const isEmployee = req.user.role === 'empleado';
        const userFilter = isEmployee ? 'WHERE created_by = $1' : '';
        const params = isEmployee ? [req.user.id] : [];

        const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'Abierto') AS abiertos,
        COUNT(*) FILTER (WHERE status = 'En progreso') AS en_progreso,
        COUNT(*) FILTER (WHERE priority = 'Crítica' AND status NOT IN ('Resuelto', 'Cerrado')) AS criticos,
        COUNT(*) FILTER (WHERE status = 'Resuelto' AND updated_at::date = CURRENT_DATE) AS resueltos_hoy
      FROM tickets
      ${userFilter};
    `;

        const recentQuery = `
      SELECT id, code, title, priority, status, created_at
      FROM tickets
      ${userFilter}
      ORDER BY created_at DESC
      LIMIT 5;
    `;

        const [statsResult, recentResult] = await Promise.all([
            pool.query(statsQuery, params),
            pool.query(recentQuery, params)
        ]);

        res.json({
            stats: {
                abiertos: parseInt(statsResult.rows[0].abiertos, 10),
                enProgreso: parseInt(statsResult.rows[0].en_progreso, 10),
                criticos: parseInt(statsResult.rows[0].criticos, 10),
                resueltosHoy: parseInt(statsResult.rows[0].resueltos_hoy, 10)
            },
            recentTickets: recentResult.rows
        });
    } catch (error) {
        console.error('Error en getDashboardStats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas del dashboard.' });
    }
};

// 2. CREAR TICKET
export const createTicket = async (req, res) => {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category || !priority) {
        return res.status(400).json({ error: 'Título, descripción, categoría y prioridad son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const insertRes = await client.query(
            `INSERT INTO tickets (code, title, description, category, priority, created_by)
       VALUES ('PENDING', $1, $2, $3, $4, $5)
       RETURNING id`,
            [title, description, category, priority, req.user.id]
        );

        const ticketId = insertRes.rows[0].id;
        const ticketCode = `INC-${String(ticketId).padStart(6, '0')}`;

        const updateRes = await client.query(
            `UPDATE tickets 
       SET code = $1 
       WHERE id = $2 
       RETURNING *`,
            [ticketCode, ticketId]
        );

        await client.query(
            `INSERT INTO ticket_comments (ticket_id, user_id, comment)
       VALUES ($1, $2, 'Incidencia creada en el sistema.')`,
            [ticketId, req.user.id]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Ticket creado exitosamente', ticket: updateRes.rows[0] });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en createTicket:', error);
        res.status(500).json({ error: 'Error al crear el ticket.' });
    } finally {
        client.release();
    }
};

// 3. LISTAR TICKETS CON FILTROS
export const getTickets = async (req, res) => {
    const { search, status, priority, category } = req.query;

    try {
        const conditions = [];
        const values = [];
        let paramIndex = 1;

        // IMPORTANTE: Solo restringir por autor si es EMPLEADO
        // Técnicos y Administradores ven todos los tickets históricos sin excepción
        if (req.user.role === 'empleado') {
            conditions.push(`t.created_by = $${paramIndex++}`);
            values.push(req.user.id);
        }

        if (status && status !== 'Todos') {
            conditions.push(`t.status = $${paramIndex++}`);
            values.push(status);
        }

        if (priority && priority !== 'Todas') {
            conditions.push(`t.priority = $${paramIndex++}`);
            values.push(priority);
        }

        if (category && category !== 'Todas') {
            conditions.push(`t.category = $${paramIndex++}`);
            values.push(category);
        }

        if (search && search.trim() !== '') {
            conditions.push(`(t.title ILIKE $${paramIndex} OR t.code ILIKE $${paramIndex})`);
            values.push(`%${search.trim()}%`);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // LEFT JOIN con users para que aparezcan aunque el solicitante haya sido modificado
        const query = `
      SELECT 
        t.id,
        t.code,
        t.title,
        t.category,
        t.priority,
        t.status,
        t.created_at,
        t.updated_at,
        COALESCE(u_creator.name, 'Usuario eliminado') AS solicitante,
        COALESCE(u_tech.name, 'Sin asignar') AS tecnico_asignado
      FROM tickets t
      LEFT JOIN users u_creator ON t.created_by = u_creator.id
      LEFT JOIN users u_tech ON t.assigned_to = u_tech.id
      ${whereClause}
      ORDER BY t.created_at DESC;
    `;

        const result = await pool.query(query, values);
        res.json({ tickets: result.rows });
    } catch (error) {
        console.error('Error en getTickets:', error);
        res.status(500).json({ error: 'Error al consultar tickets.' });
    }
};

// 4. DETALLE DE TICKET
export const getTicketById = async (req, res) => {
    const { id } = req.params;

    try {
        const ticketRes = await pool.query(
            `SELECT 
        t.*, 
        COALESCE(u_creator.name, 'Usuario') AS solicitante, 
        COALESCE(u_tech.name, 'Sin asignar') AS tecnico_asignado
       FROM tickets t
       LEFT JOIN users u_creator ON t.created_by = u_creator.id
       LEFT JOIN users u_tech ON t.assigned_to = u_tech.id
       WHERE t.id = $1`,
            [id]
        );

        if (ticketRes.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado.' });
        }

        const ticket = ticketRes.rows[0];

        // Consulta de comentarios con LEFT JOIN
        const commentsRes = await pool.query(
            `SELECT 
        c.id, 
        c.comment, 
        c.created_at, 
        COALESCE(u.name, 'Usuario') AS autor, 
        COALESCE(u.role, 'sistema') AS autor_rol
       FROM ticket_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
            [id]
        );

        res.json({ ticket, comments: commentsRes.rows });
    } catch (error) {
        console.error('Error en getTicketById:', error);
        res.status(500).json({ error: 'Error al consultar detalle del ticket.' });
    }
};

// 5. CAMBIAR ESTADO
export const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    try {
        const fields = [];
        const values = [];
        let idx = 1;

        if (status) {
            fields.push(`status = $${idx++}`);
            values.push(status);
        }
        if (assigned_to !== undefined) {
            fields.push(`assigned_to = $${idx++}`);
            values.push(assigned_to);
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No se enviaron campos a actualizar.' });
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const updateQuery = `
      UPDATE tickets 
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;

        const result = await pool.query(updateQuery, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado.' });
        }

        res.json({ message: 'Ticket actualizado correctamente', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error en updateTicketStatus:', error);
        res.status(500).json({ error: 'Error al actualizar ticket.' });
    }
};

// 6. AGREGAR COMENTARIO
export const addComment = async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'El contenido del comentario es obligatorio.' });
    }

    try {
        const insertRes = await pool.query(
            `INSERT INTO ticket_comments (ticket_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, comment, created_at`,
            [id, req.user.id, comment.trim()]
        );

        await pool.query('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);

        res.status(201).json({
            message: 'Comentario agregado',
            comment: {
                ...insertRes.rows[0],
                autor: req.user.name,
                autor_rol: req.user.role
            }
        });
    } catch (error) {
        console.error('Error en addComment:', error);
        res.status(500).json({ error: 'Error al agregar comentario.' });
    }
};

// 7. ELIMINAR TICKET
export const deleteTicket = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM tickets WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado.' });
        }

        res.json({ message: 'Ticket eliminado correctamente', ticket: result.rows[0] });
    } catch (error) {
        console.error('Error en deleteTicket:', error);
        res.status(500).json({ error: 'Error interno al eliminar el ticket.' });
    }
};