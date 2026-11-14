/**
 * app.js (navegador)
 * ------------------
 * Gestiona el chat: guarda el historial, lo envía al servidor, va pintando
 * la respuesta mientras llega (streaming) y extrae el prompt final que
 * Claude escribe entre <prompt_final> y </prompt_final>.
 *
 * Seguridad: todo el texto se pinta con textContent (nunca innerHTML),
 * así ningún contenido puede inyectar HTML o scripts en la página.
 */

// ===== Referencias a elementos del HTML =====
const $ = id => document.getElementById(id);
const contenedorMensajes = $('mensajes');
const formulario = $('formulario');
const entrada = $('entrada');
const btnEnviar = $('btn-enviar');
const btnGenerar = $('btn-generar');
const btnNueva = $('btn-nueva');
const btnCopiar = $('btn-copiar');
const btnDescargar = $('btn-descargar');
const panelPrompt = $('prompt-final');

const CLAVE_GUARDADO = 'forja-prompts:conversacion';
const INICIO = '<prompt_final>';
const FIN = '</prompt_final>';

// ===== Estado de la app =====
let historial = [];     // [{ role: 'user' | 'assistant', content: '...' }]
let ocupado = false;    // true mientras esperamos respuesta

// ===== Utilidades para el prompt final =====

/** Devuelve el texto del último bloque <prompt_final> (aunque esté a medias). */
function extraerPrompt(texto) {
    const ini = texto.lastIndexOf(INICIO);
    if (ini === -1) return null;
    const desde = ini + INICIO.length;
    const fin = texto.indexOf(FIN, desde);
    return (fin === -1 ? texto.slice(desde) : texto.slice(desde, fin)).trim();
}

/** Quita el bloque del prompt del texto del chat (ya se muestra a la derecha). */
function textoSinPrompt(texto) {
    const ini = texto.indexOf(INICIO);
    if (ini === -1) return { texto, tienePrompt: false };
    const fin = texto.indexOf(FIN, ini);
    const resto = fin === -1 ? '' : texto.slice(fin + FIN.length);
    return { texto: (texto.slice(0, ini) + resto).trim(), tienePrompt: true };
}

function mostrarPrompt(prompt) {
    const hay = Boolean(prompt);
    panelPrompt.textContent = hay ? prompt : 'Aquí aparecerá tu prompt cuando esté listo.';
    panelPrompt.classList.toggle('vacio', !hay);
    btnCopiar.disabled = !hay;
    btnDescargar.disabled = !hay;
}

// ===== Pintar mensajes =====

/** Crea (o actualiza) la burbuja de un mensaje. */
function pintarMensaje(rol, contenido, burbuja = null) {
    $('bienvenida')?.remove();
    if (!burbuja) {
        burbuja = document.createElement('div');
        burbuja.className = `msg ${rol}`;
        contenedorMensajes.appendChild(burbuja);
    }
    if (rol === 'assistant') {
        const { texto, tienePrompt } = textoSinPrompt(contenido);
        burbuja.textContent = texto;
        if (tienePrompt) {
            const aviso = document.createElement('span');
            aviso.className = 'aviso-prompt';
            aviso.textContent = '📋 Prompt generado → panel de la derecha';
            burbuja.appendChild(aviso);
        }
    } else {
        burbuja.textContent = contenido;
    }
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
    return burbuja;
}

function pintarError(texto) {
    const div = document.createElement('div');
    div.className = 'msg error';
    div.textContent = '⚠️ ' + texto;
    contenedorMensajes.appendChild(div);
    contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
}

// ===== Guardado local (para no perder la conversación al recargar) =====
// try/catch porque en modo incógnito localStorage puede fallar.
function guardar() {
    try { localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(historial)); } catch { /* sin guardado */ }
}
function cargar() {
    try {
        const datos = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '[]');
        if (Array.isArray(datos)) historial = datos;
    } catch { historial = []; }
    historial.forEach(m => pintarMensaje(m.role, m.content));
    const ultimaIA = [...historial].reverse().find(m => m.role === 'assistant' && extraerPrompt(m.content));
    mostrarPrompt(ultimaIA ? extraerPrompt(ultimaIA.content) : null);
}

function leerOpciones() {
    return {
        bucle: $('opt-bucle').value,
        maxIteraciones: $('opt-iter').value,
        idioma: $('opt-idioma').value,
        detalle: $('opt-detalle').value
    };
}

function ponerOcupado(valor) {
    ocupado = valor;
    btnEnviar.disabled = valor;
    btnGenerar.disabled = valor;
    btnEnviar.textContent = valor ? 'Pensando…' : 'Enviar';
}

// ===== Enviar un mensaje y leer la respuesta en streaming =====
async function enviar(texto) {
    texto = texto.trim();
    if (!texto || ocupado) return;

    historial.push({ role: 'user', content: texto });
    pintarMensaje('user', texto);
    guardar();
    entrada.value = '';
    ponerOcupado(true);

    const burbuja = pintarMensaje('assistant', '');
    burbuja.classList.add('escribiendo');
    let respuesta = '';

    try {
        const res = await fetch('api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mensajes: historial, opciones: leerOpciones() })
        });

        // Errores de validación llegan como JSON normal, no como stream
        if (!res.ok) {
            const datos = await res.json().catch(() => ({}));
            throw new Error(datos.error || `Error ${res.status}`);
        }

        // Leemos el cuerpo trozo a trozo. Cada evento SSE es "data: {...}\n\n"
        const lector = res.body.getReader();
        const decodificador = new TextDecoder();
        let pendiente = '';

        while (true) {
            const { value, done } = await lector.read();
            if (done) break;
            pendiente += decodificador.decode(value, { stream: true });

            const eventos = pendiente.split('\n\n');
            pendiente = eventos.pop(); // el último puede estar incompleto

            for (const ev of eventos) {
                if (!ev.startsWith('data: ')) continue;
                const datos = JSON.parse(ev.slice(6));
                if (datos.tipo === 'texto') {
                    respuesta += datos.texto;
                    pintarMensaje('assistant', respuesta, burbuja);
                    const prompt = extraerPrompt(respuesta);
                    if (prompt) mostrarPrompt(prompt);
                } else if (datos.tipo === 'error') {
                    throw new Error(datos.mensaje);
                } else if (datos.tipo === 'aviso') {
                    pintarError(datos.mensaje);
                }
            }
        }

        if (!respuesta.trim()) throw new Error('La respuesta llegó vacía.');
        historial.push({ role: 'assistant', content: respuesta });
        guardar();
    } catch (err) {
        if (!respuesta.trim()) burbuja.remove();
        // Quitamos el mensaje del usuario del historial para que pueda reintentar
        historial.pop();
        guardar();
        pintarError(err.message + ' (tu mensaje no se ha guardado: puedes volver a enviarlo)');
        entrada.value = texto;
    } finally {
        burbuja.classList.remove('escribiendo');
        ponerOcupado(false);
        entrada.focus();
    }
}

// ===== Eventos de la interfaz =====
formulario.addEventListener('submit', e => {
    e.preventDefault();
    enviar(entrada.value);
});

// Enter envía; Mayús+Enter hace salto de línea
entrada.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviar(entrada.value);
    }
});

btnGenerar.addEventListener('click', () => {
    const extra = entrada.value.trim();
    enviar((extra ? extra + '\n\n' : '') + 'Con lo que ya sabes, genera ahora el prompt final.');
});

document.querySelectorAll('.chip').forEach(chip =>
    chip.addEventListener('click', () => enviar(chip.textContent))
);

btnNueva.addEventListener('click', () => {
    if (ocupado) return;
    if (historial.length && !confirm('¿Empezar una conversación nueva? Se borrará la actual.')) return;
    historial = [];
    guardar();
    location.reload();
});

btnCopiar.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(panelPrompt.textContent);
        btnCopiar.textContent = '¡Copiado!';
    } catch {
        btnCopiar.textContent = 'No se pudo copiar';
    }
    setTimeout(() => (btnCopiar.textContent = 'Copiar'), 1500);
});

btnDescargar.addEventListener('click', () => {
    const blob = new Blob([panelPrompt.textContent], { type: 'text/markdown' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = 'prompt-claude-code.md';
    enlace.click();
    URL.revokeObjectURL(enlace.href);
});

cargar();
