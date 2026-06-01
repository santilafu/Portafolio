/**
 * migrate-proyectos-estado.js
 * ---------------------------
 * Migración idempotente que añade soporte para el estado de un proyecto
 * ('completado' o 'en_desarrollo') y registra dos proyectos nuevos que
 * están actualmente en desarrollo.
 *
 * Cambios aplicados:
 *   1. Añade columna 'estado' a proyectos (si no existe)
 *   2. Inserta el proyecto "Revisa" (si no existe ya por titulo)
 *   3. Inserta el proyecto "Rondas" (si no existe ya por titulo)
 *
 * Es seguro ejecutarlo varias veces: comprobamos la columna y cada
 * proyecto por su titulo antes de tocar nada (idempotente).
 *
 * Uso: node server/migrate-proyectos-estado.js
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

// Proyectos nuevos en desarrollo. Sin imagen ni enlaces, no destacados.
const proyectosNuevos = [
    {
        titulo: 'Revisa - Mantenimiento de Vehiculos',
        descripcion: 'Aplicacion web progresiva (PWA) para gestionar el mantenimiento de tus vehiculos. Avisa de ITV, seguro y revisiones por fecha o kilometraje, mostrando de un vistazo que esta al dia, proximo o vencido. Frontend en React + TypeScript + Vite con Tailwind CSS, animaciones con Framer Motion y persistencia local offline con Dexie.js (IndexedDB).',
        url_repo: '',
        url_demo: '',
        imagen: null,
        destacado: false,
        orden: 5,
        estado: 'en_desarrollo'
    },
    {
        titulo: 'Rondas - Checklists de Inspeccion Industrial',
        descripcion: 'Aplicacion web para realizar rondas de mantenimiento e inspecciones desde el movil o el PC. Permite rellenar checklists punto por punto (OK / No OK / N-A con comentarios y fotos), firmar con el dedo y generar un acta en PDF con veredicto Apto/No Apto. Incluye editor de plantillas personalizables, autoguardado y reanudacion de inspecciones a medias, panel de estadisticas con los puntos que mas fallan, filtros y copia de seguridad. Construida en React + Vite con Tailwind CSS, sin backend: toda la persistencia es local en el navegador.',
        url_repo: '',
        url_demo: '',
        imagen: null,
        destacado: false,
        orden: 6,
        estado: 'en_desarrollo'
    }
];

async function migrar() {
    try {
        console.log('🚀 Iniciando migración estado de proyectos...\n');

        // ── 1. Añadir columna estado ─────────────────────────────
        if (!(await columnaExiste('proyectos', 'estado'))) {
            await db.query(`ALTER TABLE proyectos ADD COLUMN estado VARCHAR(20) DEFAULT 'completado'`);
            console.log('✅ Columna estado añadida a proyectos');
        } else {
            console.log('ℹ️  Columna estado ya existe en proyectos');
        }

        // ── 2. Obtener el perfil propietario ─────────────────────
        // Los proyectos requieren un perfil_id (FK). Usamos el primer perfil.
        const [perfiles] = await db.query('SELECT id FROM perfil ORDER BY id ASC LIMIT 1');
        if (perfiles.length === 0) {
            console.log('❌ No hay ningún perfil en la BD. Ejecuta primero el seed.');
            return;
        }
        const perfilId = perfiles[0].id;
        console.log(`ℹ️  Usando perfil_id=${perfilId} para los proyectos nuevos`);

        // ── 3. Insertar los proyectos nuevos (idempotente) ───────
        for (const proyecto of proyectosNuevos) {
            // Comprobamos por titulo para no duplicar si se ejecuta dos veces
            const [existente] = await db.query(
                'SELECT id FROM proyectos WHERE titulo = ?', [proyecto.titulo]
            );

            if (existente.length > 0) {
                console.log(`ℹ️  El proyecto "${proyecto.titulo}" ya existe, se omite`);
                continue;
            }

            await db.query(
                `INSERT INTO proyectos (perfil_id, titulo, descripcion, url_repo, url_demo, imagen, destacado, orden, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [perfilId, proyecto.titulo, proyecto.descripcion, proyecto.url_repo, proyecto.url_demo,
                 proyecto.imagen, proyecto.destacado ? 1 : 0, proyecto.orden, proyecto.estado]
            );
            console.log(`✅ Proyecto insertado: ${proyecto.titulo}`);
        }

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
