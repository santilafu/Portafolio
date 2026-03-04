/**
 * app.js
 * ------
 * Lógica del frontend. Se encarga de:
 *  1. Pedir los datos a nuestra API REST (fetch)
 *  2. Construir el HTML dinámicamente con esos datos
 *  3. Gestionar las animaciones y efectos visuales
 *
 * No usamos ningún framework (ni React ni Vue): es JavaScript puro (Vanilla JS).
 * Esto es suficiente para una página como esta y ayuda a entender los fundamentos.
 *
 * Flujo general al cargar la página:
 *   renderTechStack()    → pinta los iconos de tecnologías (datos hardcodeados aquí)
 *   cargarPerfil()       → fetch /api/perfil  → rellena nombre, foto, email, etc.
 *   cargarProyectos()    → fetch /api/proyectos → pinta las tarjetas de proyectos
 *   cargarHabilidades()  → fetch /api/habilidades → pinta los badges de skills
 *   cargarExperiencia()  → fetch /api/experiencia → construye el timeline
 *   DOMContentLoaded     → inicia animaciones, navbar, copiar email, parallax
 */

// URL base de la API. Al estar en el mismo servidor, usamos ruta relativa.
// En producción podría ser 'https://midominio.com/api'
const API_URL = '/api';

// ============================================================
// TECH STACK — datos hardcodeados (no vienen de la BD)
// Aquí definimos qué iconos mostrar y sus estilos Tailwind.
// Separamos en dos grupos: uso frecuente y conocimientos básicos.
// ============================================================

/**
 * TECH_MAIN: tecnologías que uso con frecuencia.
 * Cada objeto tiene:
 *   nombre     → texto bajo el icono
 *   icono      → clase CSS del icono (devicon o font-awesome)
 *   color      → clases Tailwind para el degradado de fondo de la tarjeta
 *   border     → clase Tailwind para el borde de la tarjeta
 *   iconColor  → (opcional) color del icono si no es devicon colored
 */
const TECH_MAIN = [
    { nombre: 'Java',       icono: 'devicon-java-plain colored',       color: 'from-red-500/20 to-orange-500/20',  border: 'border-red-500/30' },
    { nombre: 'MySQL',      icono: 'devicon-mysql-plain colored',      color: 'from-blue-500/20 to-cyan-500/20',   border: 'border-blue-500/30' },
    { nombre: 'HTML5',      icono: 'devicon-html5-plain colored',      color: 'from-orange-500/20 to-red-500/20',  border: 'border-orange-500/30' },
    { nombre: 'CSS3',       icono: 'devicon-css3-plain colored',       color: 'from-blue-400/20 to-blue-600/20',   border: 'border-blue-400/30' },
    { nombre: 'Git',        icono: 'devicon-git-plain colored',        color: 'from-orange-600/20 to-red-600/20',  border: 'border-orange-600/30' },
    { nombre: 'IntelliJ',   icono: 'devicon-intellij-plain colored',   color: 'from-pink-500/20 to-blue-500/20',   border: 'border-pink-500/30' },
    { nombre: 'Claude',     icono: 'fa-solid fa-brain',                color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', iconColor: 'text-amber-400' },
    { nombre: 'Gemini',     icono: 'fa-solid fa-wand-magic-sparkles',  color: 'from-blue-400/20 to-cyan-400/20',   border: 'border-blue-400/30',  iconColor: 'text-blue-400' },
    { nombre: 'Copilot',    icono: 'fa-brands fa-github',              color: 'from-gray-300/20 to-gray-500/20',   border: 'border-gray-400/30',  iconColor: 'text-gray-300' },
];

/** TECH_OTHER: tecnologías con conocimiento básico. */
const TECH_OTHER = [
    { nombre: 'Kotlin',     icono: 'devicon-kotlin-plain colored',     color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' },
    { nombre: 'Python',     icono: 'devicon-python-plain colored',     color: 'from-yellow-500/20 to-blue-500/20',   border: 'border-yellow-500/30' },
    { nombre: 'JavaScript', icono: 'devicon-javascript-plain colored', color: 'from-yellow-400/20 to-yellow-600/20', border: 'border-yellow-400/30' },
    { nombre: 'Node.js',    icono: 'devicon-nodejs-plain colored',     color: 'from-green-500/20 to-green-700/20',   border: 'border-green-500/30' },
    { nombre: 'Spring',     icono: 'devicon-spring-plain colored',     color: 'from-green-400/20 to-green-600/20',   border: 'border-green-400/30' },
    { nombre: 'C#',         icono: 'devicon-csharp-plain colored',     color: 'from-purple-600/20 to-violet-600/20', border: 'border-purple-600/30' },
    { nombre: 'C++',        icono: 'devicon-cplusplus-plain colored',  color: 'from-blue-600/20 to-indigo-600/20',   border: 'border-blue-600/30' },
    { nombre: 'Unity',      icono: 'devicon-unity-plain',              color: 'from-gray-400/20 to-gray-600/20',     border: 'border-gray-400/30' },
    { nombre: 'Linux',      icono: 'devicon-linux-plain',              color: 'from-yellow-500/20 to-gray-500/20',   border: 'border-yellow-500/30' },
    { nombre: 'VS Code',    icono: 'devicon-vscode-plain colored',     color: 'from-blue-500/20 to-cyan-400/20',     border: 'border-blue-500/30' },
];

/**
 * SKILL_ICONS: mapeo de nombre de habilidad (en minúsculas) → clase de icono.
 * Se usa en cargarHabilidades() para asignar el icono correcto a cada skill
 * que viene de la base de datos.
 * Si no hay coincidencia, se usa 'fa-solid fa-code' como icono genérico.
 */
const SKILL_ICONS = {
    'java':       'devicon-java-plain colored',
    'mysql':      'devicon-mysql-plain colored',
    'kotlin':     'devicon-kotlin-plain colored',
    'python':     'devicon-python-plain colored',
    'javascript': 'devicon-javascript-plain colored',
    'node':       'devicon-nodejs-plain colored',
    'node.js':    'devicon-nodejs-plain colored',
    'html':       'devicon-html5-plain colored',
    'css':        'devicon-css3-plain colored',
    'git':        'devicon-git-plain colored',
    'spring':     'devicon-spring-plain colored',
    'c#':         'devicon-csharp-plain colored',
    'c++':        'devicon-cplusplus-plain colored',
    'unity':      'devicon-unity-plain',
    'linux':      'devicon-linux-plain',
};

// Array de clases de flotación para distribuirlas en ciclo entre los iconos
const FLOAT_CLASSES = ['float-1', 'float-2', 'float-3'];

// ============================================================
// TECH STACK — funciones de renderizado
// ============================================================

/**
 * renderTechStack()
 * Crea y añade al DOM todas las tarjetas del tech stack.
 * Mantiene un índice global (idx) para asignar la animación
 * de flotación de forma cíclica (float-1, float-2, float-3).
 */
function renderTechStack() {
    const mainContainer  = document.getElementById('tech-main');
    const otherContainer = document.getElementById('tech-other');
    let idx = 0; // índice global para las clases de flotación

    TECH_MAIN.forEach(tech => {
        // 'text-3xl md:text-4xl' → iconos más grandes en el grupo principal
        mainContainer.appendChild(crearTechCard(tech, 'text-3xl md:text-4xl', idx++));
    });
    TECH_OTHER.forEach(tech => {
        // 'text-2xl md:text-3xl' → iconos algo más pequeños en el grupo secundario
        otherContainer.appendChild(crearTechCard(tech, 'text-2xl md:text-3xl', idx++));
    });
}

/**
 * crearTechCard(tech, iconSize, index)
 * Construye y devuelve un elemento <div> con la tarjeta de un icono.
 *
 * @param {object} tech      - Objeto del array TECH_MAIN o TECH_OTHER
 * @param {string} iconSize  - Clases Tailwind para el tamaño del icono
 * @param {number} index     - Índice para asignar la clase de flotación
 * @returns {HTMLElement}    - El div creado (aún no está en el DOM)
 */
function crearTechCard(tech, iconSize, index) {
    // Asignamos una clase de flotación de forma cíclica: 0→float-1, 1→float-2, 2→float-3, 3→float-1...
    const floatClass = FLOAT_CLASSES[index % 3];

    // iconColor solo existe si el icono no es devicon colored (ej: Font Awesome)
    const colorClass = tech.iconColor || '';

    const card = document.createElement('div');
    // tech-enter: empieza invisible, se anima con la clase .show (IntersectionObserver)
    card.className = `skill-card tech-enter flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${tech.color} border ${tech.border} cursor-default`;
    card.dataset.index = index; // guardamos el índice como atributo data- (por si acaso)

    // innerHTML: construimos el contenido de la tarjeta
    card.innerHTML = `
        <div class="${floatClass}">
            <i class="${tech.icono} ${iconSize} ${colorClass}"></i>
        </div>
        <span class="text-xs font-medium text-gray-300">${tech.nombre}</span>
    `;
    return card;
}

/**
 * animarTechEntrada()
 * Usa IntersectionObserver para detectar cuándo la sección tech stack
 * es visible en pantalla y lanza la animación escalonada de los iconos.
 *
 * IntersectionObserver es más eficiente que escuchar el evento scroll
 * porque el navegador lo gestiona internamente sin bloquear el hilo principal.
 *
 * threshold: 0.2 → se dispara cuando el 20% de la sección es visible.
 */
function animarTechEntrada() {
    const cards = document.querySelectorAll('.tech-enter');

    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Añadimos la clase .show a cada tarjeta con un retardo incremental (70ms cada una)
                // Esto crea el efecto de aparición en cascada (primero la 1ª, luego la 2ª...)
                cards.forEach((card, i) => {
                    setTimeout(() => {
                        card.classList.add('show');
                    }, i * 70);
                });
                // Dejamos de observar una vez que se ha disparado (no necesitamos repetirlo)
                techObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const section = document.querySelector('.parallax-container');
    if (section) techObserver.observe(section);
}

/**
 * iniciarParallax()
 * Efecto 3D: al mover el ratón sobre el contenedor del tech stack,
 * el layer interior rota levemente en X e Y según la posición del cursor.
 *
 * Cómo funciona el cálculo:
 *   - Obtenemos la posición del ratón relativa al contenedor (rect)
 *   - La normalizamos a un rango [-0.5, 0.5]
 *   - Multiplicamos por 6 para limitar la rotación a ±6 grados
 *   - rotateY depende del eje X del ratón, rotateX del eje Y (invertido)
 */
function iniciarParallax() {
    const container = document.getElementById('tech-parallax');
    if (!container) return;
    const layer = container.querySelector('.parallax-layer');

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left)  / rect.width  - 0.5; // -0.5 a 0.5
        const y = (e.clientY - rect.top)   / rect.height - 0.5;
        layer.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });

    // Al salir del contenedor, volvemos a la posición neutra
    container.addEventListener('mouseleave', () => {
        layer.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
}

// ============================================================
// PERFIL
// ============================================================

/**
 * cargarPerfil()
 * Pide los datos del perfil a la API y los inyecta en el DOM.
 * Usamos async/await para que el código sea más legible que con .then()/.catch().
 * fetch() devuelve una Promise, await la "espera" sin bloquear el hilo principal.
 */
async function cargarPerfil() {
    try {
        // fetch hace una petición HTTP GET a /api/perfil
        const respuesta = await fetch(`${API_URL}/perfil`);
        // .json() convierte el texto JSON de la respuesta a un array de objetos JS
        const perfiles = await respuesta.json();

        if (perfiles.length > 0) {
            const p = perfiles[0]; // tomamos el primer (y único) perfil

            document.getElementById('nombre').textContent   = p.nombre;
            document.getElementById('sobre_mi').textContent = p.sobre_mi;

            // El titular no se pone directamente: pasamos por el efecto typing
            iniciarTyping(p.titular);

            // Foto: si hay nombre de archivo en la BD, construimos la ruta
            if (p.foto_perfil) {
                const img = document.getElementById('foto_perfil');
                let ruta = p.foto_perfil;
                // Si no empieza por http ni por /, asumimos que es solo el nombre del archivo
                if (!ruta.startsWith('http') && !ruta.startsWith('/')) {
                    ruta = '/img/' + ruta;
                }
                img.src = ruta;
            }

            // Iconos de contacto en el hero y en el footer
            document.getElementById('enlaces').innerHTML = buildEnlaces(p, 'text-gray-400 hover:text-white');

            const footerEnlaces = document.getElementById('footer-enlaces');
            if (footerEnlaces) footerEnlaces.innerHTML = buildEnlacesFooter(p);

            // Email en la sección de contacto
            const emailText = document.getElementById('email-text');
            if (emailText && p.email) emailText.textContent = p.email;
        }
    } catch (error) {
        // Si el fetch falla (sin conexión, servidor caído...) lo logueamos
        console.error('Error al cargar perfil:', error);
    }
}

/**
 * buildEnlaces(p, classes)
 * Construye los iconos de enlace (email, GitHub, LinkedIn) para el hero.
 * Usamos template literals (`) para crear el HTML como string.
 * El operador ternario (condición ? 'si' : '') evita renderizar si no hay dato.
 *
 * @param {object} p       - Objeto perfil con los datos de la BD
 * @param {string} classes - Clases CSS para el color de los iconos
 * @returns {string}       - HTML como string
 */
function buildEnlaces(p, classes) {
    return `
        ${p.email          ? `<a href="mailto:${p.email}" title="Email" class="${classes} transition-colors"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${p.enlace_github  ? `<a href="${p.enlace_github}" target="_blank" title="GitHub" class="${classes} transition-colors"><i class="fa-brands fa-github"></i></a>` : ''}
        ${p.enlace_linkedin ? `<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" title="LinkedIn" class="${classes} transition-colors"><i class="fa-brands fa-linkedin"></i></a>` : ''}
    `;
}

/**
 * buildEnlacesFooter(p)
 * Versión extendida de los enlaces para la sección de contacto.
 * Cada enlace tiene icono grande + etiqueta de texto debajo.
 * Usamos un array + .join('') en lugar de concatenar strings para mayor claridad.
 */
function buildEnlacesFooter(p) {
    const items = [];
    if (p.email)
        items.push(`<a href="mailto:${p.email}" class="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-400 transition-all duration-300 hover:-translate-y-1"><i class="fa-solid fa-envelope text-2xl"></i><span class="text-xs">Email</span></a>`);
    if (p.enlace_github)
        items.push(`<a href="${p.enlace_github}" target="_blank" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-1"><i class="fa-brands fa-github text-2xl"></i><span class="text-xs">GitHub</span></a>`);
    if (p.enlace_linkedin)
        items.push(`<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" class="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-all duration-300 hover:-translate-y-1"><i class="fa-brands fa-linkedin text-2xl"></i><span class="text-xs">LinkedIn</span></a>`);
    return items.join('');
}

/**
 * fixUrl(url)
 * Añade 'https://' si la URL no tiene protocolo.
 * Necesario porque en la BD la URL de LinkedIn está guardada sin https://.
 *
 * @param {string} url - URL potencialmente sin protocolo
 * @returns {string}   - URL con https://
 */
function fixUrl(url) {
    return url.startsWith('http') ? url : 'https://' + url;
}

// ============================================================
// COPIAR EMAIL
// ============================================================

/**
 * iniciarCopiarEmail()
 * Añade el evento click al botón de copiar email.
 * Intenta usar la API moderna navigator.clipboard.writeText().
 * Si el navegador no la soporta (o no hay HTTPS), usa el método antiguo
 * con textarea + document.execCommand('copy') como fallback.
 */
function iniciarCopiarEmail() {
    const btn      = document.getElementById('btn-copiar-email');
    const feedback = document.getElementById('copy-feedback');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const email = document.getElementById('email-text').textContent;
        if (!email || email === 'cargando...') return; // aún no ha cargado

        try {
            // Método moderno: Clipboard API (requiere HTTPS o localhost)
            await navigator.clipboard.writeText(email);
        } catch {
            // Fallback para navegadores sin soporte o sin HTTPS
            const ta = document.createElement('textarea');
            ta.value = email;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy'); // método antiguo, aún funciona
            document.body.removeChild(ta);
        }

        // Feedback visual: icono de check y mensaje durante 2 segundos
        feedback.classList.remove('hidden');
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
            feedback.classList.add('hidden');
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
    });
}

// ============================================================
// EFECTO TYPING
// ============================================================

/**
 * iniciarTyping(texto)
 * Simula el efecto de máquina de escribir en el titular.
 * Usa setInterval para añadir una letra cada 60ms.
 * Al terminar, elimina el cursor parpadeante tras 2 segundos.
 *
 * @param {string} texto - El texto a escribir letra a letra
 */
function iniciarTyping(texto) {
    const el = document.getElementById('titular');
    el.textContent = ''; // vaciamos el contenido inicial
    el.classList.add('typing-cursor'); // activamos el cursor parpadeante (CSS)
    let i = 0;

    const interval = setInterval(() => {
        el.textContent += texto.charAt(i); // añadimos la letra en posición i
        i++;
        if (i >= texto.length) {
            clearInterval(interval); // paramos cuando hemos escrito todo
            // Quitamos el cursor 2 segundos después de terminar
            setTimeout(() => el.classList.remove('typing-cursor'), 2000);
        }
    }, 60); // 60ms entre letra y letra → velocidad de escritura
}

// ============================================================
// PROYECTOS
// ============================================================

/**
 * cargarProyectos()
 * Pide los proyectos a la API y construye las tarjetas dinámicamente.
 * Cada tarjeta tiene título, descripción y enlaces a repo/demo (si existen).
 * Usa transitionDelay escalonado para que las tarjetas aparezcan una a una.
 */
async function cargarProyectos() {
    try {
        const respuesta = await fetch(`${API_URL}/proyectos`);
        const proyectos = await respuesta.json();
        const contenedor = document.getElementById('lista-proyectos');
        contenedor.innerHTML = ''; // eliminamos el spinner inicial

        if (proyectos.length > 0) {
            proyectos.forEach((proyecto, idx) => {
                const tarjeta = document.createElement('div');
                // fade-up: se animará con el IntersectionObserver
                tarjeta.className = 'card-hover bg-slate-900/80 border border-slate-800 p-6 rounded-2xl group fade-up';
                // Retraso escalonado: 1ª tarjeta 0s, 2ª 0.1s, 3ª 0.2s...
                tarjeta.style.transitionDelay = `${idx * 0.1}s`;

                tarjeta.innerHTML = `
                    <div class="flex items-center gap-2 text-purple-400 mb-4">
                        <i class="fa-solid fa-folder-open"></i>
                        <span class="text-xs uppercase tracking-wider font-semibold">Proyecto</span>
                    </div>
                    <h4 class="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">${proyecto.titulo}</h4>
                    <p class="text-gray-400 leading-relaxed mb-5 text-sm">${proyecto.descripcion}</p>
                    <div class="flex gap-4 text-sm font-semibold">
                        ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" class="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"><i class="fa-brands fa-github"></i> Codigo</a>` : ''}
                        ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" class="inline-flex items-center gap-1.5 text-pink-400 hover:text-pink-300 transition-colors"><i class="fa-solid fa-arrow-up-right-from-square"></i> Demo</a>` : ''}
                    </div>
                `;
                contenedor.appendChild(tarjeta);
            });

            // Las nuevas tarjetas .fade-up necesitan ser registradas en el observer
            setTimeout(reobservarAnimaciones, 100);
        } else {
            contenedor.innerHTML = '<p class="text-gray-500 italic col-span-2 text-center py-10">Aun no hay proyectos para mostrar.</p>';
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
    }
}

// ============================================================
// HABILIDADES
// ============================================================

/**
 * cargarHabilidades()
 * Pide las habilidades a la API y las muestra como badges (pastillas).
 * Para cada habilidad busca su icono en SKILL_ICONS usando el nombre en minúsculas.
 * El color del badge depende del nivel: verde=Avanzado, amarillo=Intermedio, azul=Básico.
 */
async function cargarHabilidades() {
    try {
        const respuesta   = await fetch(`${API_URL}/habilidades`);
        const habilidades = await respuesta.json();
        const contenedor  = document.getElementById('lista-habilidades');
        contenedor.innerHTML = '';

        if (habilidades.length > 0) {
            habilidades.forEach(hab => {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-default group';

                // Buscamos el icono en el mapa usando el nombre en minúsculas
                const key       = hab.nombre.toLowerCase();
                const iconClass = SKILL_ICONS[key] || 'fa-solid fa-code'; // fallback genérico
                const nivel     = hab.nivel || '';

                // Color del badge según el nivel de dominio
                const nivelColor = nivel.toLowerCase() === 'avanzado'
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : nivel.toLowerCase() === 'intermedio'
                        ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/30'; // básico o sin nivel

                badge.innerHTML = `
                    <i class="${iconClass} text-2xl group-hover:scale-110 transition-transform"></i>
                    <div class="flex flex-col">
                        <span class="text-sm font-semibold text-white">${hab.nombre}</span>
                        ${nivel ? `<span class="text-xs ${nivelColor} px-2 py-0.5 rounded-full border w-fit mt-0.5">${nivel}</span>` : ''}
                    </div>
                `;
                contenedor.appendChild(badge);
            });
        } else {
            contenedor.innerHTML = '<p class="text-gray-500 italic text-center w-full py-6">Aun no hay habilidades registradas.</p>';
        }
    } catch (error) {
        console.error('Error al cargar habilidades:', error);
    }
}

// ============================================================
// EXPERIENCIA
// ============================================================

/**
 * cargarExperiencia()
 * Pide la experiencia a la API y construye un timeline vertical.
 * Pasos:
 *   1. Fetch a /api/experiencia
 *   2. Deduplicar (por si hay registros repetidos en la BD)
 *   3. Añadir una entrada hardcodeada de "Proyectos Personales"
 *   4. Construir el HTML del timeline con línea y puntos
 */
async function cargarExperiencia() {
    try {
        const respuesta = await fetch(`${API_URL}/experiencia`);
        let experiencias = await respuesta.json();
        const contenedor = document.getElementById('lista-experiencia');
        contenedor.innerHTML = '';

        // ── Deduplicar ───────────────────────────────────────────
        // Usamos un Set para llevar registro de las claves ya vistas.
        // La clave es la combinación empresa+puesto+fecha para identificar duplicados.
        const vistos = new Set();
        experiencias = experiencias.filter(exp => {
            const clave = `${exp.empresa}-${exp.puesto}-${exp.fecha_inicio}`;
            if (vistos.has(clave)) return false; // ya visto: lo descartamos
            vistos.add(clave);
            return true;
        });

        // ── Entrada extra hardcodeada ─────────────────────────────
        // Añadimos manualmente la entrada de proyectos personales.
        // enlace_github indica que es un proyecto personal (usado luego para renderizar)
        experiencias.push({
            puesto: 'Desarrollador de Proyectos Personales',
            empresa: 'GitHub - santilafu',
            fecha_inicio: '2024-01-01',
            fecha_fin: null,
            descripcion: 'Desarrollo continuo de proyectos propios para reforzar conocimientos: APIs REST con Node.js y Express, aplicaciones Java con JDBC y Spring, apps moviles con Kotlin, y este mismo portafolio full-stack.',
            enlace_github: 'https://github.com/santilafu'
        });

        // ── Construcción del timeline ─────────────────────────────
        // El timeline es un div relativo con la línea vertical absoluta
        // y los items de experiencia como hijos con un punto en la izquierda.
        const timeline = document.createElement('div');
        timeline.className = 'relative pl-8 space-y-8';

        // Línea vertical degradada (CSS: .timeline-line)
        const linea = document.createElement('div');
        linea.className = 'timeline-line absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full';
        timeline.appendChild(linea);

        experiencias.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'relative';

            const fechaFin    = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'Actualidad';
            const fechaInicio = formatearFecha(exp.fecha_inicio);
            const esActual    = !exp.fecha_fin;       // sin fecha fin → trabajo actual
            const esPersonal  = !!exp.enlace_github;  // tiene enlace_github → side project

            item.innerHTML = `
                <!-- Punto de la timeline: posicionado absolutamente a la izquierda -->
                <div class="timeline-dot absolute -left-5 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950"></div>
                <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-300">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h4 class="text-lg font-bold text-white">${exp.puesto}</h4>
                        <div class="flex items-center gap-2 flex-wrap">
                            <!-- Badge verde "Actual" si no tiene fecha de fin -->
                            ${esActual   ? '<span class="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full">Actual</span>' : ''}
                            <!-- Badge azul "Side projects" si es un proyecto personal -->
                            ${esPersonal ? '<span class="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full"><i class="fa-solid fa-code mr-1"></i>Side projects</span>' : ''}
                            <span class="text-xs font-medium text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">${fechaInicio} - ${fechaFin}</span>
                        </div>
                    </div>
                    <p class="text-sm font-semibold text-blue-400 mb-2">
                        <!-- Si es personal, el nombre de empresa es un enlace a GitHub -->
                        ${esPersonal
                            ? `<a href="${exp.enlace_github}" target="_blank" class="hover:text-blue-300 transition-colors"><i class="fa-brands fa-github mr-1"></i>${exp.empresa}</a>`
                            : `<i class="fa-solid fa-building mr-1"></i>${exp.empresa}`
                        }
                    </p>
                    ${exp.descripcion ? `<p class="text-gray-400 text-sm leading-relaxed">${exp.descripcion}</p>` : ''}
                </div>
            `;
            timeline.appendChild(item);
        });

        contenedor.appendChild(timeline);
    } catch (error) {
        console.error('Error al cargar experiencia:', error);
    }
}

/**
 * formatearFecha(fechaStr)
 * Convierte una fecha ISO ('2024-10-20') a formato legible ('Oct 2024').
 *
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string}        - Fecha formateada ('Mes YYYY')
 */
function formatearFecha(fechaStr) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fecha = new Date(fechaStr);
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// ============================================================
// ANIMACIONES FADE-UP (IntersectionObserver)
// ============================================================

// Variable global para el observer (necesitamos acceso en reobservarAnimaciones)
let observer;

/**
 * iniciarAnimaciones()
 * Registra un IntersectionObserver que añade la clase .visible a cada
 * elemento .fade-up cuando entra en el viewport.
 *
 * threshold: 0.1  → se activa cuando el 10% del elemento es visible
 * rootMargin      → reduce el área de detección 60px desde abajo
 *                   (las secciones se animan un poco antes de llegar a ellas)
 */
function iniciarAnimaciones() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible'); // activa la transición CSS
                observer.unobserve(entry.target);      // una vez animado, dejamos de observarlo
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    // Registramos todos los elementos que deben animarse al entrar en pantalla
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

/**
 * reobservarAnimaciones()
 * Los elementos .fade-up creados dinámicamente (tarjetas de proyectos)
 * no existían cuando iniciarAnimaciones() los buscó.
 * Esta función los registra en el observer ya existente.
 * Solo registra los que aún no tienen la clase .visible.
 */
function reobservarAnimaciones() {
    if (!observer) return;
    document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el));
}

// ============================================================
// NAVBAR
// ============================================================

/**
 * iniciarNavbar()
 * Dos comportamientos:
 *   1. Scroll: añade/quita la clase .nav-scrolled según si el usuario
 *      ha bajado más de 50px (fondo semitransparente + blur)
 *   2. Menú móvil: el botón hamburguesa alterna la clase .hidden del menú.
 *      Al hacer clic en cualquier enlace del menú, este se cierra.
 */
function iniciarNavbar() {
    const navbar = document.getElementById('navbar');

    // classList.toggle(clase, condición) → añade si true, quita si false
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('nav-scrolled', window.scrollY > 50);
    });

    const toggle = document.getElementById('menu-toggle');
    const menu   = document.getElementById('mobile-menu');

    toggle.addEventListener('click', () => menu.classList.toggle('hidden'));

    // Cerramos el menú al hacer clic en cualquier enlace
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

// ============================================================
// VISITAS
// ============================================================

/**
 * registrarVisita()
 * Llama a /api/visitas para incrementar el contador y muestra
 * el total de forma muy discreta en el footer.
 */
async function registrarVisita() {
    try {
        const res = await fetch(`${API_URL}/visitas`);
        const { total } = await res.json();
        const el = document.getElementById('visitas-counter');
        if (el) el.textContent = `${total} visitas`;
    } catch {
        // Si falla, simplemente no mostramos nada
    }
}

// Estas llamadas se ejecutan inmediatamente al cargar el script.
// No esperan a DOMContentLoaded porque hacen fetch (asíncrono) y
// solo modifican elementos que ya existen en el HTML inicial.
renderTechStack();
cargarPerfil();
cargarProyectos();
cargarHabilidades();
cargarExperiencia();
registrarVisita();

/**
 * DOMContentLoaded: se dispara cuando el HTML está completamente cargado
 * y parseado (sin esperar imágenes ni CSS externos).
 * Aquí iniciamos las funciones que necesitan que el DOM esté listo.
 */
document.addEventListener('DOMContentLoaded', () => {
    iniciarAnimaciones();  // registra el observer para los fade-up
    iniciarNavbar();       // scroll y menú hamburguesa
    iniciarCopiarEmail();  // botón copiar en la sección contacto
    animarTechEntrada();   // observer para la entrada escalonada de iconos
    iniciarParallax();     // efecto 3D con el ratón en el tech stack
});