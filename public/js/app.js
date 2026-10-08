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
    // Caja uniforme con los tokens del tema: fondo surface + borde --line en lugar de gradientes por tecnología.
    // cursor-default y rounded-xl se aplican vía Tailwind antes de los estilos inline.
    card.className = 'tech-enter flex flex-col items-center justify-center gap-3 p-4 md:p-5 border rounded-xl skill-card';
    card.style.borderColor = 'var(--line)';
    card.style.background  = 'var(--surface)';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="${floatClass}"><i class="${tech.icono} ${iconSize} ${colorClass}" aria-hidden="true"></i></div>
        <span class="text-sm md:text-base font-medium text-center" style="color: var(--fg)">${tech.nombre}</span>
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
    // Con "reducir movimiento" activado no inclinamos el bloque al mover el ratón
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

// Temporizadores del toast guardados fuera de la función: si el código
// se ejecuta dos veces, cancelamos los anteriores en vez de acumularlos.
let _toastShowTimer = null;
let _toastHideTimer = null;
const TOAST_DURACION_MS = 5000; // tiempo visible antes de ocultarse solo

function mostrarToastBienvenida() {
    const toast = document.getElementById('toast');
    if (!toast) return; // sin contenedor no hay nada que mostrar

    // localStorage puede lanzar excepción (modo privado, cookies bloqueadas)
    try {
        if (localStorage.getItem('visited')) return; // ya visitó antes
        localStorage.setItem('visited', 'true');
    } catch { /* si falla, simplemente mostramos el saludo */ }

    clearTimeout(_toastShowTimer);
    clearTimeout(_toastHideTimer);

    // Pequeño delay para que la página cargue antes de mostrar el toast
    _toastShowTimer = setTimeout(() => {
        toast.classList.add('show');
        // Se oculta solo pasados unos segundos (con fundido/deslizamiento CSS)
        _toastHideTimer = setTimeout(cerrarToast, TOAST_DURACION_MS);
    }, 1200);
}

// Función global para cerrar el toast (también la llama el botón ×)
function cerrarToast() {
    clearTimeout(_toastShowTimer);
    clearTimeout(_toastHideTimer);
    const toast = document.getElementById('toast');
    if (toast) toast.classList.remove('show');
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
        // threshold 0 + una franja fina (rootMargin) justo debajo de la
        // navbar: con secciones más altas que el viewport (p.ej. la
        // grid de proyectos) un threshold alto (ej. 0.4) nunca llega a
        // cumplirse porque el "40% visible" del target jamás cabe en la
        // franja recortada, y esa sección nunca se marca como activa.
        // Con threshold 0 basta con que la sección toque la franja.
        threshold: 0,
        rootMargin: '-80px 0px -70% 0px' // franja fina justo bajo la navbar fija
    });

    secciones.forEach(sec => navObserver.observe(sec));
}

// ============================================================
// GITHUB STATS
// Usamos la API pública de GitHub (sin auth, límite 60 req/h).
// Mostramos: repos públicos y lenguaje más usado en los repos.
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

        // Los ítems usan los tokens CSS del sistema de diseño.
        // Los valores van en el color de texto (--fg): el acento se reserva
        // para enlaces, CTAs y estados activos.
        contenedor.innerHTML = `
            <a href="https://github.com/santilafu" target="_blank" rel="noopener noreferrer"
               class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full transition-colors"
               style="background: var(--surface); border: 1px solid var(--line);">
                <i class="fa-brands fa-github" style="color: var(--muted)" aria-hidden="true"></i>
                <span class="font-semibold" style="color: var(--fg)">${user.public_repos}</span>
                <span style="color: var(--muted)">repos públicos</span>
            </a>
            ${topLang ? `
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                 style="background: var(--surface); border: 1px solid var(--line);">
                <i class="fa-solid fa-code" style="color: var(--muted)" aria-hidden="true"></i>
                <span class="font-semibold" style="color: var(--fg)">${topLang[0]}</span>
                <span style="color: var(--muted)">lenguaje top</span>
            </div>` : ''}
        `;
    } catch {
        contenedor.innerHTML = ''; // si falla la API de GitHub, ocultamos la sección
    }
}

// ============================================================
// TEMA CLARO / OSCURO
// El tema inicial lo pone un script en el <head> de index.html
// (antes de pintar, para que no haya parpadeo): preferencia guardada
// en localStorage o, si no hay, la del sistema operativo.
// Aquí solo leemos ese atributo data-theme del <html>, sincronizamos
// los iconos y gestionamos el botón, que actúa como "override" que
// se guarda. Mientras no haya elección guardada, seguimos al sistema.
// ============================================================

// Lee la preferencia guardada (o null). localStorage puede lanzar excepción.
function leerTemaGuardado() {
    try {
        const t = localStorage.getItem('theme');
        return (t === 'light' || t === 'dark') ? t : null;
    } catch { return null; }
}

function iniciarThemeToggle() {
    const html    = document.documentElement;
    const toggles = document.querySelectorAll('#theme-toggle, #theme-toggle-mobile');

    // Tema ya aplicado por el script del <head> (respaldo: oscuro)
    aplicarTema(html.dataset.theme === 'light' ? 'light' : 'dark');

    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const actual = html.dataset.theme === 'light' ? 'light' : 'dark';
            const nuevo  = actual === 'dark' ? 'light' : 'dark';
            aplicarTema(nuevo);
            try { localStorage.setItem('theme', nuevo); } catch { /* no se puede guardar: solo esta visita */ }
        });
    });

    // Si el usuario no ha elegido tema, seguimos los cambios del sistema en vivo
    if (window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const alCambiarSistema = (e) => { if (!leerTemaGuardado()) aplicarTema(e.matches ? 'light' : 'dark'); };
        if (mq.addEventListener) mq.addEventListener('change', alCambiarSistema);
        else if (mq.addListener) mq.addListener(alCambiarSistema); // Safari antiguo
    }
}

function aplicarTema(tema) {
    const html    = document.documentElement;
    const iconos  = document.querySelectorAll('#theme-toggle i, #theme-toggle-mobile i');
    html.dataset.theme = tema;
    iconos.forEach(i => {
        i.className = tema === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    });
    // El aria-label indica a qué tema se cambiará al pulsar
    document.querySelectorAll('#theme-toggle, #theme-toggle-mobile').forEach(btn => {
        btn.setAttribute('aria-label', tema === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    });
}

// ============================================================
// PERFIL
// ============================================================

// Revela el hero (fundido escalonado de .hero-line). Se llama al cargar el
// perfil, si la API falla y como red de seguridad por tiempo: así la foto,
// el nombre y los botones nunca se quedan invisibles (opacity: 0).
function revelarHero() {
    const hero = document.getElementById('hero-content');
    if (hero) hero.classList.add('hero-ready');
}
// Red de seguridad: si /api/perfil tarda o no responde, mostramos el hero
// igualmente con el texto de respaldo del HTML.
setTimeout(revelarHero, 1500);

async function cargarPerfil() {
    try {
        const respuesta = await fetch(`${API_URL}/perfil`);
        const perfiles  = await respuesta.json();
        if (perfiles.length > 0) {
            const p = perfiles[0];
            // Solo sobrescribimos si hay valor: si no, se queda el texto de respaldo del HTML
            if (p.nombre)   document.getElementById('nombre').textContent   = p.nombre;
            if (p.sobre_mi) document.getElementById('sobre_mi').textContent = p.sobre_mi;
            if (p.titular)  document.getElementById('titular').textContent  = p.titular;

            if (p.foto_perfil) {
                const img  = document.getElementById('foto_perfil');
                let ruta   = p.foto_perfil;
                if (!ruta.startsWith('http') && !ruta.startsWith('/')) ruta = '/img/' + ruta;
                img.src = ruta;
            }

            // Enlaces del hero (GitHub / LinkedIn): el HTML trae unos de respaldo;
            // si la BD tiene valor, lo usamos en su lugar.
            const heroGithub   = document.getElementById('hero-github');
            const heroLinkedin = document.getElementById('hero-linkedin');
            if (heroGithub && p.enlace_github) heroGithub.href = fixUrl(p.enlace_github);
            if (heroLinkedin && p.enlace_linkedin) heroLinkedin.href = fixUrl(p.enlace_linkedin);

            const footerEnlaces = document.getElementById('footer-enlaces');
            if (footerEnlaces) footerEnlaces.innerHTML = buildEnlacesFooter(p);
            const emailText = document.getElementById('email-text');
            if (emailText && p.email) emailText.textContent = p.email;

        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    } finally {
        // Haya datos o no, el hero se muestra (con los de la BD o el texto de respaldo)
        revelarHero();
    }
}

function buildEnlacesFooter(p) {
    // Icono en color de texto (acento al pasar el ratón), etiqueta en color atenuado (--muted)
    const base = 'flex flex-col items-center gap-2 mobile-link transition-all duration-300 hover:-translate-y-1';
    const items = [];
    if (p.email)
        items.push(`<a href="mailto:${p.email}" class="${base}"><i class="fa-solid fa-envelope text-2xl"></i><span class="text-sm" style="color: var(--muted)">Email</span></a>`);
    if (p.enlace_github)
        items.push(`<a href="${p.enlace_github}" target="_blank" rel="noopener noreferrer" class="${base}"><i class="fa-brands fa-github text-2xl"></i><span class="text-sm" style="color: var(--muted)">GitHub</span></a>`);
    if (p.enlace_linkedin)
        items.push(`<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" rel="noopener noreferrer" class="${base}"><i class="fa-brands fa-linkedin text-2xl"></i><span class="text-sm" style="color: var(--muted)">LinkedIn</span></a>`);
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

// Imágenes que tienen versión WebP junto al original (mismo nombre, .webp).
// Se sirven con <picture>: WebP para navegadores que lo soportan y el
// PNG/JPG original como respaldo. Solo se listan las que EXISTEN: un
// <source> con un WebP inexistente no hace "fallback" al <img>.
const IMAGENES_WEBP = new Set(['/img/suscriptwallet-banner.png', '/img/domelecduke.jpg']);

// Devuelve <picture> con fuente WebP (si la hay) o un <img> simple.
function imagenResponsive(src, atributos) {
    const img = `<img src="${src}" ${atributos}>`;
    if (!IMAGENES_WEBP.has(src)) return img;
    const webp = src.replace(/\.(png|jpe?g)$/i, '.webp');
    return `<picture><source srcset="${webp}" type="image/webp">${img}</picture>`;
}

async function cargarProyectos() {
    try {
        const respuesta  = await fetch(`${API_URL}/proyectos`);
        const proyectos  = await respuesta.json();
        const contenedor = document.getElementById('lista-proyectos');
        contenedor.innerHTML = '';
        if (proyectos.length > 0) {
            // ── Reparto de columnas (rejilla de 6 columnas en escritorio) ──
            // · Destacado y proyectos con imagen → fila completa (span 6).
            // · Tarjetas sin imagen → se agrupan en "tandas" consecutivas y se
            //   reparten para que ninguna fila quede coja: con nº par, 2 por fila
            //   (span 3); con nº impar ≥3, una fila de 3 (span 2) y el resto de
            //   2 en 2; si solo hay 1, ocupa la fila entera.
            // Las clases van escritas completas para que Tailwind las detecte.
            const SPAN = { 2: 'lg:col-span-2', 3: 'lg:col-span-3', 6: 'lg:col-span-6' };
            const esAncha = (p) => (p.destacado == 1 || p.destacado === true) || !!p.imagen;
            const spans = new Array(proyectos.length).fill(6);
            let tanda = [];
            const repartirTanda = () => {
                const n = tanda.length;
                tanda.forEach((i, k) => {
                    if (n === 1)          spans[i] = 6;
                    else if (n % 2 === 0) spans[i] = 3;
                    else                  spans[i] = k < 3 ? 2 : 3;
                });
                tanda = [];
            };
            proyectos.forEach((p, i) => { if (esAncha(p)) repartirTanda(); else tanda.push(i); });
            repartirTanda();

            proyectos.forEach((proyecto, idx) => {
                const esDestacado  = proyecto.destacado == 1 || proyecto.destacado === true;
                const enDesarrollo = proyecto.estado === 'en_desarrollo';
                const tarjeta = document.createElement('div');
                tarjeta.style.transitionDelay = `${idx * 0.1}s`;

                const badge = enDesarrollo
                    ? '<span class="pill pill-dev">En desarrollo</span>'
                    : (esDestacado ? '<span class="pill pill-featured">Destacado</span>' : '');

                // mt-auto empuja los enlaces al fondo de la tarjeta: así, si una
                // tarjeta de la misma fila es más alta (p. ej. porque tiene imagen),
                // los enlaces de ambas quedan alineados abajo.
                // Enlace a la web: si el proyecto está en producción (web real de un
                // cliente) no es una "demo", así que cambiamos texto e icono.
                const enProduccion = proyecto.estado === 'en_produccion';
                const textoWeb = enProduccion
                    ? '<i class="fa-solid fa-globe"></i> Ver web'
                    : '<i class="fa-solid fa-arrow-up-right-from-square"></i> Demo';
                const enlaces = `
                    <div class="mt-auto pt-5 flex gap-5 text-base font-medium">
                        ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" rel="noopener noreferrer" class="card-link"><i class="fa-brands fa-github"></i> Código</a>` : ''}
                        ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" rel="noopener noreferrer" class="card-link">${textoWeb}</a>` : ''}
                    </div>`;

                // Imagen de cabecera para proyectos NO destacados que tengan `imagen`.
                // (El destacado ya pinta su propio banner a todo el ancho.)
                // Si hay demo o web en producción, la imagen también enlaza a ella.
                const altImagen = `Captura de ${proyecto.titulo}`.replace(/"/g, '&quot;');
                const imgTarjeta = proyecto.imagen
                    ? imagenResponsive(proyecto.imagen, `alt="${altImagen}" loading="lazy" width="1200" height="630"`)
                    : '';
                const conImagen = !esDestacado && !!proyecto.imagen;
                const mediaTarjeta = conImagen
                    ? (proyecto.url_demo
                        ? `<a href="${proyecto.url_demo}" target="_blank" rel="noopener noreferrer" class="proyecto-media" tabindex="-1" aria-hidden="true">${imgTarjeta}</a>`
                        : `<div class="proyecto-media">${imgTarjeta}</div>`)
                    : '';

                // flex-col: el cuerpo crece (flex-1) y los enlaces se alinean abajo.
                // Con imagen (no destacado): en escritorio imagen a un lado y texto al otro.
                tarjeta.className = SPAN[spans[idx]] + ' border rounded-xl overflow-hidden card-hover fade-up flex flex-col'
                    + (conImagen ? ' proyecto-wide lg:flex-row' : '');
                tarjeta.style.borderColor = 'var(--line)';
                tarjeta.style.background  = 'var(--surface)';
                tarjeta.innerHTML = `
                    ${esDestacado && proyecto.imagen ? `
                    <div class="banner-destacado h-56 md:h-72">
                        <div class="banner-fondo" aria-hidden="true">${imagenResponsive(proyecto.imagen, 'alt=""')}</div>
                        ${imagenResponsive(proyecto.imagen, `class="banner-img" alt="${altImagen}" width="1024" height="500"`)}
                    </div>` : ''}
                    ${mediaTarjeta}
                    <div class="proyecto-body p-6 md:p-8 flex-1 flex flex-col">
                        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 mb-1">
                            <h3 class="card-title font-bold text-xl md:text-2xl tracking-tight">${proyecto.titulo}</h3>
                            ${badge}
                        </div>
                        <p class="mt-3 text-base leading-relaxed" style="color: var(--fg)">${proyecto.descripcion}</p>
                        ${enlaces}
                    </div>`;
                contenedor.appendChild(tarjeta);
            });
            setTimeout(reobservarAnimaciones, 100);
        } else {
            contenedor.innerHTML = '<p class="italic col-span-full text-center py-10" style="color: var(--muted)">Aún no hay proyectos para mostrar.</p>';
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
        // Nivel → nº de segmentos encendidos (de 3). Sin porcentajes: un
        // "95%" autoevaluado resta credibilidad; el nivel en texto es honesto.
        // 'Basico' (sin tilde) se mantiene por compatibilidad con datos antiguos
        const nivelSegs = { 'Básico': 1, 'Basico': 1, 'Intermedio': 2, 'Avanzado': 3 };

        if (habilidades.length > 0) {
            contenedor.innerHTML = habilidades.map(h => {
                const n = nivelSegs[h.nivel] || 1;
                // Los segmentos son decorativos (aria-hidden): el nivel ya se lee en texto
                const segs = [1, 2, 3].map(i => `<span class="skill-seg" data-on="${i <= n ? 1 : 0}"></span>`).join('');
                return `<div class="skill-row text-base md:text-lg">
        <span class="skill-name">${h.nombre}</span>
        <span class="skill-level" aria-hidden="true">${segs}</span>
        <span class="skill-level-text">${h.nivel}</span>
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

// Enciende los segmentos de cada fila al entrar en viewport (el CSS los
// escalona; con "reducir movimiento" se encienden sin transición).
function animarHabilidades() {
    const filas = document.querySelectorAll('.skill-row');
    const encender = (fila) => fila.querySelectorAll('.skill-seg[data-on="1"]').forEach(s => s.classList.add('on'));
    if (!('IntersectionObserver' in window)) { filas.forEach(encender); return; }
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                encender(entry.target);
                skillObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    filas.forEach(f => skillObserver.observe(f));
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
            descripcion: 'Desarrollo continuo de proyectos propios para reforzar conocimientos: APIs REST con Node.js y Express, aplicaciones Java con JDBC y Spring, apps móviles con Kotlin, y este mismo portafolio full-stack.',
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
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 class="card-title font-semibold text-xl md:text-2xl tracking-tight">${exp.puesto}</h3>${activo}
                    </div>
                    <p class="mt-1 text-base" style="color: var(--muted)">${exp.empresa} &middot; ${ini} &ndash; ${fin}</p>
                    ${exp.descripcion ? `<p class="mt-3 text-base leading-relaxed" style="color: var(--fg)">${exp.descripcion}</p>` : ''}
                    ${exp.enlace_github ? `<a href="${exp.enlace_github}" target="_blank" rel="noopener noreferrer" class="card-link mt-3 text-base font-medium"><i class="fa-brands fa-github"></i> GitHub</a>` : ''}
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
            contenedor.innerHTML = '<p class="italic col-span-full text-center py-10" style="color: var(--muted)">Aún no hay certificados para mostrar.</p>';
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
                <div class="p-6 md:p-8">
                    <h3 class="card-title font-bold text-xl md:text-2xl tracking-tight">${cert.titulo}</h3>
                    <p class="text-base mt-2" style="color: var(--muted)">
                        ${cert.emisor} &middot; ${formatearFecha(cert.fecha)}
                    </p>
                    ${cert.descripcion ? `<p class="text-base mt-3 leading-relaxed" style="color: var(--fg)">${cert.descripcion}</p>` : ''}
                    <div class="mt-5 flex flex-wrap gap-5 text-base font-medium">
                        ${cert.url_archivo ? `<a href="${cert.url_archivo}" target="_blank" rel="noopener noreferrer" class="card-link"><i class="fa-solid fa-file-arrow-down"></i> Ver PDF</a>` : ''}
                        ${cert.url_externa ? `<a href="${cert.url_externa}" target="_blank" rel="noopener noreferrer" class="card-link"><i class="fa-solid fa-arrow-up-right-from-square"></i> Verificar</a>` : ''}
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
                // Éxito: limpiamos el formulario y mostramos confirmación en verde (--ok)
                form.reset();
                mostrarFeedback(feedback, 'Mensaje enviado correctamente', 'var(--ok)');
            } else {
                // Error devuelto por el servidor (p.ej. campo vacío, rate limit)
                mostrarFeedback(feedback, data.error || 'Error al enviar el mensaje', 'var(--err)');
            }
        } catch {
            // Fallo de red o sin conexión
            mostrarFeedback(feedback, 'Error de conexión. Inténtalo de nuevo.', 'var(--err)');
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
 * para que respete el sistema de diseño del sitio.
 */
function mostrarFeedback(el, texto, color) {
    // Primero lo hacemos visible y luego ponemos el texto: así la región
    // aria-live ya está en el árbol de accesibilidad y el cambio se anuncia.
    el.classList.remove('hidden');
    // Aplicamos color directo via style; className solo conserva las bases
    el.style.color = color || 'var(--ok)';
    el.textContent = texto;
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
    const actualizarNavbar = () => navbar.classList.toggle('nav-scrolled', window.scrollY > 50);
    window.addEventListener('scroll', actualizarNavbar, { passive: true });
    // Estado inicial: si el navegador restaura el scroll al recargar,
    // la navbar ya debe salir con fondo sin esperar al primer scroll.
    actualizarNavbar();

    const toggle = document.getElementById('menu-toggle');
    const menu   = document.getElementById('mobile-menu');
    // Abre/cierra el menú móvil y sincroniza aria-expanded / aria-label
    // para que los lectores de pantalla sepan si está desplegado.
    const setMenuAbierto = (abierto) => {
        menu.classList.toggle('hidden', !abierto);
        toggle.setAttribute('aria-expanded', String(abierto));
        toggle.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    toggle.addEventListener('click', () => setMenuAbierto(menu.classList.contains('hidden')));
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setMenuAbierto(false));
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