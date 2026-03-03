require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad: cabeceras HTTP
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// Seguridad: limitar peticiones por IP (100 por cada 15 min)
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiadas peticiones, intenta de nuevo mas tarde.' }
}));

// CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    optionsSuccessStatus: 200
}));

app.use(express.json());

// Servir archivos estaticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

const db = require('./db');

// Ruta raiz -> index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ==========================================
// PERFIL
// ==========================================
app.get('/api/perfil', async (req, res) => {
    try {
        const [filas] = await db.query('SELECT * FROM perfil');
        res.json(filas);
    } catch (error) {
        console.error('Error en la base de datos:', error);
        res.status(500).json({ error: 'Error al conectar con la base de datos' });
    }
});

app.post('/api/perfil', async (req, res) => {
    try {
        const { nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin } = req.body;
        if (!nombre || !email) {
            return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
        }
        const sql = 'INSERT INTO perfil (nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin) VALUES (?, ?, ?, ?, ?, ?)';
        const [resultado] = await db.query(sql, [nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin]);
        res.status(201).json({ mensaje: 'Perfil guardado correctamente', id_asignado: resultado.insertId });
    } catch (error) {
        console.error('Error al insertar el perfil:', error);
        res.status(500).json({ error: 'Error al guardar los datos' });
    }
});

app.put('/api/perfil/:id', async (req, res) => {
    try {
        const idPerfil = req.params.id;
        // FIX: ahora acepta tanto foto_perfil como foto_url del body
        const { nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin, foto_perfil, foto_url } = req.body;
        if (!nombre || !email) {
            return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' });
        }
        const foto = foto_perfil || foto_url || null;
        const sql = 'UPDATE perfil SET nombre = ?, titular = ?, sobre_mi = ?, email = ?, enlace_github = ?, enlace_linkedin = ?, foto_perfil = ? WHERE id = ?';
        const [resultado] = await db.query(sql, [nombre, titular, sobre_mi, email, enlace_github, enlace_linkedin, foto, idPerfil]);
        if (resultado.affectedRows === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }
        res.json({ mensaje: 'Perfil actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({ error: 'Error al modificar el perfil' });
    }
});

// ==========================================
// PROYECTOS
// ==========================================
app.get('/api/proyectos', async (req, res) => {
    try {
        const [proyectos] = await db.query('SELECT * FROM proyectos');
        res.json(proyectos);
    } catch (error) {
        console.error('Error al obtener proyectos:', error);
        res.status(500).json({ error: 'Error al consultar los proyectos' });
    }
});

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

// ==========================================
// HABILIDADES
// ==========================================
app.get('/api/habilidades', async (req, res) => {
    try {
        const [habilidades] = await db.query('SELECT * FROM habilidades');
        res.json(habilidades);
    } catch (error) {
        console.error('Error al obtener habilidades:', error);
        res.status(500).json({ error: 'Error al consultar las habilidades' });
    }
});

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

// ==========================================
// EXPERIENCIA
// ==========================================
app.get('/api/experiencia', async (req, res) => {
    try {
        const [experiencia] = await db.query('SELECT * FROM experiencia ORDER BY fecha_inicio DESC');
        res.json(experiencia);
    } catch (error) {
        console.error('Error al obtener experiencia:', error);
        res.status(500).json({ error: 'Error al consultar la experiencia' });
    }
});

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

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
