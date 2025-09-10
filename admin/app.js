// Archivo: /admin/app.js
// RESPONSABILIDAD: Maneja autenticación, tabs, CRUD de Configuración y Servicios.
// Buenas prácticas: modularidad con funciones pequeñas, comentarios por bloques y manejo básico de errores.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { firebaseConfig, ALLOWED_EMAILS } from "./config.js";

// -------------------------
// BLOQUE: Inicialización Firebase
// -------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// -------------------------
// BLOQUE: Selectores de UI
// -------------------------
const authOverlay = document.getElementById('authOverlay');
const formLogin = document.getElementById('formLogin');
const authMsg = document.getElementById('authMsg');
const btnLogout = document.getElementById('btnLogout');
const userEmail = document.getElementById('userEmail');

const tabLinks = document.querySelectorAll('.tablink');
const tabs = document.querySelectorAll('.tab');

// Configuración
const formSettings = document.getElementById('formSettings');
const settingsSaved = document.getElementById('settingsSaved');

// Servicios
const servicesList = document.getElementById('servicesList');
const btnNewService = document.getElementById('btnNewService');
const serviceModal = document.getElementById('serviceModal');
const formService = document.getElementById('formService');
const serviceModalTitle = document.getElementById('serviceModalTitle');

// -------------------------
// BLOQUE: Utils UI
// -------------------------
function setActiveTab(tabId){
  tabs.forEach(t => t.classList.toggle('active', t.id === tabId));
  tabLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
}

tabLinks.forEach(b => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));
function toastSaved(el){
  el.textContent = 'Guardado ✔';
  setTimeout(() => el.textContent = '', 1500);
}

// -------------------------
// BLOQUE: Autenticación (login/logout) + guard de emails permitidos
// -------------------------
formLogin?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(formLogin);
  const email = data.get('email');
  const password = data.get('password');
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Validación extra: solo emails permitidos
    if (!ALLOWED_EMAILS.includes(cred.user.email)) {
      await signOut(auth);
      authMsg.textContent = 'Este usuario no está autorizado para el panel.';
    }
  } catch (err) {
    console.error(err);
    authMsg.textContent = 'Error de acceso. Verifica tus datos.';
  }
});

btnLogout?.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  const loggedIn = !!user && ALLOWED_EMAILS.includes(user.email);
  authOverlay.style.display = loggedIn ? 'none' : 'grid';
  userEmail.textContent = loggedIn ? user.email : '';
  if (loggedIn) {
    loadSettings();
    loadServices();
  } else {
    servicesList.innerHTML = '';
  }
});

// -------------------------
// BLOQUE: Configuración (doc único: settings/global)
// -------------------------
const settingsRef = doc(db, 'settings', 'global');

async function loadSettings(){
  try {
    const snap = await getDoc(settingsRef);
    const data = snap.exists() ? snap.data() : {};
    // Rellena formulario con valores actuales
    formSettings.title.value = data.title ?? '';
    formSettings.subtitle.value = data.subtitle ?? '';
    formSettings.primaryColor.value = data.primaryColor ?? '#7a3cff';
    formSettings.whatsapp.value = data.whatsapp ?? '';
    formSettings.email.value = data.email ?? '';
    formSettings.instagram.value = data.instagram ?? '';
    formSettings.heroImage.value = data.heroImage ?? '';
    formSettings.show_services.checked = data.show_services ?? true;
    formSettings.show_faq.checked = data.show_faq ?? true;
    formSettings.show_tarot.checked = data.show_tarot ?? true;
  } catch (err){
    console.error('Error cargando settings', err);
  }
}

formSettings?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(formSettings);
  const payload = {
    title: data.get('title'),
    subtitle: data.get('subtitle'),
    primaryColor: data.get('primaryColor'),
    whatsapp: data.get('whatsapp'),
    email: data.get('email'),
    instagram: data.get('instagram'),
    heroImage: data.get('heroImage'),
    show_services: formSettings.show_services.checked,
    show_faq: formSettings.show_faq.checked,
    show_tarot: formSettings.show_tarot.checked,
    updatedAt: new Date().toISOString()
  };
  try {
    await setDoc(settingsRef, payload, { merge: true });
    toastSaved(settingsSaved);
  } catch (err){
    console.error('Error guardando settings', err);
  }
});

// -------------------------
// BLOQUE: Servicios (colección: services)
// -------------------------
const colServices = collection(db, 'services');
async function loadServices(){
  servicesList.innerHTML = '<li class="muted">Cargando…</li>';
  try {
    const q = query(colServices, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(docu => {
      const d = docu.data();
      items.push(renderServiceItem(docu.id, d));
    });
    servicesList.innerHTML = '';
    if (items.length === 0) {
      servicesList.innerHTML = '<li class="muted">Sin servicios aún.</li>';
    } else {
      items.forEach(el => servicesList.appendChild(el));
    }
  } catch (err){
    console.error('Error listando servicios', err);
  }
}

function renderServiceItem(id, d){
  // Crea <li> por servicio con acciones: editar, borrar, subir/bajar y activar.
  const li = document.createElement('li');
  li.className = 'list__item';
  li.dataset.id = id;
  li.innerHTML = `
    <div class="item__main">
      <strong>${d.name ?? '(Sin nombre)'}</strong>
      <span class="muted">${d.active ? 'Activo' : 'Inactivo'} · ${d.duration ?? 0}min · $${d.price ?? 0}</span>
    </div>
    <div class="item__actions">
      <button class="btn btn--ghost" data-action="up" title="Subir">▲</button>
      <button class="btn btn--ghost" data-action="down" title="Bajar">▼</button>
      <button class="btn btn--ghost" data-action="toggle" title="Activar/Inactivar">${d.active ? 'Desactivar' : 'Activar'}</button>
      <button class="btn" data-action="edit">Editar</button>
      <button class="btn btn--danger" data-action="delete">Borrar</button>
    </div>
  `;
  li.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'edit') openServiceModal(id, d);
    if (action === 'delete') await deleteService(id);
    if (action === 'toggle') await updateDoc(doc(db, 'services', id), { active: !d.active });
    if (action === 'up' || action === 'down') await moveService(id, action === 'up' ? -1 : 1);
    await loadServices();
  });
  return li;
}

btnNewService?.addEventListener('click', () => openServiceModal());

function openServiceModal(id = null, data = {}){
  serviceModalTitle.textContent = id ? 'Editar servicio' : 'Nuevo servicio';
  formService.id.value = id ?? '';
  formService.name.value = data.name ?? '';
  formService.description.value = data.description ?? '';
  formService.price.value = data.price ?? '';
  formService.duration.value = data.duration ?? '';
  formService.imageUrl.value = data.imageUrl ?? '';
  formService.active.checked = data.active ?? true;
  serviceModal.showModal();
}

formService?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(formService);
  const id = fd.get('id');
  const payload = {
    name: fd.get('name'),
    description: fd.get('description'),
    price: Number(fd.get('price') || 0),
    duration: Number(fd.get('duration') || 0),
    imageUrl: fd.get('imageUrl'),
    active: formService.active.checked,
    updatedAt: new Date().toISOString(),
  };
  try {
    if (id) {
      await updateDoc(doc(db, 'services', id), payload);
    } else {
      // order: usa timestamp para ordenar al final inicialmente
      await addDoc(colServices, { ...payload, order: Date.now() });
    }
    serviceModal.close();
    await loadServices();
  } catch (err){
    console.error('Error guardando servicio', err);
  }
});

async function deleteService(id){
  if (!confirm('¿Eliminar este servicio?')) return;
  try {
    await deleteDoc(doc(db, 'services', id));
  } catch (err){
    console.error('Error eliminando servicio', err);
  }
}

async function moveService(id, delta){
  // Reordena servicios moviendo su propiedad 'order' hacia arriba/abajo
  try {
    const q = query(colServices, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const arr = [];
    snap.forEach(d => arr.push({ id: d.id, order: d.data().order ?? 0 }));
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return;
    const swapIdx = idx + delta;
    if (swapIdx < 0 || swapIdx >= arr.length) return;
    const a = arr[idx], b = arr[swapIdx];
    await updateDoc(doc(db, 'services', a.id), { order: b.order });
    await updateDoc(doc(db, 'services', b.id), { order: a.order });
  } catch (err){
    console.error('Error reordenando', err);
  }
}
// -------------------------