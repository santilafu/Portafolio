/**
 * migrate-fin-practicas-titulacion.js
 * -----------------------------------
 * Migración idempotente que actualiza el portafolio tras finalizar las
 * prácticas en GD Energy Services y titularse en el ciclo DAM.
 *
 * Cambios aplicados:
 *   1. Perfil: añade la titulación (DAM, 9 de media) al texto "sobre mi".
 *   2. Experiencia GDES: marca las prácticas como finalizadas (fecha_fin)
 *      y pasa la descripción a pasado.
 *   3. Elimina la entrada de experiencia "En busqueda activa" (obsoleta).
 *
 * Es seguro ejecutarlo varias veces: cada cambio comprueba el estado
 * actual antes de tocar nada (idempotente).
 *
 * Uso: node server/migrate-fin-practicas-titulacion.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

// Textos objetivo (sin acentos, siguiendo la convención del seed)
const SOBRE_MI = 'Titulado en Desarrollo de Aplicaciones Multiplataforma (DAM) con un 9 de nota media. Apasionado por el backend, las bases de datos y la creacion de APIs robustas. Siempre buscando aprender nuevas tecnologias y mejorar mis habilidades.';
const GDES_FECHA_FIN = '2026-06-20';
const GDES_DESCRIPCION = 'Practicas del ciclo DAM en el departamento de IT del Grupo Dominguis Energy Services. Di soporte tecnico, realice mantenimiento de sistemas y desarrolle herramientas internas para apoyar las operaciones de la empresa.';

async function migrar() {
    try {
        console.log('🚀 Iniciando migración fin de prácticas + titulación...\n');

        // ── 1. Perfil: sobre_mi con la titulación ────────────────
        const [perfiles] = await db.query('SELECT id, sobre_mi FROM perfil ORDER BY id ASC LIMIT 1');
        if (perfiles.length === 0) {
            console.log('❌ No hay ningún perfil en la BD. Ejecuta primero el seed.');
            return;
        }
        const perfil = perfiles[0];

        if (perfil.sobre_mi === SOBRE_MI) {
            console.log('ℹ️  El perfil ya tiene el texto actualizado, se omite');
        } else {
            await db.query('UPDATE perfil SET sobre_mi = ? WHERE id = ?', [SOBRE_MI, perfil.id]);
            console.log(`✅ Perfil actualizado (id=${perfil.id}) con la titulación DAM`);
        }

        // ── 2. Experiencia GDES: prácticas finalizadas ───────────
        const [gdes] = await db.query(
            "SELECT id, fecha_fin FROM experiencia WHERE empresa = 'GD Energy Services' LIMIT 1"
        );
        if (gdes.length === 0) {
            console.log('ℹ️  No se encontró la experiencia de GD Energy Services, se omite');
        } else if (gdes[0].fecha_fin) {
            console.log('ℹ️  Las prácticas de GDES ya figuran como finalizadas, se omite');
        } else {
            await db.query(
                'UPDATE experiencia SET fecha_fin = ?, descripcion = ? WHERE id = ?',
                [GDES_FECHA_FIN, GDES_DESCRIPCION, gdes[0].id]
            );
            console.log(`✅ Prácticas de GDES marcadas como finalizadas (fecha_fin=${GDES_FECHA_FIN})`);
        }

        // ── 3. Eliminar entrada "En busqueda activa" (obsoleta) ──
        const [resDelete] = await db.query(
            "DELETE FROM experiencia WHERE empresa = 'En busqueda activa'"
        );
        if (resDelete.affectedRows > 0) {
            console.log(`✅ Entrada "En busqueda activa" eliminada (${resDelete.affectedRows} fila/s)`);
        } else {
            console.log('ℹ️  No existe la entrada "En busqueda activa", se omite');
        }

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
