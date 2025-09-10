// Archivo: /admin/config.js
// BLOQUE: Configuración del proyecto Firebase. Reemplaza los valores por los de tu proyecto.
// Nota: Las claves de Firebase Web no son secretas; las reglas de Firestore controlan el acceso real.

export const firebaseConfig = {
  apiKey: "AIzaSyCr0PQVjwtSuQuEZNtdn7atsQV973eZzeY",
  authDomain: "casa-minndara.firebaseapp.com",
  projectId: "casa-minndara",
  storageBucket: "casa-minndara.firebasestorage.app",
  messagingSenderId: "1042194844667",
  appId: "1:1042194844667:web:a1af25b6b5e4467d8d195e"
};

// Lista blanca de emails permitidos a ingresar al panel (extra en frontend)
export const ALLOWED_EMAILS = [
  "damgmarin13@gmail.com","mayadalucia@gmail.com"
  // Agrega aquí otros correos autorizados…
];
