import jwt from 'jsonwebtoken';

// Verifica la validez del token JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, name, email, role }
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
};

// Control de roles blindado contra mayúsculas, espacios y sinónimos
export const authorizeRoles = (...allowedRoles) => {
    // Aplana arrays anidados y convierte todo a minúsculas
    const roles = allowedRoles
        .flat(Infinity)
        .map(r => String(r).toLowerCase().trim());

    // Añade sinónimos comunes para evitar inconsistencias
    if (roles.includes('admin') && !roles.includes('administrador')) roles.push('administrador');
    if (roles.includes('administrador') && !roles.includes('admin')) roles.push('admin');
    if (roles.includes('tecnico') && !roles.includes('técnico')) roles.push('técnico');

    return (req, res, next) => {
        const userRole = req.user?.role ? String(req.user.role).toLowerCase().trim() : '';

        console.log(`[AUTH CHECK] Rol recibido: "${userRole}" | Roles permitidos: [${roles.join(', ')}]`);

        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                error: `Acceso restringido. Tu rol es '${userRole || 'ninguno'}'. Se requiere: ${roles.join(', ')}`
            });
        }

        next();
    };
};