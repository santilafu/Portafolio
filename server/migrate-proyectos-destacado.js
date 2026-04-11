/**
 * migrate-proyectos-destacado.js
 * ------------------------------
 * Migración idempotente que añade soporte para proyectos destacados.
 *
 * Cambios aplicados:
 *   1. Añade columna 'imagen' a proyectos (si no existe)
 *   2. Añade columna 'destacado' a proyectos (si no existe)
 *   3. Añade columna 'orden' a proyectos (si no existe)
 *   4. Marca SuscriptWallet como destacado y le pone su banner
 *
 * Uso: node server/migrate-proyectos-destacado.js
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
        console.log('🚀 Iniciando migración proyectos destacados...\n');

        // ── 1. Añadir columna imagen ─────────────────────────────
        if (!(await columnaExiste('proyectos', 'imagen'))) {
            await db.query(`ALTER TABLE proyectos ADD COLUMN imagen VARCHAR(255) NULL`);
            console.log('✅ Columna imagen añadida a proyectos');
        } else {
            console.log('ℹ️  Columna imagen ya existe en proyectos');
        }

        // ── 2. Añadir columna destacado ──────────────────────────
        if (!(await columnaExiste('proyectos', 'destacado'))) {
            await db.query(`ALTER TABLE proyectos ADD COLUMN destacado BOOLEAN DEFAULT FALSE`);
            console.log('✅ Columna destacado añadida a proyectos');
        } else {
            console.log('ℹ️  Columna destacado ya existe en proyectos');
        }

        // ── 3. Añadir columna orden ──────────────────────────────
        if (!(await columnaExiste('proyectos', 'orden'))) {
            await db.query(`ALTER TABLE proyectos ADD COLUMN orden INT DEFAULT 0`);
            console.log('✅ Columna orden añadida a proyectos');
        } else {
            console.log('ℹ️  Columna orden ya existe en proyectos');
        }

        // ── 4. Marcar SuscriptWallet como destacado ──────────────
        const [resultado] = await db.query(
            `UPDATE proyectos
             SET destacado = 1, imagen = ?, orden = 1
             WHERE titulo LIKE 'SuscriptWallet%'`,
            ['/img/suscriptwallet-banner.png']
        );
        if (resultado.affectedRows > 0) {
            console.log(`✅ SuscriptWallet marcado como destacado (${resultado.affectedRows} fila/s)`);
        } else {
            console.log('ℹ️  No se encontró SuscriptWallet (¿ya migrado?)');
        }

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
