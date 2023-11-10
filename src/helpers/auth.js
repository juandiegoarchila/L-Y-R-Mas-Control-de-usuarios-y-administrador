const { getAuth } = require('firebase/auth');

const isAuthenticated = (app) => (req, res, next) => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (user) {
    return next();
  } else {
    req.flash('error_msg', 'Acceso no autorizado. Inicia sesión para continuar.');
    res.redirect('/users/signin');
  }
};

module.exports = isAuthenticated;
