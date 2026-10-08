/**
 * tailwind.config.js
 * ------------------
 * Configuración de Tailwind CSS v3 (misma versión mayor que servía el Play CDN).
 * El CSS se compila con `npm run build:css` y el resultado
 * (public/css/tailwind.css) SE SUBE al repo, porque Render no tiene paso
 * de build: solo hace `npm install` + `npm start`.
 *
 * IMPORTANTE: si añades clases de Tailwind nuevas en index.html o app.js,
 * vuelve a ejecutar `npm run build:css` y commitea el CSS generado.
 * (admin.html sigue usando el Play CDN, por eso no está en `content`.)
 */
module.exports = {
    // Archivos donde Tailwind busca nombres de clase (las de app.js van
    // escritas completas en los template literals, así que se detectan).
    content: ['./public/index.html', './public/js/app.js'],
    // Clases que llegan desde la BD (tech_stack.icon_color, p. ej. "text-amber-400")
    // y que no aparecen en el código: las generamos siempre.
    safelist: [
        { pattern: /^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(300|400|500|600)$/ },
    ],
    theme: { extend: {} },
    plugins: [],
};
