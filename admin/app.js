// Archivo: /admin/app.js
// RESPONSABILIDAD: Maneja autenticación, tabs, y CRUD con Firestore.
// Esta versión es *tolerante a cambios en el HTML*: si agregás/quitás campos del formulario
// del servicio, el código no rompe. Mapea dinámicamente todos los inputs por su atributo "name".

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
// BLOQUE: Selectores de UI (IDs críticos que NO deben cambiar)
// -------------------------
const authOverlay = document.getElementById('authOverlay');
const formLogin = document.getElementById('formLogin');
const authMsg = document.getElementById('authMsg');
const btnLogout = document.getElementById('btnLogout');
const userEmail = document.getElementById('userEmail');

const tabLinks = document.querySelectorAll('.tablink');
const tabs = document.querySelectorAll('.tab');

const formSettings = document.getElementById('formSettings');
const settingsSaved = document.getElementById('settingsSaved');

const servicesList = document.getElementById('servicesList');
const btnNewService = document.getElementById('btnNewService');
const serviceModal = document.getElementById('serviceModal'); // <dialog> obligatoriamente con este id
const formService = document.getElementById('formService');   // <form> obligatoriamente con este id

// -------------------------
// BLOQUE: Utils UI
// -------------------------
function setActiveTab(tabId){
  if (!tabs?.length) return;
  tabs.forEach(t => t.classList.toggle('active', t.id === tabId));
  tabLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabId));
}

tabLinks.forEach(b => b.addEventListener('click', () => setActiveTab(b.dataset.tab)));

function toastSaved(el){
  if (!el) return;
  el.textContent = 'Guardado ✔';
  setTimeout(() => el.textContent = '', 1500);
}

// Helper seguro para obtener/poner valores por nombre de campo
function getControl(form, name){ return form?.elements?.namedItem(name) ?? null; }
function setValue(ctrl, value){
  if (!ctrl) return;
  if (ctrl.type === 'checkbox') ctrl.checked = Boolean(value);
  else ctrl.value = value ?? '';
}
function getValue(ctrl){
  if (!ctrl) return undefined;
  if (ctrl.type === 'checkbox') return Boolean(ctrl.checked);
  if (ctrl.type === 'number') return ctrl.value === '' ? null : Number(ctrl.value);
  return ctrl.value;
}

// Construye payload leyendo TODOS los campos con atributo name del form
function formToPayload(form){
  const payload = {};
  if (!form) return payload;
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    // Ignora el campo oculto id (lo manejamos aparte)
    if (el.name === 'id') return;
    payload[el.name] = getValue(el);
  });
  payload.updatedAt = new Date().toISOString();
  return payload;
}

// Rellena el form con el objeto data (nombre de propiedad === name del input)
function fillForm(form, data){
  if (!form) return;
  Array.from(form.elements).forEach(el => {
    if (!el.name) return;
    const val = data?.[el.name];
    // Si es "active" y no hay dato, por defecto true
    if (el.name === 'active' && typeof val === 'undefined') {
      setValue(el, true);
    } else {
      setValue(el, val);
    }
  });
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

onAuthStateChanged(auth, async (user) => {
  try {
    const loggedIn = !!user && ALLOWED_EMAILS.includes(user.email);
    if (authOverlay) authOverlay.style.display = loggedIn ? 'none' : 'grid';
    if (userEmail) userEmail.textContent = loggedIn ? user.email : '';
    if (loggedIn) {
      await loadSettings();
      await loadServices();
    } else {
      if (servicesList) servicesList.innerHTML = '';
    }
  } catch (err){
    console.error('onAuthStateChanged error:', err);
  }
});

// -------------------------
// BLOQUE: Configuración (doc único: settings/global)
// -------------------------
const settingsRef = doc(db, 'settings', 'global');

async function loadSettings(){
  if (!formSettings) return;
  try {
    const snap = await getDoc(settingsRef);
    const data = snap.exists() ? snap.data() : {};
    // Campos fijos del MVP (si eliminás alguno del HTML, esto no rompe)
    setValue(getControl(formSettings, 'title'), data.title ?? '');
    setValue(getControl(formSettings, 'subtitle'), data.subtitle ?? '');
    setValue(getControl(formSettings, 'primaryColor'), data.primaryColor ?? '#7a3cff');
    setValue(getControl(formSettings, 'whatsapp'), data.whatsapp ?? '');
    setValue(getControl(formSettings, 'email'), data.email ?? '');
    setValue(getControl(formSettings, 'instagram'), data.instagram ?? '');
    setValue(getControl(formSettings, 'heroImage'), data.heroImage ?? '');
    const ss = getControl(formSettings, 'show_services'); if (ss) ss.checked = data.show_services ?? true;
    const sf = getControl(formSettings, 'show_faq'); if (sf) sf.checked = data.show_faq ?? true;
    const st = getControl(formSettings, 'show_tarot'); if (st) st.checked = data.show_tarot ?? true;
  } catch (err){
    console.error('Error cargando settings', err);
  }
}

formSettings?.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const fd = new FormData(formSettings);
    const payload = {
      title: fd.get('title'),
      subtitle: fd.get('subtitle'),
      primaryColor: fd.get('primaryColor'),
      whatsapp: fd.get('whatsapp'),
      email: fd.get('email'),
      instagram: fd.get('instagram'),
      heroImage: fd.get('heroImage'),
      show_services: getControl(formSettings,'show_services')?.checked ?? true,
      show_faq: getControl(formSettings,'show_faq')?.checked ?? true,
      show_tarot: getControl(formSettings,'show_tarot')?.checked ?? true,
      updatedAt: new Date().toISOString()
    };
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
  if (!servicesList) return;
  servicesList.innerHTML = '<li class="muted">Cargando…</li>';
  try {
    const q = query(colServices, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(docu => items.push(renderServiceItem(docu.id, docu.data())));
    servicesList.innerHTML = '';
    if (items.length === 0) {
      servicesList.innerHTML = '<li class="muted">Sin servicios aún.</li>';
    } else {
      items.forEach(el => servicesList.appendChild(el));
    }
  } catch (err){
    console.error('Error listando servicios', err);
    servicesList.innerHTML = '<li class="muted">No se pudo cargar.</li>';
  }
}

function renderServiceItem(id, d){
  const li = document.createElement('li');
  li.className = 'list__item';
  li.dataset.id = id;
  const estado = d.active ? 'Activo' : 'Inactivo';
  const linea2 = [estado]
    .concat(typeof d.duration === 'number' ? [`${d.duration} días`] : [])
    .concat(typeof d.price === 'number' ? [`$${d.price}`] : [])
    .join(' · ');
  li.innerHTML = `
    <div class="item__main">
      <strong>${d.name ?? '(Sin nombre)'}</strong>
      <span class="muted">${linea2}</span>
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
    try {
      if (action === 'edit') openServiceModal(id, d);
      if (action === 'delete') await deleteService(id);
      if (action === 'toggle') await updateDoc(doc(db, 'services', id), { active: !d.active });
      if (action === 'up' || action === 'down') await moveService(id, action === 'up' ? -1 : 1);
      await loadServices();
    } catch (err){ console.error('Acción item error', err); }
  });
  return li;
}

btnNewService?.addEventListener('click', () => openServiceModal());

function openServiceModal(id = null, data = {}){
  if (!serviceModal || !formService) return;
  const titleEl = document.getElementById('serviceModalTitle');
  if (titleEl) titleEl.textContent = id ? 'Editar servicio' : 'Nuevo servicio';
  // Carga el id oculto si existe
  const idCtrl = getControl(formService, 'id');
  if (idCtrl) idCtrl.value = id ?? '';
  // Rellenar dinámicamente todos los campos
  formService.reset?.();
  fillForm(formService, data || {});
  // Asegura default de "active" en true si el campo existe y data no lo trae
  const activeCtrl = getControl(formService, 'active');
  if (activeCtrl && typeof data.active === 'undefined') activeCtrl.checked = true;
  try {
    serviceModal.showModal?.();
  } catch (err){
    console.warn('Dialog no soportado, intentando fallback', err);
    serviceModal.setAttribute('open',''); // Fallback básico
  }
}

formService?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!formService) return;
  try {
    const idCtrl = getControl(formService, 'id');
    const id = idCtrl ? idCtrl.value : '';
    // Construye payload con TODOS los campos (dinámico)
    const payload = formToPayload(formService);
    // Defaults útiles para el MVP si no existen en el form
    if (typeof payload.active === 'undefined') payload.active = true;

    if (id) {
      await updateDoc(doc(db, 'services', id), payload);
    } else {
      // order: usa timestamp si no fue provisto por el form
      if (typeof payload.order !== 'number') payload.order = Date.now();
      await addDoc(colServices, payload);
    }
    try { serviceModal.close?.(); } catch (_){ serviceModal.removeAttribute('open'); }
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

