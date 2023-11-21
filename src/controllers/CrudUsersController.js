const { getFirestore, collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const app = require('../config/Conexion');

const db = getFirestore(app);

async function obtenerUsuariosDesdeFirestore() {
  const usuariosCollection = collection(db, 'users');
  const usuariosSnapshot = await getDocs(usuariosCollection);
  const usuarios = usuariosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return usuarios.map((usuario, index) => ({ ...usuario, index: index + 1 }));
}


// controllers/CrudUsersController.js
// controllers/CrudUsersController.js
// ...
async function obtenerUsuarioPorId(id) {
  console.log('ID recibido en obtenerUsuarioPorId:', id);
  const usuariosCollection = collection(db, 'users');

  try {
    const usuarioDoc = await getDoc(doc(usuariosCollection, id));

    if (usuarioDoc.exists()) {
      const usuario = usuarioDoc.data();
      return { id: usuarioDoc.id, ...usuario };
    } else {
      console.error('Usuario no encontrado en obtenerUsuarioPorId');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener usuario por ID desde Firestore:', error);
    throw error;
  }
}



async function editarUsuarioEnFirestore(id, nuevosDatosUsuario) {
  const usuarioRef = doc(db, 'users', id);
  await updateDoc(usuarioRef, nuevosDatosUsuario);
}


  


// controllers/CrudUsersController.js
async function crearUsuarioEnFirestore(usuario) {
  const { name, email } = usuario;
  const docRef = await addDoc(collection(db, 'users'), { name, email });
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
      name: req.body.name,
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
        name: req.body.name,
        email: req.body.email,
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
