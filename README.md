# Mi Portafolio - Santiago Lafuente

Portafolio personal desarrollado con **Node.js**, **Express** y **MySQL** como backend, y **HTML + Tailwind CSS** como frontend. Sirve como escaparate profesional con datos dinamicos gestionados por una API REST.

La base de datos esta alojada en la nube mediante **Aiven** (MySQL gestionado), con conexion SSL.

## Estructura del proyecto

```
mi-portafolio/
├── public/              # Frontend (archivos estaticos)
│   ├── index.html       # Pagina principal (comentada al detalle)
│   ├── js/
│   │   └── app.js       # Logica del frontend (comentada al detalle)
│   └── img/
│       └── perfil.jpg   # Foto de perfil
├── server/              # Backend
│   ├── index.js         # Servidor Express + rutas API REST
│   ├── db.js            # Conexion al pool MySQL (Aiven)
│   ├── init-db.js       # Script: crea las tablas en la BD
│   └── seed.js          # Script: inserta los datos reales del portafolio
├── .env                 # Variables de entorno (NO se sube a git)
├── .env.example         # Plantilla de variables de entorno
├── .gitignore
├── peticiones.http      # Peticiones de prueba para la API
├── package.json
└── README.md
```

## Requisitos

- **Node.js** v18 o superior
- **npm**
- Una base de datos MySQL accesible (local o en la nube — se recomienda [Aiven](https://aiven.io))

## Instalacion

1. Clona el repositorio:
   ```bash
   git clone https://github.com/santilafu/mi-portafolio.git
   cd mi-portafolio
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales de MySQL:
   ```env
   DB_HOST=tu-host.aivencloud.com
   DB_PORT=16101
   DB_USER=avnadmin
   DB_PASSWORD=tu_contraseña
   DB_NAME=defaultdb
   DB_SSL=true
   PORT=3000
   CORS_ORIGIN=http://localhost:3000
   ```

4. Crea las tablas en la base de datos:
   ```bash
   node server/init-db.js
   ```

5. Inserta los datos del portafolio:
   ```bash
   node server/seed.js
   ```
   > El script es idempotente: si ya hay datos, los omite sin error.

6. Arranca el servidor:
   ```bash
   npm start
   ```

7. Abre en el navegador: [http://localhost:3000](http://localhost:3000)

## API Endpoints

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/perfil` | Obtener perfil |
| POST | `/api/perfil` | Crear perfil |
| PUT | `/api/perfil/:id` | Actualizar perfil |
| GET | `/api/proyectos` | Listar proyectos |
| POST | `/api/proyectos` | Crear proyecto |
| PUT | `/api/proyectos/:id` | Actualizar proyecto |
| DELETE | `/api/proyectos/:id` | Eliminar proyecto |
| GET | `/api/habilidades` | Listar habilidades |
| POST | `/api/habilidades` | Crear habilidad |
| PUT | `/api/habilidades/:id` | Actualizar habilidad |
| DELETE | `/api/habilidades/:id` | Eliminar habilidad |
| GET | `/api/experiencia` | Listar experiencia |
| POST | `/api/experiencia` | Crear experiencia |
| PUT | `/api/experiencia/:id` | Actualizar experiencia |
| DELETE | `/api/experiencia/:id` | Eliminar experiencia |

## Seguridad

- **Helmet** - Cabeceras HTTP seguras
- **express-rate-limit** - Limite de 100 peticiones/15min por IP
- **dotenv** - Credenciales fuera del codigo fuente
- **Consultas parametrizadas** - Prevencion de inyeccion SQL
- **SSL** - Conexion cifrada con la BD en Aiven
- **CORS** configurable desde `.env`

## Tech Stack

**Backend:** Node.js, Express, MySQL2, Helmet, dotenv, express-rate-limit
**Frontend:** HTML5, Tailwind CSS, JavaScript vanilla, Font Awesome, Devicon
**Base de datos:** MySQL en Aiven (nube)

## Autor

**Santiago Lafuente Hernandez** - Estudiante de DAM (Desarrollo de Aplicaciones Multiplataforma)

- GitHub: [santilafu](https://github.com/santilafu)
- Email: santi10dy@gmail.com
