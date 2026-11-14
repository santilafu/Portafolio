/**
 * asistente.js
 * ------------
 * Lógica del navegador para NOVA.
 *
 * El asistente funciona como una MÁQUINA DE ESTADOS (igual que un PLC o un
 * automatismo industrial: en cada momento está en UN estado concreto):
 *
 *     ┌──────────┐  pulsas   ┌────────────┐  terminas  ┌───────────┐
 *     │ ESPERA   │ ────────▶ │ ESCUCHANDO │ ─────────▶ │ PENSANDO  │
 *     └──────────┘           └────────────┘  de hablar └───────────┘
 *          ▲                                                │ llega
 *          │                 ┌────────────┐                 │ texto
 *          └──────────────── │ HABLANDO   │ ◀───────────────┘
 *              acaba de leer └────────────┘
 *
 * El núcleo animado cambia de color y movimiento según el estado.
 */

// ════════════════════════════════════════════════════════════════
// 1. REFERENCIAS AL HTML
// ════════════════════════════════════════════════════════════════
const nucleo       = document.getElementById('nucleo');
const lienzo       = document.getElementById('lienzo');
const estadoEl     = document.getElementById('estado');
const ayudaEl      = document.getElementById('ayuda');
const conversacion = document.getElementById('conversacion');
const formulario   = document.getElementById('formulario');
const entrada      = document.getElementById('entrada');
const botonSilencio = document.getElementById('silencio');

// ════════════════════════════════════════════════════════════════
// 2. ESTADO DE LA APLICACIÓN
// ════════════════════════════════════════════════════════════════
const ESTADOS = {
    ESPERA:     { texto: 'En espera',  color: [79, 209, 255],  velocidad: 0.4, energia: 0.15 },
    ESCUCHANDO: { texto: 'Escuchando…', color: [79, 209, 255], velocidad: 1.2, energia: 0.55 },
    PENSANDO:   { texto: 'Procesando…', color: [255, 181, 71], velocidad: 2.4, energia: 0.35 },
    HABLANDO:   { texto: 'Hablando',    color: [79, 209, 255], velocidad: 0.9, energia: 0.8 }
};

let estadoActual = ESTADOS.ESPERA;
let historial = [];          // [{ role: 'user'|'assistant', content: '...' }]
let vozActivada = true;

function cambiarEstado(nuevo) {
    estadoActual = nuevo;
    estadoEl.textContent = nuevo.texto;
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
        for (const resultado of evento.results) {
            if (resultado.isFinal) textoFinal = resultado[0].transcript;
            else provisional += resultado[0].transcript;
        }
        estadoEl.textContent = '«' + (textoFinal || provisional) + '»';
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
    ayudaEl.textContent = 'Tu navegador no admite reconocimiento de voz (usa Chrome o Edge). Puedes escribir abajo.';
}

function alternarEscucha() {
    // Si NOVA está hablando, pulsar la interrumpe (como hacen los asistentes reales)
    if (estadoActual === ESTADOS.HABLANDO) {
        speechSynthesis.cancel();
        cambiarEstado(ESTADOS.ESPERA);
        return;
    }
    if (!reconocedor) { entrada.focus(); return; }
    if (estadoActual === ESTADOS.ESCUCHANDO) { reconocedor.stop(); return; }
    if (estadoActual === ESTADOS.PENSANDO) return; // esperamos a que responda

    try { reconocedor.start(); } catch (e) { /* ya estaba arrancado */ }
}

nucleo.addEventListener('click', alternarEscucha);

// Tecla Espacio = hablar (salvo si estás escribiendo en el cuadro de texto)
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== entrada && document.activeElement !== nucleo) {
        e.preventDefault();
        alternarEscucha();
    }
});

// ════════════════════════════════════════════════════════════════
// 4. SÍNTESIS DE VOZ (texto → voz)
// ════════════════════════════════════════════════════════════════
// Las voces se cargan de forma asíncrona, así que las pedimos cuando estén.
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

// Cola de frases: NOVA empieza a hablar en cuanto termina la PRIMERA frase,
// sin esperar a que llegue la respuesta completa. Así parece más natural.
let frasesPendientes = 0;

function hablar(frase) {
    if (!vozActivada || !('speechSynthesis' in window) || !frase.trim()) return;

    const locucion = new SpeechSynthesisUtterance(frase);
    locucion.lang = 'es-ES';
    if (vozEspanol) locucion.voice = vozEspanol;
    locucion.rate = 1.05;   // velocidad (1 = normal)
    locucion.pitch = 0.9;   // tono algo más grave

    frasesPendientes++;
    locucion.onstart = () => cambiarEstado(ESTADOS.HABLANDO);
    locucion.onend = locucion.onerror = () => {
        frasesPendientes--;
        if (frasesPendientes <= 0 && estadoActual === ESTADOS.HABLANDO) {
            frasesPendientes = 0;
            cambiarEstado(ESTADOS.ESPERA);
        }
    };
    speechSynthesis.speak(locucion); // speak() ya funciona como una cola
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
// 5. COMANDOS LOCALES (sin gastar IA)
// ════════════════════════════════════════════════════════════════
// Algunas cosas no necesitan inteligencia artificial: las resolvemos
// aquí mismo, al instante y gratis. Cada comando tiene un patrón
// (expresión regular) y una función que devuelve la respuesta.
const COMANDOS = [
    {
        patron: /qu[eé] hora es|dime la hora/i,
        accion: () => {
            const ahora = new Date();
            return `Son las ${ahora.getHours()} y ${String(ahora.getMinutes()).padStart(2, '0')}.`;
        }
    },
    {
        patron: /qu[eé] d[ií]a es|fecha de hoy|qu[eé] fecha/i,
        accion: () => 'Hoy es ' + new Date().toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }) + '.'
    },
    {
        patron: /^(borra|limpia|olvida)( la)? conversaci[oó]n/i,
        accion: () => {
            historial = [];
            conversacion.innerHTML = '';
            return 'Hecho. He olvidado nuestra conversación.';
        }
    }
];

function buscarComandoLocal(texto) {
    const comando = COMANDOS.find(c => c.patron.test(texto));
    return comando ? comando.accion() : null;
}

// ════════════════════════════════════════════════════════════════
// 6. CONVERSACIÓN CON LA IA
// ════════════════════════════════════════════════════════════════

/** Añade una burbuja a la conversación y devuelve el elemento del texto */
function pintarMensaje(rol, texto) {
    conversacion.querySelector('.vacio')?.remove();
    const div = document.createElement('div');
    div.className = 'msg ' + rol;
    const quien = document.createElement('span');
    quien.className = 'quien';
    quien.textContent = rol === 'user' ? 'TÚ' : 'NOVA';
    const cuerpo = document.createElement('span');
    cuerpo.textContent = texto;  // textContent (no innerHTML) → evita inyectar HTML
    div.append(quien, cuerpo);
    conversacion.appendChild(div);
    conversacion.scrollTop = conversacion.scrollHeight;
    return cuerpo;
}

async function procesarMensaje(texto) {
    speechSynthesis.cancel();
    pintarMensaje('user', texto);

    // ¿Es un comando que podemos resolver sin IA?
    const respuestaLocal = buscarComandoLocal(texto);
    if (respuestaLocal) {
        pintarMensaje('assistant', respuestaLocal);
        hablar(respuestaLocal);
        if (!vozActivada) cambiarEstado(ESTADOS.ESPERA);
        return;
    }

    historial.push({ role: 'user', content: texto });
    cambiarEstado(ESTADOS.PENSANDO);
    const burbuja = pintarMensaje('assistant', '');

    try {
        const respuesta = await fetch('/api/asistente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ historial })
        });

        if (!respuesta.ok) {
            const datos = await respuesta.json().catch(() => ({}));
            throw new Error(datos.error || 'Error ' + respuesta.status);
        }

        // Leemos la respuesta A TROZOS según llega (streaming)
        const lector = respuesta.body.getReader();
        const decodificador = new TextDecoder();
        let textoCompleto = '';
        let pendienteDeLeer = '';   // texto recibido que aún no forma una frase entera

        while (true) {
            const { done, value } = await lector.read();
            if (done) break;

            const trozo = decodificador.decode(value, { stream: true });
            textoCompleto += trozo;
            pendienteDeLeer += trozo;
            burbuja.textContent = textoCompleto;
            conversacion.scrollTop = conversacion.scrollHeight;

            // ¿Tenemos ya una frase completa? (termina en . ! ? seguido de espacio)
            const frases = pendienteDeLeer.split(/(?<=[.!?…])\s+/);
            pendienteDeLeer = frases.pop();          // lo último puede estar a medias
            frases.forEach(hablar);                  // el resto ya se puede leer
        }
        hablar(pendienteDeLeer);                     // la última frase

        historial.push({ role: 'assistant', content: textoCompleto });

        // Si hay frases en cola pasamos a HABLANDO; si la voz está silenciada, a ESPERA
        cambiarEstado(frasesPendientes > 0 ? ESTADOS.HABLANDO : ESTADOS.ESPERA);
    } catch (error) {
        historial.pop(); // quitamos la pregunta que no obtuvo respuesta
        burbuja.parentElement.remove();
        mostrarError(error.message);
    }
}

formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = entrada.value.trim();
    if (!texto || estadoActual === ESTADOS.PENSANDO) return;
    entrada.value = '';
    procesarMensaje(texto);
});

// ════════════════════════════════════════════════════════════════
// 7. NÚCLEO ANIMADO (Canvas)
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
    ctx.lineWidth = 2;
    for (let i = 0; i < barras; i++) {
        const a = (i / barras) * Math.PI * 2;
        const ruido = Math.sin(i * 0.7 + t * 4) * Math.sin(i * 0.23 - t * 2.3);
        const largo = 4 + energia * 26 * (0.5 + 0.5 * ruido);
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
        ctx.lineWidth = grosor;
        ctx.strokeStyle = rgb(0.75);
        for (let k = 0; k < cantidad; k++) {
            const inicio = angulo * sentido + (k * Math.PI * 2) / cantidad;
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
        const largo = i % 10 === 0 ? 8 : 3;
        ctx.beginPath();
        ctx.moveTo(c + Math.cos(a) * r * 1.06, c + Math.sin(a) * r * 1.06);
        ctx.lineTo(c + Math.cos(a) * (r * 1.06 + largo), c + Math.sin(a) * (r * 1.06 + largo));
        ctx.stroke();
    }

    requestAnimationFrame(dibujar);
}
requestAnimationFrame(dibujar);
