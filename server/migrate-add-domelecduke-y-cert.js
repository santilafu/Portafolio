/**
 * migrate-add-domelecduke-y-cert.js
 * ---------------------------------
 * Migración idempotente que añade:
 *   1. El certificado del "Curso de Desarrollo con IA - El Nuevo Programador"
 *      de BIG school (mouredev), 03/10/2026, 4 horas.
 *   2. El proyecto "Domelec Duke", la web corporativa en producción que
 *      hice para una empresa de electricidad y domótica (domelecduke.es).
 *
 * Es seguro ejecutarlo varias veces: comprobamos el certificado y el
 * proyecto por su titulo antes de insertar nada.
 *
 * Uso: node server/migrate-add-domelecduke-y-cert.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

// Certificado nuevo (mismo formato que el resto de filas de certificados)
const cert = {
    titulo: 'Curso de Desarrollo con IA - El Nuevo Programador',
    emisor: 'BIG school (mouredev)',
    fecha: '2026-10-03',
    descripcion: 'Curso de iniciación al desarrollo de software con inteligencia artificial. 4 horas de formación impartidas por Romuald Fons (CEO de BIG school) y Brais Moure (Director del Máster en Desarrollo con IA).',
    url_archivo: '/certificados/curso-desarrollo-ia-nuevo-programador-bigschool.pdf',
    url_externa: '',
    icono: 'fa-solid fa-code',
    color: 'from-sky-500/20 to-indigo-500/20',
    border: 'border-sky-500/30',
    icon_color: 'text-sky-400',
    orden: 4
};

// Proyecto nuevo: web real de un cliente, ya publicada.
// El repositorio es privado (es del cliente), así que no se enlaza.
const proyecto = {
    titulo: 'Domelec Duke - Web Corporativa',
    descripcion: 'Web corporativa en producción para Domelec Duke, empresa de electricidad y domótica de la Comunidad Valenciana. Landing de una sola página en React + TypeScript + Vite con Tailwind CSS, logo 3D animado con el scroll (Three.js / React Three Fiber + GSAP) y HTML prerenderizado para SEO. Desplegada en Cloudflare Workers, con un panel de administración propio desde el que el cliente edita textos, fotos y reseñas y publica los cambios.',
    url_repo: '',
    url_demo: 'https://domelecduke.es',
    imagen: '/img/domelecduke.jpg',
    destacado: false,
    orden: 2,
    estado: 'completado'
};

async function migrar() {
    try {
        console.log('🚀 Iniciando migración Domelec Duke + certificado...\n');

        // ── 1. Certificado ───────────────────────────────────────
        const [certExiste] = await db.query(
            'SELECT id FROM certificados WHERE titulo = ?', [cert.titulo]
        );

        if (certExiste.length === 0) {
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

        // ── 2. Perfil propietario del proyecto ───────────────────
        // proyectos.perfil_id es FK obligatoria: usamos el primer perfil.
        const [perfiles] = await db.query('SELECT id FROM perfil ORDER BY id ASC LIMIT 1');
        if (perfiles.length === 0) {
            console.log('❌ No hay ningún perfil en la BD. Ejecuta primero el seed.');
            return;
        }
        const perfilId = perfiles[0].id;

        // ── 3. Proyecto ──────────────────────────────────────────
        const [proyExiste] = await db.query(
            'SELECT id FROM proyectos WHERE titulo = ?', [proyecto.titulo]
        );

        if (proyExiste.length === 0) {
            await db.query(
                `INSERT INTO proyectos (perfil_id, titulo, descripcion, url_repo, url_demo, imagen, destacado, orden, estado)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [perfilId, proyecto.titulo, proyecto.descripcion, proyecto.url_repo, proyecto.url_demo,
                 proyecto.imagen, proyecto.destacado ? 1 : 0, proyecto.orden, proyecto.estado]
            );
            console.log(`✅ Proyecto insertado: ${proyecto.titulo}`);
        } else {
            console.log(`ℹ️  El proyecto "${proyecto.titulo}" ya existe, se omite`);
        }

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
