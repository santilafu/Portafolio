# Publicar Forja de Prompts con Cloudflare Access

Objetivo: que `https://santiagolafuente.com/forja` funcione solo para los emails que tú elijas.

```
Navegador ──▶ Cloudflare (¿email permitido? → código por email)
          ──▶ Render (tu portafolio) ──▶ /forja comprueba la firma de Cloudflare ──▶ API de Claude
```

Coste: Cloudflare Free + Zero Trust Free (hasta 50 usuarios) = 0 €. Render: tu plan actual, sin servicios nuevos.

> Los menús de Cloudflare cambian a veces de nombre. Si algo no coincide exactamente, busca la opción equivalente.

---

## Paso 1 — Pasar el dominio a Cloudflare (DNS)

1. Crea una cuenta en <https://dash.cloudflare.com> → **Add a domain** → `santiagolafuente.com` → plan **Free**.
2. Cloudflare copia tus registros DNS actuales. **Revísalos**: deben estar los que apuntan a Render (normalmente un `A`/`CNAME` para `santiagolafuente.com` y otro para `www`). Si falta alguno, cópialo del panel donde gestionas el dominio ahora.
3. Cloudflare te dará **2 nameservers** (p. ej. `ana.ns.cloudflare.com`). Ve a la web donde compraste el dominio y sustituye los nameservers por esos dos.
4. Espera el email de Cloudflare diciendo que el dominio está activo (minutos u horas).
5. En Cloudflare → **SSL/TLS** → modo **Full (strict)**. (Si la web da error de certificado, prueba **Full**.)
6. En **DNS**, asegúrate de que los registros de Render tienen la **nube naranja (Proxied)**. Sin la nube naranja, Cloudflare Access no puede proteger nada.
7. Comprueba que `https://santiagolafuente.com` sigue funcionando.

## Paso 2 — Activar Zero Trust (Cloudflare Access)

1. En el panel de Cloudflare → **Zero Trust**.
2. Elige un **team name** (p. ej. `santiago`). Tu dominio de equipo será `santiago.cloudflareaccess.com` → **apúntalo**.
3. Elige el plan **Free** (puede pedir tarjeta aunque cueste 0 €).

## Paso 3 — Crear la aplicación protegida

1. Zero Trust → **Access** → **Applications** → **Add an application** → **Self-hosted**.
2. Nombre: `Forja de Prompts`.
3. Dominio: `santiagolafuente.com`, path: `forja`.
4. **Policy** (política): acción **Allow**, regla **Include → Emails** y escribe tu email y los de quien quieras dar acceso.
5. Método de login: **One-time PIN** (viene activado por defecto: Cloudflare manda un código al email).
6. Guarda. Abre la aplicación creada y copia el **Application Audience (AUD) Tag** (una cadena larga).

Para **dar o quitar acceso** más adelante: edita esta política y añade/quita emails. No hay que tocar código.

## Paso 4 — Variables de entorno en Render

En Render → tu servicio del portafolio → **Environment** → añade:

| Variable | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | Tu clave de <https://platform.claude.com> |
| `CF_ACCESS_TEAM_DOMAIN` | `santiago.cloudflareaccess.com` (el tuyo del paso 2) |
| `CF_ACCESS_AUD` | El AUD Tag del paso 3 |
| `NODE_ENV` | `production` |

Guarda y Render redesplegará solo.

## Paso 5 — Límite de gasto en Claude (muy recomendable)

En <https://platform.claude.com> → **Billing / Limits** → pon un límite mensual (p. ej. 10 $). Así nunca pagarás más de eso pase lo que pase. Además, la app limita a 40 mensajes por hora por persona.

## Paso 6 — Comprobar que todo está bien cerrado

1. Abre `https://santiagolafuente.com/forja` en una ventana de incógnito → debe pedirte el email. Entra con un email permitido → ves la app.
2. Prueba con un email NO permitido → no debe llegar el código / acceso denegado.
3. Abre `https://TU-SERVICIO.onrender.com/forja` (la dirección directa de Render) → debe decir **Acceso denegado**. Esto demuestra que la comprobación de la firma funciona y nadie puede saltarse Cloudflare.
4. El resto del portafolio (`/`, `/admin`) sigue funcionando igual.

---

## ¿Cómo funciona la protección? (para aprender)

- **Cloudflare Access** pide el email y, si está permitido, añade a cada petición la cabecera `Cf-Access-Jwt-Assertion` con un **JWT** (un "carné" firmado digitalmente).
- `server/forja/auth-cloudflare.js` comprueba ese JWT con las **claves públicas** de Cloudflare: firma correcta, no caducado, emitido por tu equipo y para esta aplicación (AUD). Si algo falla → 403.
- Si faltan las variables `CF_ACCESS_*`, `/forja` responde 503: **fail closed** (ante la duda, nadie entra).

## Probar en tu ordenador sin Cloudflare

En tu `.env` local:

```
FORJA_SIN_AUTH=1      # saltar Cloudflare (se ignora si NODE_ENV=production)
FORJA_MODO_DEMO=1     # opcional: respuestas de ejemplo sin gastar API
```

`npm run dev` y abre <http://localhost:3000/forja>.
