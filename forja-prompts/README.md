# ⚒️ Forja de Prompts

App web local para **hablar de forma natural** con Claude y obtener **prompts muy detallados para Claude Code**, con **bucles (loops)** incluidos para que la tarea se haga mejor.

## ¿Qué hace?

1. Le cuentas lo que quieres ("quiero añadir login a mi app").
2. Te hace unas pocas preguntas si le falta información importante.
3. Genera un prompt estructurado (contexto, objetivo, requisitos, restricciones, plan, criterios de aceptación, bucle de trabajo e informe final).
4. Lo copias o lo descargas en `.md` y lo pegas en Claude Code.

### Tipos de bucle

| Opción | Qué pone en el prompt |
|---|---|
| **Verificación** | Implementar → ejecutar tests/build → corregir → repetir hasta cumplir los criterios, con un **máximo de iteraciones** y qué hacer si no lo consigue. |
| **Recurrente** | Usa el comando `/loop` de Claude Code (`/loop 10m vigila el CI`) para tareas que se repiten en el tiempo. |
| **Automático** | La IA elige la que encaja. |
| **Sin bucles** | Solo una verificación final. |

## Cómo arrancarla

```bash
cd forja-prompts
npm install
cp .env.example .env      # y pon tu ANTHROPIC_API_KEY dentro
npm start                 # abre http://localhost:3100
```

¿Sin API key todavía? `npm run demo` enseña la interfaz con respuestas de ejemplo (gratis).

## Estructura

```
forja-prompts/
├── server.js          # Express: recibe el chat y llama a la API de Claude (streaming)
├── prompt-sistema.js  # Las instrucciones que definen cómo se comporta el asistente
└── public/
    ├── index.html     # La interfaz
    ├── styles.css     # Estilos (modo claro/oscuro, responsive)
    └── app.js         # Chat del navegador: envía, lee el streaming y extrae el prompt
```

## Conceptos que puedes aprender aquí

- **Streaming (SSE)**: la respuesta llega a trozos y se pinta mientras se escribe.
- **System prompt**: `prompt-sistema.js` es el "cerebro". Cambia el texto y cambia el comportamiento.
- **Seguridad**: la API key solo vive en el servidor (`.env`), el servidor escucha solo en tu ordenador (`127.0.0.1`), se valida todo lo que llega del navegador y se pinta con `textContent` (sin `innerHTML`).

## Coste

Usa el modelo `claude-opus-5-5` ($4 por millón de tokens de entrada y $20 por millón de salida). Una conversación normal cuesta céntimos. Si una petición la bloquean los filtros de seguridad, la API la reintenta sola con un modelo de respaldo (`fallbacks: "default"`).
