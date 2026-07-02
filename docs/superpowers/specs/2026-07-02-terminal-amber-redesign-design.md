# Rediseño "Terminal ámbar cinematográfico" — Diseño

**Fecha:** 2026-07-02
**Autor:** Santiago Lafuente (con Claude)
**Estado:** Aprobado (pendiente de revisión de spec)

## Objetivo

Dar al portafolio una identidad visual cinematográfica y distintiva que lo aleje del
look "generado por IA" (dark slate + degradados azul→morado→rosa + glassmorphism + blobs
difuminados). La nueva identidad es un **terminal retro ámbar sobre negro**, coherente con
el perfil de ciberseguridad/desarrollo del autor.

Nivel de compromiso elegido: **inmersivo con escape** — el hero es un terminal real y
espectacular, pero el resto de secciones son cómodas de leer para un reclutador.

## No-objetivos (fuera de alcance)

- No se toca el backend, la API REST ni los datos en Aiven.
- No se modifica `public/admin.html` (queda como está).
- No se añaden dependencias de build: se mantiene Tailwind vía CDN + CSS propio.
- No es un terminal 100% interactivo tipo shell (el prompt interactivo es opcional/stretch).

## Sistema de diseño (design tokens)

### Color
- **Fondo (dark):** negro cálido `#0d0b06` (no el slate azulado actual). Superficies elevadas `#141009`.
- **Acento fósforo:** ámbar `#ffb000`; highlight `#ffc94d`; ámbar tenue `#b3760a` para texto secundario.
- **Texto cuerpo:** gris cálido legible `#d8d2c4`.
- **Estados:** verde `#5fce7a` para OK/éxito, rojo `#ff5f56` para error/WIP crítico. Uso puntual (syntax-highlight / warnings), sin volver al arcoíris.
- **Modo claro = "paper terminal":** fondo crema `#f4ecd8`, tinta marrón `#3a2f1a`, acento ámbar oscuro. Estética de impresora matricial antigua. Se conserva el toggle (reconvertido).

### Tipografía
- Monospace en todo el sitio. Base: **IBM Plex Mono** (Google Fonts). Peso display para hero/titulares.
- Se elimina Inter.

### Motion y capa CRT
- Scanlines de baja opacidad (overlay global tenue), viñeteado en el hero, parpadeo (flicker) muy leve.
- Glow ámbar (`text-shadow`) reservado a titulares y prompts; NUNCA en texto de cuerpo (legibilidad).
- **Accesibilidad:** todo el movimiento (flicker, scanline animada, boot typing) respeta
  `prefers-reduced-motion`; en ese caso se muestra el estado final sin animación.

### Se elimina del look actual
- Blobs difuminados de fondo, degradados azul/morado/rosa, `.gradient-text` arcoíris.
- Cursor con glow púrpura → bloque ámbar parpadeante (caret de terminal).
- Barra de progreso de scroll → ámbar (thin bar).

## Hero — "inmersivo con escape"

- Ventana de terminal con barra de título: `santiago@portfolio:~`.
- **Secuencia de boot** al cargar (autoescrita, rápida): `> initializing portfolio…`, `> loading profile [OK]`, etc.
- **Comandos autoescritos:**
  - `$ whoami` → nombre + "Titulado en DAM (9.0) · Desarrollador Multiplataforma".
  - `$ cat about.txt` → bio (desde el perfil de la API).
  - Prompt parpadeante final con pista para hacer scroll.
- **Stretch (opcional):** prompt semi-interactivo que acepta `help`, `ls`, `projects`, `contact`.
  Si no se implementa, no bloquea el resto.

## Motivo cohesionador: secciones como comandos

Cada cabecera de sección es un comando de terminal (esto es lo que rompe el "parece de IA"):

- **Proyectos:** `$ ls ~/proyectos`
- **Habilidades:** `$ skills --list` → cada skill con barra ASCII de nivel: `Java [██████░░] Intermedio`
- **Experiencia:** `$ git log --experiencia` → cada puesto renderizado como un "commit"
  (hash corto, autor, fecha, mensaje). GDES = commit cerrado; proyectos personales = rama activa.
- **Certificados:** `$ cat certificados/`
- **Contacto:** `$ ./contact.sh` → campos con prompt `> `, botón `$ send`.
- **GitHub stats:** salida de `$ git stats`.
- **Easter egg (5 clics logo):** `$ sudo stats`.

### Tarjetas / paneles
- Borde ámbar fino, esquinas tipo caja ASCII, cabecera de "archivo" (`proyecto_01.md`).
- Badge "en desarrollo" → `[WIP]` (ámbar/rojo). Destacado (SuscriptWallet) → panel featured ancho.
- Hover: glow ámbar sutil + posible barrido de scanline; se mantiene un ligero lift.

## Alcance técnico

- **Archivos afectados:** `public/index.html` (bloque `<style>` + markup) y `public/js/app.js`
  (plantillas de render de cada sección + lógica de boot/typing + cursor + toast + easter egg).
- Fuentes vía Google Fonts (IBM Plex Mono). Tailwind CDN se mantiene; la paleta se desplaza a
  ámbar/neutral cálido + CSS propio para scanlines/glow/CRT.
- Sin cambios en `server/`.

## Plan de ejecución: Opción A por checkpoints

Rediseño completo y coherente, entregado en fases revisables:

1. **Checkpoint 1 — Tokens globales + Hero.** Sistema de color/tipografía/CRT + hero con boot y
   comandos autoescritos. Se corre en `localhost` para revisión visual del usuario.
2. **Checkpoint 2 — Motivo de comandos + Proyectos + Habilidades (barras ASCII).**
3. **Checkpoint 3 — Experiencia (git log) + Certificados.**
4. **Checkpoint 4 — Contacto + GitHub stats + navbar + footer + cursor/toast/easter egg + modo paper.**
5. **Checkpoint 5 — Pulido: accesibilidad (reduced-motion), responsive/móvil, rendimiento, QA final.**

Entre cada checkpoint, el usuario revisa en su navegador y se ajusta antes de continuar.

## Riesgos y mitigaciones

- **Legibilidad para reclutadores:** monospace + glow pueden cansar. Mitigación: glow solo en
  titulares, cuerpo en gris cálido de buen contraste, tamaños generosos.
- **Accesibilidad:** scanlines/flicker pueden molestar. Mitigación: `prefers-reduced-motion` +
  contraste AA en texto de cuerpo.
- **Móvil:** el hero-terminal debe degradar bien. Mitigación: en pantallas pequeñas se acorta la
  secuencia de boot y se ajusta el tamaño del terminal.
- **Rendimiento:** animaciones CRT en `transform`/`opacity` (compositables), scanlines vía overlay
  ligero, sin repaints costosos.

## Criterios de éxito

- El sitio ya no es reconocible como "portfolio genérico de IA".
- Hero con impacto inmediato (boot/typing) pero secciones legibles.
- Identidad ámbar-terminal coherente en todas las secciones.
- Funciona en móvil y respeta reduced-motion.
- Datos y backend intactos; sin regresiones funcionales (formulario, stats, easter egg, temas).
