# Rediseño "Cinematográfico Apple × reclutadores" — Diseño

**Fecha:** 2026-08-17
**Autor:** Santiago Lafuente (con Claude)
**Estado:** Aprobado (pendiente de revisión de spec)

## Objetivo

Sustituir la identidad visual actual ("Terminal ámbar/menta cinematográfico" — ver
`docs/superpowers/specs/2026-07-02-terminal-amber-redesign-design.md`) por una nueva
identidad también cinematográfica y con movimiento, pero inspirada en el lenguaje visual
de los anuncios de producto de Apple (iPhone, Mac, AirPods): tipografía grande y limpia,
mucho espacio negro/blanco, una única luz de acento, movimiento elegante y sutil.

El motivo: el look "terminal / matrix / hacker" (comandos `$`, scanlines, boot de
shell, git-log cosplay) resulta demasiado "friki" para el público objetivo real del
sitio — reclutadores y responsables de RRHH — y puede restar profesionalidad en vez
de sumarla. El nuevo objetivo es **atractivo, profesional, con movimiento que llame la
atención sin parecer una plantilla genérica de IA** (glassmorphism + degradados
azul/morado/rosa) ni un "portfolio hacker" (terminal retro).

Validado con mockups interactivos en el navegador (compañero visual de brainstorming):
se probaron 4 direcciones (Apple Keynote / Editorial / Cinematográfico oscuro / Swiss
minimal) y se eligió una **mezcla de Apple Keynote + Cinematográfico oscuro**, iterada
hasta confirmar tamaño y visibilidad de las partículas de profundidad y el tratamiento
de la foto de perfil.

## No-objetivos (fuera de alcance)

- No se toca el backend, la API REST ni los datos en Aiven.
- No se modifica `public/admin.html` (queda como está).
- No se añaden dependencias de build: se mantiene Tailwind vía CDN + CSS propio.
- No se elimina ni se reduce contenido: toda la información, iconos de tecnologías,
  la foto de perfil, el toggle claro/oscuro y el easter egg se mantienen. Es un
  cambio de "traje" visual, no de contenido.

## Sistema de diseño (design tokens)

### Color
- **Fondo (dark):** degradado cinematográfico oscuro — `#1c2440` (arriba, con glow) →
  `#0a0d1a` → `#050608` (radial, tipo póster de cine), no negro plano ni slate azulado.
- **Acento único:** azul-violeta sobrio (`#7c8cff` aprox., a afinar en implementación).
  Se sustituye por completo el verde menta neón / ámbar anteriores. Uso "con
  cuentagotas": halo de foto, línea de acento en cabeceras de sección, relleno de
  barras de skill, detalles de hover. Nunca como fondo saturado.
- **Texto:** casi blanco (`#f2f3f7`) sobre fondo oscuro; gris azulado (`#c3c8db`) para
  texto secundario.
- **Estados:** se mantienen verde `#5fce7a` (OK/disponible) y rojo `#ff5f56`
  (error/crítico) — sin cambios, uso puntual.
- **Modo claro:** blanco/negro con el mismo acento en versión oscura para contraste;
  sin partículas de profundidad (o muy tenues) para que se perciba limpio de día.

### Tipografía
- Se abandona el monospace como fuente principal. Base: pila tipo sistema/Apple
  (`-apple-system, "Helvetica Neue", Arial, sans-serif`), títulos grandes, peso 700,
  tracking negativo ligero.
- El monospace se conserva solo como detalle puntual (etiquetas pequeñas), no como
  identidad tipográfica del sitio.

### Movimiento
- **Partículas de profundidad:** motas de luz/polvo (no lluvia matrix) subiendo
  despacio en el hero, tamaño y brillo ya validados en mockup (visibles, no
  protagonistas). Versión más tenue como fondo continuo en el resto de secciones.
- **Halo de foto "respirando":** glow radial detrás de la foto de perfil con
  animación de opacidad/escala lenta (pulso ~5s).
- **Revelado de texto del hero:** el titular/subtítulo aparece progresivamente al
  cargar (efecto "tráiler"), sustituyendo el boot de terminal.
- **Scroll reveals:** cada sección entra con fundido + desplazamiento/escala sutil
  (parallax ligero), sustituyendo el `fade-up` plano actual.
- **Micro-interacciones:** botones con leve escala/elevación al hover.
- **Accesibilidad:** todo el movimiento (partículas, halo, parallax, revelado de
  texto) respeta `prefers-reduced-motion` — en ese caso se muestra el estado final
  estático, igual que en el rediseño anterior.

### Se elimina del look actual
- Scanlines, viñeteado parpadeante (`crt-flicker`), cursor personalizado tipo bloque
  con trail, ventana de terminal con semáforo de colores, caret parpadeante,
  comandos `$` como cabecera de sección, barras ASCII `█░`, cosplay de `git log`
  para experiencia, etiquetas de archivo (`proyecto_01.md`) y badges `[WIP]` /
  `[ repo ]` con corchetes.

## Hero

- Foto de perfil **circular**, con halo de acento detrás que "respira" — validado en
  mockup, sustituye al `.photo-frame` rectangular con scanlines actual.
- Encima/debajo: eyebrow pequeño en mayúsculas ("Portfolio · 2026" o similar), nombre
  en tipografía grande, subtítulo (bio corta), CTAs como píldoras (`Ver proyectos`
  primario, `Descargar CV` outline).
- Estado "disponible para trabajar" con punto verde, igual que ahora pero restyled.
- Partículas de profundidad + glow radial de fondo + viñeta suave, sin scanlines.

## Traducción sección por sección

- **Cabeceras de sección:** de `$ ls ~/proyectos` / `$ skills --list` / etc. →
  etiqueta simple en mayúsculas (p. ej. "PROYECTOS", "HABILIDADES", "EXPERIENCIA",
  "CERTIFICADOS", "CONTACTO") + línea de acento fina debajo.
- **Habilidades:** se mantiene la barra de progreso por skill (dato real desde la
  API), pero como barra limpia con relleno animado al entrar en viewport — sin
  bloques ASCII.
- **Experiencia:** de "commit de git" → línea de tiempo vertical limpia (línea de
  acento + logo de empresa + cargo + fechas), con animación de entrada al hacer
  scroll.
- **Proyectos:** de tarjeta "archivo.md" → tarjeta con imagen grande y overlay que
  revela título/descripción al hover. El proyecto destacado (SuscriptWallet) sigue
  a ancho completo. Badge "en desarrollo" se mantiene como dato pero visualmente es
  una píldora limpia, no `[WIP]`.
- **Certificados:** misma estructura de tarjetas, nueva paleta, ligera elevación al
  hover.
- **Iconos de tecnología (Font Awesome/Devicon), datos de la API, toggle
  claro/oscuro, formulario de contacto, stats de GitHub, easter egg de 5 clics:**
  se mantienen funcionalmente idénticos, solo restyled a la nueva paleta/tipografía.

## Alcance técnico

- **Archivos afectados:** `public/index.html` (bloque `<style>` + markup) y
  `public/js/app.js` (plantillas de render de cada sección + función de animación
  del hero, renombrando/adaptando `iniciarBootHero`).
- Tipografía: se retira la carga de IBM Plex Mono como fuente principal (puede
  conservarse cargada si se usa puntualmente) a favor de la pila de sistema.
  Tailwind CDN se mantiene.
- Sin cambios en `server/`.

## Plan de ejecución: por checkpoints

1. **Checkpoint 1 — Tokens globales + Hero.** Paleta/tipografía/motion tokens +
   hero completo (foto circular con halo, partículas, revelado de texto, CTAs).
   Revisión visual del usuario en `localhost`.
2. **Checkpoint 2 — Cabeceras de sección + Proyectos + Habilidades.**
3. **Checkpoint 3 — Experiencia (timeline) + Certificados.**
4. **Checkpoint 4 — Contacto + GitHub stats + navbar + footer + scroll reveals +
   modo claro.**
5. **Checkpoint 5 — Pulido: accesibilidad (reduced-motion), responsive/móvil,
   rendimiento, QA final (incluye comprobar que no queda ningún resto del look
   terminal: scanlines, cursor custom, comandos `$`, etc.).**

Entre cada checkpoint, el usuario revisa en su navegador y se ajusta antes de
continuar — mismo patrón que el rediseño anterior.

## Riesgos y mitigaciones

- **Exceso de movimiento:** partículas o parallax mal calibrados pueden distraer
  del contenido. Mitigación: mantener el nivel ya validado en el mockup (visible
  pero no protagonista), medir en dispositivo real antes de dar por cerrado el
  checkpoint 1.
- **Legibilidad:** el fondo oscuro degradado debe mantener contraste AA en texto
  de cuerpo. Mitigación: texto casi blanco sobre las zonas más oscuras del
  degradado, evitar colocar texto sobre el área más clara/glow.
- **Accesibilidad:** igual que en el rediseño anterior, todo el movimiento debe
  respetar `prefers-reduced-motion`.
- **Móvil:** el halo/partículas y el parallax deben degradar bien en pantallas
  pequeñas y no penalizar rendimiento (usar `transform`/`opacity`, evitar
  animaciones costosas en scroll).
- **Regresión de contenido:** al ser un cambio grande de markup/CSS, riesgo de
  perder algún dato o funcionalidad (formulario, stats, easter egg). Mitigación:
  QA final explícito por checkpoint 5 contra la lista de features actuales.

## Criterios de éxito

- El sitio deja de leerse como "portfolio hacker/terminal" y pasa a transmitir
  cuidado visual tipo producto (referencia Apple), sin parecer plantilla genérica
  de IA.
- El hero tiene impacto inmediato y movimiento notorio (foto + halo + partículas +
  revelado de texto) sin sacrificar legibilidad.
- Identidad coherente en todas las secciones (paleta, tipografía, motion).
- Funciona en móvil y respeta `prefers-reduced-motion`.
- Datos, backend y funcionalidades (formulario, stats, easter egg, toggle de tema)
  intactos; sin regresiones.
