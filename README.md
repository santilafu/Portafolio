# Santiago Lafuente — Portafolio

> Portafolio personal full-stack con API REST, base de datos en la nube y despliegue en producción.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)
![Aiven](https://img.shields.io/badge/Aiven-FF0000?style=flat&logo=aiven&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat&logo=render&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)

---

## Descripcion

Portafolio personal desarrollado como proyecto de fin de ciclo DAM. Incluye:

- **Backend** con Node.js y Express que expone una API REST completa (CRUD)
- **Base de datos** MySQL alojada en la nube con **Aiven**, conexion SSL
- **Frontend** con HTML5, Tailwind CSS y JavaScript vanilla que consume la API
- **Desplegado en produccion** con **Render** (backend) + Aiven (BD)

---

## Estructura del proyecto

```
mi-portafolio/
├── public/                  # Frontend (archivos estaticos)
│   ├── index.html           # Pagina principal
│   ├── js/
│   │   └── app.js           # Logica del frontend (fetch, animaciones, DOM)
│   └── img/
│       └── perfil.jpg       # Foto de perfil
├── server/                  # Backend
│   ├── index.js             # Servidor Express + rutas API REST
│   ├── db.js                # Pool de conexiones MySQL (Aiven, SSL)
│   ├── init-db.js           # Script: crea las tablas en la BD
│   └── seed.js              # Script: inserta los datos del portafolio
├── .env                     # Variables de entorno locales (NO se sube a git)
├── .env.example             # Plantilla de variables de entorno
├── .gitignore
├── peticiones.http          # Coleccion de peticiones para probar la API
├── package.json
└── README.md
```

---

## Instalacion local

### Requisitos

- Node.js v18 o superior
- npm
- Base de datos MySQL (local o en la nube)

### Pasos

**1. Clonar el repositorio**
```bash
git clone https://github.com/santilafu/Portafolio.git
cd Portafolio
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Configurar variables de entorno**
```bash
cp .env.example .env
```
Edita `.env` con tus credenciales:
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

**4. Crear las tablas**
```bash
node server/init-db.js
```

**5. Insertar los datos del portafolio**
```bash
node server/seed.js
```
> El script es idempotente: si ya hay datos, los omite sin error.

**6. Arrancar el servidor**
```bash
npm start
```

**7. Abrir en el navegador**
```
http://localhost:3000
```

---

## Despliegue en produccion

### Backend — Render

El servidor Express esta desplegado como **Web Service** en [Render](https://render.com).

| Parametro | Valor |
|-----------|-------|
| Plataforma | Render (Web Service) |
| Build command | `npm install` |
| Start command | `npm start` |
| Variables de entorno | Configuradas en el panel de Render (nunca en el repositorio) |

Las credenciales de Aiven se inyectan directamente desde el panel de control de Render como variables de entorno seguras, garantizando que ninguna informacion sensible resida en el repositorio publico.

### Base de datos — Aiven

MySQL gestionado en la nube con conexion SSL obligatoria. Las credenciales se configuran exclusivamente via variables de entorno tanto en local (`.env`) como en produccion (panel de Render).

---

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

---

## Seguridad

| Medida | Descripcion |
|--------|-------------|
| Helmet | Cabeceras HTTP seguras automaticas |
| express-rate-limit | Maximo 100 peticiones / 15 min por IP |
| Consultas parametrizadas | Prevencion de inyeccion SQL con `?` |
| SSL | Conexion cifrada con la BD en Aiven |
| dotenv | Credenciales fuera del codigo fuente |
| CORS | Origen configurable desde `.env` |

---

## Tech Stack

| Capa | Tecnologias |
|------|-------------|
| Backend | Node.js, Express, mysql2, Helmet, dotenv, express-rate-limit |
| Frontend | HTML5, Tailwind CSS, JavaScript vanilla, Font Awesome, Devicon |
| Base de datos | MySQL (Aiven — cloud managed) |
| Despliegue | Render (backend), Aiven (BD) |

---

## Autor

**Santiago Lafuente Hernandez**
Estudiante de DAM — Desarrollo de Aplicaciones Multiplataforma

[![GitHub](https://img.shields.io/badge/GitHub-santilafu-181717?style=flat&logo=github)](https://github.com/santilafu)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Santiago_Lafuente-0A66C2?style=flat&logo=linkedin)](https://www.linkedin.com/in/santiago-lafuente-hernandez-796783226)
[![Email](https://img.shields.io/badge/Email-santi10dy@gmail.com-EA4335?style=flat&logo=gmail&logoColor=white)](mailto:santi10dy@gmail.com)
