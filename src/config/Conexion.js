const { initializeApp, getApps } = require("firebase/app");

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCLpSwe4Y3RksuKYbf1qgBh_4lO_Z_md-U",
  authDomain: "proyecto-cdlr.firebaseapp.com",
  projectId: "proyecto-cdlr",
  storageBucket: "proyecto-cdlr.appspot.com",
  messagingSenderId: "900361880229",
  appId: "1:900361880229:web:911dcf308b6f6bef69434c"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
module.exports = app; 

if (getApps().length > 0) {
  console.log('Conexión de Firebase establecida exitosamente');
  // Puedes agregar código adicional aquí para interactuar con Firebase
} else {
  console.log('Error al conectarse a Firebase.');
}
