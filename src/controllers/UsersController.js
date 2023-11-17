const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, updateProfile } = require('firebase/auth');
const { getFirestore, collection, where, getDocs, query, addDoc, updateDoc, getDoc, deleteDoc } = require('firebase/firestore');
const { getStorage, ref, uploadBytes , getDownloadURL, deleteObject } = require('firebase/storage');
const app = require('../config/Conexion');
const debug = require('debug')('app:profile');
const userCtrol = {};
userCtrol.rendersignupForm = (req, res) => {
  res.render('users/signup');
};
userCtrol.signup = async (req, res) => {
  const { name, email, password, confirm_password } = req.body;
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  if (password !== confirm_password) {
    req.flash('error_msg', 'Las contraseñas no coinciden');
    return res.redirect('/users/signup');
  }

  if (password.length < 6) {
    req.flash('error_msg', 'La contraseña debe tener al menos 6 caracteres');
    return res.redirect('/users/signup');
  }

  try {
    // Crea un nuevo usuario con Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Envía un correo de verificación al usuario
    await sendEmailVerification(user);

    // Guarda la información del usuario en Firestore
    const userRef = collection(firestore, 'users');
    await addDoc(userRef, {
      uid: user.uid,
      name: name,
      email: email,
    });

    req.flash('success_msg', '¡Registro exitoso! Se ha enviado un correo de verificación a tu dirección de correo electrónico.');
    res.redirect('/users/signin');
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    req.flash('error_msg', 'Error al crear el usuario');
    res.redirect('/users/signup');
  }
};


userCtrol.rendersigninForm = (req, res) => {
  res.render('users/signin');
};

userCtrol.signin = async (req, res, next) => {
  const { email, password } = req.body;
  const auth = getAuth(app);

  try {
    // Inicia sesión con Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.emailVerified) {
      req.flash('error_msg', 'Debes verificar tu correo electrónico antes de iniciar sesión.');
      return res.redirect('/users/signin');
    }

    req.flash('success_msg', '¡Sesión iniciada!');
    res.redirect('/crud'); // Redirige al "crud" o la página que desees.
  } catch (error) {
    console.error('Usuario o contraseña incorrectos', error);
    req.flash('error_msg', 'Usuario o contraseña incorrectos');
    res.redirect('/users/signin');
  }
};


userCtrol.logout = (req, res) => {
  const auth = getAuth(app);

  signOut(auth)
    .then(() => {
      req.flash('success_msg', 'Sesión cerrada exitosamente');
      res.redirect('/users/signin');
    })
    .catch((error) => {
      console.error('Error al cerrar sesión:', error);
      req.flash('error_msg', 'Error al cerrar sesión');
      res.redirect('/');
    });
},

// Renderiza el formulario para restablecer la contraseña
userCtrol.renderForgotPasswordForm = (req, res) => {
  res.render('users/forgot-password');
};

// Procesa la solicitud de restablecimiento de contraseña
userCtrol.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const auth = getAuth(app);

  try {
    // Envía un correo electrónico para restablecer la contraseña
    await sendPasswordResetEmail(auth, email);
    req.flash('success_msg', 'Se ha enviado un correo electrónico para restablecer tu contraseña.');
    res.redirect('/users/signin'); // Redirige a la página de inicio de sesión.
  } catch (error) {
    console.error('Error al enviar el correo electrónico de restablecimiento de contraseña:', error);
    req.flash('error_msg', 'Error al enviar el correo electrónico de restablecimiento de contraseña');
    res.redirect('/users/forgot-password');
  }
};
userCtrol.renderProfile = async (req, res) => {
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

        let profileImageUrl = userData.profileImageUrl;

        if (profileImageUrl) {
          const storage = getStorage(app);
          const profileImageRef = ref(storage, profileImageUrl);
          profileImageUrl = await getDownloadURL(profileImageRef);
        }

        // Renderiza la vista con los datos del usuario y la URL de la imagen
        return res.render('users/profile', { name: userData.name, email: userData.email, uid: user.uid, profileImageUrl });
      } else {
        req.flash('error_msg', 'No se encontró información del usuario.');
        return res.redirect('/users/signin');
      }
    } catch (error) {
      console.error('Error al consultar Firestore:', error);
      req.flash('error_msg', 'Error al consultar Firestore');
      return res.redirect('/users/signin');
    }
  } else {
    req.flash('error_msg', 'Debes iniciar sesión para ver tu perfil.');
    return res.redirect('/users/signin');
  }
};

userCtrol.updateProfile = async (req, res) => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  if (user) {
    const { name, email } = req.body;

    const firestore = getFirestore(app);
    const userRef = collection(firestore, 'users');
    const userQuery = query(userRef, where('uid', '==', user.uid));

    try {
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userDocRef = querySnapshot.docs[0].ref;
        const userData = querySnapshot.docs[0].data();
        let profileImageUrl = userData.profileImageUrl;

        if (req.files && req.files.profileImage) {
          const storage = getStorage(app);

          if (profileImageUrl) {
            const previousImageRef = ref(storage, profileImageUrl);
            try {
              await deleteObject(previousImageRef);
              debug('Previous profile image deleted successfully!');
            } catch (error) {
              console.error('Error deleting previous profile image:', error);
              req.flash('error_msg', 'Hubo un error al eliminar la imagen anterior.');
              return res.redirect('/users/profile');
            }
          }

          const profileImageRef = ref(storage, `Avatar/${Date.now()}_${req.files.profileImage[0].originalname}`);

          try {
            await uploadBytes(profileImageRef, req.files.profileImage[0].buffer, {
              contentType: req.files.profileImage[0].mimetype
            });

            profileImageUrl = await getDownloadURL(profileImageRef);
            await updateDoc(userDocRef, { profileImageUrl });

            debug('Profile image uploaded successfully!');
          } catch (error) {
            console.error('Error uploading profile image:', error);
            req.flash('error_msg', 'Hubo un error al subir la nueva imagen. Por favor, inténtalo de nuevo más tarde.');
            return res.redirect('/users/profile');
          }
        }

        await updateDoc(userDocRef, {
          name: name,
          email: email
        });

        await updateProfile(user, { displayName: name, email: email });

        if (!profileImageUrl) {
          profileImageUrl = '/imagenes/default-avatar.jpg';
          await updateDoc(userDocRef, { profileImageUrl });
        }

        req.flash('success_msg', 'Perfil actualizado exitosamente');
        // Cambio: En lugar de renderizar, redirige directamente con el mensaje
        return res.redirect('/users/profile');
      } else {
        req.flash('error_msg', 'No se encontró información del usuario para actualizar.');
        return res.redirect('/users/profile');
      }
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      req.flash('error_msg', 'Hubo un error al actualizar el perfil. Por favor, inténtalo de nuevo más tarde.');
      return res.redirect('/users/profile');
    }
  } else {
    req.flash('error_msg', 'Debes iniciar sesión para actualizar tu perfil.');
    return res.redirect('/users/signin');
  }
};

module.exports = userCtrol;