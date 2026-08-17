# Rediseño "Cinematográfico Apple × reclutadores" — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sustituir la identidad visual "terminal ámbar/menta" por una estética cinematográfica inspirada en anuncios de producto de Apple (tipografía grande, fondo degradado oscuro, foto circular con halo, motas de profundidad, revelado de texto y scroll reveals), manteniendo intacto todo el contenido, datos y funcionalidad.

**Architecture:** Todo el cambio vive en `public/index.html` (tokens CSS + markup) y `public/js/app.js` (plantillas de render). Se renombra el sistema de variables CSS (de `--amber*`/`.phosphor` a `--accent*`/`--muted`/`.accent-text`) y se sustituye la capa "CRT/terminal" (scanlines, cursor custom, ventana de terminal, comandos `$`, barras ASCII, git-log cosplay) por un lenguaje visual limpio: fondo con degradado radial en el hero, foto circular con halo que respira, motas de profundidad, cabeceras de sección como etiquetas simples con línea de acento, tarjetas con badges/enlaces limpios. No se toca `server/`, la API, la BD ni `public/admin.html`.

**Tech Stack:** HTML + Tailwind CSS (CDN) + Vanilla JS. Tipografía de sistema (`-apple-system, "Helvetica Neue", Arial, sans-serif`). Express sirve estáticos (`npm run dev` = `node --watch server/index.js`).

## Global Constraints

- **No tocar** `server/`, la API REST, el esquema de BD ni `public/admin.html`.
- **Sin build step nuevo**: Tailwind sigue por CDN; los estilos propios van en el `<style>` de `index.html`.
- **Paleta (variables CSS, valores exactos, modo oscuro):** `--bg:#070b12`, `--surface:#101527`, `--accent:#7c8cff`, `--accent-hi:#a5b4ff`, `--muted:#9aa2c0`, `--fg:#f2f3f7`, `--ok:#5fce7a` (sin cambios), `--err:#ff5f56` (sin cambios), `--line:rgba(124,140,255,0.22)`, `--hero-gradient:radial-gradient(120% 100% at 50% -10%, #1c2440 0%, #0a0d1a 45%, #050608 100%)`.
- **Paleta modo claro:** `--bg:#f7f7fb`, `--surface:#ffffff`, `--fg:#14161f`, `--accent:#5865f2`, `--accent-hi:#4550c9`, `--muted:#5b6178`, `--line:rgba(88,101,242,0.22)`, `--hero-gradient` version clara (ver Tarea 1).
- **Tipografía:** pila de sistema (`-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`) en todo el sitio. Se retira IBM Plex Mono como fuente principal (Google Fonts link + override de Tailwind).
- **Movimiento:** motas de profundidad en el hero, halo de foto que respira, revelado de texto escalonado (`.hero-line` + `.hero-ready`), scroll reveals (`.fade-up`) con leve escala, micro-interacciones en botones. **Todo** debe respetar `@media (prefers-reduced-motion: reduce)` mostrando el estado final sin animación.
- **Se elimina:** scanlines (`.crt-scanlines`), viñeta parpadeante (`.crt-vignette`/`.crt-flicker`), cursor personalizado (`.cursor-dot`/`.cursor-ring`/`iniciarCursor`), ventana de terminal (`.term-window`/`.term-titlebar`/`crt-power-on`), caret parpadeante (`.term-caret`), comandos `$` en cabeceras, barras ASCII `█░`, cosplay de `git log` (incluye `pseudoHash`), etiquetas de archivo (`proyecto_NN.md`, `cert_NN.pdf`) y enlaces/badges entre corchetes (`[WIP]`, `[ repo ]`, `[ demo ]`, `[ abrir ]`, `[ok]`, `[error]`).
- **Se mantiene sin cambios de lógica:** todos los endpoints consumidos, el toggle de tema (`iniciarThemeToggle`/`aplicarTema`), el easter egg (`iniciarEasterEgg`), el formulario de contacto (`iniciarFormContacto`), el contador de visitas (`registrarVisita`), el parallax del tech stack (`iniciarParallax`), la navegación activa (`iniciarActiveNav`), la foto de perfil, todos los iconos de tecnología y los datos reales (nombre, bio, proyectos, skills, experiencia, certificados).
- **Verificación** (no hay tests unitarios): `npm run dev`, abrir `http://localhost:3000` (o el puerto que loguee el server), revisar el resultado visual, la consola del navegador sin errores y que los datos cargan.
- **Idioma/estilo de copy:** textos sin acentos siguiendo la convención del repo cuando el copy ya existente lo hacía así; comentarios de código estilo DAM (explicativos, en español).
- **Commits frecuentes**, uno por tarea, con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## Mapa de archivos

- `public/index.html` — `<head>` (fuentes), bloque `<style>` (tokens + capa CRT a eliminar + nuevo sistema hero/secciones/tarjetas), markup de navbar/hero/secciones/footer.
- `public/js/app.js` — funciones de render: `cargarPerfil`, `cargarProyectos`, `cargarHabilidades`, `cargarExperiencia`, `cargarCertificados`, `crearTechCard`/`renderTechStack` (sin cambios de lógica), `cargarGithubStats`, `iniciarFormContacto`, `iniciarCursor` (se elimina), `mostrarToastBienvenida`, `iniciarEasterEgg`, `iniciarScrollProgress`, `aplicarTema`. Se elimina `iniciarBootHero`/`_bootTimer`/`escHtml`/`pseudoHash`/`buildEnlaces`.

---

## CHECKPOINT 1 — Tokens globales + Hero cinematográfico

### Task 1: Sistema de tokens — renombrar variables/clase de acento + nueva paleta + tipografía

**Files:**
- Modify: `public/index.html` (`<head>` líneas ~67-77, bloque `<style>` completo, `<body>` línea 370)
- Modify: `public/js/app.js` (todas las referencias a `var(--amber*)`/`.phosphor`)

**Interfaces:**
- Produces: variables CSS `--bg`, `--surface`, `--accent`, `--accent-hi`, `--muted`, `--fg`, `--ok`, `--err`, `--line`, `--hero-gradient`; clase `.accent-text` (sustituye a `.phosphor`).

- [ ] **Step 1: Renombrar `--amber-dim` a `--muted` (el más específico, primero)**

```bash
sed -i 's/--amber-dim/--muted/g' public/index.html public/js/app.js
```

- [ ] **Step 2: Renombrar `--amber-hi` a `--accent-hi`**

```bash
sed -i 's/--amber-hi/--accent-hi/g' public/index.html public/js/app.js
```

- [ ] **Step 3: Renombrar el resto de `--amber` a `--accent`**

```bash
sed -i 's/--amber/--accent/g' public/index.html public/js/app.js
```

- [ ] **Step 4: Renombrar los valores rgba en crudo del acento anterior**

El acento anterior (verde menta) aparece también como tripleta rgba fuera de las variables (glow, sombras). La sustituimos por la tripleta del nuevo acento (`#7c8cff` → `124,140,255`):

```bash
sed -i 's/94,234,212/124,140,255/g' public/index.html public/js/app.js
```

- [ ] **Step 5: Renombrar la clase `.phosphor` a `.accent-text`**

```bash
sed -i 's/phosphor/accent-text/g' public/index.html public/js/app.js
```

- [ ] **Step 6: Verificar que no queda ninguna referencia antigua**

```bash
grep -rn -- "--amber\|phosphor" public/index.html public/js/app.js
```

Expected: sin resultados (comando vacío).

- [ ] **Step 7: Reescribir los valores de los tokens `:root`**

Busca el bloque `:root { ... }` al principio del `<style>` (justo después del comentario `/* ── TOKENS TERMINAL ... */`, ya con los nombres renombrados por los steps anteriores) y sustitúyelo por:

```css
:root {
    --bg: #070b12; --surface: #101527;
    --accent: #7c8cff; --accent-hi: #a5b4ff; --muted: #9aa2c0;
    --fg: #f2f3f7; --ok: #5fce7a; --err: #ff5f56;
    --line: rgba(124,140,255,0.22);
    --hero-gradient: radial-gradient(120% 100% at 50% -10%, #1c2440 0%, #0a0d1a 45%, #050608 100%);
}
```

- [ ] **Step 8: Reescribir los valores del bloque `[data-theme="light"]`**

Busca el bloque `[data-theme="light"] { ... }` (ya renombrado por los steps anteriores) y sustitúyelo por:

```css
[data-theme="light"] {
    --bg: #f7f7fb; --surface: #ffffff; --fg: #14161f;
    --accent: #5865f2; --accent-hi: #4550c9; --muted: #5b6178; --line: rgba(88,101,242,0.22);
    --hero-gradient: radial-gradient(120% 100% at 50% -10%, #eef0ff 0%, #f7f7fb 60%, #ffffff 100%);
}
```

- [ ] **Step 9: Quitar la fuente IBM Plex Mono y el override de Tailwind**

En `<head>`, elimina el `<link>` de Google Fonts y el `<script>` de `tailwind.config` que lo acompaña (justo antes del bloque `<style>`):

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap" rel="stylesheet">

<script>
    tailwind.config = {
        darkMode: 'class',
        theme: { extend: { fontFamily: { mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'] } } }
    }
</script>
```

No se sustituyen por nada: Tailwind CDN ya trae una pila `font-mono` por defecto para el uso puntual que quede (ver Tarea 5 en adelante).

- [ ] **Step 10: Cambiar la tipografía base del `<body>`**

En el `<style>`, busca `body { font-family: 'IBM Plex Mono', ui-monospace, monospace; }` y sustitúyelo por:

```css
body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; }
```

- [ ] **Step 11: Verificar en navegador**

Run: `npm run dev` y abrir `http://localhost:3000`.
Expected: el sitio sigue funcionando visualmente igual que antes (aún con la estructura de terminal), pero el acento ha pasado de verde menta a azul-violeta y la tipografía es sans-serif. Es normal que convivan elementos con el look antiguo — se sustituyen en las tareas siguientes. Consola sin errores.

- [ ] **Step 12: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "refactor(ui): renombra tokens de diseno (amber->accent) y cambia paleta/tipografia a estetica cinematografica"
```

---

### Task 2: Eliminar la capa CRT y el cursor personalizado

**Files:**
- Modify: `public/index.html` (bloque `<style>`: reglas CRT/cursor/term-caret/photo-frame/otw-badge/stats-line/embers/term-window, `<body>` línea 370, markup del cursor líneas ~393-395)
- Modify: `public/js/app.js` (`iniciarCursor` ~132-156 y su llamada en `DOMContentLoaded`)

**Interfaces:**
- Consumes: ninguna de las clases eliminadas se reutiliza en tareas posteriores (el hero se reconstruye desde cero en la Tarea 3 con clases nuevas).

- [ ] **Step 1: Eliminar la capa de scanlines/viñeta/flicker**

Elimina estos tres bloques del `<style>` (comentarios `CAPA CRT: SCANLINES`, `CAPA CRT: VIÑETA`, `CAPA CRT: FLICKER` y su contenido):

```css
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
```

- [ ] **Step 2: Quitar las referencias a scanlines/flicker del bloque de accesibilidad**

En el bloque `@media (prefers-reduced-motion: reduce) { ... }` (el que también contiene `.fade-up`, `.float-*`, `.loader`), elimina estas dos líneas (las clases ya no existen):

```css
            .crt-flicker { animation: none; }
            .crt-scanlines::before { display: none; }
```

- [ ] **Step 3: Eliminar el cursor personalizado**

Elimina el bloque `@media (pointer: fine) { * { cursor: none !important; } }` y el bloque de `.cursor-dot`/`.cursor-ring`:

```css
@media (pointer: fine) {
    * { cursor: none !important; }
}
.cursor-dot { width:10px; height:16px; background: var(--accent); position:fixed; pointer-events:none; z-index:9999; transform: translate(-50%,-50%); box-shadow: 0 0 8px rgba(124,140,255,0.7); transition: opacity .3s, transform .1s; }
.cursor-ring { display:none; }
.cursor-dot.cursor-hover { transform: translate(-50%,-50%) scale(1.4); }
```

También elimina la regla de modo claro `[data-theme="light"] .cursor-dot { box-shadow: none; }`.

- [ ] **Step 4: Eliminar el caret parpadeante de terminal**

Elimina el bloque completo (comentario `HERO TERMINAL: CARET PARPADEANTE` incluido):

```css
.term-caret {
    display: inline-block; width: 0.6em; height: 1.1em;
    background: var(--accent);
    box-shadow: 0 0 8px rgba(124,140,255,0.7);
    animation: caret-blink 1s step-end infinite;
    vertical-align: text-bottom;
}
@keyframes caret-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .term-caret { animation: none; } }
```

- [ ] **Step 5: Eliminar el marco de foto antiguo, el badge OPEN TO WORK y la stats-line**

Elimina estos tres bloques (comentarios `FOTO ENMARCADA`, `BADGE OPEN TO WORK`, `STATS LINE` incluidos) — se sustituyen por clases nuevas en la Tarea 3:

```css
.photo-frame { position: relative; display: inline-block; border: 2px solid var(--accent); border-radius: 6px; overflow: hidden; box-shadow: 0 0 18px rgba(124,140,255,0.25); }
.photo-frame img { filter: saturate(0.92) contrast(1.05); }
.photo-frame::after { content: ''; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.14) 3px); }

.otw-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.85rem; border: 1px solid var(--ok); border-radius: 9999px; color: var(--ok); font-size: 0.8rem; font-weight: 600; letter-spacing: 0.04em; }
.otw-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 0 rgba(95,206,122,0.6); animation: otw-pulse 2s infinite; }
@keyframes otw-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(95,206,122,0.5); } 50% { box-shadow: 0 0 0 7px rgba(95,206,122,0); } }

.stats-line { font-size: 0.85rem; color: var(--muted); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); padding: 0.6rem 0; }

@media (prefers-reduced-motion: reduce) { .otw-dot { animation: none; } }
```

- [ ] **Step 6: Eliminar la animación de encendido CRT y las brasas**

Elimina estos dos bloques (comentarios `HERO V2: POWER-ON CRT` y `HERO V2: BRASAS AMBIENTALES` incluidos) — las brasas se sustituyen por "motas de profundidad" nuevas en la Tarea 3:

```css
@keyframes crt-power-on {
    0%   { transform: scaleY(0.004); filter: brightness(3); opacity: 0.3; }
    12%  { transform: scaleY(0.02);  filter: brightness(3); opacity: 1; }
    45%  { transform: scaleY(1);     filter: brightness(1.5); }
    65%  { filter: brightness(0.75); }
    100% { transform: scaleY(1);     filter: brightness(1); }
}
.term-window { animation: crt-power-on 0.7s ease-out both; transform-origin: center center; }
@media (prefers-reduced-motion: reduce) { .term-window { animation: none; } }

.embers { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.embers span {
    position: absolute; bottom: -12px; width: 3px; height: 3px;
    border-radius: 50%; background: var(--accent);
    box-shadow: 0 0 6px var(--accent); opacity: 0;
    animation: ember-rise linear infinite;
}
@keyframes ember-rise {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    12%  { opacity: 0.7; }
    100% { transform: translateY(-360px) translateX(24px); opacity: 0; }
}
.embers span:nth-child(1){ left: 6%;  animation-duration: 7s;   animation-delay: 0s; }
.embers span:nth-child(2){ left: 18%; animation-duration: 9s;   animation-delay: 1.5s; }
.embers span:nth-child(3){ left: 30%; animation-duration: 6.5s; animation-delay: 3s; }
.embers span:nth-child(4){ left: 44%; animation-duration: 8.5s; animation-delay: 0.8s; }
.embers span:nth-child(5){ left: 58%; animation-duration: 7.5s; animation-delay: 2.2s; }
.embers span:nth-child(6){ left: 70%; animation-duration: 10s;  animation-delay: 4s; }
.embers span:nth-child(7){ left: 82%; animation-duration: 6.8s; animation-delay: 1.2s; }
.embers span:nth-child(8){ left: 92%; animation-duration: 9.5s; animation-delay: 3.5s; }
@media (prefers-reduced-motion: reduce) { .embers { display: none; } }
```

- [ ] **Step 7: Quitar la clase `crt-scanlines` del `<body>`**

Cambia:

```html
<body class="crt-scanlines font-mono" style="background: var(--bg); color: var(--fg);">
```

por:

```html
<body style="background: var(--bg); color: var(--fg);">
```

- [ ] **Step 8: Quitar el markup del cursor personalizado**

Elimina estas dos líneas (justo después de `<div id="scroll-progress"></div>`):

```html
<!-- Cursor personalizado (solo visible con ratón, no en móvil) -->
<div class="cursor-dot" id="cursor-dot"></div>
<div class="cursor-ring" id="cursor-ring"></div>
```

- [ ] **Step 9: Eliminar `iniciarCursor` de `app.js`**

Elimina la función completa (comentario y bloque, ~líneas 124-156):

```js
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
```

Y quita su llamada en `DOMContentLoaded`:

```js
    iniciarCursor();
```

- [ ] **Step 10: Verificar en navegador**

Run: `npm run dev` → recargar.
Expected: el cursor nativo del sistema vuelve a verse; ya no hay scanlines ni parpadeo. El hero todavía tiene su estructura antigua (se reemplaza en la Tarea 3) — es normal ver el badge "OPEN TO WORK" y la ventana de terminal sin parte de su estilo previo en este paso intermedio. Consola sin errores (nada referencia ya `#cursor-dot`/`#cursor-ring`).

- [ ] **Step 11: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "refactor(ui): elimina capa CRT (scanlines, flicker, cursor custom, caret, marco foto, badge, brasas)"
```

---

### Task 3: Nuevo hero cinematográfico — markup y estilos

**Files:**
- Modify: `public/index.html` (bloque `<style>`: nuevo bloque "HERO CINEMATOGRÁFICO"; header `#inicio` completo ~líneas 454-515; también elimina `.sr-only` si queda sin uso)

**Interfaces:**
- Consumes: tokens de la Tarea 1 (`--bg`, `--accent`, `--accent-hi`, `--muted`, `--fg`, `--ok`, `--hero-gradient`).
- Produces: clases `.hero-cinema`, `.hero-particles`, `.hero-vignette`, `.hero-photo-wrap`, `.hero-photo-glow`, `.hero-photo`, `.hero-line`/`.hero-ready`, `.hero-eyebrow`, `.hero-title`, `.hero-subtitle`, `.hero-bio`, `.hero-ctas`, `.hero-btn`/`.hero-btn-primary`/`.hero-btn-ghost`, `.hero-status`/`.hero-status-dot`, `.hero-meta`. IDs que la Tarea 4 (JS) sigue necesitando: `#hero-content`, `#nombre`, `#titular`, `#sobre_mi`, `#foto_perfil`, `#btn-cv`, `#github-stats`.

- [ ] **Step 1: Añadir el bloque CSS del nuevo hero**

Inserta este bloque nuevo en el `<style>`, donde antes estaban los bloques eliminados en la Tarea 2 (zona del hero):

```css
/* ── HERO CINEMATOGRÁFICO ────────────────────────────────
   Fondo con degradado radial oscuro, foto circular con halo
   que respira, motas de profundidad ascendiendo y revelado
   de texto escalonado cuando los datos del perfil cargan. */
.hero-cinema { background: var(--hero-gradient); }
.hero-vignette { position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 140px 40px rgba(0,0,0,0.55); }
[data-theme="light"] .hero-vignette { box-shadow: none; }

/* Motas de profundidad: ascienden despacio, tenues, con blur leve
   (sustituyen a las "brasas" del tema anterior por un efecto
   más sutil de polvo/luz suspendida, validado en mockup). */
.hero-particles { position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0; }
.hero-particles span {
    position: absolute; bottom: -12px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,.95), rgba(180,195,255,0) 70%);
    opacity: 0; animation: hero-particle-float linear infinite;
}
@keyframes hero-particle-float {
    0%   { transform: translateY(30px) translateX(0) scale(.8); opacity: 0; }
    12%  { opacity: var(--op, .7); }
    88%  { opacity: var(--op, .7); }
    100% { transform: translateY(-420px) translateX(var(--drift, 20px)) scale(1.1); opacity: 0; }
}
.hero-particles span:nth-child(1){ width:5px; height:5px; left:10%; --op:.85; --drift:18px;  animation-duration:6s;   animation-delay:0s; }
.hero-particles span:nth-child(2){ width:3px; height:3px; left:20%; --op:.6;  --drift:-20px;  animation-duration:7.5s; animation-delay:1.2s; }
.hero-particles span:nth-child(3){ width:6px; height:6px; left:32%; --op:.9;  --drift:26px;   animation-duration:6.5s; animation-delay:2.4s; }
.hero-particles span:nth-child(4){ width:4px; height:4px; left:44%; --op:.55; --drift:-14px;  animation-duration:8s;   animation-delay:.6s; }
.hero-particles span:nth-child(5){ width:5px; height:5px; left:57%; --op:.8;  --drift:20px;   animation-duration:6.8s; animation-delay:3s; }
.hero-particles span:nth-child(6){ width:3px; height:3px; left:69%; --op:.6;  --drift:-22px;  animation-duration:7.2s; animation-delay:1.8s; }
.hero-particles span:nth-child(7){ width:6px; height:6px; left:80%; --op:.85; --drift:16px;   animation-duration:6.2s; animation-delay:3.6s; }
.hero-particles span:nth-child(8){ width:4px; height:4px; left:90%; --op:.55; --drift:-18px;  animation-duration:7.8s; animation-delay:2.1s; }
@media (prefers-reduced-motion: reduce) { .hero-particles { display: none; } }
[data-theme="light"] .hero-particles { opacity: .35; }

/* Foto circular con halo que "respira" detrás */
.hero-photo-wrap { position: relative; display: inline-block; }
.hero-photo-glow {
    position: absolute; inset: -22px; border-radius: 50%;
    background: radial-gradient(circle, rgba(124,140,255,.45), transparent 72%);
    filter: blur(2px); animation: hero-breathe 5s ease-in-out infinite;
}
@keyframes hero-breathe { 0%,100% { opacity:.7; transform: scale(1); } 50% { opacity:1; transform: scale(1.06); } }
.hero-photo {
    position: relative; display: block; width: 120px; height: 120px;
    border-radius: 50%; object-fit: cover;
    border: 2px solid rgba(242,243,247,.5);
}
@media (prefers-reduced-motion: reduce) { .hero-photo-glow { animation: none; } }

/* Revelado escalonado: cada .hero-line entra con fundido + desplazamiento
   cuando #hero-content recibe .hero-ready (tras cargar el perfil, ver app.js). */
.hero-line { opacity: 0; transform: translateY(18px); transition: opacity .6s ease-out, transform .6s ease-out; }
.hero-ready .hero-line { opacity: 1; transform: none; }
.hero-line:nth-child(1) { transition-delay: .05s; }
.hero-line:nth-child(2) { transition-delay: .15s; }
.hero-line:nth-child(3) { transition-delay: .25s; }
.hero-line:nth-child(4) { transition-delay: .35s; }
.hero-line:nth-child(5) { transition-delay: .45s; }
.hero-line:nth-child(6) { transition-delay: .55s; }
.hero-line:nth-child(7) { transition-delay: .65s; }

.hero-eyebrow { font-size: .75rem; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); margin-top: 1.25rem; }
.hero-title { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.02em; margin-top: .5rem; line-height: 1.05; }
.hero-subtitle { font-size: 1.1rem; color: var(--muted); margin-top: .5rem; }
.hero-bio { max-width: 40rem; margin: .75rem auto 0; color: var(--fg); opacity: .9; }
.hero-ctas { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: center; margin-top: 1.5rem; }
.hero-btn { padding: .65rem 1.4rem; border-radius: 999px; font-size: .875rem; font-weight: 600; transition: transform .2s, opacity .2s; }
.hero-btn:hover { transform: translateY(-2px); }
.hero-btn-primary { background: var(--fg); color: var(--bg); }
.hero-btn-ghost { border: 1px solid rgba(242,243,247,.35); color: var(--fg); }
.hero-status { margin-top: 1.5rem; font-size: .8rem; color: var(--muted); display: inline-flex; align-items: center; gap: .5rem; }
.hero-status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 8px var(--ok); }
.hero-meta { margin-top: .75rem; font-size: .8rem; color: var(--muted); }
```

- [ ] **Step 2: Añadir `.hero-line` al bloque de accesibilidad existente**

En el mismo `@media (prefers-reduced-motion: reduce) { ... }` que ya contiene `.fade-up`, `.float-*`, `.loader`, añade:

```css
            .hero-line { opacity: 1 !important; transform: none !important; transition: none !important; }
```

- [ ] **Step 3: Sustituir todo el `<header id="inicio">` por el nuevo hero**

Reemplaza el bloque completo (desde `<header id="inicio" class="relative overflow-hidden pt-28 pb-10 crt-vignette crt-flicker">` hasta el `</header>` que le corresponde, incluyendo el `<div class="sr-only">` interno) por:

```html
<header id="inicio" class="relative overflow-hidden pt-24 pb-16 hero-cinema">
    <div class="hero-particles" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
    <div class="hero-vignette" aria-hidden="true"></div>

    <div id="hero-content" class="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <div class="hero-line hero-photo-wrap">
            <div class="hero-photo-glow"></div>
            <img id="foto_perfil" src="/img/perfil.jpg" alt="Santiago Lafuente" class="hero-photo">
        </div>
        <p class="hero-line hero-eyebrow">Portfolio &middot; 2026</p>
        <h1 id="nombre" class="hero-line hero-title"></h1>
        <p id="titular" class="hero-line hero-subtitle"></p>
        <p id="sobre_mi" class="hero-line hero-bio"></p>
        <div class="hero-line hero-ctas">
            <a id="btn-cv" href="/cv/cv-santiago-lafuente.pdf" download class="hero-btn hero-btn-primary">Descargar CV</a>
            <a href="#proyectos" class="hero-btn hero-btn-ghost">Ver proyectos</a>
        </div>
        <p class="hero-line hero-status"><span class="hero-status-dot"></span> Disponible para trabajar</p>
        <p class="hero-line hero-meta">9.0 de media &middot; Titulado en DAM &middot; Practicas en GDES</p>
    </div>

    <div class="relative max-w-4xl mx-auto px-6 pt-10">
        <div id="github-stats" class="flex flex-wrap gap-4 text-sm justify-center" style="color: var(--muted)">
            <span>Cargando estadisticas de GitHub...</span>
        </div>
    </div>
</header>
```

> Nota: `#enlaces` no se traslada — ese contenedor estaba oculto en `.sr-only` y `buildEnlaces()` era código muerto (confirmado: nada lo mostraba). Se elimina su uso en la Tarea 4.

- [ ] **Step 4: Eliminar la utilidad `.sr-only` si ha quedado sin uso**

Verifica que ya no se usa en ningún otro sitio:

```bash
grep -n "sr-only" public/index.html
```

Si el único resultado es la definición de la clase (bloque `/* ── SR-ONLY ... */`), elimina ese bloque completo del `<style>`. Si aparece en algún otro elemento, déjalo tal cual.

- [ ] **Step 5: Verificar en navegador**

Run: `npm run dev` → recargar.
Expected: el hero muestra fondo con degradado oscuro, foto circular con halo suave, motas subiendo, y (aún sin datos animados porque la Tarea 4 no está hecha) el nombre/titular/bio aparecen vacíos o estáticos según cómo Chrome cachee el JS previo — esto es normal en este paso intermedio; lo importante es que la estructura visual y el fondo son correctos y no hay errores de consola nuevos relacionados con el markup.

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "feat(ui): nuevo hero cinematografico con foto circular, halo y motas de profundidad"
```

---

### Task 4: Reescribir el JS del hero — revelado de texto y limpieza de código muerto

**Files:**
- Modify: `public/js/app.js` (`cargarPerfil` ~303-331, elimina `iniciarBootHero`/`_bootTimer`/`escHtml` ~396-494, elimina `buildEnlaces` ~333-339)

**Interfaces:**
- Consumes: `/perfil` (`nombre`, `titular`, `sobre_mi`, `foto_perfil`, `email`, `enlace_github`, `enlace_linkedin`); IDs del nuevo hero (`#hero-content`, `#nombre`, `#titular`, `#sobre_mi`, `#foto_perfil`).
- Produces: `cargarPerfil()` simplificado que añade la clase `hero-ready` a `#hero-content` cuando los datos están listos.

- [ ] **Step 1: Eliminar `iniciarBootHero`, `_bootTimer` y `escHtml`**

Elimina el bloque completo (comentario `HERO TERMINAL: secuencia de boot...` incluido, desde `let _bootTimer = null;` hasta el cierre de `iniciarBootHero`).

- [ ] **Step 2: Eliminar `buildEnlaces`**

Elimina la función completa:

```js
function buildEnlaces(p, classes) {
    return `
        ${p.email          ? `<a href="mailto:${p.email}" title="Email" class="${classes} transition-colors"><i class="fa-solid fa-envelope"></i></a>` : ''}
        ${p.enlace_github  ? `<a href="${p.enlace_github}" target="_blank" rel="noopener noreferrer" title="GitHub" class="${classes} transition-colors"><i class="fa-brands fa-github"></i></a>` : ''}
        ${p.enlace_linkedin ? `<a href="${fixUrl(p.enlace_linkedin)}" target="_blank" rel="noopener noreferrer" title="LinkedIn" class="${classes} transition-colors"><i class="fa-brands fa-linkedin"></i></a>` : ''}
    `;
}
```

(`buildEnlacesFooter`, que sí se usa en `#footer-enlaces`, se mantiene intacta.)

- [ ] **Step 3: Reescribir `cargarPerfil`**

Sustituye la función completa por:

```js
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
```

- [ ] **Step 4: Verificar en navegador**

Run: `npm run dev` → recargar.
Expected: la foto, el eyebrow, el nombre, el titular, la bio, los CTAs, el estado "Disponible para trabajar" y la línea de datos aparecen con un fundido escalonado (uno tras otro) al cargar. Con `prefers-reduced-motion` activado (DevTools → Rendering → Emulate CSS media feature), todo aparece de golpe sin animación. Consola sin errores (nada referencia ya `iniciarBootHero`, `escHtml` ni `buildEnlaces`).

- [ ] **Step 5: Commit**

```bash
git add public/js/app.js
git commit -m "refactor(ui): sustituye el boot de terminal por revelado de hero via CSS + limpia codigo muerto (buildEnlaces, escHtml)"
```

**🔎 CHECKPOINT 1 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 2 — Cabeceras de sección + Proyectos + Habilidades

### Task 5: Cabeceras de sección como etiqueta + línea de acento

**Files:**
- Modify: `public/index.html` (bloque `<style>`: sustituye `.section-cmd`/`.prompt`; 6 cabeceras de sección: tech ~525, proyectos ~547, habilidades ~560, experiencia ~569, certificados ~582, contacto ~604)

**Interfaces:**
- Produces: clase `.section-eyebrow` reutilizable en todas las secciones.

- [ ] **Step 1: Sustituir la clase de cabecera**

Busca el bloque actual (comentario `CABECERAS DE SECCIÓN COMO COMANDOS DE TERMINAL`, ya con los nombres de variable renombrados por la Tarea 1):

```css
.section-cmd { color: var(--accent); font-weight: 600; }
.section-cmd .prompt { color: var(--muted); }
```

Y sustitúyelo por:

```css
.section-eyebrow { font-size: .75rem; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--fg); }
.section-eyebrow::after { content: ''; display: block; width: 2.5rem; height: 2px; background: var(--accent); margin-top: .6rem; }
```

- [ ] **Step 2: Sustituir la cabecera de Tech Stack**

Cambia:

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> cat tech_stack.txt</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
</div>
```

por:

```html
<div class="mb-8">
    <p class="section-eyebrow">Stack tecnico</p>
</div>
```

- [ ] **Step 3: Sustituir la cabecera de Proyectos**

Cambia:

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> ls ~/proyectos</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
</div>
```

por:

```html
<div class="mb-8">
    <p class="section-eyebrow">Proyectos</p>
</div>
```

- [ ] **Step 4: Sustituir la cabecera de Habilidades**

Cambia:

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> skills --list</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
</div>
```

por:

```html
<div class="mb-8">
    <p class="section-eyebrow">Habilidades</p>
</div>
```

- [ ] **Step 5: Sustituir la cabecera de Experiencia**

Cambia:

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> git log --experiencia</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
</div>
```

por:

```html
<div class="mb-8">
    <p class="section-eyebrow">Experiencia</p>
</div>
```

- [ ] **Step 6: Sustituir la cabecera de Certificados**

Cambia:

```html
<div class="mb-8">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> cat certificados/</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
    <p class="mt-3 max-w-xl" style="color: var(--muted)">Cursos completados para mantenerme al dia con las ultimas tecnologias.</p>
</div>
```

por:

```html
<div class="mb-8">
    <p class="section-eyebrow">Certificados</p>
    <p class="mt-3 max-w-xl" style="color: var(--muted)">Cursos completados para mantenerme al dia con las ultimas tecnologias.</p>
</div>
```

- [ ] **Step 7: Sustituir la cabecera de Contacto**

Cambia:

```html
<div class="mb-12">
    <h3 class="section-cmd text-xl md:text-2xl"><span class="prompt">$</span> ./contact.sh</h3>
    <div class="mt-1 h-px" style="background: var(--line)"></div>
    <p class="mt-3 max-w-lg text-lg" style="color: var(--muted)">Estoy buscando oportunidades para crecer como desarrollador. Si buscas a alguien con ganas de aprender y aportar, hablemos.</p>
</div>
```

por:

```html
<div class="mb-12">
    <p class="section-eyebrow">Contacto</p>
    <p class="mt-3 max-w-lg text-lg" style="color: var(--muted)">Estoy buscando oportunidades para crecer como desarrollador. Si buscas a alguien con ganas de aprender y aportar, hablemos.</p>
</div>
```

- [ ] **Step 8: Verificar en navegador**

Expected: cada sección tiene una etiqueta simple en mayúsculas con una línea de acento corta debajo, sin comandos `$`. Consola sin errores.

- [ ] **Step 9: Commit**

```bash
git add public/index.html
git commit -m "feat(ui): cabeceras de seccion como etiqueta + linea de acento (sustituye comandos de shell)"
```

---

### Task 6: Proyectos — tarjetas limpias con badges y enlaces

**Files:**
- Modify: `public/index.html` (bloque `<style>`: añade `.pill`/`.pill-dev`/`.pill-featured`/`.proyecto-link`)
- Modify: `public/js/app.js` (`cargarProyectos` ~500-567)

**Interfaces:**
- Consumes: `/proyectos` (`titulo`, `descripcion`, `url_repo`, `url_demo`, `imagen`, `destacado`, `estado`).
- Produces: clases `.pill`, `.pill-dev`, `.pill-featured`, `.proyecto-link` (se reutilizan en las Tareas 8 y 9).

- [ ] **Step 1: Añadir estilos de badges y enlaces**

Añade al `<style>`:

```css
.pill { font-size: .7rem; font-weight: 600; padding: .15rem .55rem; border-radius: 999px; }
.pill-dev { background: rgba(255,95,86,.12); color: var(--err); }
.pill-featured { background: rgba(124,140,255,.14); color: var(--accent); }
.proyecto-link { display: inline-flex; align-items: center; gap: .4rem; color: var(--accent); }
.proyecto-link:hover { color: var(--accent-hi); }
```

- [ ] **Step 2: Reescribir `cargarProyectos`**

Sustituye la función completa por:

```js
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
```

- [ ] **Step 3: Verificar en navegador**

Expected: proyectos como tarjetas limpias sin cabecera de archivo; SuscriptWallet sigue destacado a ancho completo con su banner y píldora "Destacado"; Revisa y Rondas muestran la píldora roja "En desarrollo"; enlaces "Codigo"/"Demo" con icono en vez de corchetes. Los enlaces funcionan. Consola sin errores.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): proyectos como tarjetas limpias con badges y enlaces con icono"
```

---

### Task 7: Habilidades — barras animadas (sin ASCII)

**Files:**
- Modify: `public/index.html` (bloque `<style>`: añade `.skill-row`/`.skill-track`/`.skill-fill`; contenedor `#lista-habilidades` ~563)
- Modify: `public/js/app.js` (`cargarHabilidades` ~573-601)

**Interfaces:**
- Consumes: `/habilidades` (`nombre`, `nivel` ∈ {Basico, Intermedio, Avanzado}).
- Produces: función `animarHabilidades()` (IntersectionObserver que anima el ancho de `.skill-fill`).

- [ ] **Step 1: Añadir estilos de la barra de skill**

```css
.skill-row { margin-bottom: .9rem; }
.skill-track { height: 6px; border-radius: 3px; background: var(--line); overflow: hidden; }
.skill-fill { height: 100%; width: 0; border-radius: 3px; background: linear-gradient(90deg, var(--accent), var(--accent-hi)); transition: width 1s ease-out; }
@media (prefers-reduced-motion: reduce) { .skill-fill { transition: none; } }
```

- [ ] **Step 2: Simplificar el contenedor `#lista-habilidades`**

Cambia:

```html
<div id="lista-habilidades" class="max-w-2xl border rounded p-5 text-sm overflow-x-auto" style="border-color: var(--line); background: var(--surface);"></div>
```

por (ya no hace falta `overflow-x-auto`, no hay filas monoespaciadas que desbordar):

```html
<div id="lista-habilidades" class="max-w-2xl border rounded-xl p-5 text-sm" style="border-color: var(--line); background: var(--surface);"></div>
```

- [ ] **Step 3: Reescribir `cargarHabilidades` y añadir `animarHabilidades`**

Sustituye la función completa por:

```js
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
```

- [ ] **Step 4: Verificar en navegador**

Expected: las habilidades se muestran como filas con nombre + nivel y una barra que se rellena con una animación de ancho al entrar en el viewport (no bloques `█░`). Con `prefers-reduced-motion` activado, la barra aparece ya rellena sin transición. Consola sin errores.

- [ ] **Step 5: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): habilidades con barra de progreso animada en vez de bloques ASCII"
```

**🔎 CHECKPOINT 2 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 3 — Experiencia (timeline) + Certificados

### Task 8: Experiencia como línea de tiempo limpia

**Files:**
- Modify: `public/index.html` (bloque `<style>`: añade `.timeline-item`/`.timeline-dot`/`.timeline-body`)
- Modify: `public/js/app.js` (`cargarExperiencia` y `pseudoHash` ~607-666)

**Interfaces:**
- Consumes: `/experiencia` (`empresa`, `puesto`, `fecha_inicio`, `fecha_fin`, `descripcion`, `enlace_github`); reutiliza `.pill`/`.pill-featured` y `.proyecto-link` de la Tarea 6.
- Produces: ninguna interfaz nueva para otras tareas.

- [ ] **Step 1: Añadir estilos de la línea de tiempo**

```css
.timeline-item { position: relative; padding-left: 1.75rem; padding-bottom: 1.75rem; border-left: 2px solid var(--line); }
.timeline-item:last-child { border-left-color: transparent; }
.timeline-dot { position: absolute; left: -7px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 4px var(--surface); }
```

- [ ] **Step 2: Eliminar `pseudoHash` y reescribir `cargarExperiencia`**

Elimina la función `pseudoHash` (comentario incluido) y sustituye `cargarExperiencia` por:

```js
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
```

`formatearFecha` no cambia.

- [ ] **Step 3: Verificar en navegador**

Expected: experiencia como línea de tiempo vertical con un punto de acento por entrada, cargo + empresa + fechas, descripción y enlace de GitHub cuando aplica; la entrada sin `fecha_fin` (proyectos personales) muestra la píldora "Actual". Ya no hay `commit <hash>`/`Author:`/`Date:`. Consola sin errores.

- [ ] **Step 4: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): experiencia como linea de tiempo limpia (sustituye cosplay de git log)"
```

---

### Task 9: Certificados — tarjetas limpias

**Files:**
- Modify: `public/js/app.js` (`cargarCertificados` ~681-734)

**Interfaces:**
- Consumes: `/certificados` (`titulo`, `emisor`, `fecha`, `descripcion`, `url_archivo`, `url_externa`); reutiliza `.proyecto-link` de la Tarea 6.

- [ ] **Step 1: Reescribir la plantilla de tarjeta de certificado**

Dentro de `cargarCertificados`, sustituye el `tarjeta.className`/`tarjeta.innerHTML` por:

```js
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
```

Elimina las variables `enlaceAbrir`/`enlaceOnline` que ya no se usan.

- [ ] **Step 2: Verificar en navegador**

Expected: certificados como tarjetas limpias (sin cabecera `cert_NN.pdf`), título, emisor + fecha, descripción y enlaces "Ver PDF"/"Verificar" con icono. Los enlaces abren/descargan correctamente. Consola sin errores.

- [ ] **Step 3: Commit**

```bash
git add public/js/app.js
git commit -m "feat(ui): certificados como tarjetas limpias (sustituye cabecera de archivo y corchetes)"
```

**🔎 CHECKPOINT 3 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 4 — Contacto + GitHub stats + navbar + footer + modo claro

### Task 10: De-terminalizar navbar, toast, panel de stats, footer, formulario y GitHub stats

**Files:**
- Modify: `public/index.html` (navbar ~423, ~449; toast ~398-407; stats-panel ~377; footer ~640; formulario ~616)
- Modify: `public/js/app.js` (`cargarGithubStats` ~238-239, `iniciarFormContacto` ~757/770/773/777/781)

**Interfaces:**
- Consumes: sin cambios de lógica en ningún endpoint.

- [ ] **Step 1: Navbar — botón de contacto**

Cambia (aparece dos veces: navbar de escritorio y menú móvil):

```html
<a href="#contacto" class="btn-contact px-4 py-2 border rounded text-sm transition-colors" style="border-color: var(--line); color: var(--accent);">$ contact</a>
```

por:

```html
<a href="#contacto" class="btn-contact px-4 py-2 border rounded-full text-sm transition-colors" style="border-color: var(--line); color: var(--accent);">Contacto</a>
```

- [ ] **Step 2: Toast de bienvenida**

Cambia:

```html
<div class="flex items-center gap-3 px-5 py-4 border rounded" style="background: var(--surface); border-color: var(--line);">
    <span class="accent-text">[system]</span>
    <div>
        <p class="accent-text text-sm font-semibold">welcome</p>
        <p class="text-xs mt-0.5" style="color: var(--muted)">gracias por visitar mi portafolio</p>
    </div>
    <button onclick="cerrarToast()" class="ml-2 hover:opacity-70 text-lg leading-none" style="color: var(--muted)">×</button>
</div>
```

por:

```html
<div class="flex items-center gap-3 px-5 py-4 border rounded-xl" style="background: var(--surface); border-color: var(--line);">
    <i class="fa-solid fa-circle-check accent-text text-lg"></i>
    <div>
        <p class="text-sm font-semibold" style="color: var(--fg)">Bienvenido</p>
        <p class="text-xs mt-0.5" style="color: var(--muted)">gracias por visitar mi portafolio</p>
    </div>
    <button onclick="cerrarToast()" class="ml-2 hover:opacity-70 text-lg leading-none" style="color: var(--muted)">×</button>
</div>
```

- [ ] **Step 3: Panel de estadísticas secreto**

Cambia:

```html
<span class="text-xs uppercase tracking-widest accent-text font-semibold">$ sudo stats</span>
```

por:

```html
<span class="text-xs uppercase tracking-widest accent-text font-semibold">Estadisticas</span>
```

- [ ] **Step 4: Footer**

Cambia:

```html
<p style="color: var(--muted)">// EOF &mdash; Santiago Lafuente 2026 <span class="term-caret">&nbsp;</span></p>
```

por:

```html
<p style="color: var(--muted)">&copy; 2026 Santiago Lafuente</p>
```

- [ ] **Step 5: Formulario de contacto — botón**

Cambia:

```html
<button id="btn-enviar" type="submit" class="btn-contact px-5 py-2.5 border rounded accent-text transition-colors" style="border-color: var(--accent)">$ send</button>
```

por:

```html
<button id="btn-enviar" type="submit" class="btn-contact px-5 py-2.5 border rounded-full accent-text font-semibold transition-colors" style="border-color: var(--accent)">Enviar mensaje</button>
```

- [ ] **Step 6: Formulario de contacto — estados en JS**

En `iniciarFormContacto`, cambia los tres textos:

```js
        btnEnviar.textContent = '[ enviando... ]';
```
→
```js
        btnEnviar.textContent = 'Enviando...';
```

```js
                mostrarFeedback(feedback, '[ok] mensaje enviado correctamente', 'var(--ok)');
```
→
```js
                mostrarFeedback(feedback, 'Mensaje enviado correctamente', 'var(--ok)');
```

```js
                mostrarFeedback(feedback, '[error] ' + (data.error || 'Error al enviar'), 'var(--err)');
```
→
```js
                mostrarFeedback(feedback, data.error || 'Error al enviar el mensaje', 'var(--err)');
```

```js
            mostrarFeedback(feedback, '[error] Error de conexión. Inténtalo de nuevo.', 'var(--err)');
```
→
```js
            mostrarFeedback(feedback, 'Error de conexion. Intentalo de nuevo.', 'var(--err)');
```

```js
            btnEnviar.textContent = '$ send';
```
→
```js
            btnEnviar.textContent = 'Enviar mensaje';
```

- [ ] **Step 7: GitHub stats — quitar el prefijo de comando**

En `cargarGithubStats`, elimina esta línea del template (justo dentro de `contenedor.innerHTML`):

```js
            <span style="color: var(--muted)">$ git stats</span>
```

- [ ] **Step 8: Verificar en navegador**

Expected: botón de navbar dice "Contacto"; el toast de bienvenida no tiene el prefijo `[system]`; el panel secreto (5 clics en el logo) dice "Estadisticas"; el footer muestra `© 2026 Santiago Lafuente` sin caret; el botón de enviar dice "Enviar mensaje" y cambia a "Enviando..." durante el envío; enviar un mensaje de prueba muestra "Mensaje enviado correctamente" en verde (y llega el email real); la barra de GitHub stats ya no tiene el prefijo `$ git stats`. Consola sin errores.

- [ ] **Step 9: Commit**

```bash
git add public/index.html public/js/app.js
git commit -m "feat(ui): quita comandos de shell y corchetes de navbar, toast, panel stats, footer, formulario y github stats"
```

---

### Task 11: Scroll reveals con más presencia + modo claro

**Files:**
- Modify: `public/index.html` (bloque `<style>`: `.fade-up`)

**Interfaces:**
- Consumes: tokens de modo claro ya definidos en la Tarea 1 (Step 8).

- [ ] **Step 1: Añadir una leve escala al reveal de scroll**

Cambia:

```css
.fade-up { opacity: 0; transform: translateY(40px); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
.fade-up.visible { opacity: 1; transform: translateY(0); }
```

por:

```css
.fade-up { opacity: 0; transform: translateY(40px) scale(.98); transition: opacity 0.7s ease-out, transform 0.7s ease-out; }
.fade-up.visible { opacity: 1; transform: none; }
```

- [ ] **Step 2: Verificar el toggle de tema en navegador**

Run: `npm run dev` → pulsar el icono de sol/luna.
Expected: el modo claro cambia a fondo blanco/gris muy claro con texto casi negro y el mismo acento en versión más oscura para contraste; el hero mantiene su degradado (versión clara) y las motas se ven más tenues; la viñeta del hero desaparece en claro (ya cubierto por la regla `[data-theme="light"] .hero-vignette` de la Tarea 3). Volver a oscuro funciona. El tema persiste en localStorage tras recargar. Las secciones entran con fundido + leve escala al hacer scroll, en ambos temas.

- [ ] **Step 3: Commit**

```bash
git add public/index.html
git commit -m "feat(ui): scroll reveals con leve escala + verificacion de modo claro"
```

**🔎 CHECKPOINT 4 — revisión del usuario en el navegador antes de continuar.**

---

## CHECKPOINT 5 — Pulido: accesibilidad, responsive, rendimiento, QA

### Task 12: Responsive, auditoría de accesibilidad, limpieza final y regresión

**Files:**
- Modify: `public/index.html` (media query móvil del hero; limpieza de CSS muerto si el grep del Step 3 encuentra algo)
- Modify: `public/js/app.js` (limpieza de JS muerto si el grep del Step 3 encuentra algo)

- [ ] **Step 1: Ajuste del hero en móvil**

Añade al `<style>`, cerca del bloque del hero:

```css
@media (max-width: 420px) {
    .hero-title { font-size: 2rem; }
    .hero-photo { width: 96px; height: 96px; }
}
```

- [ ] **Step 2: Verificar responsive en DevTools**

Run: DevTools → modo dispositivo (iPhone SE / 360px).
Expected: el hero no desborda horizontalmente, el título se ve completo, los CTAs se apilan si hace falta (ya son `flex-wrap`), las tarjetas de proyectos/certificados pasan a una columna, la navbar móvil sigue operativa.

- [ ] **Step 3: Auditoría de restos del tema anterior**

```bash
grep -n "\$ \|\[WIP\]\|proyecto_.*\.md\|cert_.*\.pdf\|term-\|crt-\|accent-text\b.*phosphor\|--amber" public/index.html public/js/app.js
```

Expected: sin coincidencias relevantes (si `accent-text` aparece es correcto y esperado — es la clase nueva; solo investigar si aparece literalmente la palabra `phosphor` o `--amber`, que no deberían quedar).

- [ ] **Step 4: prefers-reduced-motion**

Run: DevTools → Rendering → Emulate CSS media feature `prefers-reduced-motion: reduce`.
Expected: no hay motas animándose, el halo de la foto no pulsa, el hero aparece de golpe sin fundido escalonado, las barras de skill aparecen ya rellenas sin transición, las secciones aparecen visibles sin fundido de scroll.

- [ ] **Step 5: Contraste y foco**

Verifica visualmente que el texto de cuerpo (`--fg` sobre `--bg`) tiene contraste suficiente en ambos temas. Confirma que `a:focus-visible, button:focus-visible, .form-input:focus-visible { outline: 2px solid var(--accent); ... }` (ya existía, solo renombrado por la Tarea 1) sigue funcionando navegando con Tab.

- [ ] **Step 6: Regresión funcional completa**

Checklist manual en `localhost`: carga de perfil/proyectos/habilidades/experiencia/certificados/tech stack; envío del formulario (llega el email real); GitHub stats; contador de visitas en el footer; easter egg (5 clics en el logo abre el panel de estadísticas); toggle de tema (oscuro↔claro) con persistencia tras recargar; navbar activa la sección visible al hacer scroll; menú móvil abre/cierra; parallax del tech stack al mover el ratón. Consola sin errores en toda la navegación.

- [ ] **Step 7: Commit final**

```bash
git add public/index.html public/js/app.js
git commit -m "chore(ui): ajustes responsive del hero, verificacion de accesibilidad y QA final del rediseno cinematografico"
```

**🔎 CHECKPOINT 5 — revisión final del usuario. Tras aprobación: push a main (auto-deploy en Render) cuando el usuario lo pida.**

---

## Notas de cierre

- **Actualizar memoria** (`MEMORY.md`) tras completar: nuevo sistema de diseño cinematográfico (tokens `--accent*`/`--muted`, tipografía de sistema), hero con foto circular + halo + motas, secciones sin motivo de terminal.
- El push a `main` dispara auto-deploy en Render; hacerlo solo cuando el usuario lo apruebe.
- No se han tocado migraciones ni BD: no hay pasos de despliegue de datos.
