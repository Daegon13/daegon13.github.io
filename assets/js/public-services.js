// Archivo: /assets/js/public-services.js
// RESPONSABILIDAD: Leer Firestore y renderizar servicios por categoría en páginas públicas
// Sin índices compuestos: filtramos por category y ordenamos en cliente.
// Reutiliza firebaseConfig desde /admin/config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { firebaseConfig } from "/admin/config.js";

// -------------------------------
// Inicialización Firebase (solo lectura)
// -------------------------------
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ----------------------------------------
// Detectar categoría desde parámetro explícito, data-attr o pathname.
// ----------------------------------------
function detectCategory(explicitCategory) {
  if (explicitCategory) return explicitCategory.toLowerCase();
  const fromAttr = document.body?.dataset?.pagecat;
  if (fromAttr) return fromAttr.toLowerCase();
  const p = location.pathname.toLowerCase();
  if (p.includes("magia-blanca")) return "blanca";
  if (p.includes("magia-roja"))   return "roja";
  return "roja"; // fallback
}

// ------------------------------------------------------
// Renderizar servicios por categoría (público)
// - containerSelector: CSS selector del UL/contendor
// - category: 'roja' | 'blanca' (opcional; se auto-detecta)
// ------------------------------------------------------
export async function renderServices(containerSelector = "#lista-servicios", category) {
  const ul = document.querySelector(containerSelector);
  if (!ul) return;

  const cat = detectCategory(category);
  ul.innerHTML = `<li class="muted">Cargando…</li>`;

  try {
    // Query mínima: filtramos por categoría (y active si existe) y ordenamos en cliente
    const q = query(
      collection(db, "services"),
      where("category", "==", cat),
      where("active", "==", true) // quita esta línea si no usas 'active'
    );
    const snap = await getDocs(q);

    const items = [];
    snap.forEach(d => items.push({ id: d.id, ...d.data() }));

    // Orden en memoria por 'order' ascendente (fallback a 0)
    items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (items.length === 0) {
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

    // Toggle "Ver más" / "Ver menos"
    ul.querySelectorAll(".serv-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = btn.closest("li").querySelector(".serv-desc");
        p.classList.toggle("clamp-3");
        btn.textContent = p.classList.contains("clamp-3") ? "Ver más" : "Ver menos";
      });
    });
  } catch (err) {
    console.error("Error cargando servicios públicos:", err);
    ul.innerHTML = `<li class="error">No se pudieron cargar los servicios. Intenta más tarde.</li>`;
  }
}

// Auto-ejecución si la página incluye un #lista-servicios por convención
document.addEventListener("DOMContentLoaded", () => {
  const target = document.querySelector("#lista-servicios");
  if (target) renderServices("#lista-servicios");
});
