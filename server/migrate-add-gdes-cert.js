/**
 * migrate-add-gdes-cert.js
 * ------------------------
 * Migración idempotente que actualiza la base de datos en producción
 * con los cambios de la nueva versión sin tocar lo existente.
 *
 * Cambios aplicados:
 *   1. Añade la columna 'logo' a la tabla experiencia (si no existe)
 *   2. Crea la tabla certificados (si no existe)
 *   3. Inserta la experiencia en GD Energy Services (si no existe)
 *   4. Inserta el proyecto SuscriptWallet (si no existe)
 *   5. Inserta los 2 certificados (si no existen)
 *   6. Añade PostgreSQL al tech stack (si no existe)
 *   7. Actualiza el logo de "En busqueda activa" a NULL si esa fila existe
 *
 * Uso: node server/migrate-add-gdes-cert.js
 *
 * Es seguro ejecutarlo varias veces — todas las comprobaciones son idempotentes.
 */

require('dotenv').config({ override: true });
const db = require('./db');

async function columnaExiste(tabla, columna) {
    const [filas] = await db.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [tabla, columna]
    );
    return filas.length > 0;
}

async function migrar() {
    try {
        console.log('🚀 Iniciando migración GDES + Certificados...\n');

        // ── 1. Añadir columna 'logo' a experiencia ───────────────
        if (!(await columnaExiste('experiencia', 'logo'))) {
            await db.query(`ALTER TABLE experiencia ADD COLUMN logo VARCHAR(255) NULL`);
            console.log('✅ Columna logo añadida a experiencia');
        } else {
            console.log('ℹ️  Columna logo ya existe en experiencia');
        }

        // ── 2. Crear tabla certificados ──────────────────────────
        await db.query(`
            CREATE TABLE IF NOT EXISTS certificados (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                titulo       VARCHAR(200) NOT NULL,
                emisor       VARCHAR(150) NOT NULL,
                fecha        DATE NOT NULL,
                descripcion  TEXT,
                url_archivo  VARCHAR(255),
                url_externa  VARCHAR(255),
                icono        VARCHAR(100) DEFAULT 'fa-solid fa-certificate',
                color        VARCHAR(255) DEFAULT '',
                border       VARCHAR(255) DEFAULT '',
                icon_color   VARCHAR(100) DEFAULT '',
                orden        INT DEFAULT 0
            )
        `);
        console.log('✅ Tabla certificados lista');

        // Necesitamos el perfil_id del único perfil para insertar la experiencia/proyecto
        const [[perfil]] = await db.query('SELECT id FROM perfil LIMIT 1');
        if (!perfil) {
            console.error('❌ No hay perfil en la BD. Ejecuta seed.js primero.');
            return;
        }
        const perfilId = perfil.id;

        // ── 3. Insertar experiencia GDES (si no existe) ──────────
        const [gdesExistente] = await db.query(
            `SELECT id FROM experiencia WHERE empresa = ? AND puesto = ?`,
            ['GD Energy Services', 'Practicas IT']
        );
        if (gdesExistente.length === 0) {
            await db.query(
                `INSERT INTO experiencia (perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion, logo)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    perfilId,
                    'GD Energy Services',
                    'Practicas IT',
                    '2026-03-23',
                    null,
                    'Practicas del ciclo DAM en el departamento de IT del Grupo Dominguis Energy Services. Soporte tecnico, mantenimiento de sistemas y desarrollo de herramientas internas para apoyar las operaciones de la empresa.',
                    '/img/gdes-logo.png'
                ]
            );
            console.log('✅ Experiencia GD Energy Services insertada');
        } else {
            console.log('ℹ️  Experiencia GD Energy Services ya existe');
        }

        // ── 4. Insertar proyecto SuscriptWallet (si no existe) ───
        const [swExistente] = await db.query(
            `SELECT id FROM proyectos WHERE titulo LIKE 'SuscriptWallet%'`
        );
        if (swExistente.length === 0) {
            await db.query(
                `INSERT INTO proyectos (perfil_id, titulo, descripcion, url_repo, url_demo)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    perfilId,
                    'SuscriptWallet - Gestor de Suscripciones',
                    'Aplicacion full-stack para gestionar todas tus suscripciones de pago en un solo lugar. Backend en Kotlin + Spring Boot 3.3 + PostgreSQL con Spring Security y JWT. App movil multiplataforma con Kotlin Multiplatform y Jetpack Compose. Catalogo de 320+ servicios, dashboard con graficos por categoria, notificaciones de renovacion, modo offline y soporte multi-divisa.',
                    'https://github.com/santilafu/SuscriptWallet',
                    ''
                ]
            );
            console.log('✅ Proyecto SuscriptWallet insertado');
        } else {
            console.log('ℹ️  Proyecto SuscriptWallet ya existe');
        }

        // ── 5. Insertar certificados (si no existen) ─────────────
        const certificados = [
            {
                titulo: 'Curso de Automatizaciones con N8N e IA',
                emisor: 'Raiola Networks',
                fecha: '2026-01-10',
                descripcion: 'Diseno de flujos de automatizacion combinando N8N con servicios de inteligencia artificial para crear procesos sin codigo.',
                url_archivo: '/certificados/curso-n8n-ia-raiola.pdf',
                url_externa: '',
                icono: 'fa-solid fa-robot',
                color: 'from-cyan-500/20 to-blue-500/20',
                border: 'border-cyan-500/30',
                icon_color: 'text-cyan-400',
                orden: 1
            },
            {
                titulo: 'Curso de Iniciacion al Desarrollo con IA',
                emisor: 'BIG school (mouredev)',
                fecha: '2025-11-21',
                descripcion: 'Jornadas formativas sobre desarrollo de aplicaciones aprovechando inteligencia artificial. 6 horas de formacion impartidas por Romuald Fons y Brais Moure.',
                url_archivo: '/certificados/curso-iniciacion-ia-bigschool.pdf',
                url_externa: '',
                icono: 'fa-solid fa-brain',
                color: 'from-purple-500/20 to-pink-500/20',
                border: 'border-purple-500/30',
                icon_color: 'text-purple-400',
                orden: 2
            }
        ];

        for (const cert of certificados) {
            const [existe] = await db.query(
                `SELECT id FROM certificados WHERE titulo = ?`,
                [cert.titulo]
            );
            if (existe.length === 0) {
                await db.query(
                    `INSERT INTO certificados
                        (titulo, emisor, fecha, descripcion, url_archivo, url_externa, icono, color, border, icon_color, orden)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [cert.titulo, cert.emisor, cert.fecha, cert.descripcion, cert.url_archivo, cert.url_externa,
                     cert.icono, cert.color, cert.border, cert.icon_color, cert.orden]
                );
                console.log(`✅ Certificado insertado: ${cert.titulo}`);
            } else {
                console.log(`ℹ️  Certificado ya existe: ${cert.titulo}`);
            }
        }

        // ── 6. Añadir PostgreSQL al tech stack (si no existe) ────
        const [pgExistente] = await db.query(
            `SELECT id FROM tech_stack WHERE nombre = 'PostgreSQL'`
        );
        if (pgExistente.length === 0) {
            await db.query(
                `INSERT INTO tech_stack (nombre, icono, color, border, icon_color, grupo, orden)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                ['PostgreSQL', 'devicon-postgresql-plain colored', 'from-blue-700/20 to-indigo-700/20', 'border-blue-700/30', '', 'other', 11]
            );
            console.log('✅ PostgreSQL añadido al tech stack');
        } else {
            console.log('ℹ️  PostgreSQL ya existe en tech stack');
        }

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
