/**
 * forja/index.js
 * --------------
 * Forja de Prompts como "mini-aplicación" dentro del portafolio.
 * Exporta un Router de Express que se monta en /forja desde server/index.js.
 *
 * Rutas (todas protegidas por Cloudflare Access):
 *   GET  /forja/          → la interfaz (HTML, CSS, JS)
 *   POST /forja/api/chat  → habla con Claude y devuelve la respuesta en streaming
 *
 * Flujo de una petición:
 *   navegador ──▶ Cloudflare (¿email permitido?) ──▶ Render ──▶ este router
 *        ──▶ autenticacionCloudflare (¿firma válida?) ──▶ API de Claude
 */

const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');
const { INSTRUCCIONES_BASE, instruccionesOpciones } = require('./prompt-sistema');
const { autenticacionCloudflare } = require('./auth-cloudflare');

const router = express.Router();
const MODO_DEMO = process.env.FORJA_MODO_DEMO === '1';

// Límites para que nadie mande conversaciones gigantes (y caras)
const MAX_MENSAJES = 40;
const MAX_CARACTERES_MENSAJE = 20000;

// El cliente se crea la primera vez que se usa (así el portafolio arranca
// aunque todavía no hayas puesto ANTHROPIC_API_KEY).
let client = null;
function obtenerCliente() {
    if (!client) client = new Anthropic(); // lee ANTHROPIC_API_KEY del entorno
    return client;
}

// 1º SIEMPRE el portero: nada de /forja se sirve sin pasar por aquí
router.use(autenticacionCloudflare);

// /forja → /forja/ (con barra final), para que las rutas relativas del
// HTML ("styles.css", "api/chat") apunten dentro de /forja/
router.get('/', (req, res, next) => {
    const ruta = req.originalUrl.split('?')[0];
    if (ruta.endsWith('/')) return next();
    res.redirect(301, ruta + '/');
});

// La interfaz (está fuera de /public para que no se pueda ver sin login)
router.use(express.static(path.join(__dirname, 'public')));

// Límite por usuario: 40 mensajes por hora. Protege tu factura de la API
// aunque alguien con acceso se pase de la raya.
const limiteChat = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 40,
    keyGenerator: req => req.usuarioForja,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Has llegado al límite de mensajes por hora. Vuelve a intentarlo más tarde.' }
});

/**
 * Comprueba que el historial que llega del navegador tiene la forma correcta.
 * Devuelve un texto con el error, o null si todo está bien.
 * Regla de oro: NUNCA te fíes de lo que llega del cliente.
 */
function validarMensajes(mensajes) {
    if (!Array.isArray(mensajes) || mensajes.length === 0) return 'No hay mensajes.';
    if (mensajes.length > MAX_MENSAJES) return `Conversación demasiado larga (máximo ${MAX_MENSAJES} mensajes). Empieza una nueva.`;

    for (const [i, m] of mensajes.entries()) {
        if (!m || (m.role !== 'user' && m.role !== 'assistant')) return `Mensaje ${i}: rol no válido.`;
        if (typeof m.content !== 'string' || m.content.trim() === '') return `Mensaje ${i}: contenido vacío.`;
        if (m.content.length > MAX_CARACTERES_MENSAJE) return `Mensaje ${i}: demasiado largo.`;
    }
    if (mensajes[0].role !== 'user') return 'El primer mensaje debe ser del usuario.';
    if (mensajes[mensajes.length - 1].role !== 'user') return 'El último mensaje debe ser del usuario.';
    return null;
}

/**
 * Envía un evento SSE ("Server-Sent Events") al navegador.
 * res.flush() lo añade el middleware "compression" del portafolio: sin él,
 * la compresión guardaría los trozos y el texto no saldría en tiempo real.
 */
function enviar(res, texto) {
    res.write(texto);
    if (typeof res.flush === 'function') res.flush();
}
function enviarEvento(res, datos) {
    enviar(res, `data: ${JSON.stringify(datos)}\n\n`);
}

router.post('/api/chat', limiteChat, express.json({ limit: '1mb' }), async (req, res) => {
    const { mensajes, opciones } = req.body || {};

    const error = validarMensajes(mensajes);
    if (error) return res.status(400).json({ error });

    // Cabeceras para streaming: la respuesta se queda abierta y vamos
    // escribiendo trozos a medida que Claude genera texto.
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive'
    });
    res.flushHeaders();

    // Mientras Claude "piensa" puede pasar un rato sin enviar nada. Mandamos un
    // comentario SSE cada 15 s para que Cloudflare/Render no corten la conexión.
    const latido = setInterval(() => enviar(res, ': ping\n\n'), 15000);
    res.on('close', () => clearInterval(latido));

    if (MODO_DEMO) return responderDemo(res, mensajes);

    // Nos quedamos solo con role y content (ignoramos cualquier otro campo)
    const historial = mensajes.map(m => ({ role: m.role, content: m.content }));

    let stream;
    try {
        stream = obtenerCliente().beta.messages.stream({
            model: 'claude-opus-5-5',
            max_tokens: 32000,
            // Dos bloques de system: el fijo (se puede cachear y abarata
            // peticiones repetidas) y el variable con las opciones elegidas.
            system: [
                { type: 'text', text: INSTRUCCIONES_BASE, cache_control: { type: 'ephemeral' } },
                { type: 'text', text: instruccionesOpciones(opciones) }
            ],
            thinking: { type: 'adaptive' },          // Claude decide cuánto "pensar"
            output_config: { effort: 'high' },       // más esfuerzo = prompts más cuidados
            // Si el modelo rechazara la petición por un filtro de seguridad,
            // la API la reintenta automáticamente con un modelo de respaldo.
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            messages: historial
        });

        // Si el usuario cierra la pestaña, cancelamos para no pagar tokens de más
        res.on('close', () => stream.abort());

        for await (const evento of stream) {
            if (evento.type === 'content_block_delta' && evento.delta.type === 'text_delta') {
                enviarEvento(res, { tipo: 'texto', texto: evento.delta.text });
            }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') {
            enviarEvento(res, { tipo: 'error', mensaje: 'Claude no ha podido responder a esta petición. Prueba a reformularla.' });
        } else if (final.stop_reason === 'max_tokens') {
            enviarEvento(res, { tipo: 'aviso', mensaje: 'La respuesta se cortó por longitud. Pide "continúa" o una versión más corta.' });
        }
        enviarEvento(res, { tipo: 'fin' });
    } catch (err) {
        if (!res.writableEnded) enviarEvento(res, { tipo: 'error', mensaje: describirError(err) });
    } finally {
        clearInterval(latido);
        res.end();
    }
});

/** Traduce los errores de la API a mensajes entendibles. */
function describirError(err) {
    if (err instanceof Anthropic.APIUserAbortError) return 'Petición cancelada.';
    if (err instanceof Anthropic.AuthenticationError) return 'API key no válida. Revisa ANTHROPIC_API_KEY en las variables de entorno.';
    if (err instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones seguidas. Espera un momento y vuelve a probar.';
    if (err instanceof Anthropic.BadRequestError) return `Petición no válida: ${err.message}`;
    if (err instanceof Anthropic.APIConnectionError) return 'No se pudo conectar con la API de Claude.';
    if (err instanceof Anthropic.APIError) return `Error de la API (${err.status}): ${err.message}`;
    if (/authentication/i.test(String(err?.message))) {
        return 'Falta la API key: añade ANTHROPIC_API_KEY a las variables de entorno y reinicia el servidor.';
    }
    console.error('[forja]', err);
    return 'Error inesperado en el servidor.';
}

/**
 * MODO DEMO (FORJA_MODO_DEMO=1): respuestas de ejemplo sin llamar a la API.
 * Sirve para probar la interfaz gratis.
 */
async function responderDemo(res, mensajes) {
    const esPrimerTurno = mensajes.length === 1;
    const texto = esPrimerTurno
        ? '¡Buena idea! Para hacerte un prompt preciso necesito saber:\n\n1. ¿En qué lenguaje o framework está tu proyecto?\n2. ¿Cómo sabremos que está terminado? (por ejemplo, un test que pase)\n3. ¿Hay algo que Claude Code NO deba tocar?\n\n(Estás en modo demo: responde cualquier cosa y te enseño un prompt de ejemplo.)'
        : 'Aquí tienes tu prompt. Lleva un bucle de verificación con un máximo de iteraciones para que Claude Code no se quede dando vueltas, y criterios de aceptación que se pueden comprobar con un comando.\n\n<prompt_final>\n## Contexto\nProyecto Node.js + Express. [RELLENA: ruta de la carpeta del proyecto]\n\n## Objetivo\nAñadir un endpoint `GET /api/salud` que responda `{ "ok": true }`.\n\n## Requisitos\n- Crear la ruta en el servidor existente.\n- Añadir un test que compruebe el código 200 y el JSON.\n\n## Restricciones\n- No modificar las rutas existentes.\n- No añadir dependencias nuevas sin explicar por qué.\n\n## Plan de trabajo\n1. Explora el proyecto y localiza dónde se definen las rutas.\n2. Implementa el endpoint.\n3. Escribe el test.\n\n## Criterios de aceptación\n- `npm test` pasa sin errores.\n- `curl localhost:3000/api/salud` devuelve `{"ok":true}`.\n\n## Bucle de trabajo\nRepite este ciclo hasta que se cumplan todos los criterios (máximo 5 iteraciones):\n1. Ejecuta `npm test`.\n2. Si falla, lee el error, corrige la causa (nunca desactives el test) y vuelve al paso 1.\nSi llegas a 5 iteraciones sin éxito, para y explica qué bloquea y qué has probado.\nAl final, relee el diff completo buscando errores o código sobrante.\n\n## Informe final\nResume qué archivos cambiaste, cómo lo verificaste y qué queda pendiente.\n</prompt_final>';

    // Simulamos el streaming enviando el texto en trocitos
    for (let i = 0; i < texto.length; i += 12) {
        if (res.writableEnded || res.destroyed) return;
        enviarEvento(res, { tipo: 'texto', texto: texto.slice(i, i + 12) });
        await new Promise(r => setTimeout(r, 15));
    }
    enviarEvento(res, { tipo: 'fin' });
    res.end();
}

module.exports = router;
