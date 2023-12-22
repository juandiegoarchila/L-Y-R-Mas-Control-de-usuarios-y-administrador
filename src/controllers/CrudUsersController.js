const { getFirestore, collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc } = require('firebase/firestore');
const { getAuth, deleteUser, sendEmailVerification, createUserWithEmailAndPassword } = require('firebase/auth');
const { getStorage, ref, deleteObject } = require('firebase/storage');

const app = require('../config/Conexion');
const db = getFirestore(app);

const json2csv = require('json2csv').parse;
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path'); // Importa el módulo path para trabajar con rutas de archivos

const NUEVO_ANCHO = 50;  // Ajusta el ancho deseado de la imagen en el PDF
const NUEVA_ALTURA = 50; // Ajusta la altura deseada de la imagen en el PDF



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

async function crearUsuarioEnFirestore(usuario, isAdmin = false) {
  const { name, email, uid } = usuario;
  const role = isAdmin ? 1 : 0; // 0 para usuarios regulares, 1 para administradores

  try {
    // Intenta crear el usuario en Firestore
    const docRef = await addDoc(collection(db, 'users'), { name, email, uid, role });

    return docRef.id;
  } catch (error) {
    // Captura la excepción si el correo electrónico ya está en uso
    if (error.code === 'auth/email-already-in-use') {
      // Utiliza el sistema de mensajes flash para mostrar el mensaje de error
      req.flash('error_msg', 'El correo electrónico ya está en uso.');
      // Redirige al formulario de registro
      return res.redirect('/Crud/Users/usuarios/crear');
    } else {
      // Si hay otro tipo de error, regístralo en la consola y envía un mensaje genérico
      console.error('Error al crear usuario en Firestore:', error);
      req.flash('error_msg', 'Error al registrar el usuario. Por favor, inténtalo de nuevo.');
      return res.redirect('/Crud/Users/usuarios/crear');
    }
  }
}

async function eliminarUsuarioEnFirestore(id) {
  const usuarioRef = doc(db, 'users', id);

  try {
    const usuarioDoc = await getDoc(usuarioRef);

    if (!usuarioDoc.exists()) {
      console.error('Usuario no encontrado en eliminarUsuarioEnFirestore');
      return;
    }

    const userData = usuarioDoc.data();

    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.uid === userData.uid) {
      // Eliminar usuario en Firebase Authentication antes de continuar
      await deleteUser(user);
    }

    // Eliminar usuario en Firestore
    await deleteDoc(usuarioRef);

    if (userData.profileImageUrl) {
      const storageRef = ref(getStorage(), `user-profile-pictures/${id}`);
      await deleteObject(storageRef);
    }

    console.log('Usuario eliminado con ID:', id);
  } catch (error) {
    console.error('Error al eliminar usuario en Firestore:', error);
    throw error;
  }
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
async function getImageBase64(imagePath) {
  const image = fs.readFileSync(imagePath);
  return 'data:image/jpeg;base64,' + image.toString('base64');
}

const CrudUsersController = {};

CrudUsersController.indexUsuarios = async function (req, res) {
  try {
    const searchTerm = req.query.search ? req.query.search.toLowerCase() : '';
    const usuarios = await obtenerUsuariosDesdeFirestore();

    const usuariosFiltrados = usuarios
      .filter((usuario) => {
        const name = usuario.name.toLowerCase();
        const email = usuario.email.toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm);
      })
      .sort((a, b) => a.originalIndex - b.originalIndex);

    const itemsPerPage = parseInt(req.query.entries) || 5;

    const totalUsuariosFiltrados = usuariosFiltrados.length;
    const totalPages = Math.ceil(totalUsuariosFiltrados / itemsPerPage);

    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const usuariosPaginados = usuariosFiltrados.slice(startIndex, endIndex);

    res.render('CrudUsers/index', {
      usuarios: usuariosPaginados,
      currentPage: page,
      totalPages: totalPages,
      search: req.query.search,
      itemsPerPage: itemsPerPage,
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
      password: req.body.password,
      confirm_password: req.body.confirm_password,
    };

    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      nuevoUsuario.email,
      nuevoUsuario.password
    );
    const user = userCredential.user;

    nuevoUsuario.uid = user.uid;

    // El segundo argumento indica si el usuario debe tener el rol de administrador
    const idUsuario = await crearUsuarioEnFirestore(nuevoUsuario, req.body.isAdmin);

    await sendEmailVerification(user);

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

CrudUsersController.exportarCSV = async function (req, res) {
  try {
    const usuarios = await obtenerUsuariosDesdeFirestore(); // Obtén tus datos de la base de datos como lo haces actualmente

    // Convierte los datos a formato CSV
    const csv = json2csv(usuarios, { fields: ['name', 'email'] });

    // Envía el archivo CSV al cliente
    res.header('Content-Type', 'text/csv');
    res.attachment('usuarios.csv');
    res.send(csv);
  } catch (error) {
    console.error('Error al exportar usuarios como CSV:', error);
    res.status(500).send('Error interno del servidor');
  }
};

CrudUsersController.exportarPDF = async function (req, res) {
  try {
    const usuarios = await obtenerUsuariosDesdeFirestore();

    // Definir las coordenadas y dimensiones de la imagen y el texto
    const anchoPagina = 210;
    const anchoElemento = 30;
    const xElemento = anchoPagina - anchoElemento - 10;
    const yElemento = 5;
    const widthElemento = 20;
    const heightElemento = 20;

    // Crear el documento PDF
    const pdf = new jsPDF();

    // Agregar la imagen al PDF usando dataURL
    const imagePath = path.join(__dirname, '..', 'public', 'imagenes', 'col.jpg');
    const imageBase64 = await getImageBase64(imagePath);

    // Ajustar las coordenadas de la imagen según tu preferencia
    const xImagen = 163; // ajusta según tu preferencia
    const yImagen = 13; // ajusta según tu preferencia 
    const widthImagen = 20; // ajusta según tu preferencia
    const heightImagen = 20; // ajusta según tu preferencia
    pdf.addImage(imageBase64, 'JPEG', xImagen, yImagen, widthImagen, heightImagen);


     // Agregar el texto al PDF
     const textoCodigo = 'CÓDIGO';
     const valorCodigo = 'RE-GAC-033';
     const textoColegio = 'COLEGIO AMERICANO DE BOGOTÁ - NIT. 800.156.763-3';
    pdf.setFontSize(8);
    const estiloCeldaD = { width: xElemento - 15, border: '1' };

    // Celda para CÓDIGO: RE-GAC-033
    pdf.rect(14, yElemento + 6, xElemento - 135, 6);
    pdf.text(`${textoCodigo} ${valorCodigo}`, 15, yElemento + 10, estiloCeldaD);

    pdf.rect(49, yElemento + 6, xElemento - 65, 12);
    pdf.text(`${textoColegio}`, 65, yElemento + 13, { width: xElemento + 10, estiloCeldaD, border: '1' });

    // Otras frases
    const textoVersion = 'VERSIÓN';
    const valorVersion = 'Vs-06';
    const textoVigencia = 'VIGENCIA';
    const valorVigencia = '04/01/2024';
    const textoNombreFormato = 'NOMBRE DEL FORMATO';
    const valorNombreFormato = 'INFORME ANUAL DEL ESTUDIANTE PREESCOLAR A GRADO DÉCIMO';

    // Configurar estilo de celda
    const estiloCelda = { width: xElemento - 15, border: '1' };

    pdf.setDrawColor(0);
    pdf.setFillColor(255, 255, 255);

    // Frase 1: VERSIÓN
    pdf.rect(14, yElemento + 12, xElemento - 135, 6);
    pdf.text(`${textoVersion} ${valorVersion}`, 15, yElemento + 16, estiloCelda);

    // Frase 2: VIGENCIA
    pdf.rect(14, yElemento + 18, xElemento - 135, 6);
    pdf.text(`${textoVigencia} ${valorVigencia}`, 15, yElemento + 22, estiloCelda);

    // Frase 3: NOMBRE DEL FORMATO
    pdf.rect(14, yElemento + 24, xElemento - 135, 6);
    pdf.text(`${textoNombreFormato}`, 15, yElemento + 28, estiloCelda);

    // Frase 4: VALOR DEL FORMATO
    pdf.rect(49, yElemento + 18, xElemento - 65, 12);
    pdf.text(`${valorNombreFormato}`, 55, yElemento + 25, estiloCelda);

    // CELDA IMAGEN
    pdf.rect(49, yElemento + 6, xElemento - 25, 24);

    // Título del documento
    pdf.setFontSize(16);
    pdf.text('Informe de Usuarios', 15, 55, { border: '1' });

    // Definir las coordenadas y dimensiones de la tabla
    const xTabla = 15;
    const yTabla = 60;

    // Configurar la tabla de usuarios
    const headers = ['ID', 'Nombre', 'Correo Electrónico'];
    const data = usuarios.map((usuario, index) => [index + 1, usuario.name, usuario.email]);

    pdf.autoTable({
      startY: yTabla,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 10, border: '1' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { fontStyle: 'normal', textColor: [0, 0, 0] },
        1: { fontStyle: 'normal', textColor: [0, 0, 0] },
        2: { fontStyle: 'normal', textColor: [0, 0, 0] },
      },
    });

    // Guardar el PDF temporalmente en el servidor
    const tempDir = 'temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const pdfPath = path.join(tempDir, 'usuarios_temp.pdf');
    pdf.save(pdfPath);

    // Enviar el archivo PDF al cliente
    const pdfData = fs.readFileSync(pdfPath);

    // Configurar el encabezado Content-Disposition para que el navegador descargue el PDF
    res.header('Content-Disposition', 'attachment; filename=usuarios_exportacion.pdf');

    res.contentType('application/pdf');
    res.send(pdfData);
  } catch (error) {
    console.error('Error al exportar usuarios como PDF:', error);
    res.status(500).send('Error interno del servidor');
  }
};




async function getImageBase64(imagePath) {
  const image = fs.readFileSync(imagePath);
  return 'data:image/jpeg;base64,' + image.toString('base64');
}




CrudUsersController.previsualizarPDF = async function (req, res) {
  try {
    const usuarios = await obtenerUsuariosDesdeFirestore();

    // Definir las coordenadas y dimensiones de la imagen y el texto
    const anchoPagina = 210;
    const anchoElemento = 30;
    const xElemento = anchoPagina - anchoElemento - 10;
    const yElemento = 5;
    const widthElemento = 20;
    const heightElemento = 20;

    // Crear el documento PDF
    const pdf = new jsPDF();

    // Agregar la imagen al PDF usando dataURL
    const imagePath = path.join(__dirname, '..', 'public', 'imagenes', 'col.jpg');
    const imageBase64 = await getImageBase64(imagePath);

    // Ajustar las coordenadas de la imagen según tu preferencia
    const xImagen = 163; // ajusta según tu preferencia
    const yImagen = 13; // ajusta según tu preferencia 
    const widthImagen = 20; // ajusta según tu preferencia
    const heightImagen = 20; // ajusta según tu preferencia
    pdf.addImage(imageBase64, 'JPEG', xImagen, yImagen, widthImagen, heightImagen);


     // Agregar el texto al PDF
     const textoCodigo = 'CÓDIGO';
     const valorCodigo = 'RE-GAC-033';
     const textoColegio = 'COLEGIO AMERICANO DE BOGOTÁ - NIT. 800.156.763-3';
 
     pdf.setFontSize(8);
     const estiloCeldaD = { width: xElemento - 15, border: '1' };
 
      // Celda para CÓDIGO: RE-GAC-033
      pdf.rect(14, yElemento + 6, xElemento - 135, 6);
      pdf.text(`${textoCodigo} ${valorCodigo}`, 15, yElemento + 10, estiloCeldaD);

       pdf.rect(49, yElemento + 6, xElemento - 65, 12);
       pdf.text(`${textoColegio}`, 65, yElemento + 13, { width: xElemento + 10,estiloCeldaD, border: '1' });


    // Otras frases
      const textoVersion = 'VERSIÓN'
      const valorVersion = 'Vs-06'
      const textoVigencia = 'VIGENCIA'
      const valorVigencia = '04/01/2024'
      const textoNombreFormato = 'NOMBRE DEL FORMATO'
      const valorNombreFormato = 'INFORME ANUAL DEL ESTUDIANTE PREESCOLAR A GRADO DÉCIMO';

      // Configurar estilo de celda
      const estiloCelda = { width: xElemento - 15, border: '1' };

      pdf.setDrawColor(0);
      pdf.setFillColor(255, 255, 255);

      // Frase 1: VERSIÓN
      pdf.rect(14, yElemento + 12, xElemento - 135, 6);
      pdf.text(`${textoVersion} ${valorVersion}`, 15, yElemento + 16, estiloCelda);

      // Frase 2: VIGENCIA
      pdf.rect(14, yElemento + 18, xElemento - 135, 6);
      pdf.text(`${textoVigencia} ${valorVigencia}`, 15, yElemento + 22, estiloCelda);

      // Frase 3: NOMBRE DEL FORMATO
      pdf.rect(14, yElemento + 24, xElemento - 135, 6);
      pdf.text(`${textoNombreFormato}`, 15, yElemento + 28, estiloCelda);

      // Frase 4: VALOR DEL FORMATO
      pdf.rect(49, yElemento + 18, xElemento - 65, 12);
      pdf.text(`${valorNombreFormato}`, 55, yElemento + 25, estiloCelda);

      // CELDA IMAGEN
      pdf.rect(49, yElemento + 6, xElemento - 25, 24);

    // Título del documento
    pdf.setFontSize(16);
    pdf.text('Informe de Usuarios', 15, 55, { border: '1' });

    // Definir las coordenadas y dimensiones de la tabla
    const xTabla = 15;
    const yTabla = 60;

    // Configurar la tabla de usuarios
    const headers = ['ID', 'Nombre', 'Correo Electrónico'];
    const data = usuarios.map((usuario, index) => [index + 1, usuario.name, usuario.email]);

    pdf.autoTable({
      startY: yTabla,
      head: [headers],
      body: data,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 10, border: '1' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      columnStyles: {
        0: { fontStyle: 'normal', textColor: [0, 0, 0] },
        1: { fontStyle: 'normal', textColor: [0, 0, 0] },
        2: { fontStyle: 'normal', textColor: [0, 0, 0] },
      },
    });

    // Guardar el PDF temporalmente en el servidor
    const tempDir = 'temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const pdfPath = path.join(tempDir, 'usuarios_temp.pdf');
    pdf.save(pdfPath);

    // Enviar el archivo PDF al cliente para previsualización
    const pdfData = fs.readFileSync(pdfPath);

    // Configurar el encabezado Content-Disposition para que el navegador abra el PDF en lugar de descargarlo
    res.header('Content-Disposition', 'inline; filename=usuarios_previsualizacion.pdf');

    res.contentType('application/pdf');
    res.send(pdfData);
  } catch (error) {
    console.error('Error al previsualizar usuarios como PDF:', error);
    res.status(500).send('Error interno del servidor');
  }
};







CrudUsersController.exportarExcel = async function (req, res) {
  try {
    const usuarios = await obtenerUsuariosDesdeFirestore();

    // Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(usuarios);
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    // Guardar el libro de Excel y enviarlo al cliente
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.attachment('usuarios.xlsx');
    res.send(XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }));
  } catch (error) {
    console.error('Error al exportar usuarios como Excel:', error);
    res.status(500).send('Error interno del servidor');
  }
};

module.exports = CrudUsersController;