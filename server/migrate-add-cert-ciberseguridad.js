/**
 * migrate-add-cert-ciberseguridad.js
 * ----------------------------------
 * Migración idempotente: añade el certificado del curso de
 * Ciberseguridad y Hacking Ético de BIG school (11/04/2026).
 *
 * Uso: node server/migrate-add-cert-ciberseguridad.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

async function migrar() {
    try {
        console.log('🚀 Insertando certificado de Ciberseguridad...\n');

        const cert = {
            titulo: 'Curso de Ciberseguridad y Hacking Etico',
            emisor: 'BIG school',
            fecha: '2026-04-11',
            descripcion: 'Jornadas sobre ciberseguridad y hacking etico: tecnicas de deteccion de vulnerabilidades y defensa digital. 6 horas de formacion impartidas por Romuald Fons y Mario Alvarez (Director del Master de Ciberseguridad).',
            url_archivo: '/certificados/curso-ciberseguridad-bigschool.pdf',
            url_externa: '',
            icono: 'fa-solid fa-shield-halved',
            color: 'from-emerald-500/20 to-green-500/20',
            border: 'border-emerald-500/30',
            icon_color: 'text-emerald-400',
            orden: 3
        };

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

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
