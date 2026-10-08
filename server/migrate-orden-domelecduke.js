/**
 * migrate-orden-domelecduke.js
 * ----------------------------
 * Migración idempotente con dos cambios sobre Domelec Duke:
 *
 * 1. Lo marca con estado = 'en_produccion': es una web real de un cliente,
 *    así que el frontend muestra el enlace como "Ver web" y no como "Demo".
 *    (La columna `estado` es VARCHAR(20), no hace falta tocar el esquema.)
 *
 * 2. Reordena los proyectos NO destacados para que
 * "Domelec Duke - Web Corporativa" aparezca justo debajo de SuscriptWallet
 * (el proyecto destacado, que se pinta como banner a todo el ancho).
 *
 * La API ordena con: ORDER BY destacado DESC, orden ASC, id ASC.
 * En producción Portafolio, MoodTrack y Gestión Bancaria tenían orden = 0,
 * así que quedaban por delante de Domelec (orden = 2). Asignamos valores
 * únicos (sin empates) manteniendo el orden relativo del resto:
 *   1 Domelec Duke · 2 Portafolio · 3 MoodTrack · 4 Gestión Bancaria
 *   5 Revisa · 6 Rondas
 *
 * Es seguro ejecutarlo varias veces: solo fija valores concretos por título.
 *
 * Uso: node server/migrate-orden-domelecduke.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

// Orden deseado de los proyectos no destacados (título → orden)
const nuevoOrden = [
    ['Domelec Duke - Web Corporativa', 1],
    ['Portafolio Full-Stack', 2],
    ['MoodTrack - Registro de Emociones', 3],
    ['Gestión Bancaria Segura', 4],
    ['Revisa - Mantenimiento de Vehículos', 5],
    ['Rondas - Checklists de Inspección Industrial', 6]
];

async function migrar() {
    try {
        console.log('🚀 Reordenando proyectos (Domelec Duke debajo de SuscriptWallet)...\n');

        for (const [titulo, orden] of nuevoOrden) {
            // Solo tocamos proyectos no destacados para no mover el banner
            const [resultado] = await db.query(
                'UPDATE proyectos SET orden = ? WHERE titulo = ? AND destacado = 0',
                [orden, titulo]
            );
            if (resultado.affectedRows > 0) {
                console.log(`✅ ${titulo} → orden ${orden}`);
            } else {
                console.log(`ℹ️  No encontrado (o destacado): ${titulo}`);
            }
        }

        // Domelec Duke es una web en producción, no una demo
        const [resEstado] = await db.query(
            "UPDATE proyectos SET estado = 'en_produccion' WHERE titulo = ?",
            ['Domelec Duke - Web Corporativa']
        );
        console.log(resEstado.affectedRows > 0
            ? "\n✅ Domelec Duke → estado 'en_produccion'"
            : '\nℹ️  Domelec Duke no encontrado');

        console.log('\n🎉 Migración completada con éxito');

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
