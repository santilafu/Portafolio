/**
 * init-db.js
 * ----------
 * Script de inicialización de la base de datos.
 * Crea las 4 tablas del portafolio si no existen todavía.
 *
 * Se usa CREATE TABLE IF NOT EXISTS para que sea seguro ejecutarlo
 * varias veces sin error: si la tabla ya existe, simplemente la ignora.
 *
 * Relaciones entre tablas:
 *   perfil (1) ──< proyectos   (uno a muchos)
 *   perfil (1) ──< habilidades (uno a muchos)
 *   perfil (1) ──< experiencia (uno a muchos)
 *
 * Las tablas hijas (proyectos, habilidades, experiencia) tienen una
 * FOREIGN KEY apuntando al id de perfil con ON DELETE CASCADE,
 * lo que significa que si borramos un perfil, se borran automáticamente
 * todos sus proyectos, habilidades y experiencia asociados.
 *
 * Uso: node server/init-db.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

async function crearTablas() {
    try {

        // ── TABLA PERFIL ─────────────────────────────────────────
        // Almacena los datos personales del desarrollador.
        // Es la tabla principal (padre) del esquema.
        await db.query(`
            CREATE TABLE IF NOT EXISTS perfil (
                id           INT AUTO_INCREMENT PRIMARY KEY, -- clave primaria autoincremental
                nombre       VARCHAR(100) NOT NULL,          -- nombre completo (obligatorio)
                titular      VARCHAR(150),                   -- ej: "Desarrollador Multiplataforma"
                sobre_mi     TEXT,                           -- texto largo de presentación
                email        VARCHAR(100) NOT NULL,          -- email de contacto (obligatorio)
                enlace_github   VARCHAR(255),                -- URL al perfil de GitHub
                enlace_linkedin VARCHAR(255),                -- URL al perfil de LinkedIn
                foto_perfil  VARCHAR(255)                    -- nombre del archivo de imagen
            )
        `);
        console.log('✅ Tabla perfil creada');

        // ── TABLA PROYECTOS ──────────────────────────────────────
        // Cada proyecto pertenece a un perfil (perfil_id es la clave foránea).
        await db.query(`
            CREATE TABLE IF NOT EXISTS proyectos (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                perfil_id   INT NOT NULL,                    -- referencia al perfil propietario
                titulo      VARCHAR(150) NOT NULL,           -- nombre del proyecto (obligatorio)
                descripcion TEXT,                            -- descripción detallada
                url_repo    VARCHAR(255),                    -- enlace al repositorio (GitHub, etc.)
                url_demo    VARCHAR(255),                    -- enlace a demo en vivo (si existe)
                -- Si se borra el perfil, sus proyectos se borran también (CASCADE)
                FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla proyectos creada');

        // ── TABLA HABILIDADES ────────────────────────────────────
        // Tecnologías que domina el desarrollador y su nivel.
        await db.query(`
            CREATE TABLE IF NOT EXISTS habilidades (
                id        INT AUTO_INCREMENT PRIMARY KEY,
                perfil_id INT NOT NULL,
                nombre    VARCHAR(100) NOT NULL,             -- ej: "Java", "MySQL"
                nivel     VARCHAR(50),                       -- ej: "Basico", "Intermedio", "Avanzado"
                FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla habilidades creada');

        // ── TABLA EXPERIENCIA ────────────────────────────────────
        // Historial laboral o de prácticas del desarrollador.
        await db.query(`
            CREATE TABLE IF NOT EXISTS experiencia (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                perfil_id    INT NOT NULL,
                empresa      VARCHAR(150) NOT NULL,          -- nombre de la empresa (obligatorio)
                puesto       VARCHAR(150) NOT NULL,          -- cargo o rol (obligatorio)
                fecha_inicio DATE NOT NULL,                  -- cuándo empezó (obligatorio)
                fecha_fin    DATE,                           -- cuándo terminó (NULL = sigue activo)
                descripcion  TEXT,                           -- descripción de las tareas realizadas
                FOREIGN KEY (perfil_id) REFERENCES perfil(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Tabla experiencia creada');

        console.log('\n🎉 Todas las tablas creadas correctamente en Aiven');

    } catch (error) {
        console.error('❌ Error al crear tablas:', error.message);
    } finally {
        // process.exit() cierra el proceso de Node.js al terminar el script.
        // Sin esto, el script se quedaría esperando (por el pool de conexiones abierto).
        process.exit();
    }
}

// Ejecutamos la función principal
crearTablas();
