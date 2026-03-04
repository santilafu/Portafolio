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
    enlace_linkedin: 'www.linkedin.com/in/santiago-lafuente-hernandez-796783226',
    foto_perfil: 'perfil.jpg'
};

// Cada proyecto referencia el perfil_id que se asignará tras insertar el perfil
const datosProyectos = [
    {
        titulo: 'Portafolio Full-Stack',
        descripcion: 'Portafolio personal con backend Node.js/Express y API REST completa (CRUD) conectada a MySQL. Frontend con tema oscuro, animaciones y Tailwind CSS. Incluye seguridad con Helmet, rate-limiting y dotenv.',
        url_repo: 'https://github.com/santilafu/Portafolio',
        url_demo: ''
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

// fecha_fin null significa que sigue en curso
const datosExperiencia = [
    {
        empresa: 'En busqueda activa',
        puesto: 'Estudiante en Practicas DAM',
        fecha_inicio: '2024-10-20',
        fecha_fin: null,
        descripcion: 'Buscando una empresa para realizar las practicas del ciclo de Desarrollo de Aplicaciones Multiplataforma, con ganas de aportar y aprender en un entorno real.'
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
                    `INSERT INTO experiencia (perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [perfilId, exp.empresa, exp.puesto, exp.fecha_inicio, exp.fecha_fin, exp.descripcion]
                );
                console.log(`✅ Experiencia insertada: ${exp.puesto} en ${exp.empresa}`);
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