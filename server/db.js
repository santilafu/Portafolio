/**
 * db.js
 * -----
 * Módulo encargado de gestionar la conexión con la base de datos MySQL (Aiven).
 *
 * En lugar de abrir y cerrar una conexión cada vez que hacemos una consulta,
 * usamos un POOL de conexiones. Un pool mantiene varias conexiones abiertas
 * y las reutiliza, lo que es mucho más eficiente.
 *
 * Las credenciales se leen del archivo .env para no escribirlas en el código
 * (buena práctica de seguridad: nunca hardcodear contraseñas).
 */

// Cargamos las variables de entorno del archivo .env
// override: true hace que sobreescriba cualquier variable que ya existiera
require('dotenv').config({ override: true });

// mysql2 es el driver que nos permite conectar Node.js con MySQL
const mysql = require('mysql2');

/**
 * Creamos el pool de conexiones.
 * Cada propiedad se lee de las variables de entorno (.env).
 * El || es el valor por defecto si la variable no está definida.
 */
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',   // dirección del servidor MySQL
    port:     process.env.DB_PORT     || 3306,          // puerto (3306 es el estándar de MySQL)
    user:     process.env.DB_USER     || 'root',        // usuario de la base de datos
    password: process.env.DB_PASSWORD || '',            // contraseña
    database: process.env.DB_NAME     || 'mi_portafolio', // nombre de la base de datos

    // SSL es obligatorio en Aiven para cifrar la conexión.
    // Si DB_SSL=true en el .env, activamos SSL con rejectUnauthorized: false
    // (necesario porque Aiven usa certificados propios, no de una CA pública).
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

/**
 * Convertimos el pool a su versión "promise".
 * Por defecto mysql2 usa callbacks (función que se ejecuta al terminar).
 * Con .promise() podemos usar async/await, que es más limpio y moderno.
 */
const promisePool = pool.promise();

/**
 * Test de conexión al arrancar el servidor.
 * Pedimos una conexión del pool solo para comprobar que llegamos a Aiven.
 * Si funciona, la liberamos inmediatamente con .release().
 * Si falla, mostramos el error para poder diagnosticarlo.
 */
promisePool.getConnection()
    .then(connection => {
        console.log('¡Conexión exitosa a la base de datos en la nube (Aiven)! ☁️');
        connection.release(); // devolvemos la conexión al pool para que otros la puedan usar
    })
    .catch(error => {
        console.error('❌ Error al conectar con Aiven:', error.message);
    });

// Exportamos el pool para usarlo en index.js y otros módulos
module.exports = promisePool;