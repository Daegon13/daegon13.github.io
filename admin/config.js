// Archivo: /admin/config.js
// BLOQUE: Configuración del proyecto Firebase. Reemplaza los valores por los de tu proyecto.
// Nota: Las claves de Firebase Web no son secretas; las reglas de Firestore controlan el acceso real.

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_BUCKET.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Lista blanca de emails permitidos a ingresar al panel (extra en frontend)
export const ALLOWED_EMAILS = [
  "tu-correo@cristal-sagrado.com",
  // Agrega aquí otros correos autorizados…
];
