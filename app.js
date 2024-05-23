// 1. Se invoca a express
const express = require('express');
const app = express(); // Crea una instancia de la aplicación Express

//2. Se setea el urlenconded para poder capturar datos desde formulario
app.use(express.urlencoded({ extended: false })); // Permite capturar datos codificados en URL desde formularios
app.use(express.json()); // Permite capturar datos en formato JSON

//3. Se invoca a dotenv para utilizar variables de entorno
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' }); // Carga las variables de entorno desde el archivo .env

//4. Se setea el Directorio public
app.use('/resources', express.static('public')); // Sirve archivos estáticos desde el directorio 'public'
app.use('/resources', express.static(__dirname + '/public')); // Sirve archivos estáticos desde el directorio 'public' con ruta absoluta

//5. Establecer el motor de plantillas
app.set('view engine', 'ejs'); // Configura EJS como el motor de plantillas para renderizar vistas

//6. Invocamos a bcryptjs para gestionar passwords
const bcryptjs = require('bcryptjs'); // Importa bcryptjs para manejar el hashing de contraseñas

//7. Var. de session
const session = require('express-session');
app.use(session({
    secret: 'secret', // Clave secreta para firmar la sesión
    resave: true, // Fuerza la sesión a ser guardada en la tienda incluso si no ha sido modificada
    saveUninitialized: true // Guarda una sesión no inicializada
}));

//8. Invocamos al modulo de conexión de la DB
const connection = require('./database/db'); // Importa el módulo de conexión a la base de datos

//9. Establecer rutas
app.get('/', (req, res) => {
    res.render('index.ejs'); // Renderiza la vista 'index.ejs' cuando se accede a la raíz
})

app.get('/register', (req, res) => {
    res.render('register.ejs'); // Renderiza la vista 'register.ejs' cuando se accede a '/register'
})

app.get('/login', (req, res) => {
    res.render('login.ejs'); // Renderiza la vista 'login.ejs' cuando se accede a '/login'
})

//10. Registro
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8); // Hashea la contraseña con bcryptjs
    connection.query('INSERT INTO  users SET ?', { user: user, name: name, rol: rol, pass: passwordHaash }, async (error, results) => {
        if (error) {
            console.log(error); // Muestra errores en la consola
        } else {
            res.render('register', {
                alert: true,
                alertTitle: "Registro",
                alertMessage: "Usuario registrado con exito :)",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 3500,
                ruta: 'login'
            }); // Renderiza una vista de éxito en el registro
        }
    });
});

// 11. Autenticacion
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass; 
    let passwordHaash = await bcryptjs.hash(pass, 8); // Hashea la contraseña (aunque este hash no se usa realmente en este contexto)
    if (user && pass) {
        connection.query('SELECT * FROM users WHERE user = ?', [user], async function (error, results) {
                if (results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass))) {
                    res.render('login', {
                        alert: true,
                        alertTitle: "Error",
                        alertMessage: "Usuario y/o contraseña incorrectas :(",
                        alertIcon: 'error',
                        showConfirmButton: true,
                        timer: false,
                        ruta: 'login'
                     }); // Renderiza una vista de error en el login
                } else {
                    //res.send('USUARIO O CONTRASEÑA CORRECTOS BIENVENIDO');
                    req.session.name = results[0].name; // Guarda el nombre del usuario en la sesión
                    res.render('index', {
                        alert: true,
                        alertTitle: "Conexion exitosa",
                        alertMessage: "!LOGIN CORRECTO BIENVENIDO¡",
                        alertIcon: 'success',
                        showConfirmButton: false,
                        timer: 2000,
                        ruta: '/'
                    }); // Renderiza una vista de éxito en el login
                }
            });
        }    
    }    
);

//12. Autenticacion paginas
app.get('/', (req, res) => {
    if(req.session.loggedin){
        res.render('index', {
            login: true,
            name: req.session.name
        }); // Renderiza la vista 'index' con el estado de login y el nombre del usuario si está autenticado
    } else {
        res.render('login', {
            login: false,
            name: 'Debe iniciar sesión'
        }); // Renderiza la vista 'login' con un mensaje indicando que se debe iniciar sesión
    }
});

app.listen(3000, (req, res) => {
    console.log('SERVER RUNNING IN http://localhost:3000'); // Inicia el servidor en el puerto 3000 y muestra un mensaje en la consola
});
