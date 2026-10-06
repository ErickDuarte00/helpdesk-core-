-- Esquema e inicialización de Helpdesk
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Abierto',
    created_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (1, 'Erick Duarte', 'erick@test.com', '$2b$10$OGsWcC7HCLqOtD8JDvt4X.wSyy35tz2BRHDIqxgNHI0NjzA/.yklW', 'tecnico', true, '2026-09-16T22:02:08.268Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (2, 'Admin', 'admin@test.com', '$2b$10$s6uEdADVFKoqUTXMZ9Vkzu6vpnZy3QQGMsT1myqVY3dQx5tOBKVQu', 'admin', true, '2026-09-22T03:18:29.364Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (3, 'empleado', 'empleado@test.com', '$2b$10$OEXDAe/Z/hGuaeE9a/E2YODo.80df1ruO6ytnFpKiKNEdBIsQvV42', 'empleado', true, '2026-09-26T00:46:58.762Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (4, 'Pepe Gomonzo', 'pepempleado@test.com', '$2b$10$nsQziW3Gd1PCaVXX4x.XKO9kaO/iJd0ltXIwE3CFktXpKbv5aszEq', 'empleado', true, '2026-09-26T03:23:54.632Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (6, 'Juan', 'juan@empresa.com', '$2b$10$PJTX9S8iv.EP6nZFOEjj/.eopm9Wrp4w28jaOaGHplG9n7qeu.V4W', 'empleado', true, '2026-10-01T00:12:53.617Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (7, 'Juan2', 'Juan2@empresa.com', '$2b$10$mvWftJevq9gT3ERBEybv/.UsjRBaTlCAv2wnMgMIYP68KC8YRGbSO', 'tecnico', true, '2026-10-01T00:13:23.116Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (8, 'Juan3', 'Juan3@empresa.com', '$2b$10$xoo2eAEVsEw4Usgtydmm7uASlkBreVoJ1XxWYZhFoc3n9DmhUE1wS', 'admin', true, '2026-10-01T00:13:56.185Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (9, 'juannuevo', 'JuanN@empresa.com', '$2b$10$WUzWOcwi47kdj17vA6J60O/h71rBjOtWboXlXc8Vo9ltDgvfKSjWW', 'tecnico', true, '2026-10-01T00:29:53.797Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO users (id, name, email, password_hash, role, is_active, created_at)
VALUES (10, 'JuanW', 'JuanW@empresa.com', '$2b$10$JgepPgKtMvxo9OSHavhB1uB3UDaI5QMLuNLnW3LfWKcH.pdNTxefK', 'tecnico', true, '2026-10-01T00:49:36.151Z')
ON CONFLICT (id) DO NOTHING;
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));

INSERT INTO tickets (id, code, title, description, category, priority, status, created_by, assigned_to, created_at, updated_at)
VALUES (1, 'INC-000001', 'No puedo acceder al sistema de inventarios', 'Al iniciar sesión aparece ''Connection refused''.', 'Software', 'Alta', 'En progreso', 1, 1, '2026-09-16T22:29:48.109Z', '2026-09-26T01:41:30.470Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tickets (id, code, title, description, category, priority, status, created_by, assigned_to, created_at, updated_at)
VALUES (7, 'INC-000007', 'Necesito ayuda con mi impresora ', 'No tiene tinta ', 'Software', 'Crítica', 'Resuelto', 3, 1, '2026-09-26T01:42:44.477Z', '2026-09-29T02:50:58.623Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO tickets (id, code, title, description, category, priority, status, created_by, assigned_to, created_at, updated_at)
VALUES (8, 'INC-000008', 'Ocupo que me asignen algun tecnico para algo importante ', 'Un problema aparecio en la red ', 'Red', 'Media', 'Cerrado', 4, 7, '2026-09-26T03:25:22.633Z', '2026-10-01T00:51:08.547Z')
ON CONFLICT (id) DO NOTHING;
SELECT setval('tickets_id_seq', COALESCE((SELECT MAX(id) FROM tickets), 1));

INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (1, 1, 1, 'Incidencia creada en el sistema.', '2026-09-16T22:29:48.109Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (2, 1, 1, 'Revisando conectividad con el switch de planta.', '2026-09-16T22:33:06.660Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (9, 1, 1, 'Ando revisando la red del sistema', '2026-09-26T01:41:24.645Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (10, 1, 1, 'Okey', '2026-09-26T01:41:30.397Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (11, 7, 3, 'Incidencia creada en el sistema.', '2026-09-26T01:42:44.477Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (12, 7, 1, 'Hola', '2026-09-26T01:43:45.505Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (13, 7, 1, 'Voy a checar tu impresora', '2026-09-26T01:43:56.660Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (14, 8, 4, 'Incidencia creada en el sistema.', '2026-09-26T03:25:22.633Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (15, 8, 2, 'Que sucedio?', '2026-09-26T03:26:17.661Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (16, 8, 2, 'Que sucedio?', '2026-09-26T03:26:17.957Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (17, 8, 2, 'Hola', '2026-09-26T03:26:23.298Z')
ON CONFLICT (id) DO NOTHING;
INSERT INTO ticket_comments (id, ticket_id, user_id, comment, created_at)
VALUES (18, 8, 1, 'Resuelto', '2026-09-26T03:29:32.952Z')
ON CONFLICT (id) DO NOTHING;
SELECT setval('ticket_comments_id_seq', COALESCE((SELECT MAX(id) FROM ticket_comments), 1));
