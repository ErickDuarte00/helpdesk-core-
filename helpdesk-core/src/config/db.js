/**
 * ARCHIVO: src/config/db.js
 * DESCRIPCIÓN: Administra la conexión a PostgreSQL mediante un Pool de conexiones.
 * Detecta automáticamente si se conecta a Supabase (SSL requerido) o a Docker local (sin SSL).
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Busca el .env dentro de helpdesk-core (útil cuando corres fuera de Docker)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

// Comprobar si la base de datos es Supabase / Cloud
const dbUrl = process.env.DATABASE_URL || '';
const isCloudDB = dbUrl.includes('supabase') || dbUrl.includes('sslmode=require');

// Configuración del Pool de conexiones
export const pool = new Pool({
  connectionString: dbUrl,
  // Si es Supabase usa SSL; si es Docker (postgres_db) lo desactiva para no fallar
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// Consulta de prueba
pool.query('SELECT NOW()')
  .then((resultado) => {
    console.log('✓ Conectado exitosamente a la BD. Fecha/Hora:', resultado.rows[0].now);
  })
  .catch((error) => {
    console.error('✗ Error al conectar con la BD:', error.message);
  });