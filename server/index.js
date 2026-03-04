/**
 * index.js
 * --------
 * Punto de entrada del servidor. Aquí arranca la aplicación Express
 * y se definen todas las rutas de la API REST.
 *
 * API REST significa que cada recurso (perfil, proyectos...) tiene su propia
 * URL y respondemos con JSON. Los métodos HTTP indican la acción:
 *   GET    → leer datos
 *   POST   → crear nuevo registro
 *   PUT    → actualizar registro existente
 *   DELETE → eliminar registro
 *
 * Buenas prácticas aplicadas:
 *  - Helmet:     añade cabeceras de seguridad HTTP automáticamente
 *  - Rate limit: limita peticiones por IP para evitar abuso o ataques DDoS
 *  - CORS:       controla qué dominios pueden hacer peticiones a nuestra API
 *  - dotenv:     las configuraciones sensibles van en .env, no en el código
 *  - async/await + try/catch: manejo de errores limpio en todas las rutas
 */

// Cargamos las variables de entorno antes que cualquier otra cosa
require('dotenv').config({ override: true });

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARES DE SEGURIDAD
// Los middlewares son funciones que se ejecutan antes de llegar
// a nuestras rutas. Los configuramos aquí arriba para que se
// apliquen a todas las peticiones.
// ============================================================

/**
 * Helmet añade automáticamente cabeceras HTTP de seguridad
 * (por ejemplo: X-Content-Type-Options, X-Frame-Options...).
 * Desactivamos contentSecurityPolicy y crossOriginEmbedderPolicy
 * porque interfieren con nuestro frontend estático.
 */
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

/**
 * Rate Limiting: limitamos a 100 peticiones por IP cada 15 minutos
 * en todas las rutas que empiecen por /api/.
 * Esto protege contra ataques de fuerza bruta o abuso de la API.
 */
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // ventana de tiempo: 15 minutos en milisegundos
    max: 100,                  // máximo de peticiones por IP en esa ventana
    standardHeaders: true,     // incluye info del límite en las cabeceras de respuesta
    legacyHeaders: false,      // desactiva cabeceras antiguas (X-RateLimit-*)
    message: { error: 'Demasiadas peticiones, intenta de nuevo mas tarde.' }
}));

/**
 * CORS (Cross-Origin Resource Sharing):
 * Controla qué dominios pueden hacer fetch/ajax a nuestra API.
 * En producción debería ser el dominio real, en desarrollo usamos localhost.
 * El valor viene del .env (CORS_ORIGIN).
 */
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    optionsSuccessStatus: 200
}));

// Permite que Express entienda el cuerpo de las peticiones en formato JSON
app.use(express.json());

// Servimos los archivos estáticos del frontend (HTML, CSS, JS, imágenes)
// desde la carpeta /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Importamos el módulo de conexión a la base de datos
const db = require('./db');

// nodemailer: librería para enviar emails desde Node.js
const nodemailer = require('nodemailer');

// Ruta raíz: devuelve el index.html del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ============================================================
// PERFIL
// Tabla: perfil — datos personales del desarrollador
// ============================================================

/**
 * GET /api/perfil
 * Devuelve todos los registros de la tabla perfil en formato JSON.
 * El frontend usa esto para mostrar el nombre, foto, etc.
 */
app.get('/api/perfil', async (req, res) => {
    try {
        // db.query devuelve un array: [filas, campos]. Solo nos interesan las filas.
        const [filas] = await db.query('SELECT * FROM perfil');
        res.json(filas);
    } catch (error) {
        console.error('Error en la base de datos:', error);
        res.status(500).json({ error: 'Error al conectar con la base de datos' });
    }
});

/**
 * POST /api/perfil
 * Crea un nuevo perfil con los datos del body (JSON).
 * nombre y email son obligatorios; si faltan devolvemos 400 (Bad Request).
 */
app.post('/api/perfil', async (req, res) => {
    try {
        const { nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin } = req.body;

        // Validación básica: campos obligatorios
        if (!nombre || !email) {
            return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
        }

        // Usamos ? para evitar inyección SQL (consulta parametrizada)
        const sql = 'INSERT INTO perfil (nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultado] = await db.query(sql, [nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin]);

        // 201 Created: el recurso se ha creado correctamente
        res.status(201).json({ mensaje: 'Perfil guardado correctamente', id_asignado: resultado.insertId });
    } catch (error) {
        console.error('Error al insertar el perfil:', error);
        res.status(500).json({ error: 'Error al guardar los datos' });
    }
});

/**
 * PUT /api/perfil/:id
 * Actualiza un perfil existente identificado por su :id.
 * Acepta tanto foto_perfil como foto_url en el body (compatibilidad).
 * Si no existe el perfil, devolvemos 404 (Not Found).
 */
app.put('/api/perfil/:id', async (req, res) => {
    try {
        const idPerfil = req.params.id; // id que viene en la URL

        const { nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin, foto_perfil, foto_url } = req.body;

        if (!nombre || !email) {
            return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
        }

        // Aceptamos cualquiera de los dos campos para la foto
        const foto = foto_perfil || foto_url || null;

        const sql = 'UPDATE perfil SET nombre = ?, titular = ?, sobre_mi = ?, email = ?, enlace_github = ?, enlace_linkedin = ?, foto_perfil = ? WHERE id = ?';
        const [resultado] = await db.query(sql, [nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin, foto, idPerfil]);

        // affectedRows = 0 significa que no existía ningún registro con ese id
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al modificar el perfil' });
    }
});

// ============================================================
// PROYECTOS
// Tabla: proyectos — cada proyecto tiene un perfil_id (clave foránea)
// que lo vincula a un perfil concreto.
// ============================================================

/**
 * GET /api/proyectos
 * Devuelve todos los proyectos almacenados.
 */
app.get('/api/proyectos', async (req, res) => {
    try {
        const [proyectos] = await db.query('SELECT * FROM proyectos');
        res.json(proyectos);
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ error: 'Error al consultar los proyectos' });
    }
});

/**
 * POST /api/proyectos
 * Crea un nuevo proyecto vinculado a un perfil.
 * perfil_id y titulo son obligatorios.
 */
app.post('/api/proyectos', async (req, res) => {
    try {
        const { perfil_id, titulo, descripcion, url_repo, url_demo } = req.body;

        if (!perfil_id || !titulo) {
            return res.status(400).json({ error: 'Los campos perfil_id y titulo son obligatorios' });
        }

        const sql = 'INSERT INTO proyectos (perfil_id, titulo, descripcion, url_repo, url_demo) VALUES (?, ?, ?, ?, ?)';
        const [resultado] = await db.query(sql, [perfil_id, titulo, descripcion, url_repo, url_demo]);

        res.status(201).json({ mensaje: 'Proyecto anadido correctamente', id_proyecto: resultado.insertId });
    } catch (error) {
        console.error('Error al insertar el proyecto:', error);
        res.status(500).json({ error: 'Error al guardar el proyecto' });
    }
});

/**
 * PUT /api/proyectos/:id
 * Actualiza los datos de un proyecto existente.
 */
app.put('/api/proyectos/:id', async (req, res) => {
    try {
        const idProyecto = req.params.id;
        const { titulo, descripcion, url_repo, url_demo } = req.body;

        if (!titulo) {
            return res.status(400).json({ error: 'El campo titulo es obligatorio' });
        }

        const sql = 'UPDATE proyectos SET titulo = ?, descripcion = ?, url_repo = ?, url_demo = ? WHERE id = ?';
        const [resultado] = await db.query(sql, [titulo, descripcion, url_repo, url_demo, idProyecto]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ mensaje: 'Proyecto actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar:', error);
        res.status(500).json({ error: 'Error al actualizar el proyecto' });
    }
});

/**
 * DELETE /api/proyectos/:id
 * Elimina un proyecto por su id.
 * Si no existe, devolvemos 404.
 */
app.delete('/api/proyectos/:id', async (req, res) => {
    try {
        const idProyecto = req.params.id;
        const [resultado] = await db.query('DELETE FROM proyectos WHERE id = ?', [idProyecto]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Proyecto no encontrado' });
        }

        res.json({ mensaje: 'Proyecto eliminado correctamente' });
    } catch (error) {
        console.error('Error al borrar:', error);
        res.status(500).json({ error: 'Error al eliminar el proyecto' });
    }
});

// ============================================================
// HABILIDADES
// Tabla: habilidades — tecnologías y nivel de dominio
// ============================================================

/**
 * GET /api/habilidades
 * Devuelve todas las habilidades almacenadas.
 */
app.get('/api/habilidades', async (req, res) => {
    try {
        const [habilidades] = await db.query('SELECT * FROM habilidades');
        res.json(habilidades);
    } catch (error) {
        console.error('Error al obtener habilidades:', error);
        res.status(500).json({ error: 'Error al consultar las habilidades' });
    }
});

/**
 * POST /api/habilidades
 * Añade una nueva habilidad vinculada a un perfil.
 * perfil_id y nombre son obligatorios.
 */
app.post('/api/habilidades', async (req, res) => {
    try {
        const { perfil_id, nombre, nivel } = req.body;

        if (!perfil_id || !nombre) {
            return res.status(400).json({ error: 'Los campos perfil_id y nombre son obligatorios' });
        }

        const sql = 'INSERT INTO habilidades (perfil_id, nombre, nivel) VALUES (?, ?, ?)';
        const [resultado] = await db.query(sql, [perfil_id, nombre, nivel]);

        res.status(201).json({ mensaje: 'Habilidad anadida correctamente', id_habilidad: resultado.insertId });
    } catch (error) {
        console.error('Error al insertar habilidad:', error);
        res.status(500).json({ error: 'Error al guardar la habilidad' });
    }
});

/**
 * PUT /api/habilidades/:id
 * Actualiza el nombre o nivel de una habilidad.
 */
app.put('/api/habilidades/:id', async (req, res) => {
    try {
        const idHabilidad = req.params.id;
        const { nombre, nivel } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El campo nombre es obligatorio' });
        }

        const sql = 'UPDATE habilidades SET nombre = ?, nivel = ? WHERE id = ?';
        const [resultado] = await db.query(sql, [nombre, nivel, idHabilidad]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Habilidad no encontrada' });
        }

        res.json({ mensaje: 'Habilidad actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar habilidad:', error);
        res.status(500).json({ error: 'Error al modificar la habilidad' });
    }
});

/**
 * DELETE /api/habilidades/:id
 * Elimina una habilidad por su id.
 */
app.delete('/api/habilidades/:id', async (req, res) => {
    try {
        const idHabilidad = req.params.id;
        const [resultado] = await db.query('DELETE FROM habilidades WHERE id = ?', [idHabilidad]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Habilidad no encontrada' });
        }

        res.json({ mensaje: 'Habilidad eliminada correctamente' });
    } catch (error) {
        console.error('Error al borrar habilidad:', error);
        res.status(500).json({ error: 'Error al eliminar la habilidad' });
    }
});

// ============================================================
// EXPERIENCIA
// Tabla: experiencia — historial laboral / prácticas
// ============================================================

/**
 * GET /api/experiencia
 * Devuelve toda la experiencia laboral ordenada por fecha de inicio
 * descendente (la más reciente primero).
 */
app.get('/api/experiencia', async (req, res) => {
    try {
        const [experiencia] = await db.query('SELECT * FROM experiencia ORDER BY fecha_inicio DESC');
        res.json(experiencia);
    } catch (error) {
        console.error('Error al obtener experiencia:', error);
        res.status(500).json({ error: 'Error al consultar la experiencia' });
    }
});

/**
 * POST /api/experiencia
 * Añade un nuevo registro de experiencia laboral.
 * perfil_id, empresa, puesto y fecha_inicio son obligatorios.
 * fecha_fin puede ser null si el trabajo sigue en curso.
 */
app.post('/api/experiencia', async (req, res) => {
    try {
        const { perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion } = req.body;

        if (!perfil_id || !empresa || !puesto || !fecha_inicio) {
            return res.status(400).json({ error: 'Los campos perfil_id, empresa, puesto y fecha_inicio son obligatorios' });
        }

        const sql = 'INSERT INTO experiencia (perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultado] = await db.query(sql, [perfil_id, empresa, puesto, fecha_inicio, fecha_fin, descripcion]);

        res.status(201).json({ mensaje: 'Experiencia anadida correctamente', id_experiencia: resultado.insertId });
    } catch (error) {
        console.error('Error al insertar experiencia:', error);
        res.status(500).json({ error: 'Error al guardar la experiencia' });
    }
});

/**
 * PUT /api/experiencia/:id
 * Actualiza un registro de experiencia existente.
 */
app.put('/api/experiencia/:id', async (req, res) => {
    try {
        const idExperiencia = req.params.id;
        const { empresa, puesto, fecha_inicio, fecha_fin, descripcion } = req.body;

        if (!empresa || !puesto || !fecha_inicio) {
            return res.status(400).json({ error: 'Los campos empresa, puesto y fecha_inicio son obligatorios' });
        }

        const sql = 'UPDATE experiencia SET empresa = ?, puesto = ?, fecha_inicio = ?, fecha_fin = ?, descripcion = ? WHERE id = ?';
        const [resultado] = await db.query(sql, [empresa, puesto, fecha_inicio, fecha_fin, descripcion, idExperiencia]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Experiencia no encontrada' });
        }

        res.json({ mensaje: 'Experiencia actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar experiencia:', error);
        res.status(500).json({ error: 'Error al modificar la experiencia' });
    }
});

/**
 * DELETE /api/experiencia/:id
 * Elimina un registro de experiencia por su id.
 */
app.delete('/api/experiencia/:id', async (req, res) => {
    try {
        const idExperiencia = req.params.id;
        const [resultado] = await db.query('DELETE FROM experiencia WHERE id = ?', [idExperiencia]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Experiencia no encontrada' });
        }

        res.json({ mensaje: 'Experiencia eliminada correctamente' });
    } catch (error) {
        console.error('Error al borrar experiencia:', error);
        res.status(500).json({ error: 'Error al eliminar la experiencia' });
    }
});

// ============================================================
// PING (health check)
// Endpoint simple que devuelve 200 OK. Lo usan el auto-ping
// interno y servicios externos para comprobar que el servidor
// está vivo.
// ============================================================

/**
 * GET /api/ping
 * Devuelve 200 OK con un timestamp. Útil para:
 *  - Comprobar que el servidor está arriba
 *  - Ser llamado por el auto-ping para evitar el apagado en Render free tier
 */
app.get('/api/ping', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// CONTACTO
// Recibe el formulario del frontend y envía un email al dueño
// del portafolio usando nodemailer con Gmail como servidor SMTP.
//
// Para que funcione necesitas:
//  1. Activar verificación en 2 pasos en tu cuenta Google
//  2. Generar una "Contraseña de aplicación" en Seguridad → Contraseñas de app
//  3. Añadir GMAIL_USER y GMAIL_PASS al .env y a las variables de Render
// ============================================================

/**
 * Configuramos el transporter de nodemailer con Gmail.
 * Se crea una vez y se reutiliza en cada petición (eficiente).
 * Si las credenciales no están en el .env, nodemailer lo indicará al enviar.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

/**
 * POST /api/contacto
 * Recibe { nombre, email, mensaje } y envía un email al dueño del portafolio.
 * Validamos que los tres campos estén presentes antes de intentar enviar.
 */
app.post('/api/contacto', async (req, res) => {
    try {
        const { nombre, email, mensaje } = req.body;

        if (!nombre || !email || !mensaje) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios' });
        }

        await transporter.sendMail({
            from: `"Portafolio" <${process.env.GMAIL_USER}>`, // remitente (tu cuenta Gmail)
            to: process.env.GMAIL_USER,                        // destinatario (tú mismo)
            replyTo: email,                                    // al responder, va al visitante
            subject: `📩 Mensaje de ${nombre} — Portafolio`,
            html: `
                <h2>Nuevo mensaje desde tu portafolio</h2>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Mensaje:</strong></p>
                <p>${mensaje.replace(/\n/g, '<br>')}</p>
            `
        });

        res.json({ mensaje: '¡Mensaje enviado correctamente!' });
    } catch (error) {
        console.error('Error al enviar email:', error);
        res.status(500).json({ error: 'Error al enviar el mensaje. Inténtalo de nuevo.' });
    }
});

// ============================================================
// VISITAS
// Contador de visitas persistente en la BD.
// La tabla tiene una sola fila (id=1) con el total acumulado.
// Se crea automáticamente al arrancar si no existe.
// ============================================================

/**
 * Crea la tabla visitas si no existe e inicializa el contador a 0.
 * Se llama una vez al arrancar el servidor.
 */
async function inicializarVisitas() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS visitas (
            id    INT PRIMARY KEY DEFAULT 1,
            total INT NOT NULL DEFAULT 0
        )
    `);
    // INSERT IGNORE: solo inserta si la fila id=1 no existe todavía
    await db.query('INSERT IGNORE INTO visitas (id, total) VALUES (1, 0)');
}

/**
 * GET /api/visitas
 * Incrementa el contador en 1 y devuelve el total actualizado.
 * El auto-ping usa /api/ping (no este endpoint) para no inflar el contador.
 */
app.get('/api/visitas', async (req, res) => {
    try {
        await db.query('UPDATE visitas SET total = total + 1 WHERE id = 1');
        const [[fila]] = await db.query('SELECT total FROM visitas WHERE id = 1');
        res.json({ total: fila.total });
    } catch (error) {
        console.error('Error al registrar visita:', error);
        res.status(500).json({ error: 'Error al registrar visita' });
    }
});

// ============================================================
// ARRANQUE DEL SERVIDOR
// app.listen() pone el servidor a escuchar peticiones en el puerto
// definido. Solo llega aquí si todos los middlewares y rutas
// se han registrado correctamente.
// ============================================================
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);

    // Crea la tabla visitas si no existe
    inicializarVisitas()
        .then(() => console.log('✅ Tabla visitas lista'))
        .catch(err => console.error('❌ Error inicializando visitas:', err.message));

    // ── Auto-ping para Render free tier ──────────────────────
    // Render apaga los servicios gratuitos tras 15 min sin tráfico.
    // Cada 10 minutos hacemos una petición a nuestro propio /api/ping
    // para mantener el servidor despierto.
    //
    // RENDER_EXTERNAL_URL es una variable que Render inyecta
    // automáticamente con la URL pública del servicio.
    // En local no existe, por eso el if lo comprueba antes.
    const appUrl = process.env.RENDER_EXTERNAL_URL;
    if (appUrl) {
        const DIEZ_MINUTOS = 10 * 60 * 1000;
        setInterval(async () => {
            try {
                // Node 18+ incluye fetch nativo, no necesitamos axios ni node-fetch
                const res = await fetch(`${appUrl}/api/ping`);
                console.log(`[auto-ping] ${new Date().toLocaleTimeString()} → ${res.status}`);
            } catch (err) {
                console.error('[auto-ping] Error:', err.message);
            }
        }, DIEZ_MINUTOS);
        console.log(`[auto-ping] Activo → ping cada 10 min a ${appUrl}/api/ping`);
    }
});