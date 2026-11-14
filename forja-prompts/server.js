/**
 * server.js
 * ---------
 * Servidor Express de Forja de Prompts.
 *
 * Flujo de una petición:
 *   navegador ──POST /api/chat──▶ este servidor ──▶ API de Claude
 *   navegador ◀── texto en trozos (streaming SSE) ◀── Claude va escribiendo
 *
 * ¿Por qué un servidor y no llamar a Claude desde el navegador?
 * Porque la API key es secreta: si la pusiéramos en el JavaScript del
 * navegador, cualquiera podría verla y gastar tu dinero. Aquí se queda en .env.
 */

require('dotenv').config();

const express = require('express');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { INSTRUCCIONES_BASE, instruccionesOpciones } = require('./prompt-sistema');

const app = express();
const PORT = process.env.PORT || 3100;
const MODO_DEMO = process.env.MODO_DEMO === '1';

// Límites para que nadie mande conversaciones gigantes (y caras)
const MAX_MENSAJES = 40;
const MAX_CARACTERES_MENSAJE = 20000;

// new Anthropic() lee la clave de la variable de entorno ANTHROPIC_API_KEY
const client = MODO_DEMO ? null : new Anthropic();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

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

/** Envía un evento SSE ("Server-Sent Events") al navegador. */
function enviarEvento(res, datos) {
    res.write(`data: ${JSON.stringify(datos)}\n\n`);
}

app.post('/api/chat', async (req, res) => {
    const { mensajes, opciones } = req.body || {};

    const error = validarMensajes(mensajes);
    if (error) return res.status(400).json({ error });

    // Cabeceras para streaming: la respuesta se queda abierta y vamos
    // escribiendo trozos a medida que Claude genera texto.
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
    });
    res.flushHeaders();

    if (MODO_DEMO) return responderDemo(res, mensajes);

    // Nos quedamos solo con role y content (ignoramos cualquier otro campo)
    const historial = mensajes.map(m => ({ role: m.role, content: m.content }));

    const stream = client.beta.messages.stream({
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

    try {
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
        res.end();
    }
});

/** Traduce los errores de la API a mensajes entendibles. */
function describirError(err) {
    if (err instanceof Anthropic.APIUserAbortError) return 'Petición cancelada.';
    if (err instanceof Anthropic.AuthenticationError) return 'API key no válida. Revisa ANTHROPIC_API_KEY en el archivo .env.';
    if (err instanceof Anthropic.RateLimitError) return 'Demasiadas peticiones seguidas. Espera un momento y vuelve a probar.';
    if (err instanceof Anthropic.BadRequestError) return `Petición no válida: ${err.message}`;
    if (err instanceof Anthropic.APIConnectionError) return 'No se pudo conectar con la API de Claude. Revisa tu conexión.';
    if (err instanceof Anthropic.APIError) return `Error de la API (${err.status}): ${err.message}`;
    if (/authentication/i.test(String(err?.message))) {
        return 'Falta la API key. Copia .env.example a .env, pon tu ANTHROPIC_API_KEY y reinicia el servidor (o prueba con: npm run demo).';
    }
    console.error(err);
    return 'Error inesperado en el servidor.';
}

/**
 * MODO DEMO: devuelve respuestas de ejemplo sin llamar a la API.
 * Sirve para probar la interfaz gratis (npm run demo).
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

// Escuchamos solo en 127.0.0.1 (tu ordenador): así nadie de tu red puede
// usar tu API key a través de este servidor.
app.listen(PORT, '127.0.0.1', () => {
    console.log(`Forja de Prompts en http://localhost:${PORT}${MODO_DEMO ? '  (MODO DEMO)' : ''}`);
    if (!MODO_DEMO && !process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠️  No hay ANTHROPIC_API_KEY en .env. Copia .env.example a .env y añádela, o usa: npm run demo');
    }
});
