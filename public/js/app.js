/**
 * app.js — v2
 * -----------
 * Lógica completa del frontend.
 *
 * Funciones nuevas en v2:
 *   iniciarScrollProgress()  → barra de progreso de lectura
 *   iniciarCursor()          → cursor personalizado con glow
 *   mostrarToastBienvenida() → toast primera visita (localStorage)
 *   iniciarActiveNav()       → resalta el link de la sección visible
 *   cargarGithubStats()      → stats en tiempo real desde la API de GitHub
 *   iniciarFormContacto()    → formulario que envía email via /api/contacto
 *   iniciarThemeToggle()     → toggle modo claro / oscuro (localStorage)
 *   registrarVisita()        → contador de visitas en Aiven
 */

const API_URL = '/api';

// ============================================================
// TECH STACK
// ============================================================

const SKILL_ICONS = {
    'java': 'devicon-java-plain colored', 'mysql': 'devicon-mysql-plain colored',
    'kotlin': 'devicon-kotlin-plain colored', 'python': 'devicon-python-plain colored',
    'javascript': 'devicon-javascript-plain colored', 'node': 'devicon-nodejs-plain colored',
    'node.js': 'devicon-nodejs-plain colored', 'html': 'devicon-html5-plain colored',
    'css': 'devicon-css3-plain colored', 'git': 'devicon-git-plain colored',
    'spring': 'devicon-spring-plain colored', 'c#': 'devicon-csharp-plain colored',
    'c++': 'devicon-cplusplus-plain colored', 'unity': 'devicon-unity-plain',
    'linux': 'devicon-linux-plain',
};

const FLOAT_CLASSES = ['float-1', 'float-2', 'float-3'];

// Carga el tech stack desde la API y renderiza las tarjetas.
// Los datos ya no están hardcodeados — vienen de la tabla tech_stack en Aiven.
async function renderTechStack() {
    const mainContainer  = document.getElementById('tech-main');
    const otherContainer = document.getElementById('tech-other');

    try {
        const r    = await fetch(`${API_URL}/tech-stack`);
        const list = await r.json();

        const main  = list.filter(t => t.grupo === 'main');
        const other = list.filter(t => t.grupo === 'other');

        let idx = 0;
        main.forEach(tech  => mainContainer.appendChild(crearTechCard(tech, 'text-3xl md:text-4xl', idx++)));
        other.forEach(tech => otherContainer.appendChild(crearTechCard(tech, 'text-2xl md:text-3xl', idx++)));

        // Las tarjetas se añaden al DOM después del fetch (async),
        // así que lanzamos la animación aquí, no al inicio del script.
        animarTechEntrada();
    } catch (e) {
        console.warn('No se pudo cargar el tech stack desde la API', e);
    }
}

function crearTechCard(tech, iconSize, index) {
    const floatClass = FLOAT_CLASSES[index % 3];
    // La API devuelve icon_color (snake_case); el campo antiguo hardcodeado era iconColor (camelCase)
    const colorClass = tech.icon_color || tech.iconColor || '';
    const card = document.createElement('div');
    // Caja ámbar uniforme: fondo surface + borde --line en lugar de gradientes por tecnología.
    // cursor-default y rounded-xl se aplican vía Tailwind antes de los estilos inline.
    card.className = 'tech-enter flex flex-col items-center justify-center gap-2 p-4 border rounded skill-card';
    card.style.borderColor = 'var(--line)';
    card.style.background  = 'var(--surface)';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="${floatClass}"><i class="${tech.icono} ${iconSize} ${colorClass}"></i></div>
        <span class="text-xs font-medium" style="color: var(--fg)">${tech.nombre}</span>
    `;
    return card;
}

function animarTechEntrada() {
    const cards = document.querySelectorAll('.tech-enter');
    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                cards.forEach((card, i) => setTimeout(() => card.classList.add('show'), i * 70));
                techObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    const section = document.querySelector('.parallax-container');
    if (section) techObserver.observe(section);
}

function iniciarParallax() {
    const container = document.getElementById('tech-parallax');
    if (!container) return;
    const layer = container.querySelector('.parallax-layer');
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width  - 0.5;
        const y = (e.clientY - rect.top)  / rect.height - 0.5;
        layer.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    container.addEventListener('mouseleave', () => {
        layer.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
}

// ============================================================
// SCROLL PROGRESS BAR
// Calcula qué porcentaje de la página se ha scrolleado y
// actualiza el ancho de la barra superior.
// ============================================================

function iniciarScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        // scrollTop: píxeles scrolleados. scrollHeight - clientHeight: máximo posible.
        const total   = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const current = document.documentElement.scrollTop || document.body.scrollTop;
        bar.style.width = `${(current / total) * 100}%`;
    }, { passive: true }); // passive: true mejora el rendimiento del scroll
}

// ============================================================
// CURSOR PERSONALIZADO
// Seguimos la posición del ratón con dos elementos: un punto
// pequeño (inmediato) y un anillo más grande (con transición CSS).
// Al pasar por encima de elementos interactivos, cambia de tamaño.
// Solo funciona en dispositivos con ratón (pointer: fine).
// ============================================================

function iniciarCursor() {
    // En móvil/táctil no tiene sentido mostrar cursor personalizado
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot  = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');

    // Actualizamos la posición del cursor en cada movimiento de ratón
    document.addEventListener('mousemove', (e) => {
        dot.style.left  = ring.style.left  = `${e.clientX}px`;
        dot.style.top   = ring.style.top   = `${e.clientY}px`;
    });

    // Al pasar por encima de elementos interactivos, el cursor se expande
    document.querySelectorAll('a, button, [role="button"], input, textarea').forEach(el => {
        el.addEventListener('mouseenter', () => {
            dot.classList.add('cursor-hover');
            ring.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            dot.classList.remove('cursor-hover');
            ring.classList.remove('cursor-hover');
        });
    });
}

// ============================================================
// TOAST DE BIENVENIDA
// Usamos localStorage para recordar si el usuario ya visitó
// la página. Si no, mostramos el toast y guardamos la visita.
// ============================================================

function mostrarToastBienvenida() {
    if (localStorage.getItem('visited')) return; // ya visitó antes

    const toast = document.getElementById('toast');
    // Pequeño delay para que la página cargue antes de mostrar el toast
    setTimeout(() => {
        toast.classList.add('show');
        // Se cierra automáticamente a los 4 segundos
        setTimeout(() => cerrarToast(), 4000);
    }, 1200);

    localStorage.setItem('visited', 'true');
}

// Función global para cerrar el toast (también la llama el botón ×)
function cerrarToast() {
    document.getElementById('toast').classList.remove('show');
}

// ============================================================
// ACTIVE NAV — sección activa en la navbar
// Usamos IntersectionObserver para detectar qué sección es
// visible y resaltar el link correspondiente en la navbar.
// ============================================================

function iniciarActiveNav() {
    const navLinks  = document.querySelectorAll('.nav-link[data-section]');
    const secciones = document.querySelectorAll('section[id], header[id]');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Quitamos .active de todos los links
                navLinks.forEach(l => l.classList.remove('active'));
                // Añadimos .active solo al link de la sección visible
                const link = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
                if (link) link.classList.add('active');
            }
        });
    }, {
        threshold: 0.4,       // sección activa cuando el 40% es visible
        rootMargin: '-80px 0px -40% 0px' // compensamos la navbar fija
    });

    secciones.forEach(sec => navObserver.observe(sec));
}

// ============================================================
// GITHUB STATS
// Usamos la API pública de GitHub (sin auth, límite 60 req/h).
// Mostramos: repos, seguidores, top lenguaje del repo con más stars.
// ============================================================

async function cargarGithubStats() {
    const contenedor = document.getElementById('github-stats');
    try {
        // Petición paralela: datos del usuario y lista de repos
        const [userRes, reposRes] = await Promise.all([
            fetch('https://api.github.com/users/santilafu'),
            fetch('https://api.github.com/users/santilafu/repos?sort=updated&per_page=100')
        ]);
        const user  = await userRes.json();
        const repos = await reposRes.json();

        // Contamos cuántos repos tienen cada lenguaje
        const langs = {};
        repos.forEach(r => {
            if (r.language) langs[r.language] = (langs[r.language] || 0) + 1;
        });
        // Lenguaje más repetido
        const topLang = Object.entries(langs).sort((a, b) => b[1] - a[1])[0];

        // Prefijo de prompt y ítems con tokens CSS del tema terminal ámbar.
        // Los valores numéricos usan .accent-text para el brillo característico.
        contenedor.innerHTML = `
            <span style="color: var(--muted)">$ git stats</span>
            <a href="https://github.com/santilafu" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors"
               style="background: var(--surface); border: 1px solid var(--line);">
                <i class="fa-brands fa-github accent-text"></i>
                <span class="accent-text font-semibold">${user.public_repos}</span>
                <span style="color: var(--muted)">repos publicos</span>
            </a>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                 style="background: var(--surface); border: 1px solid var(--line);">
                <i class="fa-solid fa-users" style="color: var(--accent)"></i>
                <span class="accent-text font-semibold">${user.followers}</span>
                <span style="color: var(--muted)">seguidores</span>
            </div>
            ${topLang ? `
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                 style="background: var(--surface); border: 1px solid var(--line);">
                <i class="fa-solid fa-code" style="color: var(--accent)"></i>
                <span class="accent-text font-semibold">${topLang[0]}</span>
                <span style="color: var(--muted)">lenguaje top</span>
            </div>` : ''}
        `;
    } catch {
        contenedor.innerHTML = ''; // si falla la API de GitHub, ocultamos la sección
    }
}

// ============================================================
// TEMA CLARO / OSCURO
// Guardamos la preferencia en localStorage.
// Aplicamos el tema con un atributo data-theme en el <html>.
// ============================================================

function iniciarThemeToggle() {
    const html    = document.documentElement;
    const toggles = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

    // Recuperamos el tema guardado (por defecto: dark)
    const temaGuardado = localStorage.getItem('theme') || 'dark';
    aplicarTema(temaGuardado);

    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const actual = html.dataset.theme === 'light' ? 'light' : 'dark';
            const nuevo  = actual === 'dark' ? 'light' : 'dark';
            aplicarTema(nuevo);
            localStorage.setItem('theme', nuevo);
        });
    });
}

function aplicarTema(tema) {
    const html    = document.documentElement;
    const iconos  = document.querySelectorAll('#theme-toggle i, #theme-toggle-mobile i');
    html.dataset.theme = tema;
    iconos.forEach(i => {
        i.className = tema === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    });
}

// ============================================================
// PERFIL
// ============================================================

async function cargarPerfil() {
    try {
        const respuesta = await fetch(`${API_URL}/perfil`);
        const perfiles  = await respuesta.json();
        if (perfiles.length > 0) {
            const p = perfiles[0];
            document.getElementById('nombre').textContent   = p.nombre;
            document.getElementById('sobre_mi').textContent = p.sobre_mi;
            document.getElementById('titular').textContent  = p.titular;
            // iniciarBootHero rellena la ventana de terminal con los datos del perfil
            iniciarBootHero(p);

            if (p.foto_perfil) {
                const img  = document.getElementById('foto_perfil');
                let ruta   = p.foto_perfil;
                if (!ruta.startsWith('http') && !ruta.startsWith('/')) ruta = '/img/' + ruta;
                img.src = ruta;
            }

            document.getElementById('enlaces').innerHTML = buildEnlaces(p, 'text-gray-400 hover:text-white');
            const footerEnlaces = document.getElementById('footer-enlaces');
            if (footerEnlaces) footerEnlaces.innerHTML = buildEnlacesFooter(p);
            const emailText = document.getElementById('email-text');
            if (emailText && p.email) emailText.textContent = p.email;
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

function buildEnlaces(p, classes) {
    return `
        ${p.email          ? `<a href="mailto:${p.email}" title="Email" class="${classes} transition-colors"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${p.enlace_github  ? `<a href="${p.enlace_github}" target="_blank" rel="noopener noreferrer" title="GitHub" class="${classes} transition-colors"><i class="fa-brands fa-github"></i></a>` : ''}
        ${p.enlace_linkedin ? `<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" rel="noopener noreferrer" title="LinkedIn" class="${classes} transition-colors"><i class="fa-brands fa-linkedin"></i></a>` : ''}
    `;
}

function buildEnlacesFooter(p) {
    // Estilo terminal ámbar: icono con .accent-text, etiqueta en --muted
    const base = 'flex flex-col items-center gap-2 accent-text transition-all duration-300 hover:-translate-y-1';
    const items = [];
    if (p.email)
        items.push(`<a href="mailto:${p.email}" class="${base}"><i class="fa-solid fa-envelope text-2xl"></i><span class="text-xs" style="color: var(--muted)">Email</span></a>`);
    if (p.enlace_github)
        items.push(`<a href="${p.enlace_github}" target="_blank" rel="noopener noreferrer" class="${base}"><i class="fa-brands fa-github text-2xl"></i><span class="text-xs" style="color: var(--muted)">GitHub</span></a>`);
    if (p.enlace_linkedin)
        items.push(`<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" rel="noopener noreferrer" class="${base}"><i class="fa-brands fa-linkedin text-2xl"></i><span class="text-xs" style="color: var(--muted)">LinkedIn</span></a>`);
    return items.join('');
}

function fixUrl(url) {
    return url.startsWith('http') ? url : 'https://' + url;
}

// ============================================================
// COPIAR EMAIL
// ============================================================

function iniciarCopiarEmail() {
    const btn      = document.getElementById('btn-copiar-email');
    const feedback = document.getElementById('copy-feedback');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        const email = document.getElementById('email-text').textContent;
        if (!email || email === 'cargando...') return;
        try {
            await navigator.clipboard.writeText(email);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = email;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        feedback.classList.remove('hidden');
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => {
            feedback.classList.add('hidden');
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        }, 2000);
    });
}

// iniciarTyping eliminada: ya no se usa desde que el hero
// es una secuencia de boot (iniciarBootHero). El efecto de
// typing-cursor también se ha eliminado del CSS.

// ============================================================
// HERO TERMINAL: secuencia de boot tecleada caracter a caracter
// ============================================================
// Timer del tecleo: lo guardamos a nivel de modulo para poder cancelar
// una animacion en curso si iniciarBootHero se llamara dos veces (evita
// que dos cadenas de tecleo escriban a la vez en #term-typed).
let _bootTimer = null;

// Escapa texto para interpolarlo en innerHTML de forma segura.
function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function iniciarBootHero(perfil) {
    const typed = document.getElementById('term-typed');
    if (!typed) return;
    if (_bootTimer) { clearTimeout(_bootTimer); _bootTimer = null; } // cancela un tecleo previo
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nombre  = perfil.nombre  || 'Santiago Lafuente';
    const titular = perfil.titular || 'Desarrollador Multiplataforma';
    const bio     = perfil.sobre_mi || '';

    // Secuencia de lineas que se teclean en orden.
    const seq = [
        { text: '> initializing portfolio... [OK]', cls: 'boot-ok' },
        { text: '> loading profile.............. [OK]', cls: 'boot-ok' },
        { text: '$ whoami', cls: 'cmd' },
        { text: nombre, cls: 'name' },
        { text: 'Titulado en DAM (9.0) - ' + titular, cls: 'dim' },
        { text: '$ cat about.txt', cls: 'cmd' },
        { text: bio, cls: 'fg' },
        { text: '$ status', cls: 'cmd' },
    ];

    // Bloque final estatico (badge de estado + CTAs + prompt final).
    const finalStatic = `
        <div class="mt-1 flex items-center gap-2" style="color: var(--ok)">
            <span class="inline-block w-2 h-2 rounded-full" style="background: var(--ok); box-shadow: 0 0 8px var(--ok)"></span>
            available for hire - busco empleo activamente
        </div>
        <div class="mt-4 flex flex-wrap gap-3 items-center">
            <a href="/cv/cv-santiago-lafuente.pdf" download class="btn-contact px-4 py-2 border rounded accent-text" style="border-color: var(--accent)">[ descargar CV ]</a>
            <a href="#contacto" class="btn-contact px-4 py-2 border rounded accent-text" style="border-color: var(--accent)">[ ./contact.sh ]</a>
        </div>
        <div class="mt-3"><span class="accent-text">$</span> <span class="term-caret">&nbsp;</span></div>`;

    // Estilo inline segun tipo de linea.
    function styleFor(cls) {
        if (cls === 'boot-ok') return 'color: var(--ok)';
        if (cls === 'cmd')     return 'color: var(--accent)';
        if (cls === 'dim')     return 'color: var(--muted)';
        if (cls === 'fg')      return 'color: var(--fg)';
        return '';
    }
    function claseLinea(cls) {
        if (cls === 'name')    return 'glow accent-text text-2xl md:text-3xl font-bold mt-1';
        if (cls === 'cmd')     return 'mt-4';
        if (cls === 'boot-ok') return '';
        return 'mt-1';
    }

    // Sin animacion: se pinta todo de golpe (accesibilidad).
    if (reduce) {
        typed.innerHTML = seq.map(l =>
            `<div class="${claseLinea(l.cls)}" style="${styleFor(l.cls)}">${escHtml(l.text)}</div>`
        ).join('') + finalStatic;
        return;
    }

    // Con animacion: teclea linea por linea, con caret temporal al final de cada una.
    typed.innerHTML = '';
    let li = 0;
    function typeLine() {
        if (li >= seq.length) { typed.insertAdjacentHTML('beforeend', finalStatic); return; }
        const l = seq[li];
        const div = document.createElement('div');
        div.className = claseLinea(l.cls);
        if (styleFor(l.cls)) div.setAttribute('style', styleFor(l.cls));
        const caret = document.createElement('span');
        caret.className = 'term-caret';
        caret.innerHTML = '&nbsp;';
        div.appendChild(caret);
        typed.appendChild(div);
        let ci = 0;
        // La bio (fg) y el boot van rapidos para no hacer esperar los CTAs;
        // comandos/titulo algo mas lentos por dramatismo.
        const speed = (l.cls === 'boot-ok' || l.cls === 'fg') ? 9 : 18; // ms por caracter
        (function typeChar() {
            if (ci < l.text.length) {
                // insertAdjacentText es seguro: no parsea HTML, no rompe con < > en la bio
                caret.insertAdjacentText('beforebegin', l.text.charAt(ci));
                ci++;
                _bootTimer = setTimeout(typeChar, speed);
            } else {
                caret.remove();
                li++;
                _bootTimer = setTimeout(typeLine, l.cls === 'cmd' ? 90 : 160);
            }
        })();
    }
    typeLine();
}

// ============================================================
// PROYECTOS
// ============================================================

async function cargarProyectos() {
    try {
        const respuesta  = await fetch(`${API_URL}/proyectos`);
        const proyectos  = await respuesta.json();
        const contenedor = document.getElementById('lista-proyectos');
        contenedor.innerHTML = '';
        if (proyectos.length > 0) {
            proyectos.forEach((proyecto, idx) => {
                // Los proyectos destacados ocupan las 2 columnas y muestran banner + icono
                const esDestacado = proyecto.destacado == 1 || proyecto.destacado === true;
                // Si el proyecto esta en desarrollo mostramos badge [WIP] en estilo terminal
                const enDesarrollo = proyecto.estado === 'en_desarrollo';
                const tarjeta = document.createElement('div');
                tarjeta.style.transitionDelay = `${idx * 0.1}s`;

                // Badge [WIP] en rojo terminal para proyectos en desarrollo
                const wipBadge = enDesarrollo
                    ? '<span class="ml-2 text-xs" style="color: var(--err)">[WIP]</span>'
                    : '';
                // Número de tarjeta formateado como nombre de archivo de terminal
                const numArchivo = `proyecto_${String(idx + 1).padStart(2, '0')}.md`;

                if (esDestacado) {
                    // El destacado ocupa ambas columnas y muestra el banner sobre el panel
                    tarjeta.className = 'lg:col-span-2 border rounded overflow-hidden card-hover fade-up';
                    tarjeta.style.borderColor = 'var(--line)';
                    tarjeta.style.background  = 'var(--surface)';
                    tarjeta.innerHTML = `
                        ${proyecto.imagen ? `<img src="${proyecto.imagen}" class="w-full h-48 object-cover" alt="${proyecto.titulo}">` : ''}
                        <div class="px-4 py-2 border-b text-xs flex items-center justify-between" style="border-color: var(--line); color: var(--muted)">
                            <span>${numArchivo} <span class="accent-text">★ featured</span></span>${wipBadge}
                        </div>
                        <div class="p-5">
                            <h4 class="accent-text font-bold text-lg">${proyecto.titulo}</h4>
                            <p class="mt-2 text-sm" style="color: var(--fg)">${proyecto.descripcion}</p>
                            <div class="mt-4 flex gap-4 text-sm">
                                ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" rel="noopener noreferrer" class="accent-text hover:underline">[ repo ]</a>` : ''}
                                ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" rel="noopener noreferrer" class="accent-text hover:underline">[ demo ]</a>` : ''}
                            </div>
                        </div>`;
                } else {
                    // Tarjeta normal: panel de terminal con cabecera de archivo
                    tarjeta.className = 'border rounded overflow-hidden card-hover fade-up';
                    tarjeta.style.borderColor = 'var(--line)';
                    tarjeta.style.background  = 'var(--surface)';
                    tarjeta.innerHTML = `
                        <div class="px-4 py-2 border-b text-xs flex items-center justify-between" style="border-color: var(--line); color: var(--muted)">
                            <span>${numArchivo}</span>${wipBadge}
                        </div>
                        <div class="p-5">
                            <h4 class="accent-text font-bold text-lg">${proyecto.titulo}</h4>
                            <p class="mt-2 text-sm" style="color: var(--fg)">${proyecto.descripcion}</p>
                            <div class="mt-4 flex gap-4 text-sm">
                                ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" rel="noopener noreferrer" class="accent-text hover:underline">[ repo ]</a>` : ''}
                                ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" rel="noopener noreferrer" class="accent-text hover:underline">[ demo ]</a>` : ''}
                            </div>
                        </div>`;
                }
                contenedor.appendChild(tarjeta);
            });
            setTimeout(reobservarAnimaciones, 100);
        } else {
            contenedor.innerHTML = '<p class="italic col-span-2 text-center py-10" style="color: var(--muted)">Aun no hay proyectos para mostrar.</p>';
        }
    } catch (error) {
        console.error('Error al cargar proyectos:', error);
    }
}

// ============================================================
// HABILIDADES
// ============================================================

async function cargarHabilidades() {
    try {
        const respuesta   = await fetch(`${API_URL}/habilidades`);
        const habilidades = await respuesta.json();
        const contenedor  = document.getElementById('lista-habilidades');
        // Bloques llenos por nivel (escala de 8 caracteres)
        const nivelBloques = { 'Basico': 3, 'Intermedio': 6, 'Avanzado': 8 };

        if (habilidades.length > 0) {
            const filas = habilidades.map(h => {
                const llenos = nivelBloques[h.nivel] || 4;
                // Barra de 8 bloques: █ llenos + ░ vacíos
                const barra  = '█'.repeat(llenos) + '░'.repeat(8 - llenos);
                // padEnd a 12 chars para alinear la columna de barras (white-space:pre lo respeta)
                const nombre = h.nombre.padEnd(12, ' ');
                return `<div class="flex items-center gap-3 py-0.5">
        <span class="accent-text" style="white-space:pre">${nombre}</span>
        <span style="color: var(--accent)">[${barra}]</span>
        <span style="color: var(--muted)">${h.nivel}</span>
    </div>`;
            }).join('');
            contenedor.innerHTML = filas;
        } else {
            contenedor.innerHTML = '<span class="accent-text" style="color: var(--muted)">-- sin habilidades registradas --</span>';
        }
    } catch (error) {
        console.error('Error al cargar habilidades:', error);
    }
}

// ============================================================
// EXPERIENCIA
// ============================================================

// Genera un "hash" corto y estable a partir de un texto (estilo commit git).
// Usamos un hash determinista para que cada experiencia tenga siempre el mismo hash
// sin depender de Math.random (que cambia en cada recarga).
function pseudoHash(str) {
    let h = 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h.toString(16).padStart(7, '0').slice(0, 7);
}

async function cargarExperiencia() {
    try {
        const respuesta = await fetch(`${API_URL}/experiencia`);
        let experiencias = await respuesta.json();
        const contenedor = document.getElementById('lista-experiencia');
        contenedor.innerHTML = '';

        // Deduplicar con Set
        const vistos = new Set();
        experiencias = experiencias.filter(exp => {
            const clave = `${exp.empresa}-${exp.puesto}-${exp.fecha_inicio}`;
            if (vistos.has(clave)) return false;
            vistos.add(clave);
            return true;
        });

        // Entrada extra de proyectos personales
        experiencias.push({
            puesto: 'Desarrollador de Proyectos Personales',
            empresa: 'GitHub - santilafu',
            fecha_inicio: '2024-01-01',
            fecha_fin: null,
            descripcion: 'Desarrollo continuo de proyectos propios para reforzar conocimientos: APIs REST con Node.js y Express, aplicaciones Java con JDBC y Spring, apps moviles con Kotlin, y este mismo portafolio full-stack.',
            enlace_github: 'https://github.com/santilafu'
        });

        // Cada experiencia se renderiza como un commit de git log:
        // commit <hash>  (HEAD -> activo) si sigue en curso
        // Author: <empresa>
        // Date:   <inicio> - <fin|HEAD>
        experiencias.forEach(exp => {
            const fin  = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'HEAD';
            const ini  = formatearFecha(exp.fecha_inicio);
            // Las experiencias sin fecha_fin están en curso → etiqueta "(HEAD -> activo)" en verde
            const rama = exp.fecha_fin ? '' : '<span style="color: var(--ok)"> (HEAD -> activo)</span>';
            const hash = pseudoHash(exp.empresa + exp.puesto);
            const item = document.createElement('div');
            item.className = 'pl-4 border-l pb-6';
            item.style.borderColor = 'var(--line)';
            item.innerHTML = `
                <div style="color: var(--accent)">commit ${hash}${rama}</div>
                <div style="color: var(--muted)">Author: ${exp.empresa}</div>
                <div style="color: var(--muted)">Date:   ${ini} - ${fin}</div>
                <div class="mt-2 accent-text font-semibold">${exp.puesto}</div>
                ${exp.descripcion ? `<div class="mt-1 text-sm" style="color: var(--fg)">${exp.descripcion}</div>` : ''}
                ${exp.enlace_github ? `<a href="${exp.enlace_github}" target="_blank" rel="noopener noreferrer" class="text-sm accent-text hover:underline">[ github ]</a>` : ''}`;
            contenedor.appendChild(item);
        });
    } catch (error) {
        console.error('Error al cargar experiencia:', error);
    }
}

function formatearFecha(fechaStr) {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const fecha = new Date(fechaStr);
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// ============================================================
// CERTIFICADOS
// Carga los certificados desde la API y los renderiza como
// tarjetas con el mismo estilo glassmorphism que el resto.
// Cada tarjeta enlaza al PDF para descargarlo / verlo.
// ============================================================

async function cargarCertificados() {
    try {
        const respuesta    = await fetch(`${API_URL}/certificados`);
        const certificados = await respuesta.json();
        const contenedor   = document.getElementById('lista-certificados');
        contenedor.innerHTML = '';

        if (certificados.length === 0) {
            contenedor.innerHTML = '<p class="italic col-span-full text-center py-10" style="color: var(--muted)">Aun no hay certificados para mostrar.</p>';
            return;
        }

        certificados.forEach((cert, idx) => {
            const tarjeta = document.createElement('div');
            // Estilo "archivo de terminal": borde sutil + superficie del tema ámbar
            tarjeta.className            = 'border rounded overflow-hidden card-hover fade-up';
            tarjeta.style.borderColor    = 'var(--line)';
            tarjeta.style.background     = 'var(--surface)';
            tarjeta.style.transitionDelay = `${idx * 0.1}s`;

            // Enlace al PDF del certificado (condicional)
            const enlaceAbrir = cert.url_archivo
                ? `<a href="${cert.url_archivo}" target="_blank" rel="noopener noreferrer"
                      class="text-sm accent-text hover:underline mt-3 inline-block mr-4">[ abrir ]</a>`
                : '';

            // Enlace de verificación online (condicional)
            const enlaceOnline = cert.url_externa
                ? `<a href="${cert.url_externa}" target="_blank" rel="noopener noreferrer"
                      class="text-sm accent-text hover:underline mt-3 inline-block">[ ver online ]</a>`
                : '';

            tarjeta.innerHTML = `
                <div class="px-4 py-2 border-b text-xs"
                     style="border-color: var(--line); color: var(--muted)">
                    <i class="fa-solid fa-file-lines mr-1"></i> cert_${String(idx + 1).padStart(2, '0')}.pdf
                </div>
                <div class="p-5">
                    <h4 class="accent-text font-bold">${cert.titulo}</h4>
                    <p class="text-sm mt-1" style="color: var(--muted)">
                        ${cert.emisor} &middot; ${formatearFecha(cert.fecha)}
                    </p>
                    ${cert.descripcion ? `<p class="text-sm mt-2" style="color: var(--fg)">${cert.descripcion}</p>` : ''}
                    ${enlaceAbrir}${enlaceOnline}
                </div>`;

            contenedor.appendChild(tarjeta);
        });

        setTimeout(reobservarAnimaciones, 100);
    } catch (error) {
        console.error('Error al cargar certificados:', error);
    }
}

// ============================================================
// FORMULARIO DE CONTACTO
// Envía los datos al endpoint POST /api/contacto del backend,
// que los reenvía por email con nodemailer.
// ============================================================

function iniciarFormContacto() {
    const form     = document.getElementById('form-contacto');
    const feedback = document.getElementById('form-feedback');
    const btnEnviar = document.getElementById('btn-enviar');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // evitamos que recargue la página

        const nombre  = document.getElementById('contacto-nombre').value.trim();
        const email   = document.getElementById('contacto-email').value.trim();
        const mensaje = document.getElementById('contacto-mensaje').value.trim();

        // Estado de carga en el botón
        btnEnviar.disabled = true;
        btnEnviar.textContent = '[ enviando... ]';

        try {
            const res = await fetch(`${API_URL}/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, mensaje })
            });
            const data = await res.json();

            if (res.ok) {
                // Éxito: limpiamos el formulario y mostramos confirmación en verde terminal
                form.reset();
                mostrarFeedback(feedback, '[ok] mensaje enviado correctamente', 'var(--ok)');
            } else {
                // Error devuelto por el servidor (p.ej. campo vacío, rate limit)
                mostrarFeedback(feedback, '[error] ' + (data.error || 'Error al enviar'), 'var(--err)');
            }
        } catch {
            // Fallo de red o sin conexión
            mostrarFeedback(feedback, '[error] Error de conexión. Inténtalo de nuevo.', 'var(--err)');
        } finally {
            // Restauramos el botón independientemente del resultado
            btnEnviar.disabled = false;
            btnEnviar.textContent = '$ send';
        }
    });
}

/**
 * mostrarFeedback(el, texto, color)
 * Muestra un mensaje de feedback durante 4 segundos y lo oculta.
 * Usa tokens CSS (var(--ok) / var(--err)) en vez de clases Tailwind
 * para que respete el sistema de diseño terminal ámbar.
 */
function mostrarFeedback(el, texto, color) {
    el.textContent = texto;
    // Aplicamos color directo via style; className solo conserva las bases
    el.style.color = color || 'var(--ok)';
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

// ============================================================
// EASTER EGG — panel de stats secreto
// 5 clics seguidos en el logo S.L.H. abre el panel con las stats.
// El contador se resetea si pasan más de 2 segundos entre clics.
// ============================================================

function iniciarEasterEgg() {
    const logo  = document.getElementById('logo-navbar');
    const panel = document.getElementById('stats-panel');
    if (!logo || !panel) return;

    let clics = 0;
    let timer = null;

    logo.addEventListener('click', async () => {
        clics++;

        // Resetear contador si pasan más de 2 segundos sin clic
        clearTimeout(timer);
        timer = setTimeout(() => { clics = 0; }, 2000);

        if (clics >= 5) {
            clics = 0;
            try {
                const res  = await fetch(`${API_URL}/visitas-total`);
                const data = await res.json();
                document.getElementById('stats-visitas').textContent = data.total;
            } catch {
                document.getElementById('stats-visitas').textContent = '—';
            }
            panel.classList.remove('hidden');
        }
    });
}

// ============================================================
// VISITAS
// ============================================================

async function registrarVisita() {
    try {
        const res = await fetch(`${API_URL}/visitas`);
        const { total } = await res.json();
        const el = document.getElementById('visitas-counter');
        if (el) el.textContent = `${total} visitas`;
    } catch {
        // Si falla, no mostramos nada
    }
}

// ============================================================
// ANIMACIONES FADE-UP
// ============================================================

let observer;

function iniciarAnimaciones() {
    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

function reobservarAnimaciones() {
    if (!observer) return;
    document.querySelectorAll('.fade-up:not(.visible)').forEach(el => observer.observe(el));
}

// ============================================================
// NAVBAR
// ============================================================

function iniciarNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('nav-scrolled', window.scrollY > 50);
    }, { passive: true });

    const toggle = document.getElementById('menu-toggle');
    const menu   = document.getElementById('mobile-menu');
    toggle.addEventListener('click', () => menu.classList.toggle('hidden'));
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

renderTechStack();
cargarPerfil();
cargarProyectos();
cargarHabilidades();
cargarExperiencia();
cargarCertificados();
cargarGithubStats();
registrarVisita();

document.addEventListener('DOMContentLoaded', () => {
    iniciarAnimaciones();
    iniciarNavbar();
    iniciarCopiarEmail();
    iniciarParallax();
    iniciarScrollProgress();
    iniciarCursor();
    mostrarToastBienvenida();
    iniciarActiveNav();
    iniciarFormContacto();
    iniciarThemeToggle();
    iniciarEasterEgg();
});