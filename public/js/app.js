/**
 * app.js — v2
 * -----------
 * Lógica completa del frontend.
 *
 * Funciones nuevas en v2:
 *   iniciarScrollProgress()  → barra de progreso de lectura
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

            if (p.foto_perfil) {
                const img  = document.getElementById('foto_perfil');
                let ruta   = p.foto_perfil;
                if (!ruta.startsWith('http') && !ruta.startsWith('/')) ruta = '/img/' + ruta;
                img.src = ruta;
            }

            const footerEnlaces = document.getElementById('footer-enlaces');
            if (footerEnlaces) footerEnlaces.innerHTML = buildEnlacesFooter(p);
            const emailText = document.getElementById('email-text');
            if (emailText && p.email) emailText.textContent = p.email;

            // Revela el hero con fundido escalonado una vez los datos estan listos
            document.getElementById('hero-content').classList.add('hero-ready');
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
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
                const esDestacado  = proyecto.destacado == 1 || proyecto.destacado === true;
                const enDesarrollo = proyecto.estado === 'en_desarrollo';
                const tarjeta = document.createElement('div');
                tarjeta.style.transitionDelay = `${idx * 0.1}s`;

                const badge = enDesarrollo
                    ? '<span class="pill pill-dev">En desarrollo</span>'
                    : (esDestacado ? '<span class="pill pill-featured">Destacado</span>' : '');

                const enlaces = `
                    <div class="mt-4 flex gap-4 text-sm">
                        ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" rel="noopener noreferrer" class="proyecto-link"><i class="fa-brands fa-github"></i> Codigo</a>` : ''}
                        ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" rel="noopener noreferrer" class="proyecto-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Demo</a>` : ''}
                    </div>`;

                tarjeta.className = (esDestacado ? 'lg:col-span-2 ' : '') + 'border rounded-xl overflow-hidden card-hover fade-up';
                tarjeta.style.borderColor = 'var(--line)';
                tarjeta.style.background  = 'var(--surface)';
                tarjeta.innerHTML = `
                    ${esDestacado && proyecto.imagen ? `<img src="${proyecto.imagen}" class="w-full h-48 object-cover" alt="${proyecto.titulo}">` : ''}
                    <div class="p-5">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="accent-text font-bold text-lg">${proyecto.titulo}</h4>
                            ${badge}
                        </div>
                        <p class="mt-2 text-sm" style="color: var(--fg)">${proyecto.descripcion}</p>
                        ${enlaces}
                    </div>`;
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
        const nivelPct = { 'Basico': 40, 'Intermedio': 70, 'Avanzado': 95 };

        if (habilidades.length > 0) {
            contenedor.innerHTML = habilidades.map(h => {
                const pct = nivelPct[h.nivel] || 50;
                return `<div class="skill-row">
        <div class="flex items-center justify-between text-sm mb-1">
            <span style="color: var(--fg)">${h.nombre}</span>
            <span style="color: var(--muted)">${h.nivel}</span>
        </div>
        <div class="skill-track"><div class="skill-fill" style="--pct:${pct}%"></div></div>
    </div>`;
            }).join('');
            animarHabilidades();
        } else {
            contenedor.innerHTML = '<span style="color: var(--muted)">Sin habilidades registradas</span>';
        }
    } catch (error) {
        console.error('Error al cargar habilidades:', error);
    }
}

function animarHabilidades() {
    const fills = document.querySelectorAll('.skill-fill');
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.width = 'var(--pct)';
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    fills.forEach(f => skillObserver.observe(f));
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

        const vistos = new Set();
        experiencias = experiencias.filter(exp => {
            const clave = `${exp.empresa}-${exp.puesto}-${exp.fecha_inicio}`;
            if (vistos.has(clave)) return false;
            vistos.add(clave);
            return true;
        });

        experiencias.push({
            puesto: 'Desarrollador de Proyectos Personales',
            empresa: 'GitHub - santilafu',
            fecha_inicio: '2024-01-01',
            fecha_fin: null,
            descripcion: 'Desarrollo continuo de proyectos propios para reforzar conocimientos: APIs REST con Node.js y Express, aplicaciones Java con JDBC y Spring, apps moviles con Kotlin, y este mismo portafolio full-stack.',
            enlace_github: 'https://github.com/santilafu'
        });

        experiencias.forEach(exp => {
            const fin    = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'Actualidad';
            const ini    = formatearFecha(exp.fecha_inicio);
            const activo = !exp.fecha_fin ? '<span class="pill pill-featured">Actual</span>' : '';
            const item = document.createElement('div');
            item.className = 'timeline-item fade-up';
            item.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-body">
                    <div class="flex items-center gap-2">
                        <h4 class="accent-text font-semibold">${exp.puesto}</h4>${activo}
                    </div>
                    <p class="text-sm" style="color: var(--muted)">${exp.empresa} &middot; ${ini} &ndash; ${fin}</p>
                    ${exp.descripcion ? `<p class="mt-1 text-sm" style="color: var(--fg)">${exp.descripcion}</p>` : ''}
                    ${exp.enlace_github ? `<a href="${exp.enlace_github}" target="_blank" rel="noopener noreferrer" class="proyecto-link mt-1"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
                </div>`;
            contenedor.appendChild(item);
        });
        setTimeout(reobservarAnimaciones, 100);
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
            // Tarjeta limpia de certificado: borde sutil + superficie del tema
            tarjeta.className            = 'border rounded-xl overflow-hidden card-hover fade-up';
            tarjeta.style.borderColor    = 'var(--line)';
            tarjeta.style.background     = 'var(--surface)';
            tarjeta.style.transitionDelay = `${idx * 0.1}s`;

            tarjeta.innerHTML = `
                <div class="p-5">
                    <h4 class="accent-text font-bold">${cert.titulo}</h4>
                    <p class="text-sm mt-1" style="color: var(--muted)">
                        ${cert.emisor} &middot; ${formatearFecha(cert.fecha)}
                    </p>
                    ${cert.descripcion ? `<p class="text-sm mt-2" style="color: var(--fg)">${cert.descripcion}</p>` : ''}
                    <div class="mt-3 flex gap-4">
                        ${cert.url_archivo ? `<a href="${cert.url_archivo}" target="_blank" rel="noopener noreferrer" class="proyecto-link"><i class="fa-solid fa-file-arrow-down"></i> Ver PDF</a>` : ''}
                        ${cert.url_externa ? `<a href="${cert.url_externa}" target="_blank" rel="noopener noreferrer" class="proyecto-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Verificar</a>` : ''}
                    </div>
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
        btnEnviar.textContent = 'Enviando...';

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
                mostrarFeedback(feedback, 'Mensaje enviado correctamente', 'var(--ok)');
            } else {
                // Error devuelto por el servidor (p.ej. campo vacío, rate limit)
                mostrarFeedback(feedback, data.error || 'Error al enviar el mensaje', 'var(--err)');
            }
        } catch {
            // Fallo de red o sin conexión
            mostrarFeedback(feedback, 'Error de conexion. Intentalo de nuevo.', 'var(--err)');
        } finally {
            // Restauramos el botón independientemente del resultado
            btnEnviar.disabled = false;
            btnEnviar.textContent = 'Enviar mensaje';
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
    mostrarToastBienvenida();
    iniciarActiveNav();
    iniciarFormContacto();
    iniciarThemeToggle();
    iniciarEasterEgg();
});