/**
 * auth-cloudflare.js
 * ------------------
 * Middleware que comprueba que la petición ha pasado por Cloudflare Access.
 *
 * ¿Cómo funciona Cloudflare Access?
 *  1. El usuario abre santiagolafuente.com/forja.
 *  2. Cloudflare le pide su email y le manda un código (solo a emails permitidos).
 *  3. Si entra, Cloudflare añade a CADA petición la cabecera
 *     "Cf-Access-Jwt-Assertion" con un JWT: un "carné" firmado digitalmente
 *     que dice quién es el usuario y para qué aplicación es válido.
 *
 * ¿Por qué comprobarlo también aquí si Cloudflare ya filtra?
 * Porque Render da a tu servicio otra dirección (xxx.onrender.com) que NO pasa
 * por Cloudflare. Sin esta comprobación, alguien podría entrar por ahí.
 * Como la firma solo la puede hacer Cloudflare, nadie puede falsificar el carné.
 *
 * Variables de entorno necesarias:
 *   CF_ACCESS_TEAM_DOMAIN  → p.ej. "santiago.cloudflareaccess.com"
 *   CF_ACCESS_AUD          → el "Application Audience (AUD) Tag" de la app en Cloudflare
 *
 * Para probar en tu ordenador sin Cloudflare: FORJA_SIN_AUTH=1 (nunca en Render).
 */

let jwks = null; // claves públicas de Cloudflare (se descargan y cachean solas)

async function verificarToken(token, dominioEquipo, aud) {
    // jose es un módulo moderno (ESM); con import() lo cargamos desde CommonJS
    const { createRemoteJWKSet, jwtVerify } = await import('jose');
    if (!jwks) {
        jwks = createRemoteJWKSet(new URL(`https://${dominioEquipo}/cdn-cgi/access/certs`));
    }
    // jwtVerify comprueba: firma válida, no caducado, emisor y audiencia correctos
    const { payload } = await jwtVerify(token, jwks, {
        issuer: `https://${dominioEquipo}`,
        audience: aud
    });
    return payload;
}

async function autenticacionCloudflare(req, res, next) {
    // Modo desarrollo local: sin Cloudflare. Bloqueado en producción por seguridad.
    if (process.env.FORJA_SIN_AUTH === '1' && process.env.NODE_ENV !== 'production') {
        req.usuarioForja = 'local';
        return next();
    }

    const dominioEquipo = process.env.CF_ACCESS_TEAM_DOMAIN;
    const aud = process.env.CF_ACCESS_AUD;

    // "Fail closed": si falta configuración, NADIE entra (mejor que todos)
    if (!dominioEquipo || !aud) {
        return res.status(503).send('Forja no está configurada todavía (faltan CF_ACCESS_TEAM_DOMAIN y CF_ACCESS_AUD).');
    }

    const token = req.get('Cf-Access-Jwt-Assertion');
    if (!token) return res.status(403).send('Acceso denegado.');

    try {
        const datos = await verificarToken(token, dominioEquipo, aud);
        req.usuarioForja = datos.email || datos.sub; // lo usamos para el límite de peticiones
        next();
    } catch {
        res.status(403).send('Acceso denegado.');
    }
}

module.exports = { autenticacionCloudflare };
