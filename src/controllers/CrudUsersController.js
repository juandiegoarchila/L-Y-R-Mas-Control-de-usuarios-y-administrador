const {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} = require('firebase/firestore');

const app = require('../config/Conexion');
const db = getFirestore(app);

async function obtenerUsuariosDesdeFirestore() {
  const usuariosCollection = collection(db, 'users');
  const usuariosSnapshot = await getDocs(usuariosCollection);
  return usuariosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function obtenerUsuarioPorId(id) {
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

async function crearUsuarioEnFirestore(usuario) {
  const { name, email } = usuario;
  const docRef = await addDoc(collection(db, 'users'), { name, email });
  return docRef.id;
}

async function eliminarUsuarioEnFirestore(id) {
  const usuarioRef = doc(db, 'users', id);
  await deleteDoc(usuarioRef);
}

async function buscarUsuariosEnFirestore(terminoBusqueda) {
  const usuariosCollection = collection(db, 'users');
  const usuariosQuery = query(
    usuariosCollection,
    where('name', '>=', terminoBusqueda),
    where('email', '>=', terminoBusqueda)
  );

  try {
    const usuariosSnapshot = await getDocs(usuariosQuery);
    return usuariosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error al buscar usuarios en Firestore:', error);
    throw error;
  }
}

const CrudUsersController = {};

CrudUsersController.indexUsuarios = async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = 2;

    const usuarios = req.query.search
      ? await buscarUsuariosEnFirestore(req.query.search)
      : await obtenerUsuariosDesdeFirestore();

    const totalUsuarios = usuarios.length;
    const totalPages = Math.ceil(totalUsuarios / itemsPerPage);

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const usuariosPaginados = usuarios.slice(startIndex, endIndex);

    res.render('CrudUsers/index', {
      usuarios: usuariosPaginados,
      currentPage: page,
      totalPages: totalPages,
    });
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
      name: req.body.name,
      email: req.body.email,
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
    console.log('Intento de eliminar usuario con ID:', idUsuario);
    await eliminarUsuarioEnFirestore(idUsuario);
    console.log('Usuario eliminado con ID:', idUsuario);
    res.redirect('/Crud/Users/usuarios');
  } catch (error) {
    console.error('Error al eliminar usuario en Firestore:', error);
    res.status(500).send('Error interno del servidor');
  }
};

module.exports = CrudUsersController;
