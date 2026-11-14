/**
 * asistente.js
 * ------------
 * Backend de NOVA, un asistente de IA por voz inspirado en los asistentes
 * de las películas de ciencia ficción.
 *
 * ¿Cómo funciona todo junto?
 *
 *   [Navegador]                      [Nuestro servidor]            [API de Claude]
 *   1. Escucha tu voz (micrófono)
 *   2. La convierte a texto
 *   3. POST /api/asistente  ───────▶ 4. Añade las instrucciones
 *                                       (system prompt) y llama  ──▶ 5. Genera la
 *                                       a Claude                       respuesta
 *   7. Muestra el texto y   ◀─────── 6. Reenvía el texto        ◀── poco a poco
 *      lo lee en voz alta               según llega (streaming)
 *
 * ¿Por qué el navegador no llama a Claude directamente?
 *   Porque para llamar a la API hace falta una clave secreta (ANTHROPIC_API_KEY).
 *   Si la pusiéramos en el JavaScript del navegador, cualquiera podría verla
 *   con F12 y gastar tu dinero. La clave vive SOLO en el servidor (.env).
 *
 * Exportamos un "Router" de Express: un mini-grupo de rutas que luego
 * enganchamos en index.js con app.use(). Así no llenamos index.js de código.
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const Anthropic  = require('@anthropic-ai/sdk');

const router = express.Router();

// El cliente lee la clave automáticamente de process.env.ANTHROPIC_API_KEY
const client = new Anthropic();

// ── Límites para proteger tu bolsillo ──────────────────────────
// La página es pública: sin límites, alguien podría mandar miles de
// mensajes y la factura la pagarías tú.
const MAX_MENSAJES_HISTORIAL = 20;   // solo enviamos los últimos 20 mensajes
const MAX_CARACTERES_MENSAJE = 1000; // un mensaje no puede ser un libro

const limiteAsistente = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 30,                  // 30 mensajes por IP y hora
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Has alcanzado el límite de mensajes. Vuelve dentro de un rato.' }
});

// ── Personalidad del asistente (system prompt) ─────────────────
// Es el "carácter" de NOVA. Claude lo lee antes de cada conversación.
// Cambia este texto y cambiará cómo habla. ¡Prueba!
const SYSTEM_PROMPT = `Eres NOVA, un asistente de inteligencia artificial por voz con un estilo
elegante, educado y con un toque de humor británico sutil, como el mayordomo
digital de un inventor brillante. Te diriges al usuario como "señor" o "señora"
solo de vez en cuando, sin abusar.

Vives en el portafolio web de Santiago Lafuente, desarrollador de aplicaciones
multiplataforma (Java, Kotlin, Node.js, MySQL) que viene del mundo de la
mecánica industrial y el mantenimiento. Si te preguntan por él, puedes contarlo
y sugerir que miren su portafolio, pero no inventes datos que no conozcas.

Reglas importantes:
- Responde SIEMPRE en español.
- Tus respuestas se leen en voz alta: sé breve (2-4 frases normalmente),
  sin listas, sin tablas, sin markdown, sin emojis y sin bloques de código.
- Si algo requiere una respuesta larga, da un resumen y ofrece ampliar.
- No tienes acceso a internet, al dispositivo del usuario ni a la hora real;
  si te piden algo así, dilo con naturalidad.`;

/**
 * Valida el historial que manda el navegador.
 * NUNCA te fíes de lo que llega del cliente: puede venir manipulado.
 * Devuelve el historial limpio o null si no es válido.
 */
function validarHistorial(historial) {
    if (!Array.isArray(historial) || historial.length === 0) return null;

    const limpio = historial
        .slice(-MAX_MENSAJES_HISTORIAL)
        .filter(m =>
            m &&
            (m.role === 'user' || m.role === 'assistant') &&
            typeof m.content === 'string' &&
            m.content.trim().length > 0
        )
        .map(m => ({
            role: m.role,
            content: m.content.slice(0, MAX_CARACTERES_MENSAJE)
        }));

    // La API exige que el primer mensaje sea del usuario y el último también
    // (es al que Claude va a responder).
    while (limpio.length && limpio[0].role !== 'user') limpio.shift();
    if (!limpio.length || limpio[limpio.length - 1].role !== 'user') return null;

    return limpio;
}

/**
 * POST /api/asistente
 * Body: { historial: [{ role: 'user'|'assistant', content: '...' }, ...] }
 *
 * Responde con texto plano que se va enviando a trozos (streaming).
 * Así el usuario ve la respuesta aparecer palabra a palabra, igual que
 * en ChatGPT o Claude.ai, en vez de esperar varios segundos a que esté entera.
 */
router.post('/api/asistente', limiteAsistente, async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
            error: 'El asistente no está configurado (falta ANTHROPIC_API_KEY en el .env).'
        });
    }

    const historial = validarHistorial(req.body?.historial);
    if (!historial) {
        return res.status(400).json({ error: 'Historial de conversación no válido.' });
    }

    // Cabeceras para enviar texto por partes
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // evita que proxies acumulen la respuesta

    try {
        // Usamos client.beta porque "fallbacks" es una función en beta:
        // si el modelo rechazara la petición por un filtro de seguridad,
        // la API la reintenta automáticamente con otro modelo recomendado.
        const stream = client.beta.messages.stream({
            model: 'claude-opus-5-5',
            max_tokens: 2048,
            // effort "low": respuestas rápidas y baratas, ideal para conversación
            output_config: { effort: 'low' },
            betas: ['server-side-fallback-2026-07-01'],
            fallbacks: 'default',
            system: SYSTEM_PROMPT,
            messages: historial
        });

        // Si el usuario cierra la página a mitad, cortamos la llamada
        // para no pagar tokens que nadie va a leer.
        res.on('close', () => stream.abort());

        // Cada vez que llega un trozo de texto, lo reenviamos al navegador
        stream.on('text', (trozo) => res.write(trozo));

        const mensajeFinal = await stream.finalMessage();

        if (mensajeFinal.stop_reason === 'refusal') {
            res.write('\n\nLo siento, no puedo ayudar con esa petición.');
        }
        res.end();
    } catch (error) {
        // Errores tipados del SDK: del más concreto al más general
        let mensaje = 'Ha ocurrido un error al contactar con la IA.';
        if (error instanceof Anthropic.AuthenticationError) {
            mensaje = 'La clave de la API no es válida.';
        } else if (error instanceof Anthropic.RateLimitError) {
            mensaje = 'La IA está saturada ahora mismo, prueba en unos segundos.';
        } else if (error instanceof Anthropic.APIUserAbortError) {
            return; // el usuario cerró la página: no hay nadie a quien responder
        }
        console.error('[asistente] Error:', error.message);

        if (!res.headersSent) {
            res.status(500).json({ error: mensaje });
        } else {
            // Ya habíamos empezado a enviar texto: añadimos el aviso al final
            res.end(`\n\n[${mensaje}]`);
        }
    }
});

module.exports = router;
