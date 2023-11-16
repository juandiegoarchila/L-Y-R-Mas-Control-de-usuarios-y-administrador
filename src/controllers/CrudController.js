const { getFirestore, collection, addDoc, getDoc, deleteDoc, doc, getDocs, updateDoc, query, where } = require('firebase/firestore');
const { getAuth } = require('firebase/auth');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage'); // Agregué esta línea para importar funciones de almacenamiento
const app = require('../config/Conexion');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const db = getFirestore(app);
const auth = getAuth(app);

// Resto del código sin cambios

module.exports = {
  index: async function (req, res) {
    const auth = getAuth(app);
    const user = auth.currentUser;
  
    if (user) {
      const firestore = getFirestore(app);
      const userRef = collection(firestore, 'users');
      const userQuery = query(userRef, where('uid', '==', user.uid));
  
      try {
        const querySnapshot = await getDocs(userQuery);
  
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
  
          // Obtén la URL de descarga de la imagen del usuario
          let profileImageUrl = userData.profileImageUrl;
  
          if (profileImageUrl) {
            const storage = getStorage(app);
            const profileImageRef = ref(storage, profileImageUrl);
            profileImageUrl = await getDownloadURL(profileImageRef);
          }
          
  
          // Obtén los datos CRUD de tu base de datos
          const crudCollection = collection(db, "CRUD"); 
          const CrudSnapshot = await getDocs(crudCollection); 
          const CRUD = CrudSnapshot.docs.map((doc) => {
            const data = doc.data();
            return { id: doc.id, nombre: data.nombre, imagen: data.imagen };
          });
  
          // Renderiza la vista con los datos del usuario y los datos CRUD
          res.render('Crud/index', { name: userData.name, profileImageUrl, CRUD: CRUD });
        } else {
          req.flash('error_msg', 'No se encontró información del usuario.');
          res.redirect('/users/signin');
        }
      } catch (error) {
        console.error('Error al consultar Firestore:', error);
        req.flash('error_msg', 'Error al consultar Firestore');
        res.redirect('/users/signin');
      }
    } else {
      req.flash('error_msg', 'Debes iniciar sesión para ver tu perfil.');
      res.redirect('/users/signin');
    }
  },
  
  crear: async function (req, res) {
    try {
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (user) {
        const firestore = getFirestore(app);
        const userRef = collection(firestore, 'users');
        const userQuery = query(userRef, where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();

          // Obtén la URL de descarga de la imagen del usuario
          let profileImageUrl = userData.profileImageUrl;

          if (profileImageUrl) {
            const storage = getStorage(app);
            const profileImageRef = ref(storage, profileImageUrl);
            profileImageUrl = await getDownloadURL(profileImageRef);
          }

          res.render('Crud/crear', { name: userData.name, profileImageUrl });
        } else {
          req.flash('error_msg', 'No se encontró información del usuario.');
          res.redirect('/users/signin');
        }
      } else {
        req.flash('error_msg', 'Debes iniciar sesión para crear un libro.');
        res.redirect('/users/signin');
      }
    } catch (error) {
      console.error('Error al consultar Firestore:', error);
      req.flash('error_msg', 'Error al consultar Firestore');
      res.redirect('/users/signin');
    }
  },

  creardato: async function (req, res) {
    try {
      const { nombre } = req.body;
      let imagen = null;

      if (req.file) {
        imagen = req.file.filename;
      }

      // Obtén la información del usuario
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!nombre && !imagen) {
        if (user) {
          const firestore = getFirestore(app);
          const userRef = collection(firestore, 'users');
          const userQuery = query(userRef, where('uid', '==', user.uid));
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();

            // Renderiza la vista con el mensaje de error y el nombre del usuario
            req.flash('error_msg', 'Debes proporcionar al menos un campo (Nombre o Imagen)');
            return res.render('Crud/crear', { nombre, error_msg: req.flash('error_msg'), name: userData.name });
          } else {
            console.log("Usuario no encontrado en Firestore. Redireccionando...");
            res.status(404).send("El usuario no se encontró en la base de datos.");
          }
        } else {
          req.flash('error_msg', 'Debes iniciar sesión para crear un libro y proporcionar al menos un campo (Nombre o Imagen)');
          return res.redirect('/users/signin');
        }
      }

      // Obtén la URL de descarga de la imagen del usuario
      let profileImageUrl = null;

      if (user) {
        const firestore = getFirestore(app);
        const userRef = collection(firestore, 'users');
        const userQuery = query(userRef, where('uid', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();

          if (userData.profileImageUrl) {
            const storage = getStorage(app);
            const profileImageRef = ref(storage, userData.profileImageUrl);
            profileImageUrl = await getDownloadURL(profileImageRef);
          }
        }
      }

      const crudCollection = collection(db, "CRUD");
      const nuevodato = {
        nombre,
        imagen,
      };

      await addDoc(crudCollection, nuevodato);
      req.flash('success_msg', 'Creación de un nuevo libro');

      res.redirect('/crud');
    } catch (error) {
      console.error("Error al agregar dato: ", error);
      res.status(500).send("Error al agregar dato: " + error.message);
    }
  },


  eliminar: async function (req, res) {
    try {
      const id = req.params.id;
  
      const crudCollection = collection(db, "CRUD"); 
      const elementoRef = doc(crudCollection, id); 
  
      const elementoSnapshot = await getDoc(elementoRef);
  
      if (elementoSnapshot.exists()) {
        const elementoData = elementoSnapshot.data();
  
        if (elementoData.imagen) {
          const imagePath = path.join(__dirname, '../public/imagenes', elementoData.imagen);
          fs.unlinkSync(imagePath);
        }
  
        await deleteDoc(elementoRef);
  
        req.flash('error_msg', 'Libro eliminado con éxito');
  
        res.redirect('/crud'); 
      } else {
        res.status(404).send("El elemento no se encontró en la base de datos.");
      }
    } catch (error) {
      console.error("Error al eliminar elemento: ", error);
      res.status(500).send("Error al eliminar elemento: " + error.message);
    }
  },
  
  
  mostrarFormularioEdicion: async function (req, res) {
    try {
      const id = req.params.id;
  
      // Obtén la información del libro
      const CrudSnapshot = await getDoc(doc(collection(db, 'CRUD'), id));
  
      if (CrudSnapshot.exists()) {
        const CrudData = CrudSnapshot.data();
  
        // Obtén la información del usuario
        const auth = getAuth(app);
        const user = auth.currentUser;
  
        if (user) {
          const firestore = getFirestore(app);
          const userRef = collection(firestore, 'users');
          const userQuery = query(userRef, where('uid', '==', user.uid));
          const userSnapshot = await getDocs(userQuery);
  
          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
  
            // Obtén la URL de descarga de la imagen del usuario
            let profileImageUrl = null;
  
            if (userData.profileImageUrl) {
              const storage = getStorage(app);
              const profileImageRef = ref(storage, userData.profileImageUrl);
              profileImageUrl = await getDownloadURL(profileImageRef);
            }
  
            // Renderiza la vista con los datos del libro, del usuario y la imagen
            res.render('Crud/editar', { Tabla: CrudData, id, name: userData.name, profileImageUrl });
          } else {
            console.log("Usuario no encontrado en Firestore. Redireccionando...");
            res.status(404).send("El usuario no se encontró en la base de datos.");
          }
        } else {
          req.flash('error_msg', 'Debes iniciar sesión para editar un libro.');
          res.redirect('/users/signin');
        }
      } else {
        res.status(404).send('El libro no se encontró en la base de datos.');
      }
    } catch (error) {
      console.error("Error al obtener datos para editar: ", error);
      res.status(500).send("Error al obtener datos para editar: " + error.message);
    }
  },
  

  actualizar: async function (req, res) {
    try {
      const id = req.body.id;
      const { nombre, imagen } = req.body;
  
      const crudCollection = collection(db, "CRUD"); 
      const CrudRef = doc(crudCollection, id); 
      const CrudSnapshot = await getDoc(CrudRef);
  
      if (CrudSnapshot.exists()) {
        const CrudData = CrudSnapshot.data();
  
        if (req.file) {
          const nuevaImagen = req.file.filename;
            if (CrudData.imagen) {
            const imagePath = path.join(__dirname, '../public/imagenes', CrudData.imagen);
            fs.unlinkSync(imagePath);
          }
            CrudData.imagen = nuevaImagen;
        }
          CrudData.nombre = nombre;
          await updateDoc(CrudRef, CrudData);
  
        req.flash('success_msg', 'El libro fue actualizado con éxito');
  
        res.redirect("/crud");
      } else {
        console.log("Libro no encontrado en Firestore. Redireccionando...");
        res.status(404).send("El libro no se encontró en la base de datos.");
      }
    } catch (error) {
      console.error("Error al actualizar el libro: ", error);
      res.status(500).send("Error al actualizar el libro: " + error.message);
    }
  }
}  