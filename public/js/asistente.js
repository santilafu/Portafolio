/**
 * asistente.js
 * ------------
 * Lógica del navegador para NOVA.
 *
 * El asistente funciona como una MÁQUINA DE ESTADOS (igual que un PLC o un
 * automatismo industrial: en cada momento está en UN estado concreto):
 *
 *     ┌──────────┐  pulsas   ┌────────────┐  terminas  ┌───────────┐
 *     │ ESPERA   │ ────────▶ │ ESCUCHANDO │ ─────────▶ │ PENSANDO  │ ◀─ razona, busca
 *     └──────────┘           └────────────┘  de hablar └───────────┘    en internet...
 *          ▲                                                │ llega
 *          │                 ┌────────────┐                 │ texto
 *          └──────────────── │ HABLANDO   │ ◀───────────────┘
 *              acaba de leer └────────────┘
 *
 * El núcleo animado cambia de color y movimiento según el estado.
 *
 * Índice:
 *   1. Referencias al HTML        6. Comandos locales (sin IA)
 *   2. Estado de la aplicación    7. Conversación con la IA (streaming)
 *   3. Reconocimiento de voz      8. Pintar mensajes (Markdown)
 *   4. Síntesis de voz            9. Formulario y teclado
 *   5. Archivos adjuntos         10. Núcleo animado (Canvas)
 */

// ════════════════════════════════════════════════════════════════
// 1. REFERENCIAS AL HTML
// ════════════════════════════════════════════════════════════════
const nucleo        = document.getElementById('nucleo');
const lienzo        = document.getElementById('lienzo');
const estadoEl      = document.getElementById('estado');
const ayudaEl       = document.getElementById('ayuda');
const conversacion  = document.getElementById('conversacion');
const formulario    = document.getElementById('formulario');
const entrada       = document.getElementById('entrada');
const botonSilencio = document.getElementById('silencio');
const botonAdjuntar = document.getElementById('adjuntar');
const inputArchivo  = document.getElementById('archivo');
const pendientesEl  = document.getElementById('pendientes');

// ════════════════════════════════════════════════════════════════
// 2. ESTADO DE LA APLICACIÓN
// ════════════════════════════════════════════════════════════════
const ESTADOS = {
    ESPERA:     { texto: 'En espera',   color: [79, 209, 255], velocidad: 0.4, energia: 0.15 },
    ESCUCHANDO: { texto: 'Escuchando…', color: [79, 209, 255], velocidad: 1.2, energia: 0.55 },
    PENSANDO:   { texto: 'Procesando…', color: [255, 181, 71], velocidad: 2.4, energia: 0.35 },
    HABLANDO:   { texto: 'Hablando',    color: [79, 209, 255], velocidad: 0.9, energia: 0.8 }
};

let estadoActual = ESTADOS.ESPERA;
let historial = [];          // [{ role: 'user'|'assistant', content: '...', adjuntos?: [...] }]
let adjuntosPendientes = []; // archivos elegidos que aún no se han enviado
let vozActivada = true;
let peticionEnCurso = null;  // AbortController para poder cancelar

/**
 * Cambia de estado. Opcionalmente con un texto distinto al del estado
 * (por ejemplo "Buscando en internet: …" mientras está PENSANDO).
 */
function cambiarEstado(nuevo, texto) {
    estadoActual = nuevo;
    estadoEl.textContent = texto || nuevo.texto;
    estadoEl.className = nuevo === ESTADOS.PENSANDO ? 'pensando' : '';
}

function mostrarError(texto) {
    cambiarEstado(ESTADOS.ESPERA);
    estadoEl.textContent = texto;
    estadoEl.className = 'error';
}

// ════════════════════════════════════════════════════════════════
// 3. RECONOCIMIENTO DE VOZ (voz → texto)
// ════════════════════════════════════════════════════════════════
// Chrome y Edge lo llaman webkitSpeechRecognition. Firefox no lo soporta,
// por eso siempre dejamos también la opción de escribir.
const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
let reconocedor = null;

if (Reconocimiento) {
    reconocedor = new Reconocimiento();
    reconocedor.lang = 'es-ES';
    reconocedor.interimResults = true;   // muestra lo que vas diciendo en tiempo real
    reconocedor.continuous = false;      // se detiene solo cuando dejas de hablar

    let textoFinal = '';

    reconocedor.onstart = () => {
        textoFinal = '';
        cambiarEstado(ESTADOS.ESCUCHANDO);
    };

    reconocedor.onresult = (evento) => {
        // El navegador va devolviendo "resultados": unos provisionales
        // y otros definitivos (isFinal). Los juntamos.
        let provisional = '';
        textoFinal = '';
        for (const resultado of evento.results) {
            if (resultado.isFinal) textoFinal += resultado[0].transcript;
            else provisional += resultado[0].transcript;
        }
        estadoEl.textContent = '«' + (textoFinal + provisional) + '»';
    };

    reconocedor.onerror = (evento) => {
        const mensajes = {
            'not-allowed': 'Necesito permiso para usar el micrófono.',
            'no-speech':   'No he oído nada. Prueba otra vez.',
            'network':     'El reconocimiento de voz necesita conexión a internet.'
        };
        mostrarError(mensajes[evento.error] || 'Error del micrófono: ' + evento.error);
    };

    reconocedor.onend = () => {
        if (textoFinal.trim()) {
            procesarMensaje(textoFinal.trim());
        } else if (estadoActual === ESTADOS.ESCUCHANDO) {
            cambiarEstado(ESTADOS.ESPERA);
        }
    };
} else {
    ayudaEl.textContent = 'Tu navegador no admite dictado por voz (usa Chrome o Edge), pero puedes escribir y adjuntar archivos.';
}

function alternarEscucha() {
    // Si NOVA está hablando, pulsar la interrumpe (como hacen los asistentes reales)
    if (estadoActual === ESTADOS.HABLANDO) {
        speechSynthesis.cancel();
        cambiarEstado(ESTADOS.ESPERA);
        return;
    }
    // Si está pensando, pulsar cancela la tarea
    if (estadoActual === ESTADOS.PENSANDO) {
        peticionEnCurso?.abort();
        return;
    }
    if (!reconocedor) { entrada.focus(); return; }
    if (estadoActual === ESTADOS.ESCUCHANDO) { reconocedor.stop(); return; }

    try { reconocedor.start(); } catch (e) { /* ya estaba arrancado */ }
}

nucleo.addEventListener('click', alternarEscucha);

// ════════════════════════════════════════════════════════════════
// 4. SÍNTESIS DE VOZ (texto → voz)
// ════════════════════════════════════════════════════════════════
// Las respuestas pueden ser largas (tablas, código...). Leer todo eso en
// voz alta sería insoportable, así que la voz:
//   - se salta los bloques de código y las tablas
//   - quita los símbolos de Markdown (#, **, `...)
//   - lee como mucho LIMITE_VOZ caracteres y luego avisa de que el resto
//     está en pantalla (NOVA siempre empieza con un resumen hablado)
const LIMITE_VOZ = 450;

let vozEspanol = null;
function elegirVoz() {
    const voces = speechSynthesis.getVoices();
    // Preferimos voces de España; si no, cualquier español
    vozEspanol =
        voces.find(v => v.lang === 'es-ES' && /google|natural|online/i.test(v.name)) ||
        voces.find(v => v.lang === 'es-ES') ||
        voces.find(v => v.lang.startsWith('es')) ||
        null;
}
if ('speechSynthesis' in window) {
    elegirVoz();
    speechSynthesis.onvoiceschanged = elegirVoz;
}

let frasesPendientes = 0;

/** Pone una frase en la cola de voz (speechSynthesis ya funciona como una cola) */
function decir(frase) {
    if (!vozActivada || !('speechSynthesis' in window) || !frase.trim()) return;

    const locucion = new SpeechSynthesisUtterance(frase);
    locucion.lang = 'es-ES';
    if (vozEspanol) locucion.voice = vozEspanol;
    locucion.rate = 1.05;   // velocidad (1 = normal)
    locucion.pitch = 0.95;  // tono

    frasesPendientes++;
    locucion.onstart = () => cambiarEstado(ESTADOS.HABLANDO);
    locucion.onend = locucion.onerror = () => {
        frasesPendientes = Math.max(0, frasesPendientes - 1);
        if (frasesPendientes === 0 && estadoActual === ESTADOS.HABLANDO) {
            cambiarEstado(ESTADOS.ESPERA);
        }
    };
    speechSynthesis.speak(locucion);
}

/** Quita los símbolos de Markdown de una línea para que suene natural */
function limpiarMarkdown(linea) {
    return linea
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/, '') // títulos, citas, viñetas
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')           // [texto](url) → texto
        .replace(/[*_~`]+/g, '')                              // negritas, cursivas, código
        .trim();
}

/**
 * "Lector" que recibe el texto según llega y decide qué decir en voz alta.
 * Es un objeto con su propio estado porque hay que recordar cosas entre
 * trozos: si estamos dentro de un bloque de código, cuánto se ha leído...
 */
function crearLector() {
    let lineaIncompleta = '';
    let pendienteDeFrase = '';
    let enCodigo = false;
    let leidos = 0;
    let avisado = false;

    function decirFrases(texto, final) {
        pendienteDeFrase += texto;
        // Partimos por final de frase (. ! ? …) seguido de espacio
        const frases = pendienteDeFrase.split(/(?<=[.!?…:])\s+/);
        pendienteDeFrase = final ? '' : frases.pop(); // la última puede estar a medias
        for (const frase of frases) {
            if (!frase.trim()) continue;
            if (leidos >= LIMITE_VOZ) {
                if (!avisado) { avisado = true; decir('Te dejo el resto en pantalla.'); }
                return;
            }
            leidos += frase.length;
            decir(frase.replace(/^[-*+]\s+/, '')); // viñetas sueltas a mitad de línea
        }
    }

    function procesarLinea(linea) {
        if (/^\s*```/.test(linea)) { enCodigo = !enCodigo; return; }
        if (enCodigo || /^\s*\|/.test(linea) || /^\s*[-*_]{3,}\s*$/.test(linea)) return;
        const limpia = limpiarMarkdown(linea);
        // Un título o una línea sin punto final también es una "frase"
        if (limpia) decirFrases(limpia + (/[.!?…:]$/.test(limpia) ? ' ' : '. '), false);
    }

    return {
        recibir(trozo) {
            lineaIncompleta += trozo;
            const lineas = lineaIncompleta.split('\n');
            lineaIncompleta = lineas.pop();
            lineas.forEach(procesarLinea);
        },
        terminar() {
            if (lineaIncompleta) procesarLinea(lineaIncompleta);
            decirFrases('', true);
        }
    };
}

// "Perro guardián" (watchdog): algunos navegadores a veces no lanzan el
// evento onend al terminar de hablar y NOVA se quedaría "hablando" para
// siempre. Cada medio segundo comprobamos si de verdad sigue sonando algo.
setInterval(() => {
    if (estadoActual === ESTADOS.HABLANDO &&
        !speechSynthesis.speaking && !speechSynthesis.pending) {
        frasesPendientes = 0;
        cambiarEstado(ESTADOS.ESPERA);
    }
}, 500);

botonSilencio.addEventListener('click', () => {
    vozActivada = !vozActivada;
    botonSilencio.textContent = vozActivada ? '🔊' : '🔇';
    botonSilencio.setAttribute('aria-pressed', String(!vozActivada));
    if (!vozActivada) {
        speechSynthesis.cancel();
        if (estadoActual === ESTADOS.HABLANDO) cambiarEstado(ESTADOS.ESPERA);
    }
});

// ════════════════════════════════════════════════════════════════
// 5. ARCHIVOS ADJUNTOS
// ════════════════════════════════════════════════════════════════
const MAX_ADJUNTOS = 5;
const MAX_MB_BINARIO = 8;
const MAX_CARACTERES_TEXTO = 200_000;
const LADO_MAX_IMAGEN = 1600; // px: más grande no mejora el análisis y pesa mucho

/** Lee un archivo y devuelve una Promesa con su contenido */
function leerArchivo(archivo, modo) {
    return new Promise((resolver, rechazar) => {
        const lector = new FileReader();
        lector.onload = () => resolver(lector.result);
        lector.onerror = () => rechazar(new Error('No se pudo leer ' + archivo.name));
        if (modo === 'texto') lector.readAsText(archivo);
        else lector.readAsDataURL(archivo); // "data:image/png;base64,AAAA..."
    });
}

/**
 * Reduce una imagen grande dibujándola en un canvas más pequeño.
 * Así una foto del móvil de 12 MB pasa a ocupar unos cientos de KB.
 */
async function reducirImagen(dataUrl, mediaType) {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const escala = Math.min(1, LADO_MAX_IMAGEN / Math.max(img.width, img.height));
    if (escala === 1 && dataUrl.length < 3_000_000) return { dataUrl, mediaType };

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), mediaType: 'image/jpeg' };
}

/** Convierte un File del navegador en el objeto "adjunto" que espera el servidor */
async function prepararAdjunto(archivo) {
    const nombre = archivo.name;

    if (/^image\/(png|jpeg|gif|webp)$/.test(archivo.type)) {
        let { dataUrl, mediaType } = { dataUrl: await leerArchivo(archivo), mediaType: archivo.type };
        if (mediaType !== 'image/gif') ({ dataUrl, mediaType } = await reducirImagen(dataUrl, mediaType));
        return { nombre, tipo: 'imagen', mediaType, datos: dataUrl.split(',')[1] };
    }

    if (archivo.type === 'application/pdf') {
        if (archivo.size > MAX_MB_BINARIO * 1024 * 1024) throw new Error(`«${nombre}» supera ${MAX_MB_BINARIO} MB`);
        const dataUrl = await leerArchivo(archivo);
        return { nombre, tipo: 'pdf', mediaType: 'application/pdf', datos: dataUrl.split(',')[1] };
    }

    // Cualquier otra cosa la intentamos leer como texto (código, CSV, JSON...)
    if (archivo.size > MAX_CARACTERES_TEXTO * 4) throw new Error(`«${nombre}» es demasiado grande`);
    const texto = await leerArchivo(archivo, 'texto');
    if (texto.includes('\u0000')) throw new Error(`«${nombre}» no es un archivo de texto`);
    return { nombre, tipo: 'texto', mediaType: 'text/plain', datos: texto.slice(0, MAX_CARACTERES_TEXTO) };
}

async function anadirArchivos(lista) {
    for (const archivo of lista) {
        if (adjuntosPendientes.length >= MAX_ADJUNTOS) {
            mostrarError(`Máximo ${MAX_ADJUNTOS} archivos por mensaje.`);
            break;
        }
        try {
            adjuntosPendientes.push(await prepararAdjunto(archivo));
        } catch (error) {
            mostrarError(error.message);
        }
    }
    pintarPendientes();
}

function icono(tipo) {
    return { imagen: '🖼️', pdf: '📄', texto: '📝' }[tipo] || '📎';
}

function crearChip(adjunto, alQuitar) {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.title = adjunto.nombre;
    const nombre = document.createElement('span');
    nombre.textContent = icono(adjunto.tipo) + ' ' + adjunto.nombre;
    chip.appendChild(nombre);
    if (alQuitar) {
        const quitar = document.createElement('button');
        quitar.type = 'button';
        quitar.textContent = '✕';
        quitar.setAttribute('aria-label', 'Quitar ' + adjunto.nombre);
        quitar.addEventListener('click', alQuitar);
        chip.appendChild(quitar);
    }
    return chip;
}

function pintarPendientes() {
    pendientesEl.replaceChildren(...adjuntosPendientes.map((adjunto, i) =>
        crearChip(adjunto, () => { adjuntosPendientes.splice(i, 1); pintarPendientes(); })
    ));
}

botonAdjuntar.addEventListener('click', () => inputArchivo.click());
inputArchivo.addEventListener('change', () => {
    anadirArchivos([...inputArchivo.files]);
    inputArchivo.value = ''; // permite volver a elegir el mismo archivo
});

// Arrastrar y soltar archivos sobre la página
let contadorArrastre = 0; // dragenter/dragleave saltan también en los hijos
document.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    contadorArrastre++;
    document.body.classList.add('arrastrando');
});
document.addEventListener('dragleave', () => {
    if (--contadorArrastre <= 0) { contadorArrastre = 0; document.body.classList.remove('arrastrando'); }
});
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', (e) => {
    e.preventDefault();
    contadorArrastre = 0;
    document.body.classList.remove('arrastrando');
    if (e.dataTransfer?.files.length) anadirArchivos([...e.dataTransfer.files]);
});

// Pegar imágenes con Ctrl+V (capturas de pantalla)
entrada.addEventListener('paste', (e) => {
    const archivos = [...(e.clipboardData?.files || [])];
    if (archivos.length) { e.preventDefault(); anadirArchivos(archivos); }
});

// ════════════════════════════════════════════════════════════════
// 6. COMANDOS LOCALES (sin gastar IA)
// ════════════════════════════════════════════════════════════════
// Algunas cosas no necesitan inteligencia artificial: las resolvemos
// aquí mismo, al instante y gratis. Cada comando tiene un patrón
// (expresión regular) y una función que devuelve la respuesta.
const COMANDOS = [
    {
        patron: /^(qu[eé] hora es|dime la hora)\??$/i,
        accion: () => {
            const ahora = new Date();
            return `Son las ${ahora.getHours()} y ${String(ahora.getMinutes()).padStart(2, '0')}.`;
        }
    },
    {
        patron: /^(qu[eé] d[ií]a es( hoy)?|qu[eé] fecha es( hoy)?)\??$/i,
        accion: () => 'Hoy es ' + new Date().toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }) + '.'
    },
    {
        patron: /^(borra|limpia|olvida)( la| nuestra)? conversaci[oó]n\.?$/i,
        accion: () => {
            historial = [];
            conversacion.replaceChildren();
            return 'Hecho. He olvidado nuestra conversación.';
        }
    }
];

function buscarComandoLocal(texto) {
    const comando = COMANDOS.find(c => c.patron.test(texto.trim()));
    return comando ? comando.accion() : null;
}

// ════════════════════════════════════════════════════════════════
// 7. CONVERSACIÓN CON LA IA (streaming)
// ════════════════════════════════════════════════════════════════
async function procesarMensaje(texto) {
    if (estadoActual === ESTADOS.PENSANDO) return;
    speechSynthesis.cancel();

    const adjuntos = adjuntosPendientes;
    adjuntosPendientes = [];
    pintarPendientes();
    pintarMensajeUsuario(texto, adjuntos);

    // ¿Es un comando que podemos resolver sin IA?
    const respuestaLocal = adjuntos.length ? null : buscarComandoLocal(texto);
    if (respuestaLocal) {
        crearBurbujaNova().ponerTexto(respuestaLocal);
        decir(respuestaLocal);
        if (frasesPendientes === 0) cambiarEstado(ESTADOS.ESPERA);
        return;
    }

    historial.push({ role: 'user', content: texto || 'Analiza los archivos adjuntos.', adjuntos });
    cambiarEstado(ESTADOS.PENSANDO);
    const burbuja = crearBurbujaNova();
    const lector = crearLector();
    let textoCompleto = '';
    peticionEnCurso = new AbortController();

    try {
        const respuesta = await fetch('/api/asistente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ historial }),
            signal: peticionEnCurso.signal
        });

        if (!respuesta.ok) {
            const datos = await respuesta.json().catch(() => ({}));
            throw new Error(datos.error || (respuesta.status === 413
                ? 'Los archivos son demasiado grandes.'
                : 'Error ' + respuesta.status));
        }

        // Leemos la respuesta A TROZOS según llega. Cada línea es un
        // evento JSON (ver el comentario de PROTOCOLO en server/asistente.js).
        const lectorStream = respuesta.body.getReader();
        const decodificador = new TextDecoder();
        let buffer = '';

        const procesarEvento = (evento) => {
            switch (evento.tipo) {
                case 'pensamiento':
                    burbuja.anadirPensamiento(evento.texto);
                    if (!textoCompleto) cambiarEstado(ESTADOS.PENSANDO, 'Razonando…');
                    break;
                case 'herramienta':
                    cambiarEstado(ESTADOS.PENSANDO, evento.texto);
                    break;
                case 'texto':
                    if (!textoCompleto) cambiarEstado(ESTADOS.PENSANDO, 'Respondiendo…');
                    textoCompleto += evento.texto;
                    burbuja.ponerTexto(textoCompleto);
                    lector.recibir(evento.texto);
                    break;
                case 'fuentes':
                    burbuja.ponerFuentes(evento.lista);
                    break;
                case 'error':
                    throw new Error(evento.texto);
            }
        };

        while (true) {
            const { done, value } = await lectorStream.read();
            if (done) break;
            buffer += decodificador.decode(value, { stream: true });
            const lineas = buffer.split('\n');
            buffer = lineas.pop(); // la última línea puede venir a medias
            for (const linea of lineas) {
                if (linea.trim()) procesarEvento(JSON.parse(linea));
            }
        }
        if (buffer.trim()) procesarEvento(JSON.parse(buffer));

        lector.terminar();
        historial.push({ role: 'assistant', content: textoCompleto });
        cambiarEstado(frasesPendientes > 0 ? ESTADOS.HABLANDO : ESTADOS.ESPERA);
    } catch (error) {
        const cancelado = error.name === 'AbortError';
        if (textoCompleto) {
            // Guardamos lo que llegó a responder para no perder el contexto
            historial.push({ role: 'assistant', content: textoCompleto });
        } else {
            historial.pop();     // quitamos la pregunta que no obtuvo respuesta
            burbuja.eliminar();
        }
        if (cancelado) cambiarEstado(ESTADOS.ESPERA, 'Tarea cancelada');
        else mostrarError(error.message);
    } finally {
        peticionEnCurso = null;
    }
}

// ════════════════════════════════════════════════════════════════
// 8. PINTAR MENSAJES (Markdown)
// ════════════════════════════════════════════════════════════════

// Todos los enlaces de las respuestas se abren en otra pestaña
if (window.DOMPurify) {
    DOMPurify.addHook('afterSanitizeAttributes', (nodo) => {
        if (nodo.tagName === 'A') {
            nodo.setAttribute('target', '_blank');
            nodo.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

/**
 * Markdown → HTML SEGURO.
 * Nunca metas en innerHTML texto que no controlas sin limpiarlo:
 * si la IA (o una web que haya leído) devolviera <script>, se ejecutaría.
 * DOMPurify elimina todo lo peligroso.
 */
function markdownAHtml(texto) {
    if (!window.marked || !window.DOMPurify) return null; // librerías no cargadas
    return DOMPurify.sanitize(marked.parse(texto));
}

function bajarAlFinal() {
    // Solo bajamos si el usuario ya estaba abajo (si está leyendo arriba, no le movemos)
    const cerca = conversacion.scrollHeight - conversacion.scrollTop - conversacion.clientHeight < 120;
    if (cerca) conversacion.scrollTop = conversacion.scrollHeight;
}

function crearMensaje(rol) {
    conversacion.querySelector('.vacio')?.remove();
    const div = document.createElement('div');
    div.className = 'msg ' + rol;
    const quien = document.createElement('span');
    quien.className = 'quien';
    quien.textContent = rol === 'user' ? 'TÚ' : 'NOVA';
    div.appendChild(quien);
    conversacion.appendChild(div);
    return div;
}

function pintarMensajeUsuario(texto, adjuntos) {
    const div = crearMensaje('user');
    if (adjuntos.length) {
        const chips = document.createElement('div');
        chips.className = 'chips';
        adjuntos.forEach(a => chips.appendChild(crearChip(a)));
        div.appendChild(chips);
    }
    const cuerpo = document.createElement('div');
    cuerpo.textContent = texto;  // textContent (no innerHTML) → no se interpreta HTML
    div.appendChild(cuerpo);
    conversacion.scrollTop = conversacion.scrollHeight;
}

/**
 * Crea la burbuja de NOVA y devuelve un pequeño objeto para ir
 * rellenándola mientras llega la respuesta.
 */
function crearBurbujaNova() {
    const div = crearMensaje('assistant');
    let detalles = null, textoPensamiento = null;
    const cuerpo = document.createElement('div');
    cuerpo.className = 'md';
    div.appendChild(cuerpo);
    conversacion.scrollTop = conversacion.scrollHeight;

    // Volver a convertir el Markdown en cada trozo es costoso: lo hacemos
    // como mucho una vez por fotograma con requestAnimationFrame.
    let textoPendiente = null;
    const renderizar = () => {
        const html = markdownAHtml(textoPendiente);
        if (html === null) cuerpo.textContent = textoPendiente;
        else cuerpo.innerHTML = html;
        textoPendiente = null;
        bajarAlFinal();
    };

    return {
        anadirPensamiento(trozo) {
            if (!detalles) {
                detalles = document.createElement('details');
                detalles.className = 'razonamiento';
                const resumen = document.createElement('summary');
                resumen.textContent = 'RAZONAMIENTO';
                textoPensamiento = document.createElement('div');
                detalles.append(resumen, textoPensamiento);
                div.insertBefore(detalles, cuerpo);
            }
            textoPensamiento.textContent += trozo;
            bajarAlFinal();
        },
        ponerTexto(texto) {
            if (textoPendiente === null) requestAnimationFrame(renderizar);
            textoPendiente = texto;
        },
        ponerFuentes(lista) {
            const caja = document.createElement('div');
            caja.className = 'fuentes';
            caja.textContent = 'Fuentes consultadas:';
            const ol = document.createElement('ol');
            for (const { url, titulo } of lista) {
                if (!/^https?:\/\//.test(url)) continue; // solo enlaces web normales
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = url;
                a.textContent = titulo;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                li.appendChild(a);
                ol.appendChild(li);
            }
            caja.appendChild(ol);
            div.appendChild(caja);
            bajarAlFinal();
        },
        eliminar() { div.remove(); }
    };
}

// ════════════════════════════════════════════════════════════════
// 9. FORMULARIO Y TECLADO
// ════════════════════════════════════════════════════════════════
function enviarFormulario() {
    const texto = entrada.value.trim();
    if ((!texto && !adjuntosPendientes.length) || estadoActual === ESTADOS.PENSANDO) return;
    entrada.value = '';
    ajustarAlturaEntrada();
    procesarMensaje(texto);
}

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    enviarFormulario();
});

// Intro envía; Mayús+Intro hace salto de línea
entrada.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        enviarFormulario();
    }
});

// El cuadro de texto crece con el contenido
function ajustarAlturaEntrada() {
    entrada.style.height = 'auto';
    entrada.style.height = entrada.scrollHeight + 2 + 'px';
}
entrada.addEventListener('input', ajustarAlturaEntrada);

// Tecla Espacio = hablar (salvo si estás escribiendo o sobre un botón)
document.addEventListener('keydown', (e) => {
    const etiqueta = document.activeElement?.tagName;
    if (e.code === 'Space' && !['TEXTAREA', 'INPUT', 'BUTTON', 'SUMMARY', 'A'].includes(etiqueta)) {
        e.preventDefault();
        alternarEscucha();
    }
    // Escape cancela lo que esté haciendo NOVA
    if (e.key === 'Escape') {
        if (estadoActual === ESTADOS.PENSANDO) peticionEnCurso?.abort();
        if (estadoActual === ESTADOS.HABLANDO) { speechSynthesis.cancel(); cambiarEstado(ESTADOS.ESPERA); }
    }
});

// ════════════════════════════════════════════════════════════════
// 10. NÚCLEO ANIMADO (Canvas)
// ════════════════════════════════════════════════════════════════
// Dibujamos ~60 veces por segundo con requestAnimationFrame.
// Los valores "actuales" se acercan poco a poco a los del estado
// (interpolación), así los cambios de estado son suaves y no bruscos.
const ctx = lienzo.getContext('2d');
const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let color = [...ESTADOS.ESPERA.color];
let energia = 0;
let angulo = 0;

function ajustarTamano() {
    // devicePixelRatio: en pantallas retina dibujamos al doble para que se vea nítido
    const escala = window.devicePixelRatio || 1;
    const lado = lienzo.clientWidth;
    lienzo.width = lado * escala;
    lienzo.height = lado * escala;
    ctx.setTransform(escala, 0, 0, escala, 0, 0);
}
window.addEventListener('resize', ajustarTamano);
ajustarTamano();

/** Acerca el valor a hacia b un porcentaje t (0-1) */
const acercar = (a, b, t) => a + (b - a) * t;

function dibujar(tiempo) {
    const lado = lienzo.clientWidth;
    const c = lado / 2;               // centro
    const r = lado * 0.42;            // radio exterior
    const t = tiempo / 1000;          // segundos
    const k = lado / 340;             // escala de grosores respecto al tamaño original

    // Suavizamos color y energía hacia los del estado actual
    color = color.map((v, i) => acercar(v, estadoActual.color[i], 0.06));
    // Al hablar la energía "late" de forma irregular, imitando una voz
    const objetivo = estadoActual === ESTADOS.HABLANDO
        ? estadoActual.energia * (0.6 + 0.4 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.7)))
        : estadoActual.energia;
    energia = acercar(energia, objetivo, 0.1);
    if (!reducirMovimiento) angulo += 0.01 * estadoActual.velocidad;

    const rgb = (a) => `rgba(${color[0] | 0}, ${color[1] | 0}, ${color[2] | 0}, ${a})`;

    ctx.clearRect(0, 0, lado, lado);
    ctx.lineCap = 'round';

    // Resplandor central
    const brillo = ctx.createRadialGradient(c, c, 0, c, c, r * 0.55);
    brillo.addColorStop(0, rgb(0.55 + energia * 0.4));
    brillo.addColorStop(0.35, rgb(0.18 + energia * 0.2));
    brillo.addColorStop(1, rgb(0));
    ctx.fillStyle = brillo;
    ctx.beginPath();
    ctx.arc(c, c, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Anillo de "onda": 90 barras que salen hacia fuera según la energía
    const barras = 90;
    ctx.lineWidth = 2 * k;
    for (let i = 0; i < barras; i++) {
        const a = (i / barras) * Math.PI * 2;
        const ruido = Math.sin(i * 0.7 + t * 4) * Math.sin(i * 0.23 - t * 2.3);
        const largo = (4 + energia * 26 * (0.5 + 0.5 * ruido)) * k;
        const r1 = r * 0.62;
        ctx.strokeStyle = rgb(0.35 + energia * 0.5);
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
        ctx.lineTo(c + Math.cos(a) * (r1 + largo), c + Math.sin(a) * (r1 + largo));
        ctx.stroke();
    }

    // Arcos giratorios: [radio, grosor, longitud del arco, sentido, nº de arcos]
    const arcos = [
        [0.80, 3, 1.2, 1, 3],
        [0.90, 1.5, 0.5, -1.6, 6],
        [0.99, 1, 2.6, 0.6, 2],
        [0.48, 2, 0.9, -2.2, 4]
    ];
    for (const [radio, grosor, longitud, sentido, cantidad] of arcos) {
        ctx.lineWidth = grosor * k;
        ctx.strokeStyle = rgb(0.75);
        for (let j = 0; j < cantidad; j++) {
            const inicio = angulo * sentido + (j * Math.PI * 2) / cantidad;
            ctx.beginPath();
            ctx.arc(c, c, r * radio, inicio, inicio + longitud / cantidad * 2);
            ctx.stroke();
        }
    }

    // Marcas finas tipo "regla" en el anillo exterior
    ctx.lineWidth = 1;
    ctx.strokeStyle = rgb(0.3);
    for (let i = 0; i < 120; i++) {
        const a = (i / 120) * Math.PI * 2 - angulo * 0.3;
        const largo = (i % 10 === 0 ? 8 : 3) * k;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * r * 1.06, c + Math.sin(a) * r * 1.06);
        ctx.lineTo(c + Math.cos(a) * (r * 1.06 + largo), c + Math.sin(a) * (r * 1.06 + largo));
        ctx.stroke();
    }

    requestAnimationFrame(dibujar);
}
requestAnimationFrame(dibujar);
