/**
 * migrate-corrige-tildes.js
 * -------------------------
 * Migración idempotente que corrige la ortografía (tildes, ñ, º) de los
 * textos guardados en la base de datos. Hasta ahora los datos se habían
 * escrito sin acentos ("produccion", "Vehiculos", "resenas"...).
 *
 * Solo se corrige ortografía: no se reescribe el contenido. No se tocan
 * URLs, rutas de archivos, clases de iconos, colores ni nombres de marcas
 * o tecnologías.
 *
 * ¿Cómo localizamos cada fila? Por su valor antiguo EXACTO.
 * OJO: las tablas usan la collation utf8mb4_0900_ai_ci, que es
 * "accent insensitive" (para MySQL 'Basico' = 'Básico'). Por eso
 * comparamos con BINARY: así solo casa el texto antiguo sin tildes y,
 * una vez corregido, ya no vuelve a casar (idempotente).
 *
 * Uso: node server/migrate-corrige-tildes.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

// Lista blanca de tablas y columnas que podemos tocar.
// Como los nombres de tabla/columna no se pueden pasar como parámetro (?),
// validamos contra esta lista antes de montar la consulta (evita inyección SQL).
const COLUMNAS_PERMITIDAS = {
    perfil:       ['nombre', 'sobre_mi'],
    proyectos:    ['titulo', 'descripcion'],
    experiencia:  ['puesto', 'descripcion'],
    certificados: ['titulo', 'descripcion'],
    habilidades:  ['nivel']
};

// Cada corrección: en qué tabla/columna, el texto antiguo y el corregido
const correcciones = [
    // ── perfil ──
    {
        tabla: 'perfil', campo: 'nombre',
        antes:   'Santiago Lafuente Hernandez',
        despues: 'Santiago Lafuente Hernández'
    },
    {
        tabla: 'perfil', campo: 'sobre_mi',
        antes:   'Titulado en Desarrollo de Aplicaciones Multiplataforma (DAM) con un 9 de nota media. Apasionado por el backend, las bases de datos y la creacion de APIs robustas. Siempre buscando aprender nuevas tecnologias y mejorar mis habilidades.',
        despues: 'Titulado en Desarrollo de Aplicaciones Multiplataforma (DAM) con un 9 de nota media. Apasionado por el backend, las bases de datos y la creación de APIs robustas. Siempre buscando aprender nuevas tecnologías y mejorar mis habilidades.'
    },

    // ── proyectos ──
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'Aplicacion web con Spring Boot y Thymeleaf para registrar emociones diarias, ver historial y estadisticas graficas. Base de datos H2 en memoria. Proyecto de 1er curso DAM.',
        despues: 'Aplicación web con Spring Boot y Thymeleaf para registrar emociones diarias, ver historial y estadísticas gráficas. Base de datos H2 en memoria. Proyecto de 1er curso DAM.'
    },
    {
        tabla: 'proyectos', campo: 'titulo',
        antes:   'Gestion Bancaria Segura',
        despues: 'Gestión Bancaria Segura'
    },
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'App de escritorio Java Swing con cifrado AES-128, firmas digitales DSA y SHA-256. Gestiona cuentas bancarias con depositos, transferencias y control de acceso criptografico. Proyecto de 2o DAM.',
        despues: 'App de escritorio Java Swing con cifrado AES-128, firmas digitales DSA y SHA-256. Gestiona cuentas bancarias con depósitos, transferencias y control de acceso criptográfico. Proyecto de 2º DAM.'
    },
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'Aplicacion full-stack para gestionar todas tus suscripciones de pago en un solo lugar. Backend en Kotlin + Spring Boot 3.3 + PostgreSQL con Spring Security y JWT. App movil multiplataforma con Kotlin Multiplatform y Jetpack Compose. Catalogo de 320+ servicios, dashboard con graficos por categoria, notificaciones de renovacion, modo offline y soporte multi-divisa.',
        despues: 'Aplicación full-stack para gestionar todas tus suscripciones de pago en un solo lugar. Backend en Kotlin + Spring Boot 3.3 + PostgreSQL con Spring Security y JWT. App móvil multiplataforma con Kotlin Multiplatform y Jetpack Compose. Catálogo de 320+ servicios, dashboard con gráficos por categoría, notificaciones de renovación, modo offline y soporte multi-divisa.'
    },
    {
        tabla: 'proyectos', campo: 'titulo',
        antes:   'Revisa - Mantenimiento de Vehiculos',
        despues: 'Revisa - Mantenimiento de Vehículos'
    },
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'Aplicacion web progresiva (PWA) para gestionar el mantenimiento de tus vehiculos. Avisa de ITV, seguro y revisiones por fecha o kilometraje, mostrando de un vistazo que esta al dia, proximo o vencido. Frontend en React + TypeScript + Vite con Tailwind CSS, animaciones con Framer Motion y persistencia local offline con Dexie.js (IndexedDB).',
        despues: 'Aplicación web progresiva (PWA) para gestionar el mantenimiento de tus vehículos. Avisa de ITV, seguro y revisiones por fecha o kilometraje, mostrando de un vistazo qué está al día, próximo o vencido. Frontend en React + TypeScript + Vite con Tailwind CSS, animaciones con Framer Motion y persistencia local offline con Dexie.js (IndexedDB).'
    },
    {
        tabla: 'proyectos', campo: 'titulo',
        antes:   'Rondas - Checklists de Inspeccion Industrial',
        despues: 'Rondas - Checklists de Inspección Industrial'
    },
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'Aplicacion web para realizar rondas de mantenimiento e inspecciones desde el movil o el PC. Permite rellenar checklists punto por punto (OK / No OK / N-A con comentarios y fotos), firmar con el dedo y generar un acta en PDF con veredicto Apto/No Apto. Incluye editor de plantillas personalizables, autoguardado y reanudacion de inspecciones a medias, panel de estadisticas con los puntos que mas fallan, filtros y copia de seguridad. Construida en React + Vite con Tailwind CSS, sin backend: toda la persistencia es local en el navegador.',
        despues: 'Aplicación web para realizar rondas de mantenimiento e inspecciones desde el móvil o el PC. Permite rellenar checklists punto por punto (OK / No OK / N-A con comentarios y fotos), firmar con el dedo y generar un acta en PDF con veredicto Apto/No Apto. Incluye editor de plantillas personalizables, autoguardado y reanudación de inspecciones a medias, panel de estadísticas con los puntos que más fallan, filtros y copia de seguridad. Construida en React + Vite con Tailwind CSS, sin backend: toda la persistencia es local en el navegador.'
    },
    {
        tabla: 'proyectos', campo: 'descripcion',
        antes:   'Web corporativa en produccion para Domelec Duke, empresa de electricidad y domotica de la Comunidad Valenciana. Landing de una sola pagina en React + TypeScript + Vite con Tailwind CSS, logo 3D animado con el scroll (Three.js / React Three Fiber + GSAP) y HTML prerenderizado para SEO. Desplegada en Cloudflare Workers, con un panel de administracion propio desde el que el cliente edita textos, fotos y resenas y publica los cambios.',
        despues: 'Web corporativa en producción para Domelec Duke, empresa de electricidad y domótica de la Comunidad Valenciana. Landing de una sola página en React + TypeScript + Vite con Tailwind CSS, logo 3D animado con el scroll (Three.js / React Three Fiber + GSAP) y HTML prerenderizado para SEO. Desplegada en Cloudflare Workers, con un panel de administración propio desde el que el cliente edita textos, fotos y reseñas y publica los cambios.'
    },

    // ── experiencia ──
    {
        tabla: 'experiencia', campo: 'puesto',
        antes:   'Practicas IT',
        despues: 'Prácticas IT'
    },
    {
        tabla: 'experiencia', campo: 'descripcion',
        antes:   'Practicas del ciclo DAM en el departamento de IT del Grupo Dominguis Energy Services. Di soporte tecnico, realice mantenimiento de sistemas y desarrolle herramientas internas para apoyar las operaciones de la empresa.',
        despues: 'Prácticas del ciclo DAM en el departamento de IT del Grupo Dominguis Energy Services. Di soporte técnico, realicé mantenimiento de sistemas y desarrollé herramientas internas para apoyar las operaciones de la empresa.'
    },

    // ── certificados ──
    {
        tabla: 'certificados', campo: 'descripcion',
        antes:   'Diseno de flujos de automatizacion combinando N8N con servicios de inteligencia artificial para crear procesos sin codigo.',
        despues: 'Diseño de flujos de automatización combinando N8N con servicios de inteligencia artificial para crear procesos sin código.'
    },
    {
        tabla: 'certificados', campo: 'titulo',
        antes:   'Curso de Iniciacion al Desarrollo con IA',
        despues: 'Curso de Iniciación al Desarrollo con IA'
    },
    {
        tabla: 'certificados', campo: 'descripcion',
        antes:   'Jornadas formativas sobre desarrollo de aplicaciones aprovechando inteligencia artificial. 6 horas de formacion impartidas por Romuald Fons y Brais Moure.',
        despues: 'Jornadas formativas sobre desarrollo de aplicaciones aprovechando inteligencia artificial. 6 horas de formación impartidas por Romuald Fons y Brais Moure.'
    },
    {
        tabla: 'certificados', campo: 'titulo',
        antes:   'Curso de Ciberseguridad y Hacking Etico',
        despues: 'Curso de Ciberseguridad y Hacking Ético'
    },
    {
        tabla: 'certificados', campo: 'descripcion',
        antes:   'Jornadas sobre ciberseguridad y hacking etico: tecnicas de deteccion de vulnerabilidades y defensa digital. 6 horas de formacion impartidas por Romuald Fons y Mario Alvarez (Director del Master de Ciberseguridad).',
        despues: 'Jornadas sobre ciberseguridad y hacking ético: técnicas de detección de vulnerabilidades y defensa digital. 6 horas de formación impartidas por Romuald Fons y Mario Álvarez (Director del Máster de Ciberseguridad).'
    },
    {
        tabla: 'certificados', campo: 'descripcion',
        antes:   'Curso de iniciacion al desarrollo de software con inteligencia artificial. 4 horas de formacion impartidas por Romuald Fons (CEO de BIG school) y Brais Moure (Director del Master en Desarrollo con IA).',
        despues: 'Curso de iniciación al desarrollo de software con inteligencia artificial. 4 horas de formación impartidas por Romuald Fons (CEO de BIG school) y Brais Moure (Director del Máster en Desarrollo con IA).'
    },

    // ── habilidades ──
    {
        tabla: 'habilidades', campo: 'nivel',
        antes:   'Basico',
        despues: 'Básico'
    }
];

async function migrar() {
    try {
        console.log('🚀 Iniciando corrección de tildes en la BD...\n');

        let totalFilas = 0;

        for (const c of correcciones) {
            // Comprobamos que la tabla y la columna están en la lista blanca
            if (!(COLUMNAS_PERMITIDAS[c.tabla] || []).includes(c.campo)) {
                console.log(`❌ Columna no permitida: ${c.tabla}.${c.campo}, se omite`);
                continue;
            }

            // BINARY fuerza comparación exacta (sensible a tildes y mayúsculas)
            const [resultado] = await db.query(
                `UPDATE ${c.tabla} SET ${c.campo} = ? WHERE BINARY ${c.campo} = BINARY ?`,
                [c.despues, c.antes]
            );

            if (resultado.affectedRows > 0) {
                totalFilas += resultado.affectedRows;
                console.log(`✅ ${c.tabla}.${c.campo} (${resultado.affectedRows} fila/s): "${c.antes.slice(0, 50)}" → "${c.despues.slice(0, 50)}"`);
            } else {
                console.log(`ℹ️  ${c.tabla}.${c.campo}: ya corregido o no encontrado ("${c.despues.slice(0, 50)}")`);
            }
        }

        console.log(`\n🎉 Migración completada con éxito (${totalFilas} fila/s actualizadas)`);

    } catch (error) {
        console.error('❌ Error en la migración:', error.message);
    } finally {
        process.exit();
    }
}

migrar();
