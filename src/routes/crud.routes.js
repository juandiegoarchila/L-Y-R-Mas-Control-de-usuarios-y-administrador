const express = require('express');
const crudRouter = express.Router();
const Crud = require('../controllers/CrudController');
const multer = require('multer');
const path = require('path');
const isAuthenticated = require('../helpers/auth'); // Importa el middleware de autenticación
const app = require('../config/Conexion'); // Importa la configuración de Firebase

//CONFIGURACION DE MULTER
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './src/public/imagenes');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});
const cargar = multer({ storage: storage });
crudRouter.get('/', isAuthenticated(app), Crud.index);
crudRouter.get('/crear', isAuthenticated(app), Crud.crear);
crudRouter.post('/crear', isAuthenticated(app), cargar.single('imagen'), Crud.creardato);
crudRouter.post('/eliminar/:id', isAuthenticated(app), Crud.eliminar);
crudRouter.get('/editar/:id', isAuthenticated(app), Crud.mostrarFormularioEdicion);
crudRouter.post("/actualizar", isAuthenticated(app), cargar.single('imagen'), Crud.actualizar);


module.exports = crudRouter;



