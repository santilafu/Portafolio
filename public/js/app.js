const API_URL = '/api';

// ==========================================
// TECH STACK
// ==========================================
const TECH_MAIN = [
    { nombre: 'Java',       icono: 'devicon-java-plain colored',       color: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30' },
    { nombre: 'MySQL',      icono: 'devicon-mysql-plain colored',      color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
    { nombre: 'HTML5',      icono: 'devicon-html5-plain colored',      color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
    { nombre: 'CSS3',       icono: 'devicon-css3-plain colored',       color: 'from-blue-400/20 to-blue-600/20', border: 'border-blue-400/30' },
    { nombre: 'Git',        icono: 'devicon-git-plain colored',        color: 'from-orange-600/20 to-red-600/20', border: 'border-orange-600/30' },
    { nombre: 'IntelliJ',   icono: 'devicon-intellij-plain colored',   color: 'from-pink-500/20 to-blue-500/20', border: 'border-pink-500/30' },
    { nombre: 'Claude',     icono: 'fa-solid fa-brain',                color: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', iconColor: 'text-amber-400' },
    { nombre: 'Gemini',     icono: 'fa-solid fa-wand-magic-sparkles',  color: 'from-blue-400/20 to-cyan-400/20', border: 'border-blue-400/30', iconColor: 'text-blue-400' },
    { nombre: 'Copilot',    icono: 'fa-brands fa-github',              color: 'from-gray-300/20 to-gray-500/20', border: 'border-gray-400/30', iconColor: 'text-gray-300' },
];

const TECH_OTHER = [
    { nombre: 'Kotlin',     icono: 'devicon-kotlin-plain colored',     color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' },
    { nombre: 'Python',     icono: 'devicon-python-plain colored',     color: 'from-yellow-500/20 to-blue-500/20', border: 'border-yellow-500/30' },
    { nombre: 'JavaScript', icono: 'devicon-javascript-plain colored', color: 'from-yellow-400/20 to-yellow-600/20', border: 'border-yellow-400/30' },
    { nombre: 'Node.js',    icono: 'devicon-nodejs-plain colored',     color: 'from-green-500/20 to-green-700/20', border: 'border-green-500/30' },
    { nombre: 'Spring',     icono: 'devicon-spring-plain colored',     color: 'from-green-400/20 to-green-600/20', border: 'border-green-400/30' },
    { nombre: 'C#',         icono: 'devicon-csharp-plain colored',     color: 'from-purple-600/20 to-violet-600/20', border: 'border-purple-600/30' },
    { nombre: 'C++',        icono: 'devicon-cplusplus-plain colored',  color: 'from-blue-600/20 to-indigo-600/20', border: 'border-blue-600/30' },
    { nombre: 'Unity',      icono: 'devicon-unity-plain',              color: 'from-gray-400/20 to-gray-600/20', border: 'border-gray-400/30' },
    { nombre: 'Linux',      icono: 'devicon-linux-plain',              color: 'from-yellow-500/20 to-gray-500/20', border: 'border-yellow-500/30' },
    { nombre: 'VS Code',    icono: 'devicon-vscode-plain colored',     color: 'from-blue-500/20 to-cyan-400/20', border: 'border-blue-500/30' },
];

// Mapa de iconos para habilidades de la BD
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

const FLOAT_CLASSES = ['float-1', 'float-2', 'float-3'];

function renderTechStack() {
    const mainContainer = document.getElementById('tech-main');
    const otherContainer = document.getElementById('tech-other');
    let idx = 0;

    TECH_MAIN.forEach(tech => {
        mainContainer.appendChild(crearTechCard(tech, 'text-3xl md:text-4xl', idx++));
    });
    TECH_OTHER.forEach(tech => {
        otherContainer.appendChild(crearTechCard(tech, 'text-2xl md:text-3xl', idx++));
    });
}

function crearTechCard(tech, iconSize, index) {
    const floatClass = FLOAT_CLASSES[index % 3];
    const colorClass = tech.iconColor || '';
    const card = document.createElement('div');
    card.className = `skill-card tech-enter flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br ${tech.color} border ${tech.border} cursor-default`;
    card.dataset.index = index;
    card.innerHTML = `
        <div class="${floatClass}">
            <i class="${tech.icono} ${iconSize} ${colorClass}"></i>
        </div>
        <span class="text-xs font-medium text-gray-300">${tech.nombre}</span>
    `;
    return card;
}

// Entrada escalonada cuando la seccion es visible
function animarTechEntrada() {
    const cards = document.querySelectorAll('.tech-enter');
    const techObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Disparar la cascada de aparicion
                cards.forEach((card, i) => {
                    setTimeout(() => {
                        card.classList.add('show');
                    }, i * 70);
                });
                techObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    const section = document.querySelector('.parallax-container');
    if (section) techObserver.observe(section);
}

// Parallax con el raton
function iniciarParallax() {
    const container = document.getElementById('tech-parallax');
    if (!container) return;
    const layer = container.querySelector('.parallax-layer');

    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        layer.style.transform = `rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });

    container.addEventListener('mouseleave', () => {
        layer.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
}

// ==========================================
// PERFIL
// ==========================================
async function cargarPerfil() {
    try {
        const respuesta = await fetch(`${API_URL}/perfil`);
        const perfiles = await respuesta.json();

        if (perfiles.length > 0) {
            const p = perfiles[0];

            document.getElementById('nombre').textContent = p.nombre;
            document.getElementById('sobre_mi').textContent = p.sobre_mi;
            iniciarTyping(p.titular);

            if (p.foto_perfil) {
                const img = document.getElementById('foto_perfil');
                let ruta = p.foto_perfil;
                if (!ruta.startsWith('http') && !ruta.startsWith('/')) {
                    ruta = '/img/' + ruta;
                }
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
        ${p.email ? `<a href="mailto:${p.email}" title="Email" class="${classes} transition-colors"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${p.enlace_github ? `<a href="${p.enlace_github}" target="_blank" title="GitHub" class="${classes} transition-colors"><i class="fa-brands fa-github"></i></a>` : ''}
        ${p.enlace_linkedin ? `<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" title="LinkedIn" class="${classes} transition-colors"><i class="fa-brands fa-linkedin"></i></a>` : ''}
    `;
}

function buildEnlacesFooter(p) {
    const items = [];
    if (p.email) items.push(`<a href="mailto:${p.email}" class="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-400 transition-all duration-300 hover:-translate-y-1"><i class="fa-solid fa-envelope text-2xl"></i><span class="text-xs">Email</span></a>`);
    if (p.enlace_github) items.push(`<a href="${p.enlace_github}" target="_blank" class="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-all duration-300 hover:-translate-y-1"><i class="fa-brands fa-github text-2xl"></i><span class="text-xs">GitHub</span></a>`);
    if (p.enlace_linkedin) items.push(`<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" class="flex flex-col items-center gap-2 text-gray-400 hover:text-blue-500 transition-all duration-300 hover:-translate-y-1"><i class="fa-brands fa-linkedin text-2xl"></i><span class="text-xs">LinkedIn</span></a>`);
    return items.join('');
}

function fixUrl(url) {
    return url.startsWith('http') ? url : 'https://' + url;
}

// ==========================================
// COPIAR EMAIL
// ==========================================
function iniciarCopiarEmail() {
    const btn = document.getElementById('btn-copiar-email');
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

// ==========================================
// TYPING EFFECT
// ==========================================
function iniciarTyping(texto) {
    const el = document.getElementById('titular');
    el.textContent = '';
    el.classList.add('typing-cursor');
    let i = 0;
    const interval = setInterval(() => {
        el.textContent += texto.charAt(i);
        i++;
        if (i >= texto.length) {
            clearInterval(interval);
            setTimeout(() => el.classList.remove('typing-cursor'), 2000);
        }
    }, 60);
}

// ==========================================
// PROYECTOS
// ==========================================
async function cargarProyectos() {
    try {
        const respuesta = await fetch(`${API_URL}/proyectos`);
        const proyectos = await respuesta.json();
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

// ==========================================
// HABILIDADES (con iconos mapeados)
// ==========================================
async function cargarHabilidades() {
    try {
        const respuesta = await fetch(`${API_URL}/habilidades`);
        const habilidades = await respuesta.json();
        const contenedor = document.getElementById('lista-habilidades');
        contenedor.innerHTML = '';

        if (habilidades.length > 0) {
            habilidades.forEach(hab => {
                const badge = document.createElement('div');
                badge.className = 'inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300 cursor-default group';

                const key = hab.nombre.toLowerCase();
                const iconClass = SKILL_ICONS[key] || 'fa-solid fa-code';
                const isDevicon = iconClass.startsWith('devicon');
                const nivel = hab.nivel || '';

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

// ==========================================
// EXPERIENCIA (con entrada extra de proyectos personales)
// ==========================================
async function cargarExperiencia() {
    try {
        const respuesta = await fetch(`${API_URL}/experiencia`);
        let experiencias = await respuesta.json();
        const contenedor = document.getElementById('lista-experiencia');
        contenedor.innerHTML = '';

        // Deduplicar
        const vistos = new Set();
        experiencias = experiencias.filter(exp => {
            const clave = `${exp.empresa}-${exp.puesto}-${exp.fecha_inicio}`;
            if (vistos.has(clave)) return false;
            vistos.add(clave);
            return true;
        });

        // Anadir entrada de proyectos personales
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
            const item = document.createElement('div');
            item.className = 'relative';

            const fechaFin = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'Actualidad';
            const fechaInicio = formatearFecha(exp.fecha_inicio);
            const esActual = !exp.fecha_fin;
            const esPersonal = !!exp.enlace_github;

            item.innerHTML = `
                <div class="timeline-dot absolute -left-5 top-1.5 w-4 h-4 rounded-full border-2 border-slate-950"></div>
                <div class="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-purple-500/30 transition-all duration-300">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <h4 class="text-lg font-bold text-white">${exp.puesto}</h4>
                        <div class="flex items-center gap-2 flex-wrap">
                            ${esActual ? '<span class="px-2 py-0.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold rounded-full">Actual</span>' : ''}
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
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fecha = new Date(fechaStr);
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// ==========================================
// ANIMACIONES
// ==========================================
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

// ==========================================
// NAVBAR
// ==========================================
function iniciarNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('nav-scrolled', window.scrollY > 50);
    });

    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    toggle.addEventListener('click', () => menu.classList.toggle('hidden'));
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// ==========================================
// INICIALIZAR
// ==========================================
renderTechStack();
cargarPerfil();
cargarProyectos();
cargarHabilidades();
cargarExperiencia();

document.addEventListener('DOMContentLoaded', () => {
    iniciarAnimaciones();
    iniciarNavbar();
    iniciarCopiarEmail();
    animarTechEntrada();
    iniciarParallax();
});
