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
    card.className = `skill-card tech-enter flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${tech.color} border ${tech.border} cursor-default`;
    card.dataset.index = index;
    card.innerHTML = `
        <div class="${floatClass}"><i class="${tech.icono} ${iconSize} ${colorClass}"></i></div>
        <span class="text-xs font-medium text-gray-300">${tech.nombre}</span>
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

        contenedor.innerHTML = `
            <a href="https://github.com/santilafu" target="_blank"
               class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-full hover:border-purple-500/40 transition-colors">
                <i class="fa-brands fa-github text-white"></i>
                <span class="text-white font-semibold">${user.public_repos}</span>
                <span>repos publicos</span>
            </a>
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-full">
                <i class="fa-solid fa-users text-purple-400"></i>
                <span class="text-white font-semibold">${user.followers}</span>
                <span>seguidores</span>
            </div>
            ${topLang ? `
            <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/60 border border-slate-800 rounded-full">
                <i class="fa-solid fa-code text-blue-400"></i>
                <span class="text-white font-semibold">${topLang[0]}</span>
                <span>lenguaje top</span>
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
            iniciarTyping(p.titular);

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
        ${p.enlace_github  ? `<a href="${p.enlace_github}" target="_blank" title="GitHub" class="${classes} transition-colors"><i class="fa-brands fa-github"></i></a>` : ''}
        ${p.enlace_linkedin ? `<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" title="LinkedIn" class="${classes} transition-colors"><i class="fa-brands fa-linkedin"></i></a>` : ''}
    `;
}

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

// ============================================================
// TYPING EFFECT
// ============================================================

function iniciarTyping(texto) {
    const el = document.getElementById('titular');
    el.textContent = '';
    el.classList.add('typing-cursor');
    let i = 0;
    const interval = setInterval(() => {
        el.textContent += texto.charAt(i++);
        if (i >= texto.length) {
            clearInterval(interval);
            setTimeout(() => el.classList.remove('typing-cursor'), 2000);
        }
    }, 60);
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
                const tarjeta = document.createElement('div');
                tarjeta.className = 'card-hover bg-slate-900/80 border border-slate-800 p-6 rounded-2xl group fade-up';
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
                const key       = hab.nombre.toLowerCase();
                const iconClass = SKILL_ICONS[key] || 'fa-solid fa-code';
                const nivel     = hab.nivel || '';
                const nivelColor = nivel.toLowerCase() === 'avanzado'
                    ? 'text-green-400 bg-green-500/10 border-green-500/30'
                    : nivel.toLowerCase() === 'intermedio'
                        ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
                        : 'text-blue-400 bg-blue-500/10 border-blue-500/30';
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

        const timeline = document.createElement('div');
        timeline.className = 'relative pl-8 space-y-8';
        const linea = document.createElement('div');
        linea.className = 'timeline-line absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full';
        timeline.appendChild(linea);

        experiencias.forEach(exp => {
            const item       = document.createElement('div');
            item.className   = 'relative';
            const fechaFin   = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'Actualidad';
            const fechaInicio = formatearFecha(exp.fecha_inicio);
            const esActual   = !exp.fecha_fin;
            const esPersonal = !!exp.enlace_github;
            item.innerHTML = `
                <div class="timeline-dot absolute -left-5 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950"></div>
                <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-300">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h4 class="text-lg font-bold text-white">${exp.puesto}</h4>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${esActual   ? '<span class="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full">Actual</span>' : ''}
                            ${esPersonal ? '<span class="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold rounded-full"><i class="fa-solid fa-code mr-1"></i>Side projects</span>' : ''}
                            <span class="text-xs font-medium text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full">${fechaInicio} - ${fechaFin}</span>
                        </div>
                    </div>
                    <p class="text-sm font-semibold text-blue-400 mb-2">
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

function formatearFecha(fechaStr) {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const fecha = new Date(fechaStr);
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
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
        btnEnviar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

        try {
            const res = await fetch(`${API_URL}/contacto`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, email, mensaje })
            });
            const data = await res.json();

            if (res.ok) {
                // Éxito: limpiamos el formulario y mostramos mensaje verde
                form.reset();
                mostrarFeedback(feedback, data.mensaje, 'text-green-400');
            } else {
                mostrarFeedback(feedback, data.error || 'Error al enviar', 'text-red-400');
            }
        } catch {
            mostrarFeedback(feedback, 'Error de conexión. Inténtalo de nuevo.', 'text-red-400');
        } finally {
            // Restauramos el botón independientemente del resultado
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar mensaje';
        }
    });
}

/**
 * mostrarFeedback(el, texto, colorClass)
 * Muestra un mensaje de feedback durante 4 segundos y lo oculta.
 */
function mostrarFeedback(el, texto, colorClass) {
    el.textContent  = texto;
    el.className    = `text-center text-sm ${colorClass}`;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
}

// ============================================================
// EASTER EGG — panel de stats secreto
// 5 clics seguidos en el logo S.L.H. abre el panel con las stats.
// El contador se resetea si pasan más de 2 segundos entre clics.
// ============================================================

function iniciarEasterEgg() {
    const logo  = document.querySelector('a.gradient-text');
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