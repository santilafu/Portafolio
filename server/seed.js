/**
 * seed.js
 * -------
 * Script para poblar la base de datos con los datos reales del portafolio.
 *
 * Buenas prácticas aplicadas:
 *  - Usamos transacciones para que si algo falla, se deshagan todos los cambios (atomicidad).
 *  - Usamos consultas parametrizadas (?) para evitar inyección SQL.
 *  - Comprobamos si ya hay datos antes de insertar, para que sea seguro ejecutarlo varias veces.
 *  - Separamos los datos de la lógica (los arrays al principio).
 *
 * Uso: node server/seed.js
 */

require('dotenv').config({ override: true });
const db = require('./db');

// ============================================================
// DATOS DEL PORTAFOLIO
// Separamos los datos aquí arriba para que sea fácil editarlos
// sin tocar la lógica de inserción.
// ============================================================

const datosPerfil = {
    nombre: 'Santiago Lafuente Hernandez',
    titular: 'Desarrollador Multiplataforma',
    sobre_mi: 'Apasionado por el backend, las bases de datos y la creacion de APIs robustas. Siempre buscando aprender nuevas tecnologias y mejorar mis habilidades.',
    email: 'santi10dy@gmail.com',
    enlace_github: 'https://github.com/santilafu',
    enlace_linkedin: 'https://www.linkedin.com/in/santiago-lafuente-hern%C3%A1ndez-796783226/',
    foto_perfil: 'perfil.jpg'
};

// Cada proyecto referencia el perfil_id que se asignará tras insertar el perfil
const datosProyectos = [
    {
        titulo: 'SuscriptWallet - Gestor de Suscripciones',
        descripcion: 'Aplicacion full-stack para gestionar todas tus suscripciones de pago en un solo lugar. Backend en Kotlin + Spring Boot 3.3 + PostgreSQL con Spring Security y JWT. App movil multiplataforma con Kotlin Multiplatform y Jetpack Compose. Catalogo de 320+ servicios, dashboard con graficos por categoria, notificaciones de renovacion, modo offline y soporte multi-divisa.',
        url_repo: 'https://github.com/santilafu/SuscriptWallet',
        url_demo: ''
    },
    {
        titulo: 'Portafolio Full-Stack',
        descripcion: 'Portafolio personal con backend Node.js/Express y API REST completa (CRUD) conectada a MySQL. Frontend con tema oscuro, animaciones y Tailwind CSS. Incluye seguridad con Helmet, rate-limiting y dotenv.',
        url_repo: 'https://github.com/santilafu/Portafolio',
        url_demo: 'https://santiagolafuente.com'
    },
    {
        titulo: 'MoodTrack - Registro de Emociones',
        descripcion: 'Aplicacion web con Spring Boot y Thymeleaf para registrar emociones diarias, ver historial y estadisticas graficas. Base de datos H2 en memoria. Proyecto de 1er curso DAM.',
        url_repo: 'https://github.com/santilafu/App-Moodtrack',
        url_demo: ''
    },
    {
        titulo: 'Gestion Bancaria Segura',
        descripcion: 'App de escritorio Java Swing con cifrado AES-128, firmas digitales DSA y SHA-256. Gestiona cuentas bancarias con depositos, transferencias y control de acceso criptografico. Proyecto de 2o DAM.',
        url_repo: 'https://github.com/santilafu/GestionBancaria',
        url_demo: ''
    }
];

// nivel puede ser: 'Basico', 'Intermedio', 'Avanzado'
const datosHabilidades = [
    { nombre: 'Java',    nivel: 'Intermedio' },
    { nombre: 'MySQL',   nivel: 'Intermedio' },
    { nombre: 'HTML',    nivel: 'Intermedio' },
    { nombre: 'CSS',     nivel: 'Intermedio' },
    { nombre: 'Git',     nivel: 'Intermedio' },
    { nombre: 'Kotlin',  nivel: 'Basico' },
    { nombre: 'Node.js', nivel: 'Basico' },
    { nombre: 'Python',  nivel: 'Basico' },
    { nombre: 'Spring',  nivel: 'Basico' },
    { nombre: 'C#',      nivel: 'Basico' }
];

// Tecnologías principales (sección destacada)
const datosTechMain = [
    { nombre: 'Java',      icono: 'devicon-java-plain colored',       color: 'from-red-500/20 to-orange-500/20',   border: 'border-red-500/30',     icon_color: '',              grupo: 'main', orden: 1 },
    { nombre: 'MySQL',     icono: 'devicon-mysql-plain colored',      color: 'from-blue-500/20 to-cyan-500/20',    border: 'border-blue-500/30',    icon_color: '',              grupo: 'main', orden: 2 },
    { nombre: 'HTML5',     icono: 'devicon-html5-plain colored',      color: 'from-orange-500/20 to-red-500/20',   border: 'border-orange-500/30',  icon_color: '',              grupo: 'main', orden: 3 },
    { nombre: 'CSS3',      icono: 'devicon-css3-plain colored',       color: 'from-blue-400/20 to-blue-600/20',    border: 'border-blue-400/30',    icon_color: '',              grupo: 'main', orden: 4 },
    { nombre: 'Git',       icono: 'devicon-git-plain colored',        color: 'from-orange-600/20 to-red-600/20',   border: 'border-orange-600/30',  icon_color: '',              grupo: 'main', orden: 5 },
    { nombre: 'IntelliJ',  icono: 'devicon-intellij-plain colored',   color: 'from-pink-500/20 to-blue-500/20',    border: 'border-pink-500/30',    icon_color: '',              grupo: 'main', orden: 6 },
    { nombre: 'Claude',    icono: 'fa-solid fa-brain',                color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30',   icon_color: 'text-amber-400', grupo: 'main', orden: 7 },
    { nombre: 'Gemini',    icono: 'fa-solid fa-wand-magic-sparkles',  color: 'from-blue-400/20 to-cyan-400/20',    border: 'border-blue-400/30',    icon_color: 'text-blue-400', grupo: 'main', orden: 8 },
    { nombre: 'Copilot',   icono: 'fa-brands fa-github',              color: 'from-gray-300/20 to-gray-500/20',    border: 'border-gray-400/30',    icon_color: 'text-gray-300', grupo: 'main', orden: 9 },
];

// Otras tecnologías conocidas
const datosTechOther = [
    { nombre: 'Kotlin',     icono: 'devicon-kotlin-plain colored',     color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30',  icon_color: '', grupo: 'other', orden: 1 },
    { nombre: 'Python',     icono: 'devicon-python-plain colored',     color: 'from-yellow-500/20 to-blue-500/20',   border: 'border-yellow-500/30',  icon_color: '', grupo: 'other', orden: 2 },
    { nombre: 'JavaScript', icono: 'devicon-javascript-plain colored', color: 'from-yellow-400/20 to-yellow-600/20', border: 'border-yellow-400/30',  icon_color: '', grupo: 'other', orden: 3 },
    { nombre: 'Node.js',    icono: 'devicon-nodejs-plain colored',     color: 'from-green-500/20 to-green-700/20',   border: 'border-green-500/30',   icon_color: '', grupo: 'other', orden: 4 },
    { nombre: 'Spring',     icono: 'devicon-spring-plain colored',     color: 'from-green-400/20 to-green-600/20',   border: 'border-green-400/30',   icon_color: '', grupo: 'other', orden: 5 },
    { nombre: 'C#',         icono: 'devicon-csharp-plain colored',     color: 'from-purple-600/20 to-violet-600/20', border: 'border-purple-600/30',  icon_color: '', grupo: 'other', orden: 6 },
    { nombre: 'C++',        icono: 'devicon-cplusplus-plain colored',  color: 'from-blue-600/20 to-indigo-600/20',   border: 'border-blue-600/30',    icon_color: '', grupo: 'other', orden: 7 },
    { nombre: 'Unity',      icono: 'devicon-unity-plain',              color: 'from-gray-400/20 to-gray-600/20',     border: 'border-gray-400/30',    icon_color: '', grupo: 'other', orden: 8 },
    { nombre: 'Linux',      icono: 'devicon-linux-plain',              color: 'from-yellow-500/20 to-gray-500/20',   border: 'border-yellow-500/30',  icon_color: '', grupo: 'other', orden: 9 },
    { nombre: 'VS Code',    icono: 'devicon-vscode-plain colored',     color: 'from-blue-500/20 to-cyan-400/20',     border: 'border-blue-500/30',    icon_color: '', grupo: 'other', orden: 10 },
    { nombre: 'PostgreSQL', icono: 'devicon-postgresql-plain colored', color: 'from-blue-700/20 to-indigo-700/20',   border: 'border-blue-700/30',    icon_color: '', grupo: 'other', orden: 11 },
];

// fecha_fin null significa que sigue en curso
const datosExperiencia = [
    {
        empresa: 'GD Energy Services',
        puesto: 'Practicas IT',
        fecha_inicio: '2026-03-23',
        fecha_fin: null,
        descripcion: 'Practicas del ciclo DAM en el departamento de IT del Grupo Dominguis Energy Services. Soporte tecnico, mantenimiento de sistemas y desarrollo de herramientas internas para apoyar las operaciones de la empresa.',
        logo: '/img/gdes-logo.png'
    },
    {
        empresa: 'En busqueda activa',
        puesto: 'Estudiante en Practicas DAM',
        fecha_inicio: '2024-10-20',
        fecha_fin: null,
        descripcion: 'Buscando una empresa para realizar las practicas del ciclo de Desarrollo de Aplicaciones Multiplataforma, con ganas de aportar y aprender en un entorno real.',
        logo: null
    }
];

// Certificados y cursos completados
const datosCertificados = [
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

// ============================================================
// LÓGICA DE INSERCIÓN
// ============================================================

async function poblarBaseDatos() {
    // Obtenemos una conexión del pool para poder usar transacciones
    const conexion = await db.getConnection();

    try {
        // Iniciamos la transacción: si algo falla, se revertirá todo
        await conexion.beginTransaction();

        // ── PERFIL ──────────────────────────────────────────────
        // Comprobamos si ya existe un perfil para no duplicar datos
        const [perfilExistente] = await conexion.query('SELECT id FROM perfil LIMIT 1');

        let perfilId;

        if (perfilExistente.length > 0) {
            // Si ya existe, usamos su id (no insertamos de nuevo)
            perfilId = perfilExistente[0].id;
            console.log(`ℹ️  Perfil ya existente con id=${perfilId}, se omite la inserción`);
        } else {
            // Insertamos el perfil y guardamos el id autogenerado
            const [resultado] = await conexion.query(
                `INSERT INTO perfil
                    (nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin, foto_perfil)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    datosPerfil.nombre,
                    datosPerfil.titular,
                    datosPerfil.sobre_mi,
                    datosPerfil.email,
                    datosPerfil.enlace_github,
                    datosPerfil.enlace_linkedin,
                    datosPerfil.foto_perfil
                ]
            );
            perfilId = resultado.insertId;
            console.log(`✅ Perfil insertado con id=${perfilId}`);
        }

        // ── PROYECTOS ────────────────────────────────────────────
        // Comprobamos si ya hay proyectos asociados a este perfil
        const [proyectosExistentes] = await conexion.query(
            'SELECT id FROM proyectos WHERE perfil_id = ?', [perfilId]
        );

        if (proyectosExistentes.length > 0) {
            console.log(`ℹ️  Proyectos ya existentes para perfil_id=${perfilId}, se omite la inserción`);
        } else {
            // Recorremos el array e insertamos cada proyecto
            for (const proyecto of datosProyectos) {
                await conexion.query(
                    `INSERT INTO proyectos (perfil_id, titulo, descripcion, url_repo, url_demo)
                     VALUES (?, ?, ?, ?, ?)`,
                    [perfilId, proyecto.titulo, proyecto.descripcion, proyecto.url_repo, proyecto.url_demo]
                );
                console.log(`✅ Proyecto insertado: ${proyecto.titulo}`);
            }
        }

        // ── HABILIDADES ──────────────────────────────────────────
        const [habilidadesExistentes] = await conexion.query(
            'SELECT id FROM habilidades WHERE perfil_id = ?', [perfilId]
        );

        if (habilidadesExistentes.length > 0) {
            console.log(`ℹ️  Habilidades ya existentes para perfil_id=${perfilId}, se omite la inserción`);
        } else {
            for (const habilidad of datosHabilidades) {
                await conexion.query(
                    `INSERT INTO habilidades (perfil_id, nombre, nivel) VALUES (?, ?, ?)`,
                    [perfilId, habilidad.nombre, habilidad.nivel]
                );
                console.log(`✅ Habilidad insertada: ${habilidad.nombre} (${habilidad.nivel})`);
            }
        }

        // ── EXPERIENCIA ──────────────────────────────────────────
        const [experienciaExistente] = await conexion.query(
            'SELECT id FROM experiencia WHERE perfil_id = ?', [perfilId]
        );

        if (experienciaExistente.length > 0) {
            console.log(`ℹ️  Experiencia ya existente para perfil_id=${perfilId}, se omite la inserción`);
        } else {
            for (const exp of datosExperiencia) {
                await conexion.query(
                    `INSERT INTO experiencia (perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion, logo)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [perfilId, exp.empresa, exp.puesto, exp.fecha_inicio, exp.fecha_fin, exp.descripcion, exp.logo]
                );
                console.log(`✅ Experiencia insertada: ${exp.puesto} en ${exp.empresa}`);
            }
        }

        // ── CERTIFICADOS ─────────────────────────────────────────
        // La tabla certificados no tiene perfil_id (es global del portfolio)
        const [certsExistentes] = await conexion.query('SELECT id FROM certificados LIMIT 1');

        if (certsExistentes.length > 0) {
            console.log('ℹ️  Certificados ya existentes, se omite la inserción');
        } else {
            for (const cert of datosCertificados) {
                await conexion.query(
                    `INSERT INTO certificados
                        (titulo, emisor, fecha, descripcion, url_archivo, url_externa, icono, color, border, icon_color, orden)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [cert.titulo, cert.emisor, cert.fecha, cert.descripcion, cert.url_archivo, cert.url_externa,
                     cert.icono, cert.color, cert.border, cert.icon_color, cert.orden]
                );
                console.log(`✅ Certificado insertado: ${cert.titulo}`);
            }
        }

        // ── TECH STACK ───────────────────────────────────────────
        // La tabla tech_stack no tiene perfil_id (es global del portfolio)
        const [techExistente] = await conexion.query('SELECT id FROM tech_stack LIMIT 1');

        if (techExistente.length > 0) {
            console.log('ℹ️  Tech stack ya existente, se omite la inserción');
        } else {
            const todasLasTechs = [...datosTechMain, ...datosTechOther];
            for (const tech of todasLasTechs) {
                await conexion.query(
                    `INSERT INTO tech_stack (nombre, icono, color, border, icon_color, grupo, orden)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [tech.nombre, tech.icono, tech.color, tech.border, tech.icon_color, tech.grupo, tech.orden]
                );
                console.log(`✅ Tech insertada: ${tech.nombre} (${tech.grupo})`);
            }
        }

        // Si todo fue bien, confirmamos la transacción
        await conexion.commit();
        console.log('\n🎉 Base de datos poblada correctamente en Aiven');

    } catch (error) {
        // Si algo falló, revertimos todos los cambios de esta transacción
        await conexion.rollback();
        console.error('❌ Error durante el seed, se revirtieron los cambios:', error.message);
    } finally {
        // Siempre liberamos la conexión de vuelta al pool
        conexion.release();
        process.exit();
    }
}

// Ejecutamos la función principal
poblarBaseDatos();