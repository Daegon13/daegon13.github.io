// Archivo: /assets/js/data.js
// RESPONSABILIDAD: Cargar y renderizar servicios por categoría (roja/blanca)
// + buscador en vivo + ver más/menos, todo desde Firestore.
// Usa firebaseConfig desde /admin/config.js.
// Nota: sin orderBy en Firestore para evitar índices; se ordena en cliente por `order`.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { firebaseConfig } from "/admin/config.js";

// -------------------------
// BLOQUE: Inicialización Firebase
// -------------------------
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// -------------------------
// BLOQUE: Estado en memoria (cache por categoría)
// -------------------------
const cache = {
  roja:   { items: [], lastFetch: 0 },
  blanca: { items: [], lastFetch: 0 }
};

// -------------------------
// BLOQUE: Utilidades
// -------------------------
function detectCategory(explicitCategory) {
  if (explicitCategory) return explicitCategory.toLowerCase();
  const fromAttr = document.body?.dataset?.pagecat;
  if (fromAttr) return fromAttr.toLowerCase();
  const p = location.pathname.toLowerCase();
  if (p.includes("magia-blanca")) return "blanca";
  if (p.includes("magia-roja"))   return "roja";
  if (p.includes("magia-negra"))   return "negra";
  if (p.includes("magia-verde"))   return "verde";
  return "roja";
}

function normalizeItems(snap) {
  const arr = [];
  snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
  // Orden en cliente por `order` asc (fallback a 0)
  arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return arr;
}

// Trunca/expande descripción
function wireViewMore(ul) {
  ul.querySelectorAll(".serv-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = btn.closest("li").querySelector(".serv-desc");
      p.classList.toggle("clamp-3");
      btn.textContent = p.classList.contains("clamp-3") ? "Ver más" : "Ver menos";
    });
  });
}

// -------------------------
// BLOQUE: Búsqueda en vivo (client-side)
// -------------------------
// - inputSelector: selector del <input> de búsqueda (opcional)
// - listSelector:  el UL/OL donde se renderizaron los servicios
export function attachSearch(inputSelector = "#buscador-servicios", listSelector = "#lista-servicios") {
  const input = document.querySelector(inputSelector);
  const list  = document.querySelector(listSelector);
  if (!input || !list) return;

  input.addEventListener("input", () => {
    const term = input.value.trim().toLowerCase();
    list.querySelectorAll("li.serv-card").forEach(li => {
      const title = (li.querySelector(".serv-title")?.textContent || "").toLowerCase();
      const desc  = (li.querySelector(".serv-desc")?.textContent || "").toLowerCase();
      const match = !term || title.includes(term) || desc.includes(term);
      li.style.display = match ? "" : "none";
    });
  });
}

// -------------------------
// BLOQUE: Render de servicios por categoría
// -------------------------
// - containerSelector: UL/OL contenedor (por defecto #lista-servicios)
// - category: 'roja' | 'blanca' (opcional; se auto-detecta)
// - options: { searchSelector?: string } para enganchar buscador al vuelo
export async function renderServices(containerSelector = "#lista-servicios", category, options = {}) {
  const ul = document.querySelector(containerSelector);
  if (!ul) return;

  const cat = detectCategory(category);
  ul.innerHTML = `<li class="muted">Cargando…</li>`;

  try {
    // Si hay cache fresco (5 min), úsalo
    const now = Date.now();
    const freshMs = 5 * 60 * 1000;
    let items = [];
    if (cache[cat] && (now - cache[cat].lastFetch) < freshMs && cache[cat].items.length) {
      items = cache[cat].items;
    } else {
      // Query mínima: filtramos por categoría (y active si existe)
      const q = query(
        collection(db, "services"),
        where("category", "==", cat),
        where("active", "==", true) // quita esta línea si no usas 'active'
      );
      const snap = await getDocs(q);
      items = normalizeItems(snap);
      cache[cat] = { items, lastFetch: now };
    }

    if (!items.length) {
      ul.innerHTML = `<li class="muted">Pronto habrá servicios disponibles aquí.</li>`;
      return;
    }

    ul.innerHTML = items.map(s => `
      <li class="serv-card" data-id="${s.id}">
        <h3 class="serv-title">${s.title ?? s.name ?? ""}</h3>
        <p class="serv-desc clamp-3">${s.description ?? ""}</p>
        <div class="serv-meta">
          ${s.price ? `<span class="serv-price">$${s.price}</span>` : ""}
          ${s.duration ? `<span class="serv-duration">${s.duration} días</span>` : ""}
        </div>
        <button class="serv-toggle" type="button">Ver más</button>
      </li>
    `).join("");

    wireViewMore(ul);

    // Si pasaste un input de búsqueda, lo enganchamos ahora
    if (options.searchSelector) {
      attachSearch(options.searchSelector, containerSelector);
    }
  } catch (err) {
    console.error("Error cargando servicios:", err);
    ul.innerHTML = `<li class="error">No se pudieron cargar los servicios. Intenta más tarde.</li>`;
  }
}

// -------------------------
// BLOQUE: Auto-inicialización “convención sobre configuración”
// -------------------------
// Si la página trae #lista-servicios, renderiza automáticamente con categoría detectada.
// Si existe #buscador-servicios, lo engancha automáticamente.
document.addEventListener("DOMContentLoaded", () => {
  const listEl = document.querySelector("#lista-servicios");
  if (listEl) {
    renderServices("#lista-servicios", /* category */ undefined, { searchSelector: "#buscador-servicios" });
  }
});
