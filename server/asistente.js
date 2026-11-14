/**
 * asistente.js
 * ------------
 * Backend de NOVA, un asistente de IA por voz capaz de analizar todo tipo
 * de tareas: preguntas, problemas, imágenes, PDFs, código, datos...
 *
 * ¿Cómo funciona todo junto?
 *
 *   [Navegador]                      [Nuestro servidor]            [API de Claude]
 *   1. Escucha tu voz / lee
 *      tus archivos adjuntos
 *   2. POST /api/asistente  ───────▶ 3. Valida los datos, añade
 *                                       las instrucciones y     ──▶ 4. Razona, busca en
 *                                       llama a Claude                 internet si hace
 *   6. Muestra el texto y   ◀─────── 5. Reenvía cada "evento"   ◀──   falta y responde
 *      lo lee en voz alta               según llega (streaming)        poco a poco
 *
 * ¿Por qué el navegador no llama a Claude directamente?
 *   Porque para llamar a la API hace falta una clave secreta (ANTHROPIC_API_KEY).
 *   Si la pusiéramos en el JavaScript del navegador, cualquiera podría verla
 *   con F12 y gastar tu dinero. La clave vive SOLO en el servidor (.env).
 *
 * PROTOCOLO DE RESPUESTA (NDJSON = "JSON delimitado por saltos de línea"):
 *   En vez de mandar un único JSON al final, mandamos una línea JSON por
 *   cada cosa que pasa. El navegador las procesa según llegan:
 *     {"tipo":"pensamiento","texto":"..."}  → trozo del razonamiento
 *     {"tipo":"texto","texto":"..."}        → trozo de la respuesta
 *     {"tipo":"herramienta","texto":"..."}  → "Buscando en internet: ..."
 *     {"tipo":"fuentes","lista":[...]}      → webs consultadas
 *     {"tipo":"error","texto":"..."}        → algo falló a mitad
 */

const express    = require('express');
const rateLimit  = require('express-rate-limit');
const Anthropic  = require('@anthropic-ai/sdk');

const router = express.Router();

// El cliente lee la clave automáticamente de process.env.ANTHROPIC_API_KEY
const client = new Anthropic();

// ── Límites para proteger tu bolsillo y tu servidor ────────────
// La página es pública: sin límites, alguien podría mandar miles de
// mensajes y la factura la pagarías tú.
const MAX_MENSAJES_HISTORIAL = 20;        // solo enviamos los últimos 20 mensajes
const MAX_CARACTERES_MENSAJE = 20_000;    // texto escrito/dictado
const MAX_CARACTERES_ARCHIVO = 200_000;   // archivos de texto (código, CSV...)
const MAX_ADJUNTOS_MENSAJE   = 5;
const MAX_BYTES_BINARIO      = 8 * 1024 * 1024; // 8 MB por imagen o PDF
const MAX_CONTINUACIONES     = 4;         // ver "pause_turn" más abajo

const TIPOS_IMAGEN = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const limiteAsistente = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20,                  // 20 mensajes por IP y hora
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Has alcanzado el límite de mensajes. Vuelve dentro de un rato.' }
});

// ── Personalidad y forma de trabajar (system prompt) ───────────
// Es el "carácter" de NOVA. Claude lo lee antes de cada conversación.
const SYSTEM_PROMPT = `Eres NOVA, una asistente de inteligencia artificial con un estilo elegante,
educado y con un toque de humor sutil, como la asistente digital de un inventor
brillante. Eres capaz de ayudar con cualquier tipo de tarea: analizar problemas,
explicar conceptos, programar y revisar código, analizar imágenes, documentos
PDF y datos, hacer cálculos, planificar, redactar textos, diagnosticar averías
mecánicas o eléctricas y buscar información actual en internet.

Vives en el portafolio web de Santiago Lafuente, desarrollador de aplicaciones
multiplataforma (Java, Kotlin, Node.js, MySQL) que viene del mundo de la
mecánica industrial y el mantenimiento. Si te preguntan por él, cuéntalo, pero
no inventes datos que no conozcas.

Cómo trabajas:
- Responde siempre en español, salvo que te pidan otro idioma.
- Adapta la longitud a la tarea: a una pregunta sencilla, respuesta breve; a una
  tarea compleja, un análisis completo y bien estructurado.
- Tus respuestas se muestran en pantalla con formato Markdown (títulos, listas,
  tablas, bloques de código) y además se leen en voz alta. Empieza SIEMPRE con
  una o dos frases que resuman la respuesta en lenguaje natural, sin formato,
  porque es lo que se escuchará. Después, si hace falta, el detalle.
- Si algo depende de información actual (noticias, precios, versiones de
  software, datos que cambian), búscalo en internet antes de responder y
  menciona de dónde sale.
- Si te adjuntan archivos o imágenes, analízalos con detalle.
- Si una petición es ambigua, haz la suposición más razonable, dila y responde.
- Sé honesta: si no estás segura de algo, dilo. En temas de dinero o inversión,
  da información y análisis, pero recuerda que no es asesoramiento financiero.`;

// ════════════════════════════════════════════════════════════════
// VALIDACIÓN: nunca te fíes de lo que llega del navegador
// ════════════════════════════════════════════════════════════════

/**
 * Convierte un adjunto que manda el navegador en un "bloque de contenido"
 * de la API de Claude. Devuelve null si no es válido.
 *
 * Formato que esperamos del navegador:
 *   { nombre, tipo: 'imagen'|'pdf'|'texto', mediaType, datos }
 *   - imagen/pdf → datos en base64
 *   - texto      → datos como texto normal
 */
function adjuntoABloque(adjunto) {
    if (!adjunto || typeof adjunto.datos !== 'string') return null;
    const nombre = String(adjunto.nombre || 'archivo').slice(0, 120);

    if (adjunto.tipo === 'imagen' && TIPOS_IMAGEN.includes(adjunto.mediaType)) {
        if (adjunto.datos.length * 0.75 > MAX_BYTES_BINARIO) return null; // base64 ocupa ~4/3
        return {
            type: 'image',
            source: { type: 'base64', media_type: adjunto.mediaType, data: adjunto.datos }
        };
    }

    if (adjunto.tipo === 'pdf') {
        if (adjunto.datos.length * 0.75 > MAX_BYTES_BINARIO) return null;
        return {
            type: 'document',
            title: nombre,
            source: { type: 'base64', media_type: 'application/pdf', data: adjunto.datos }
        };
    }

    if (adjunto.tipo === 'texto') {
        return {
            type: 'text',
            text: `Archivo adjunto «${nombre}»:\n\n${adjunto.datos.slice(0, MAX_CARACTERES_ARCHIVO)}`
        };
    }
    return null;
}

/**
 * Valida el historial y lo convierte al formato de la API.
 * Devuelve los mensajes listos o null si no es válido.
 */
function prepararMensajes(historial) {
    if (!Array.isArray(historial) || historial.length === 0) return null;

    const mensajes = [];
    for (const m of historial.slice(-MAX_MENSAJES_HISTORIAL)) {
        if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
        const texto = typeof m.content === 'string' ? m.content.slice(0, MAX_CARACTERES_MENSAJE) : '';

        if (m.role === 'assistant') {
            if (texto.trim()) mensajes.push({ role: 'assistant', content: texto });
            continue;
        }

        // Mensaje del usuario: adjuntos primero (la API funciona mejor así) y luego el texto
        const bloques = (Array.isArray(m.adjuntos) ? m.adjuntos : [])
            .slice(0, MAX_ADJUNTOS_MENSAJE)
            .map(adjuntoABloque)
            .filter(Boolean);
        if (texto.trim()) bloques.push({ type: 'text', text: texto });
        if (bloques.length) mensajes.push({ role: 'user', content: bloques });
    }

    // La API exige que el primer mensaje sea del usuario y el último también
    // (es al que Claude va a responder).
    while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
    if (!mensajes.length || mensajes[mensajes.length - 1].role !== 'user') return null;
    return mensajes;
}

/** Texto corto para enseñar al usuario qué herramienta está usando NOVA */
function describirHerramienta(bloque) {
    const entrada = bloque.input || {};
    if (bloque.name === 'web_search') return `Buscando en internet: «${entrada.query || '…'}»`;
    if (bloque.name === 'web_fetch')  return `Leyendo la página: ${entrada.url || '…'}`;
    return 'Analizando datos…';
}

// ════════════════════════════════════════════════════════════════
// RUTA PRINCIPAL
// ════════════════════════════════════════════════════════════════

/**
 * POST /api/asistente
 * Body: { historial: [{ role, content, adjuntos? }, ...] }
 */
router.post('/api/asistente', limiteAsistente, async (req, res) => {
    if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(503).json({
            error: 'El asistente no está configurado (falta ANTHROPIC_API_KEY en el .env).'
        });
    }

    const mensajes = prepararMensajes(req.body?.historial);
    if (!mensajes) {
        return res.status(400).json({ error: 'Historial de conversación no válido.' });
    }

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no'); // evita que proxies acumulen la respuesta

    // Envía un evento (una línea JSON) al navegador
    const enviar = (evento) => res.write(JSON.stringify(evento) + '\n');

    let streamActual = null;
    let cancelado = false;
    // Si el usuario cierra la página a mitad, cortamos la llamada
    // para no pagar tokens que nadie va a leer.
    res.on('close', () => { cancelado = true; streamActual?.abort(); });

    const fecha = new Date().toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid'
    });

    try {
        const fuentes = new Map(); // url → título (Map evita duplicados)

        // ── Bucle de "continuaciones" ─────────────────────────────
        // Cuando Claude usa herramientas del servidor (buscar en internet),
        // la API puede pausar el turno (stop_reason "pause_turn") si se alarga.
        // Para continuar, reenviamos lo que lleva hecho y la API sigue
        // exactamente donde lo dejó.
        for (let vuelta = 0; vuelta <= MAX_CONTINUACIONES && !cancelado; vuelta++) {
            // Usamos client.beta porque "fallbacks" es una función en beta:
            // si el modelo rechazara la petición por un filtro de seguridad,
            // la API la reintenta automáticamente con otro modelo recomendado.
            const stream = client.beta.messages.stream({
                model: 'claude-opus-5-5',
                max_tokens: 32000,
                // effort "high": piensa más a fondo. Más lento y caro que "low",
                // pero mucho mejor para analizar tareas complejas.
                output_config: { effort: 'high' },
                // "summarized": la API nos devuelve un resumen legible de su
                // razonamiento, que mostramos al usuario mientras piensa.
                thinking: { type: 'adaptive', display: 'summarized' },
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                // Caché automática: si reenviamos lo mismo (un PDF adjunto en
                // cada pregunta), la API lo cobra ~10 veces más barato.
                cache_control: { type: 'ephemeral' },
                system: [
                    { type: 'text', text: SYSTEM_PROMPT },
                    // La fecha va en un bloque aparte, al final, para no romper la caché
                    { type: 'text', text: `Fecha de hoy: ${fecha}. Zona horaria: España.` }
                ],
                tools: [
                    // Herramientas "de servidor": se ejecutan en los servidores de
                    // Anthropic, no en el nuestro. Solo tenemos que declararlas.
                    {
                        type: 'web_search_20260209',
                        name: 'web_search',
                        max_uses: 5,
                        user_location: { type: 'approximate', country: 'ES', timezone: 'Europe/Madrid' }
                    },
                    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 }
                ],
                messages: mensajes
            });
            streamActual = stream;

            stream.on('thinking', (trozo) => enviar({ tipo: 'pensamiento', texto: trozo }));
            stream.on('text', (trozo) => enviar({ tipo: 'texto', texto: trozo }));
            // contentBlock salta cuando un bloque está COMPLETO (con su entrada entera)
            stream.on('contentBlock', (bloque) => {
                if (bloque.type === 'server_tool_use') {
                    enviar({ tipo: 'herramienta', texto: describirHerramienta(bloque) });
                }
            });

            const mensaje = await stream.finalMessage();

            // Recogemos las webs citadas en la respuesta
            for (const bloque of mensaje.content) {
                if (bloque.type !== 'text' || !bloque.citations) continue;
                for (const cita of bloque.citations) {
                    if (cita.url) fuentes.set(cita.url, cita.title || cita.url);
                }
            }

            if (mensaje.stop_reason === 'pause_turn') {
                mensajes.push({ role: 'assistant', content: mensaje.content });
                continue;
            }
            if (mensaje.stop_reason === 'refusal') {
                enviar({ tipo: 'texto', texto: '\n\nLo siento, no puedo ayudar con esa petición.' });
            } else if (mensaje.stop_reason === 'max_tokens') {
                enviar({ tipo: 'texto', texto: '\n\n*(Respuesta cortada por longitud. Pídeme que continúe.)*' });
            }
            break;
        }

        if (fuentes.size) {
            enviar({ tipo: 'fuentes', lista: [...fuentes].map(([url, titulo]) => ({ url, titulo })) });
        }
        res.end();
    } catch (error) {
        if (cancelado || error instanceof Anthropic.APIUserAbortError) return;

        // Errores tipados del SDK: del más concreto al más general
        let mensaje = 'Ha ocurrido un error al contactar con la IA.';
        if (error instanceof Anthropic.AuthenticationError) {
            mensaje = 'La clave de la API no es válida.';
        } else if (error instanceof Anthropic.RateLimitError) {
            mensaje = 'La IA está saturada ahora mismo, prueba en unos segundos.';
        } else if (error instanceof Anthropic.BadRequestError) {
            mensaje = 'La petición no es válida (¿algún archivo dañado o demasiado grande?).';
        }
        console.error('[asistente] Error:', error.message);

        if (!res.headersSent) {
            res.status(500).json({ error: mensaje });
        } else {
            // Ya habíamos empezado a enviar: mandamos el error como un evento más
            enviar({ tipo: 'error', texto: mensaje });
            res.end();
        }
    }
});

module.exports = router;
