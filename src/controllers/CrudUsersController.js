const { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const app = require('../config/Conexion');

const db = getFirestore(app);

// Función para obtener todos los usuarios desde Firestore
async function obtenerUsuariosDesdeFirestore() {
  const usuariosCollection = collection(db, 'users');
  const usuariosSnapshot = await getDocs(usuariosCollection);
  const usuarios = usuariosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return usuarios;
}

// Función para obtener un usuario por su ID desde Firestore
async function obtenerUsuarioPorId(id) {
  const usuarioDoc = await getDocs(query(collection(db, 'users'), where('id', '==', id)));
  const usuario = usuarioDoc.docs[0].data();
  return { id: usuarioDoc.docs[0].id, ...usuario };
}

// Función para crear un nuevo usuario en Firestore
async function crearUsuarioEnFirestore(usuario) {
  const docRef = await addDoc(collection(db, 'users'), usuario);
  return docRef.id;
}

// Función para editar un usuario en Firestore
async function editarUsuarioEnFirestore(id, nuevosDatosUsuario) {
  const usuarioRef = collection(db, 'users', id);
  await updateDoc(usuarioRef, nuevosDatosUsuario);
}

// Función para eliminar un usuario en Firestore
async function eliminarUsuarioEnFirestore(id) {
  const usuarioRef = collection(db, 'users', id);
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

CrudUsersController.crearUsuario = async function (req, res) {
  try {
    const nuevoUsuario = {
      nombre: req.body.nombre,
      email: req.body.email,
      foto: req.body.foto,
      // Agrega más campos según tus necesidades
    };

    const idUsuario = await crearUsuarioEnFirestore(nuevoUsuario);
    console.log('Nuevo usuario creado con ID:', idUsuario);

    res.redirect('/Crud/Users/usuarios');
  } catch (error) {
    console.error('Error al crear usuario en Firestore:', error);
    res.status(500).send('Error interno del servidor');
  }
};

CrudUsersController.formularioEditarUsuario = async function (req, res) {
  try {
    const usuario = await obtenerUsuarioPorId(req.params.id);
    res.render('CrudUsers/editar', { usuario: usuario });
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

CrudUsersController.eliminarUsuario = async function (req, res) {
  try {
    const idUsuario = req.params.id;
    await eliminarUsuarioEnFirestore(idUsuario);
    console.log('Usuario eliminado con ID:', idUsuario);

    res.redirect('/Crud/Users/usuarios');
  } catch (error) {
    console.error('Error al eliminar usuario en Firestore:', error);
    res.status(500).send('Error interno del servidor');
  }
};

module.exports = CrudUsersController;
