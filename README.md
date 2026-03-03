# Mi Portafolio - Santiago Lafuente

Portafolio personal desarrollado con **Node.js**, **Express** y **MySQL** como backend, y **HTML + Tailwind CSS** como frontend. Sirve como escaparate profesional con datos dinamicos gestionados por una API REST.

## Estructura del proyecto

```
mi-portafolio/
├── public/              # Frontend (archivos estaticos)
│   ├── index.html       # Pagina principal
│   ├── js/
│   │   └── app.js       # Logica del frontend
│   └── img/
│       └── perfil.jpg   # Foto de perfil
├── server/              # Backend
│   ├── index.js         # Servidor Express + rutas API
│   └── db.js            # Conexion a MySQL
├── .env                 # Variables de entorno (NO se sube a git)
├── .env.example         # Plantilla de variables de entorno
├── .gitignore
├── peticiones.http      # Peticiones de prueba para la API
├── package.json
└── README.md
```

## Requisitos

- **Node.js** v18 o superior
- **MySQL** 8.0 o superior
- **npm**

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

3. Crea la base de datos en MySQL:
   ```sql
   CREATE DATABASE mi_portafolio;
   USE mi_portafolio;

   CREATE TABLE perfil (
       id INT AUTO_INCREMENT PRIMARY KEY,
       nombre VARCHAR(100) NOT NULL,
       titular VARCHAR(150),
       sobre_mi TEXT,
       email VARCHAR(100) NOT NULL,
       enlace_github VARCHAR(255),
       enlace_linkedin VARCHAR(255),
       foto_perfil VARCHAR(255)
   );

   CREATE TABLE proyectos (
       id INT AUTO_INCREMENT PRIMARY KEY,
       perfil_id INT NOT NULL,
       titulo VARCHAR(150) NOT NULL,
       descripcion TEXT,
       url_repo VARCHAR(255),
       url_demo VARCHAR(255),
       FOREIGN KEY (perfil_id) REFERENCES perfil(id)
   );

   CREATE TABLE habilidades (
       id INT AUTO_INCREMENT PRIMARY KEY,
       perfil_id INT NOT NULL,
       nombre VARCHAR(100) NOT NULL,
       nivel VARCHAR(50),
       FOREIGN KEY (perfil_id) REFERENCES perfil(id)
   );

   CREATE TABLE experiencia (
       id INT AUTO_INCREMENT PRIMARY KEY,
       perfil_id INT NOT NULL,
       empresa VARCHAR(150) NOT NULL,
       puesto VARCHAR(150) NOT NULL,
       fecha_inicio DATE NOT NULL,
       fecha_fin DATE,
       descripcion TEXT,
       FOREIGN KEY (perfil_id) REFERENCES perfil(id)
   );
   ```

4. Configura las variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tus credenciales de MySQL.

5. Arranca el servidor:
   ```bash
   npm start
   ```

6. Abre en el navegador: [http://localhost:3000](http://localhost:3000)

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
- **CORS** configurable desde `.env`

## Tech Stack

**Backend:** Node.js, Express, MySQL2, Helmet, dotenv
**Frontend:** HTML5, Tailwind CSS, JavaScript vanilla, Font Awesome, Devicon

## Autor

**Santiago Lafuente Hernandez** - Estudiante de DAM (Desarrollo de Aplicaciones Multiplataforma)

- GitHub: [santilafu](https://github.com/santilafu)
- Email: santi10dy@gmail.com
