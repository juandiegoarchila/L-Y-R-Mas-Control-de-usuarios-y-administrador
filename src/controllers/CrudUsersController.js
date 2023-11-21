const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } = require('firebase/firestore');
  const { getAuth } = require('firebase/auth');
  const app = require('../config/Conexion');

  const db = getFirestore(app);

  // Función para obtener todos los usuarios desde Firestore
// controllers/CrudUsersController.js
async function obtenerUsuariosDesdeFirestore() {
  const usuariosCollection = collection(db, 'users');
  const usuariosSnapshot = await getDocs(usuariosCollection);
  const usuarios = usuariosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return usuarios;
}

// controllers/CrudUsersController.js
async function obtenerUsuarioPorId(id) {
  const usuariosCollection = collection(db, 'users');
  const usuarioDoc = await getDocs(query(usuariosCollection, where('id', '==', id)));

  if (usuarioDoc.docs.length > 0) {
    const usuario = usuarioDoc.docs[0].data();
    return { id: usuarioDoc.docs[0].id, ...usuario };
  } else {
    return null; // Retorna null si no se encuentra el usuario
  }
}


  

// controllers/CrudUsersController.js
async function crearUsuarioEnFirestore(usuario) {
  const { nombre, email } = usuario;
  const docRef = await addDoc(collection(db, 'users'), { nombre, email });
  return docRef.id;
}





  

// Función para eliminar un usuario en Firestore
async function eliminarUsuarioEnFirestore(id) {
  const usuarioRef = doc(db, 'users', id);
  await deleteDoc(usuarioRef);
}



  const CrudUsersController = {};

  CrudUsersController.indexUsuarios = async function (req, res) {
    try {
      const usuarios = await obtenerUsuariosDesdeFirestore();
      res.render('CrudUsers/index', { usuarios: usuarios });
    } catch (error) {
      console.error('Error al obtener usuarios desde Firestore:', error);
      res.status(500).send('Error interno del servidor');
    }
  };

  CrudUsersController.formularioCrearUsuario = async function (req, res) {
    res.render('CrudUsers/crear');
  };

  // controllers/CrudUsersController.js
  CrudUsersController.crearUsuario = async function (req, res) {
    try {
      const nuevoUsuario = {
        nombre: req.body.nombre,
        email: req.body.email,
        // Otros campos según sea necesario
      };

      const idUsuario = await crearUsuarioEnFirestore(nuevoUsuario);
      console.log('Nuevo usuario creado con ID:', idUsuario);

      res.redirect('/Crud/Users/usuarios');
    } catch (error) {
      console.error('Error al crear usuario en Firestore:', error);
      res.status(500).send('Error interno del servidor');
    }
  };




  // controllers/CrudUsersController.js
  CrudUsersController.formularioEditarUsuario = async function (req, res) {
    try {
      const usuario = await obtenerUsuarioPorId(req.params.id);

      // Verifica si el usuario existe antes de renderizar la vista
      if (usuario) {
        res.render('CrudUsers/editar', { usuario: usuario });
      } else {
        res.status(404).send('Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error al obtener usuario para editar desde Firestore:', error);
      res.status(500).send('Error interno del servidor');
    }
  };


  CrudUsersController.editarUsuario = async function (req, res) {
    try {
      const idUsuario = req.params.id;
      const nuevosDatosUsuario = {
        nombre: req.body.nombre,
        email: req.body.email,
        foto: req.body.foto,
        // Agrega más campos según tus necesidades
      };

      await editarUsuarioEnFirestore(idUsuario, nuevosDatosUsuario);
      console.log('Usuario editado con ID:', idUsuario);

      res.redirect('/Crud/Users/usuarios');
    } catch (error) {
      console.error('Error al editar usuario en Firestore:', error);
      res.status(500).send('Error interno del servidor');
    }
  };

  // controllers/CrudUsersController.js
  CrudUsersController.eliminarUsuario = async function (req, res) {
    try {
      const idUsuario = req.params.id;
      console.log('Intento de eliminar usuario con ID:', idUsuario); // Agrega esta línea
      await eliminarUsuarioEnFirestore(idUsuario);
      console.log('Usuario eliminado con ID:', idUsuario);
      res.redirect('/Crud/Users/usuarios');
    } catch (error) {
      console.error('Error al eliminar usuario en Firestore:', error);
      res.status(500).send('Error interno del servidor');
    }
  };






  module.exports = CrudUsersController;
