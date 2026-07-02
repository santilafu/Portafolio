# Rediseño "Terminal ámbar cinematográfico" — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskinar el portafolio a una estética "terminal retro ámbar sobre negro" (inmersivo con escape), eliminando el look genérico de IA, sin tocar backend ni datos.

**Architecture:** Todo el cambio vive en `public/index.html` (bloque `<style>` + markup) y `public/js/app.js` (plantillas de render + boot/typing + cursor/toast/easter egg). Se introduce un sistema de design tokens vía variables CSS y clases utilitarias propias; Tailwind CDN se mantiene solo para layout. Cada sección adopta un motivo "comando de terminal". No se modifica `server/`, la API ni el esquema de BD. `public/admin.html` queda intacto.

**Tech Stack:** HTML + Tailwind CSS (CDN) + Vanilla JS. Fuente IBM Plex Mono (Google Fonts). Express sirve estáticos (`npm run dev` = `node --watch server/index.js`).

## Global Constraints

- **No tocar** `server/`, la API REST, el esquema de BD ni `public/admin.html`.
- **Sin build step nuevo**: Tailwind sigue por CDN; los estilos propios van en el `<style>` de `index.html`.
- **Paleta (variables CSS, valores exactos):** fondo `#0d0b06`, superficie `#141009`, ámbar `#ffb000`, highlight `#ffc94d`, ámbar tenue `#b3760a`, texto cuerpo `#d8d2c4`, OK `#5fce7a`, error `#ff5f56`. Modo "paper" (light): fondo `#f4ecd8`, tinta `#3a2f1a`.
- **Fuente:** IBM Plex Mono en todo el sitio. Fuera Inter.
- **Glow** (`text-shadow`) solo en titulares/prompts, nunca en texto de cuerpo.
- **Accesibilidad:** todo el movimiento (flicker, scanlines animadas, boot typing) se desactiva bajo `@media (prefers-reduced-motion: reduce)` mostrando el estado final. Texto de cuerpo con contraste AA.
- **Sin regresiones funcionales:** formulario de contacto, GitHub stats, contador de visitas, easter egg (5 clics logo), toggle de tema, active-nav y carga de datos deben seguir funcionando.
- **Verificación** (no hay tests unitarios): `npm run dev`, abrir `http://localhost:3000` (o el puerto que loguee el server), revisar el resultado visual, la consola del navegador sin errores y que los datos cargan.
- **Idioma/estilo de copy:** textos sin acentos siguiendo la convención del repo; comentarios de código estilo DAM (explicativos, en español).
- **Commits frecuentes**, uno por tarea, con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## Mapa de archivos

- `public/index.html` — `<head>` (fuentes, tailwind.config), bloque `<style>` (tokens + efectos CRT + reskin de clases), markup de navbar/hero/secciones/footer.
- `public/js/app.js` — funciones de render: `cargarPerfil`, `iniciarTyping`, `cargarProyectos`, `cargarHabilidades`, `cargarExperiencia`, `formatearFecha`, `cargarCertificados`, `renderTechStack`/`crearTechCard`, `cargarGithubStats`, `iniciarFormContacto`, `iniciarCursor`, `mostrarToastBienvenida`, `iniciarEasterEgg`, `iniciarScrollProgress`, `aplicarTema`, y una nueva `iniciarBootHero`.

---

## CHECKPOINT 1 — Tokens globales + Hero terminal

### Task 1: Fundamentos — fuentes, paleta y capa CRT

**Files:**
- Modify: `public/index.html` (`<head>` líneas ~67-81 y bloque `<style>` ~83-214; `<body>` línea 217)

**Interfaces:**
- Produces: variables CSS globales (`--bg`, `--surface`, `--amber`, `--amber-hi`, `--amber-dim`, `--fg`, `--ok`, `--err`), clases `.crt-scanlines`, `.crt-vignette`, `.glow`, `.term-window`, `.term-titlebar`, `.phosphor`. Fuente IBM Plex Mono aplicada a `body`.

- [ ] **Step 1: Cambiar la fuente en `<head>`**

Reemplazar el `<link>` de Inter (línea ~70) por IBM Plex Mono y actualizar `tailwind.config`:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

```html
<script>
    tailwind.config = {
        darkMode: 'class',
        theme: { extend: { fontFamily: { mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'] } } }
    }
</script>
```

- [ ] **Step 2: Añadir tokens y capa CRT al principio del `<style>`**

Insertar al inicio del bloque `<style>`:

```css
:root {
    --bg: #0d0b06; --surface: #141009;
    --amber: #ffb000; --amber-hi: #ffc94d; --amber-dim: #b3760a;
    --fg: #d8d2c4; --ok: #5fce7a; --err: #ff5f56;
    --line: rgba(255,176,0,0.22);
}
html, body { background: var(--bg); color: var(--fg); }
body { font-family: '"IBM Plex Mono"', ui-monospace, monospace; }
.phosphor { color: var(--amber); }
.glow { text-shadow: 0 0 6px rgba(255,176,0,0.55), 0 0 14px rgba(255,176,0,0.25); }

/* Scanlines: overlay global tenue */
.crt-scanlines::before {
    content: ''; position: fixed; inset: 0; z-index: 55; pointer-events: none;
    background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.10) 3px);
    mix-blend-mode: multiply;
}
.crt-vignette { position: relative; }
.crt-vignette::after {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    box-shadow: inset 0 0 160px 40px rgba(0,0,0,0.55);
}
@keyframes crt-flicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.85} 94%{opacity:1} }
.crt-flicker { animation: crt-flicker 6s infinite steps(1); }

@media (prefers-reduced-motion: reduce) {
    .crt-flicker { animation: none; }
    .crt-scanlines::before { display: none; }
}
```

- [ ] **Step 3: Aplicar clases al `<body>`**

Cambiar la clase del `<body>` (línea 217) de `bg-slate-950 text-gray-200 font-sans` a:

```html
<body class="crt-scanlines font-mono" style="background: var(--bg); color: var(--fg);">
```

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev` y abrir `http://localhost:3000`.
Expected: el fondo es negro cálido, la tipografía es monospace, se ven scanlines muy sutiles. Aún conviven estilos viejos (normal en este paso). Consola sin errores nuevos.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat(ui): tokens terminal ambar + fuente IBM Plex Mono + capa CRT"
```

---

### Task 2: Hero como ventana de terminal + secuencia de boot

**Files:**
- Modify: `public/index.html` (header `#inicio`, líneas ~297-343)
- Modify: `public/js/app.js` (`cargarPerfil` ~293-319, `iniciarTyping` ~378-394; nueva `iniciarBootHero`)

**Interfaces:**
- Consumes: variables CSS y clases de Task 1; datos de `/perfil` (campos `nombre`, `titular`, `sobre_mi`).
- Produces: función `iniciarBootHero(perfil)` que reproduce boot + comandos autoescritos dentro de `#term-body`; se llama desde `cargarPerfil` tras pintar los datos.

- [ ] **Step 1: Reemplazar el markup del hero**

Sustituir todo el contenido de `<header id="inicio">` por una ventana de terminal. Mantener los IDs `#nombre`, `#titular`, `#sobre_mi`, `#foto_perfil`, `#enlaces`, `#btn-cv`, `#github-stats` para no romper `app.js`:

```html
<header id="inicio" class="relative overflow-hidden pt-28 pb-10 crt-vignette crt-flicker">
    <div class="max-w-4xl mx-auto px-6">
        <div class="term-window border rounded-lg overflow-hidden" style="border-color: var(--line); background: var(--surface);">
            <div class="term-titlebar flex items-center gap-2 px-4 py-2 border-b" style="border-color: var(--line);">
                <span class="w-3 h-3 rounded-full" style="background:#ff5f56"></span>
                <span class="w-3 h-3 rounded-full" style="background:#ffbd2e"></span>
                <span class="w-3 h-3 rounded-full" style="background:#27c93f"></span>
                <span class="ml-3 text-xs" style="color: var(--amber-dim)">santiago@portfolio:~</span>
            </div>
            <div id="term-body" class="p-6 text-sm md:text-base leading-relaxed min-h-[320px]">
                <!-- iniciarBootHero() escribe aqui -->
            </div>
        </div>
        <!-- Datos crudos ocultos: los rellena cargarPerfil() y los lee iniciarBootHero() -->
        <div class="sr-only">
            <span id="nombre"></span><span id="titular"></span><span id="sobre_mi"></span>
            <img id="foto_perfil" src="/img/perfil.jpg" alt="Santiago Lafuente">
            <div id="enlaces"></div>
            <a id="btn-cv" href="/cv/cv-santiago-lafuente.pdf" download>CV</a>
        </div>
    </div>
    <div class="relative max-w-4xl mx-auto px-6 pt-8">
        <div id="github-stats" class="flex flex-wrap gap-4 text-sm" style="color: var(--amber-dim)"></div>
    </div>
</header>
```

Añadir al `<style>` la utilidad `.sr-only` si no existe (Tailwind CDN ya la incluye; si no):

```css
.sr-only { position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0; }
```

- [ ] **Step 2: Escribir `iniciarBootHero` en `app.js`**

Añadir esta función y un helper de typing. Reproduce boot + comandos; respeta reduced-motion pintando el resultado final directo.

```js
// ============================================================
// HERO TERMINAL: secuencia de boot + comandos autoescritos
// ============================================================
function iniciarBootHero(perfil) {
    const body = document.getElementById('term-body');
    if (!body) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const nombre  = perfil.nombre || 'Santiago Lafuente';
    const titular = perfil.titular || 'Desarrollador Multiplataforma';
    const bio     = perfil.sobre_mi || '';

    // Bloques finales que quedaran en pantalla
    const finalHtml = `
        <div style="color: var(--ok)">&gt; initializing portfolio... [OK]</div>
        <div style="color: var(--ok)">&gt; loading profile.............. [OK]</div>
        <div class="mt-4"><span class="phosphor">$</span> whoami</div>
        <div class="glow phosphor text-2xl md:text-3xl font-bold mt-1">${nombre}</div>
        <div style="color: var(--amber-dim)">Titulado en DAM (9.0) &middot; ${titular}</div>
        <div class="mt-4"><span class="phosphor">$</span> cat about.txt</div>
        <div class="mt-1">${bio}</div>
        <div class="mt-4 flex flex-wrap gap-4 items-center">
            <a href="/cv/cv-santiago-lafuente.pdf" download class="phosphor hover:underline">[ descargar CV ]</a>
            <a href="#contacto" class="phosphor hover:underline">[ ./contact.sh ]</a>
        </div>
        <div class="mt-4"><span class="phosphor">$</span> <span class="term-caret">&nbsp;</span></div>`;

    if (reduce) { body.innerHTML = finalHtml; return; }

    // Animacion: revelamos el bloque final con un fade + caret (simple y robusto)
    body.style.opacity = '0';
    body.innerHTML = finalHtml;
    requestAnimationFrame(() => {
        body.style.transition = 'opacity 0.5s ease';
        body.style.opacity = '1';
    });
}
```

> Nota: se opta por un reveal con caret en vez de typing carácter-a-carácter para robustez y rendimiento; el efecto "boot" se transmite con las líneas `[OK]` y el caret. (El typing char-a-char queda como mejora en Checkpoint 5 si se desea.)

- [ ] **Step 3: Añadir estilo del caret**

En el `<style>`:

```css
.term-caret { display:inline-block; width:0.6em; height:1.1em; background: var(--amber);
    box-shadow: 0 0 8px rgba(255,176,0,0.7); animation: caret-blink 1s step-end infinite; vertical-align: text-bottom; }
@keyframes caret-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .term-caret { animation: none; } }
```

- [ ] **Step 4: Llamar a `iniciarBootHero` desde `cargarPerfil`**

En `cargarPerfil` (~299-301), tras asignar `nombre/sobre_mi` y en lugar de `iniciarTyping(p.titular)`, añadir:

```js
document.getElementById('nombre').textContent   = p.nombre;
document.getElementById('sobre_mi').textContent = p.sobre_mi;
document.getElementById('titular').textContent  = p.titular;
iniciarBootHero(p);
```

Dejar el resto de `cargarPerfil` (foto, enlaces, footer, email) igual.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev` → recargar.
Expected: el hero es una ventana de terminal con barra de título; aparecen líneas `[OK]`, `$ whoami` con tu nombre en ámbar con glow, `$ cat about.txt` con la bio, enlaces `[ ./contact.sh ]` y un caret ámbar parpadeante. Con reduced-motion activado, se ve el estado final sin fade. Consola sin errores.

- [ ] **Step 6: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): hero terminal con secuencia de boot y comandos autoescritos"
```

---

### Task 3: Navbar, cursor, scroll-progress y toast en clave terminal

**Files:**
- Modify: `public/index.html` (navbar ~255-292, `#scroll-progress` ~87-92, cursor markup ~237-238, toast ~241-250)
- Modify: `public/js/app.js` (`iniciarCursor` ~128-158)

**Interfaces:**
- Consumes: tokens de Task 1.
- Produces: cursor bloque ámbar; navbar/toast/scroll-bar recoloreados.

- [ ] **Step 1: Recolorear scroll-progress y navbar**

En `<style>`, cambiar el gradiente de `#scroll-progress` (línea ~89) por:

```css
#scroll-progress { position: fixed; top:0; left:0; height:3px; width:0%; background: var(--amber); box-shadow: 0 0 8px rgba(255,176,0,0.7); z-index:60; transition: width 0.1s linear; }
```

Cambiar `.nav-scrolled` (~167) y `.nav-link.active::after` (~170) a ámbar:

```css
.nav-scrolled { background: rgba(13,11,6,0.92); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.nav-link.active { color: var(--amber); }
.nav-link.active::after { content:''; display:block; height:2px; background: var(--amber); margin-top:2px; }
```

En el markup del navbar, cambiar el botón "Contactar" (línea ~266) y clases de color de gris a ámbar; reemplazar `bg-gradient-to-r from-blue-600 to-purple-600` por un borde ámbar:

```html
<a href="#contacto" class="px-4 py-2 border rounded text-sm hover:bg-[rgba(255,176,0,0.1)] transition-colors" style="border-color: var(--line); color: var(--amber);">$ contact</a>
```

- [ ] **Step 2: Cursor bloque ámbar**

En `<style>` reemplazar `.cursor-dot`/`.cursor-ring` (~100-119) por un bloque:

```css
.cursor-dot { width:10px; height:16px; background: var(--amber); position:fixed; pointer-events:none; z-index:9999; transform: translate(-50%,-50%); box-shadow: 0 0 8px rgba(255,176,0,0.7); transition: opacity .3s, transform .1s; }
.cursor-ring { display:none; }
.cursor-dot.cursor-hover { transform: translate(-50%,-50%) scale(1.4); }
```

`iniciarCursor` en `app.js` ya mueve `#cursor-dot`; funciona sin cambios de lógica (solo el ring queda oculto). Verificar que no falle si `ring` existe.

- [ ] **Step 3: Toast en clave terminal**

En el markup del toast (~242-249), cambiar a estilo terminal:

```html
<div class="flex items-center gap-3 px-5 py-4 border rounded" style="background: var(--surface); border-color: var(--line);">
    <span class="phosphor">[system]</span>
    <div>
        <p class="phosphor text-sm font-semibold">welcome</p>
        <p class="text-xs mt-0.5" style="color: var(--amber-dim)">gracias por visitar mi portafolio</p>
    </div>
    <button onclick="cerrarToast()" class="ml-2 hover:opacity-70 text-lg leading-none" style="color: var(--amber-dim)">×</button>
</div>
```

- [ ] **Step 4: Verificar en navegador**

Expected: cursor es un bloque ámbar; la barra de progreso es ámbar; navbar al hacer scroll tiene fondo oscuro con borde ámbar; el link activo se subraya en ámbar; el toast de bienvenida sale en clave terminal. Sin errores en consola. El menú móvil y el toggle siguen operativos.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): navbar, cursor bloque, scroll-bar y toast en estetica terminal ambar"
```

**🔎 CHECKPOINT 1 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 2 — Motivo de comandos + Proyectos + Habilidades

### Task 4: Cabeceras de sección como comandos + reskin del tech stack

**Files:**
- Modify: `public/index.html` (cabeceras de cada `<section>`: tech ~352-355, proyectos ~372-375, habilidades ~385-388, experiencia ~398-401, certificados ~411-414, y contacto)
- Modify: `public/js/app.js` (`crearTechCard` ~61-73)

**Interfaces:**
- Produces: patrón de cabecera reutilizable `.section-cmd`.

- [ ] **Step 1: Añadir clase de cabecera-comando**

En `<style>`:

```css
.section-cmd { color: var(--amber); font-weight: 600; }
.section-cmd .prompt { color: var(--amber-dim); }
```

- [ ] **Step 2: Reemplazar cada cabecera centrada por un comando**

Sustituir el bloque `<div class="text-center mb-10">...</div>` de cada sección por (ejemplo proyectos):

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> ls ~/proyectos</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
</div>
```

Comandos por sección: tech → `$ cat tech_stack.txt`; proyectos → `$ ls ~/proyectos`; habilidades → `$ skills --list`; experiencia → `$ git log --experiencia`; certificados → `$ cat certificados/`; contacto → `$ ./contact.sh`.

- [ ] **Step 3: Reskin de las tech cards**

En `crearTechCard` (~61-73), sustituir las clases de color (gradientes/bordes de colores variados) por caja ámbar uniforme. Reemplazar el `className` de la card por:

```js
card.className = 'tech-enter flex flex-col items-center justify-center gap-2 p-4 border rounded skill-card';
card.style.borderColor = 'var(--line)';
card.style.background = 'var(--surface)';
```

Mantener el `<i>` del icono y el nombre; el nombre en `color: var(--fg)`.

- [ ] **Step 4: Verificar en navegador**

Expected: cada sección tiene su cabecera-comando con línea divisoria ámbar; las tech cards son cajas ámbar uniformes (sin arcoíris). Consola limpia.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): cabeceras de seccion como comandos + tech stack ambar"
```

---

### Task 5: Proyectos como paneles de terminal

**Files:**
- Modify: `public/js/app.js` (`cargarProyectos` ~396-473)

**Interfaces:**
- Consumes: `/proyectos` (campos `titulo`, `descripcion`, `url_repo`, `url_demo`, `imagen`, `destacado`, `estado`).
- Produces: tarjetas con cabecera de archivo y badge `[WIP]`.

- [ ] **Step 1: Reskinar la plantilla de tarjeta de proyecto**

En `cargarProyectos`, para cada proyecto renderizar un panel con cabecera tipo archivo y borde ámbar. Estructura por tarjeta (reemplazar las clases slate/purple por tokens):

```js
const wip = proyecto.estado === 'en_desarrollo'
    ? '<span class="ml-2 text-xs" style="color: var(--err)">[WIP]</span>' : '';
card.className = 'border rounded overflow-hidden card-hover';
card.style.borderColor = 'var(--line)';
card.style.background = 'var(--surface)';
card.innerHTML = `
    <div class="px-4 py-2 border-b text-xs flex items-center justify-between" style="border-color: var(--line); color: var(--amber-dim)">
        <span>proyecto_${String(idx+1).padStart(2,'0')}.md${''}</span>${wip}
    </div>
    <div class="p-5">
        <h4 class="phosphor font-bold text-lg">${proyecto.titulo}</h4>
        <p class="mt-2 text-sm" style="color: var(--fg)">${proyecto.descripcion}</p>
        <div class="mt-4 flex gap-4 text-sm">
            ${proyecto.url_repo ? `<a href="${proyecto.url_repo}" target="_blank" class="phosphor hover:underline">[ repo ]</a>` : ''}
            ${proyecto.url_demo ? `<a href="${proyecto.url_demo}" target="_blank" class="phosphor hover:underline">[ demo ]</a>` : ''}
        </div>
    </div>`;
```

Mantener el tratamiento especial del **destacado** (SuscriptWallet): si `proyecto.destacado`, aplicar `lg:col-span-2` y mostrar la imagen `proyecto.imagen` como banner arriba del panel. Conservar la lógica de orden existente.

- [ ] **Step 2: Verificar en navegador**

Expected: proyectos como paneles con cabecera `proyecto_NN.md`, título ámbar, enlaces `[ repo ]`/`[ demo ]`; Revisa y Rondas muestran `[WIP]` en rojo; SuscriptWallet sigue destacado ancho con su banner. Los enlaces funcionan.

- [ ] **Step 3: Commit**

```bash
git add public/js/app.js
git commit -m "feat(ui): proyectos como paneles de terminal con badge [WIP]"
```

---

### Task 6: Habilidades con barras ASCII

**Files:**
- Modify: `public/js/app.js` (`cargarHabilidades` ~475-508)
- Modify: `public/index.html` (contenedor `#lista-habilidades` ~389: cambiar a bloque monospace de ancho contenido)

**Interfaces:**
- Consumes: `/habilidades` (campos `nombre`, `nivel` ∈ {Basico, Intermedio, Avanzado}).
- Produces: salida tipo `skills --list` con barras ASCII.

- [ ] **Step 1: Ajustar el contenedor**

Cambiar `#lista-habilidades` de `flex flex-wrap justify-center gap-3` a:

```html
<div id="lista-habilidades" class="max-w-2xl border rounded p-5 text-sm" style="border-color: var(--line); background: var(--surface);"></div>
```

- [ ] **Step 2: Render con barras ASCII**

Reescribir `cargarHabilidades` para mapear nivel → nº de bloques llenos (Basico=3, Intermedio=6, Avanzado=8 de 8) y pintar filas monospace alineadas:

```js
const nivelBloques = { 'Basico': 3, 'Intermedio': 6, 'Avanzado': 8 };
const filas = habilidades.map(h => {
    const llenos = nivelBloques[h.nivel] || 4;
    const barra = '█'.repeat(llenos) + '░'.repeat(8 - llenos);
    const nombre = h.nombre.padEnd(12, ' ').replace(/ /g, ' ');
    return `<div class="flex items-center gap-3 py-0.5">
        <span class="phosphor" style="white-space:pre">${nombre}</span>
        <span style="color: var(--amber)">[${barra}]</span>
        <span style="color: var(--amber-dim)">${h.nivel}</span>
    </div>`;
}).join('');
contenedor.innerHTML = filas;
```

- [ ] **Step 3: Verificar en navegador**

Expected: habilidades como lista monospace alineada, cada una con barra `[██████░░]` ámbar y su nivel. Alineación correcta con las tres longitudes de nombre. Consola limpia.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): habilidades con barras ASCII estilo skills --list"
```

**🔎 CHECKPOINT 2 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 3 — Experiencia (git log) + Certificados

### Task 7: Experiencia como `git log`

**Files:**
- Modify: `public/js/app.js` (`cargarExperiencia` ~514-591, `formatearFecha` se mantiene)

**Interfaces:**
- Consumes: `/experiencia` (campos `empresa`, `puesto`, `fecha_inicio`, `fecha_fin`, `descripcion`, `logo`; más la entrada personal hardcodeada existente con `enlace_github`).
- Produces: render tipo commits de git.

- [ ] **Step 1: Generar un "hash" corto determinista**

Añadir helper (sin `Math.random` para que sea estable):

```js
function pseudoHash(str) {
    let h = 0; for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
    return h.toString(16).padStart(7, '0').slice(0, 7);
}
```

- [ ] **Step 2: Reescribir el render como commits**

Mantener la deduplicación y la entrada extra de "proyectos personales" existentes. Cambiar solo la plantilla del item:

```js
experiencias.forEach(exp => {
    const fin = exp.fecha_fin ? formatearFecha(exp.fecha_fin) : 'HEAD';
    const ini = formatearFecha(exp.fecha_inicio);
    const rama = exp.fecha_fin ? '' : '<span style="color: var(--ok)"> (HEAD -> activo)</span>';
    const hash = pseudoHash(exp.empresa + exp.puesto);
    const item = document.createElement('div');
    item.className = 'pl-4 border-l pb-6';
    item.style.borderColor = 'var(--line)';
    item.innerHTML = `
        <div style="color: var(--amber)">commit ${hash}${rama}</div>
        <div style="color: var(--amber-dim)">Author: ${exp.empresa}</div>
        <div style="color: var(--amber-dim)">Date:   ${ini} - ${fin}</div>
        <div class="mt-2 phosphor font-semibold">${exp.puesto}</div>
        ${exp.descripcion ? `<div class="mt-1 text-sm" style="color: var(--fg)">${exp.descripcion}</div>` : ''}
        ${exp.enlace_github ? `<a href="${exp.enlace_github}" target="_blank" class="text-sm phosphor hover:underline">[ github ]</a>` : ''}`;
    contenedor.appendChild(item);
});
```

Sustituye el bloque `timeline`/`item.innerHTML` anterior. Elimina referencias a `timeline-line`/`timeline-dot`/`logoHtml`/badges antiguos.

- [ ] **Step 3: Verificar en navegador**

Expected: experiencia como lista de commits: `commit <hash>`, `Author:`, `Date:`, puesto en ámbar y descripción; GDES con rango de fechas cerrado; proyectos personales como `(HEAD -> activo)` verde con enlace `[ github ]`. Consola limpia.

- [ ] **Step 4: Commit**

```bash
git add public/js/app.js
git commit -m "feat(ui): experiencia renderizada como git log"
```

---

### Task 8: Certificados como archivos

**Files:**
- Modify: `public/js/app.js` (`cargarCertificados` ~606-673)

**Interfaces:**
- Consumes: `/certificados` (campos `titulo`, `emisor`, `fecha`, `descripcion`, `url_archivo`, `url_externa`).

- [ ] **Step 1: Reskinar la tarjeta de certificado**

Reemplazar clases de color por tokens; cabecera tipo archivo `.pdf`:

```js
card.className = 'border rounded overflow-hidden card-hover';
card.style.borderColor = 'var(--line)';
card.style.background = 'var(--surface)';
card.innerHTML = `
    <div class="px-4 py-2 border-b text-xs" style="border-color: var(--line); color: var(--amber-dim)">
        <i class="fa-solid fa-file-lines mr-1"></i> cert_${String(idx+1).padStart(2,'0')}.pdf
    </div>
    <div class="p-5">
        <h4 class="phosphor font-bold">${cert.titulo}</h4>
        <p class="text-sm mt-1" style="color: var(--amber-dim)">${cert.emisor} &middot; ${formatearFecha(cert.fecha)}</p>
        <p class="text-sm mt-2" style="color: var(--fg)">${cert.descripcion}</p>
        ${cert.url_archivo ? `<a href="${cert.url_archivo}" target="_blank" class="text-sm phosphor hover:underline mt-3 inline-block">[ abrir ]</a>` : ''}
    </div>`;
```

- [ ] **Step 2: Verificar en navegador**

Expected: certificados como tarjetas con cabecera `cert_NN.pdf`, título ámbar, emisor+fecha, y enlace `[ abrir ]` que descarga/abre el PDF. Consola limpia.

- [ ] **Step 3: Commit**

```bash
git add public/js/app.js
git commit -m "feat(ui): certificados como archivos de terminal"
```

**🔎 CHECKPOINT 3 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 4 — Contacto + GitHub stats + footer + easter egg + modo paper

### Task 9: Formulario de contacto en clave terminal

**Files:**
- Modify: `public/index.html` (sección `#contacto` y `.form-input` en `<style>` ~203-213)
- Modify: `public/js/app.js` (`iniciarFormContacto` ~675-720, `mostrarFeedback` ~721-732)

**Interfaces:**
- Consumes: POST `/contacto` (campos `nombre`, `email`, `mensaje`) — sin cambios de lógica.

- [ ] **Step 1: Reskinar `.form-input` y prompts**

En `<style>`:

```css
.form-input { width:100%; padding:0.6rem 0.8rem; background: var(--bg); border:1px solid var(--line); border-radius:4px; color: var(--fg); outline:none; font-family: inherit; transition: border-color .2s; }
.form-input::placeholder { color: var(--amber-dim); }
.form-input:focus { border-color: var(--amber); box-shadow: 0 0 0 1px var(--amber); }
```

En el markup del formulario, prefijar cada label con `>` y el botón enviar como `$ send`:

```html
<button id="btn-enviar" type="submit" class="px-5 py-2.5 border rounded phosphor hover:bg-[rgba(255,176,0,0.1)] transition-colors" style="border-color: var(--amber)">$ send</button>
```

- [ ] **Step 2: Feedback en clave terminal**

En `mostrarFeedback`, mantener la lógica; usar colores por token. Éxito con `var(--ok)` y prefijo `[ok]`, error con `var(--err)` y prefijo `[error]`. Ejemplo de llamada de éxito en `iniciarFormContacto`:

```js
mostrarFeedback(feedback, '[ok] mensaje enviado correctamente', '');
```

Ajustar `mostrarFeedback` para aplicar color por argumento (usar `el.style.color`) en vez de clases Tailwind de color:

```js
function mostrarFeedback(el, texto, color) {
    el.textContent = texto;
    el.style.color = color || 'var(--ok)';
    el.classList.remove('hidden');
}
```

Y en el `catch`/validaciones pasar `'var(--err)'`.

- [ ] **Step 3: Verificar en navegador**

Expected: campos oscuros con borde ámbar al enfocar, botón `$ send`. Enviar un mensaje de prueba muestra `[ok] ...` en verde; un envío inválido muestra `[error] ...` en rojo. El email real sigue llegando (backend intacto).

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): formulario de contacto en estetica terminal"
```

---

### Task 10: GitHub stats, footer y easter egg

**Files:**
- Modify: `public/js/app.js` (`cargarGithubStats` ~213-260, `iniciarEasterEgg`/panel ~734-765)
- Modify: `public/index.html` (footer, panel de stats ~220-231)

**Interfaces:**
- Consumes: API pública de GitHub (sin cambios) y `/visitas`.

- [ ] **Step 1: GitHub stats como salida de comando**

En `cargarGithubStats`, envolver la salida con un prefijo `$ git stats` y recolorear los ítems a ámbar/tenue (reemplazar `text-gray-500`/colores por `var(--amber-dim)` y los números en `phosphor`). Mantener los datos que ya calcula (repos, seguidores, etc.).

- [ ] **Step 2: Panel easter-egg como `sudo stats`**

En el markup `#stats-panel` (~220-231), recolorear a tokens y cambiar el título a:

```html
<span class="text-xs uppercase tracking-widest phosphor font-semibold">$ sudo stats</span>
```

Recolorear textos internos a `var(--fg)`/`var(--amber)`. La lógica de `iniciarEasterEgg` no cambia.

- [ ] **Step 3: Footer en clave terminal**

Recolorear el footer a tokens y cerrar con una línea tipo prompt:

```html
<p style="color: var(--amber-dim)">// EOF &mdash; Santiago Lafuente 2026 <span class="term-caret">&nbsp;</span></p>
```

- [ ] **Step 4: Verificar en navegador**

Expected: barra de stats con prefijo `$ git stats` y números en ámbar; footer con `// EOF` y caret; 5 clics en el logo abren el panel `$ sudo stats` con las visitas. Consola limpia.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): github stats, footer y easter egg en clave terminal"
```

---

### Task 11: Modo claro = "paper terminal"

**Files:**
- Modify: `public/index.html` (bloque `[data-theme="light"]` en `<style>` ~190-213)
- Modify: `public/js/app.js` (`aplicarTema` ~280-292 si hace falta ajustar icono)

**Interfaces:**
- Consumes: toggle de tema existente (`iniciarThemeToggle`, `aplicarTema`).

- [ ] **Step 1: Reescribir las reglas de tema claro**

Sustituir el bloque `[data-theme="light"] ...` por variables paper (tinta marrón sobre crema). En vez de sobreescribir clases slate, sobreescribir las variables raíz:

```css
[data-theme="light"] :root, [data-theme="light"] body {
    --bg: #f4ecd8; --surface: #ece0c4; --fg: #3a2f1a;
    --amber: #9a5b00; --amber-hi: #7a4600; --amber-dim: #8a6a3a; --line: rgba(154,91,0,0.30);
}
[data-theme="light"] .glow { text-shadow: none; }
[data-theme="light"] .cursor-dot { box-shadow: none; }
```

> Como todo el reskin usa `var(--...)`, cambiar las variables propaga el modo paper a todo el sitio sin reglas por-clase.

- [ ] **Step 2: Verificar en navegador**

Expected: pulsar el toggle cambia a fondo crema con tinta marrón (aspecto de impresora antigua), sin glow; el terminal y todas las secciones siguen legibles y coherentes. Volver a oscuro funciona. El tema persiste en localStorage (lógica intacta).

- [ ] **Step 3: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): modo claro reconvertido a paper terminal via variables CSS"
```

**🔎 CHECKPOINT 4 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 5 — Pulido: accesibilidad, responsive, rendimiento, QA

### Task 12: Responsive y degradado en móvil

**Files:**
- Modify: `public/index.html` (hero terminal, tamaños; secciones)
- Modify: `public/js/app.js` (`iniciarBootHero` si acorta boot en móvil)

- [ ] **Step 1: Ajustes móviles del hero**

Asegurar que el `.term-window` no desborda en móvil: padding reducido, `text-xs` en `<380px`, min-height adaptativa. Verificar barras ASCII de habilidades: en móvil, permitir scroll horizontal del contenedor `#lista-habilidades` con `overflow-x-auto` para no romper alineación monospace.

- [ ] **Step 2: Verificar en DevTools (responsive)**

Run: DevTools → modo dispositivo (iPhone SE / 360px).
Expected: hero legible sin scroll horizontal; barras ASCII no rompen el layout; proyectos en una columna; navbar móvil operativa.

- [ ] **Step 3: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "fix(ui): responsive del terminal en movil"
```

---

### Task 13: QA de accesibilidad y regresiones + limpieza

**Files:**
- Modify: `public/index.html` (limpiar CSS muerto: `.gradient-text`, `.timeline-*`, `.badge-pulse`, floats/parallax no usados si quedaron huérfanos)
- Modify: `public/js/app.js` (eliminar código muerto de parallax/typing si dejó de usarse)

- [ ] **Step 1: prefers-reduced-motion**

Verificar (DevTools → Rendering → Emulate `prefers-reduced-motion`) que no hay flicker ni scanlines animadas y que el hero muestra el estado final directo.

- [ ] **Step 2: Contraste y foco**

Comprobar contraste del texto de cuerpo (`--fg` sobre `--bg`) ≥ 4.5:1 y que los enlaces/botones son alcanzables con teclado (focus visible: añadir `:focus-visible { outline: 2px solid var(--amber); }` global si falta).

- [ ] **Step 2b: Añadir focus-visible global**

En `<style>`:

```css
a:focus-visible, button:focus-visible, .form-input:focus-visible { outline: 2px solid var(--amber); outline-offset: 2px; }
```

- [ ] **Step 3: Regresión funcional completa**

Checklist manual en `localhost`: carga de perfil/proyectos/habilidades/experiencia/certificados/tech; envío del formulario (llega email); GitHub stats; contador de visitas; easter egg (5 clics); toggle de tema (dark↔paper) con persistencia; navbar activa al hacer scroll; menú móvil. Consola sin errores.

- [ ] **Step 4: Limpiar CSS/JS muerto**

Eliminar reglas y funciones que ya no se usan (gradient-text, timeline-line/dot, badge-pulse, parallax/float si quedaron huérfanos, `iniciarTyping` si se dejó de llamar). Verificar que la página sigue igual tras la limpieza.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "chore(ui): QA accesibilidad, focus-visible y limpieza de CSS/JS muerto"
```

**🔎 CHECKPOINT 5 — revisión final del usuario. Tras aprobación: push a main (auto-deploy en Render) cuando el usuario lo pida.**

---

## Notas de cierre

- **Actualizar memoria** (`MEMORY.md`) tras completar: nuevo sistema de diseño terminal-ámbar, fuente IBM Plex Mono, hero boot, motivos por sección.
- El push a `main` dispara auto-deploy en Render; hacerlo solo cuando el usuario lo apruebe.
- No se han tocado migraciones ni BD: no hay pasos de despliegue de datos.
