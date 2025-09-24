// Archivo: /assets/js/data.js
// OBJETIVO: Leer Firestore y aplicar contenido en páginas públicas (index.html, servicios.html, etc.).
// USO: Incluye <script type="module" src="/assets/js/data.js"></script> al final de tus HTML públicos.

// -------------------------
// BLOQUE: Imports Firebase (app y firestore) + config del proyecto
// -------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { firebaseConfig } from "/admin/config.js"; // ruta absoluta en el sitio

// -------------------------
// BLOQUE: Inicialización Firebase (solo lectura pública)
// -------------------------
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// -------------------------
// BLOQUE: Aplica settings globales a la página
// -------------------------
export async function applySettings(){
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    if (!snap.exists()) return;
    const s = snap.data();

    // Título y subtítulo
    const titleEl = document.querySelector('[data-bind="site.title"]');
    const subtitleEl = document.querySelector('[data-bind="site.subtitle"]');
    if (titleEl) titleEl.textContent = s.title ?? titleEl.textContent;
    if (subtitleEl) subtitleEl.textContent = s.subtitle ?? subtitleEl.textContent;

    // Color primario (CSS var)
    if (s.primaryColor) document.documentElement.style.setProperty('--primary-color', s.primaryColor);

    // Contacto
    const waEls = document.querySelectorAll('[data-bind="site.whatsapp"]');
    waEls.forEach(a => { if (s.whatsapp) a.href = s.whatsapp; });
    const emailEls = document.querySelectorAll('[data-bind="site.email"]');
    emailEls.forEach(a => { if (s.email) a.textContent = s.email; });

    // Hero
    const heroImg = document.querySelector('[data-bind="site.hero"]');
    if (heroImg && s.heroImage) heroImg.setAttribute('src', s.heroImage);

    // Visibilidad de secciones
    toggleSection('[data-section="services"]', s.show_services);
    toggleSection('[data-section="faq"]', s.show_faq);
    toggleSection('[data-section="tarot"]', s.show_tarot);
  } catch (err){
    console.error('applySettings', err);
  }
}

function toggleSection(selector, show){
  const el = document.querySelector(selector);
  if (!el) return;
  el.style.display = show === false ? 'none' : '';
}

// -------------------------
// BLOQUE: Render de servicios en páginas públicas
// -------------------------
export async function renderServices(listSelector){
  const ul = document.querySelector(listSelector);
  if (!ul) return;
  ul.innerHTML = '<li>Cargando…</li>';
  try {
    const q = query(collection(db, 'services'), where('active','==', true), orderBy('order','asc'));
    const snap = await getDocs(q);
    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));

    if (items.length === 0) {
      ul.innerHTML = '<li>No hay servicios disponibles por ahora.</li>';
      return;
    }
    
    ul.innerHTML = items.map(s => `
      <li class="servicio">
        <div>
        <!-- Título del servicio -->
          <h3 class="service-title">${s.name ?? 'Servicio'}</h3>

           <!-- Descripción colapsable: por defecto se muestra poco texto -->
          <p class="service-desc">${s.description ?? ''}</p>

          <!-- Acción de expansión/colapso accesible -->
        <button class="toggle-desc" type="button" aria-expanded="false" aria-label="Ver descripción completa">
        Ver más
        </button>

          <!-- Meta -->
        <div class="meta">
          <strong>${s.price ? `$${s.price}` : ''}${s.duration ? ` · ${s.duration} días` : ''}</strong>
        </div>
      </li>
    `).join('');
  } catch (err){
    console.error('renderServices', err);
    ul.innerHTML = '<li>Error cargando servicios.</li>';
  }
  // ================================
// BLOQUE: Delegación de eventos para "Ver más / Ver menos"
// ================================
ul.addEventListener('click', (ev) => {
  const btn = ev.target.closest('.toggle-desc');
  if (!btn) return;

  const item = btn.closest('.servicio');
  if (!item) return;

  // Alterna el estado visual
  const expanded = item.classList.toggle('expanded');

  // Accesibilidad y texto del botón
  btn.setAttribute('aria-expanded', String(expanded));
  btn.textContent = expanded ? 'Ver menos' : 'Ver más';
});

// Utilidad: crea un slug único a partir del título
const toSlug = (text, i) => {
  const base = (text ?? 'servicio')
    .toString()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `svc-${base || 'item'}-${i}`;
};

// ================================
// BLOQUE: Buscador de servicios con scroll y highlight
// ================================
(function setupServiceSearch() {
  const input = document.getElementById('q');
  const btn = document.getElementById('btn-buscar');
  const feedback = document.getElementById('search-feedback');
  const ul = document.getElementById('lista-servicios');

  if (!input || !btn || !ul) return;

  // Limpia highlight previo
  const clearHighlights = () => {
    ul.querySelectorAll('.servicio.highlight').forEach(el => el.classList.remove('highlight'));
  };

  // Busca primer match por título o descripción
  const findFirstMatch = (q) => {
    if (!q) return null;
    const needle = q.trim().toLowerCase();
    if (!needle) return null;

    const items = [...ul.querySelectorAll('.servicio')];
    for (const li of items) {
      const title = (li.querySelector('.service-title')?.textContent || '').toLowerCase();
      const desc  = (li.querySelector('.service-desc')?.textContent || '').toLowerCase();
      if (title.includes(needle) || desc.includes(needle)) {
        return li;
      }
    }
    return null;
  };

  // Ejecuta búsqueda, hace scroll suave y resalta
  const goSearch = () => {
    clearHighlights();
    const q = input.value;
    const match = findFirstMatch(q);

    if (!match) {
      feedback.textContent = q?.trim()
        ? `Sin resultados para “${q.trim()}”.`
        : 'Escribí algo para buscar.';
      return;
    }

    // Expande el item (para ver más texto si aplica)
    match.classList.add('expanded');

    // Actualiza botón del ítem expandido si existe
    const btnToggle = match.querySelector('.toggle-desc');
    if (btnToggle) {
      btnToggle.setAttribute('aria-expanded', 'true');
      btnToggle.textContent = 'Ver menos';
    }

    // Resalta y hace scroll
    match.classList.add('highlight');
    match.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Feedback accesible
    const title = match.querySelector('.service-title')?.textContent || 'Servicio';
    feedback.textContent = `Mostrando: ${title}`;

    // Quita el highlight visual luego de un rato (opcional)
    setTimeout(() => match.classList.remove('highlight'), 2400);

    // Ancla en URL (útil para compartir el resultado)
    if (match.id) {
      history.replaceState(null, '', `#${match.id}`);
    }
  };

  // Click en botón
  btn.addEventListener('click', goSearch);

  // Enter en input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      goSearch();
    }
  });

  // Si llega con hash (ej: .../servicios.html#svc-x), enfocar y resaltar
  window.addEventListener('load', () => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (target && ul.contains(target)) {
      target.classList.add('expanded', 'highlight');
      const btnToggle = target.querySelector('.toggle-desc');
      if (btnToggle) {
        btnToggle.setAttribute('aria-expanded', 'true');
        btnToggle.textContent = 'Ver menos';
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => target.classList.remove('highlight'), 2400);
    }
  });
})();


}

// -------------------------
// BLOQUE: Auto-ejecución mínima
// -------------------------
applySettings();
// En servicios.html, busca <ul data-bind="services.list"></ul> y carga servicios