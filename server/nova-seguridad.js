/**
 * nova-seguridad.js
 * -----------------
 * Inicio de sesión y protecciones de NOVA.
 *
 * ¿Por qué tanta seguridad? Porque NOVA ahora:
 *   - gasta dinero de TU cuenta en cada mensaje
 *   - tiene MEMORIA con datos tuyos (que nadie más debe leer ni modificar)
 *
 * Cómo funciona la sesión (sin librerías extra):
 *
 *   1. Envías la contraseña a POST /api/asistente/login
 *   2. El servidor la compara con NOVA_PASSWORD (del .env)
 *   3. Si es correcta, crea un "token firmado":  caducidad.firma
 *        caducidad = fecha en la que deja de valer
 *        firma     = HMAC-SHA256(caducidad, NOVA_SECRET)
 *      Solo quien conoce NOVA_SECRET puede crear una firma válida, así que
 *      nadie puede fabricarse un token falso ni alargar su caducidad.
 *   4. El token se guarda en una COOKIE con estas protecciones:
 *        HttpOnly        → el JavaScript de la página no puede leerla
 *                          (si alguien colara un script, no podría robarla)
 *        SameSite=Strict → el navegador no la envía desde otras webs
 *                          (protege contra ataques CSRF)
 *        Secure          → solo viaja por HTTPS (en producción)
 *
 * Para cerrar TODAS las sesiones abiertas de golpe: cambia NOVA_SECRET.
 */

const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');

const NOMBRE_COOKIE   = 'nova_sesion';
const DURACION_SESION = 7 * 24 * 60 * 60 * 1000; // 7 días en milisegundos

/** ¿Está configurado el modo propietario? (hacen falta las dos variables) */
function loginDisponible() {
    return Boolean(process.env.NOVA_PASSWORD && process.env.NOVA_SECRET &&
                   process.env.NOVA_SECRET.length >= 32);
}

/** ¿Pueden usar NOVA (en modo demo) los visitantes sin sesión? */
function modoPublico() {
    return process.env.NOVA_PUBLICO === 'true';
}

function firmar(texto) {
    return crypto.createHmac('sha256', process.env.NOVA_SECRET).update(texto).digest('hex');
}

/**
 * Compara dos textos en TIEMPO CONSTANTE.
 * Un "===" normal se detiene en la primera letra distinta, y midiendo
 * cuánto tarda en responder un atacante podría adivinar la contraseña
 * letra a letra (ataque de temporización). timingSafeEqual tarda siempre
 * lo mismo. Comparamos los hash SHA-256 para que ambos midan igual.
 */
function igualesSeguro(a, b) {
    const hashA = crypto.createHash('sha256').update(String(a)).digest();
    const hashB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(hashA, hashB);
}

function crearToken() {
    const caducidad = String(Date.now() + DURACION_SESION);
    return `${caducidad}.${firmar(caducidad)}`;
}

function tokenValido(token) {
    if (!loginDisponible() || typeof token !== 'string') return false;
    const [caducidad, firma] = token.split('.');
    if (!caducidad || !firma || !/^\d+$/.test(caducidad)) return false;
    if (!igualesSeguro(firma, firmar(caducidad))) return false;
    return Number(caducidad) > Date.now();
}

/** Lee una cookie de la cabecera "Cookie: a=1; b=2" */
function leerCookie(req, nombre) {
    const cabecera = req.headers.cookie || '';
    for (const parte of cabecera.split(';')) {
        const [clave, ...valor] = parte.trim().split('=');
        if (clave === nombre) return decodeURIComponent(valor.join('='));
    }
    return null;
}

function escribirCookie(req, res, valor, maxAgeSegundos) {
    const partes = [
        `${NOMBRE_COOKIE}=${encodeURIComponent(valor)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        `Max-Age=${maxAgeSegundos}`
    ];
    // req.secure es true cuando la petición llegó por HTTPS (Render).
    // En localhost (http) no podemos marcarla Secure o el navegador la ignoraría.
    if (req.secure) partes.push('Secure');
    res.setHeader('Set-Cookie', partes.join('; '));
}

// ════════════════════════════════════════════════════════════════
// MIDDLEWARES
// ════════════════════════════════════════════════════════════════

/** Añade req.esPropietario (true/false) a todas las peticiones de NOVA */
function identificar(req, res, next) {
    req.esPropietario = tokenValido(leerCookie(req, NOMBRE_COOKIE));
    next();
}

/** Solo deja pasar al propietario (con sesión iniciada) */
function soloPropietario(req, res, next) {
    if (!req.esPropietario) return res.status(401).json({ error: 'Necesitas iniciar sesión.' });
    next();
}

/**
 * Protección extra contra CSRF: si la petición trae cabecera Origin
 * (los navegadores siempre la ponen en un POST/DELETE con fetch),
 * debe ser nuestra propia web.
 */
function mismoOrigen(req, res, next) {
    if (req.method === 'GET') return next();
    const origen = req.headers.origin;
    if (origen) {
        let host = null;
        try { host = new URL(origen).host; } catch (e) { /* origen mal formado */ }
        if (host !== req.headers.host) {
            return res.status(403).json({ error: 'Origen no permitido.' });
        }
    }
    next();
}

// Máximo 5 intentos de login cada 15 minutos por IP: hace inviable
// probar contraseñas por fuerza bruta.
const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // los logins correctos no cuentan
    message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

// ════════════════════════════════════════════════════════════════
// RUTAS DE SESIÓN
// ════════════════════════════════════════════════════════════════
function registrarRutasSesion(router) {
    /** Estado de la sesión: lo consulta la página al cargar */
    router.get('/api/asistente/sesion', (req, res) => {
        res.json({
            propietario: req.esPropietario,
            publico: modoPublico(),
            loginDisponible: loginDisponible()
        });
    });

    router.post('/api/asistente/login', limiteLogin, async (req, res) => {
        if (!loginDisponible()) {
            return res.status(503).json({ error: 'El inicio de sesión no está configurado en el servidor.' });
        }
        const password = req.body?.password;
        // Pequeña espera fija: frena todavía más a quien pruebe contraseñas
        await new Promise(r => setTimeout(r, 400));

        if (typeof password !== 'string' || !igualesSeguro(password, process.env.NOVA_PASSWORD)) {
            console.warn(`[nova] Login fallido desde ${req.ip}`);
            return res.status(401).json({ error: 'Contraseña incorrecta.' });
        }
        escribirCookie(req, res, crearToken(), DURACION_SESION / 1000);
        res.json({ ok: true });
    });

    router.post('/api/asistente/logout', (req, res) => {
        escribirCookie(req, res, '', 0); // Max-Age=0 → el navegador la borra
        res.json({ ok: true });
    });
}

module.exports = {
    identificar,
    soloPropietario,
    mismoOrigen,
    registrarRutasSesion,
    modoPublico
};
