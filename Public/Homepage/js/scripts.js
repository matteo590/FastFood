// ===== Cache in memoria =====
let ALL_RESTAURANTS = null;   // array completo (fetch una sola volta)
let BUILT = false;            // abbiamo già creato le card?

const byId = (id) => document.getElementById(id);
const container = byId("body");
const templateEl = byId("clone");

// Placeholder opzionale (se vuoi evitare buchi d’immagine)
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400">
  <rect width="100%" height="100%" fill="#e9ecef"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial" font-size="22" fill="#6c757d">No image</text>
</svg>`);

// ===== 1) Carica SOLO una volta dal server =====
async function loadRestaurantsOnce() {
  if (ALL_RESTAURANTS) return ALL_RESTAURANTS; // già in cache
  const res = await fetch("/api/restaurants");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  // tieni solo quelli validi
  ALL_RESTAURANTS = Array.isArray(data)
    ? data.filter(r => r?.name && r?.menu && r.menu.length)
    : [];
  return ALL_RESTAURANTS;
}

// ===== 2) Costruisci le card UNA SOLA VOLTA =====
function buildAllCards(restaurants) {
  if (!container || !templateEl || BUILT) return;
  const frag = document.createDocumentFragment();

  for (const r of restaurants) {
    // clona dal <template>
    const node = templateEl.content.firstElementChild.cloneNode(true);
    node.classList.add("js-restaurant-card");
    node.dataset.restaurantId = r._id;

    const link = node.querySelector("a");
    if (link) link.href = `/restaurants?id=${r._id}`;

    const img = node.querySelector("img");
    if (img) {
      const src = r.logo && String(r.logo).trim() ? r.logo : PLACEHOLDER_IMG;
      img.src = src;
      img.alt = r.name || "Restaurant";
      img.onerror = () => { if (img.src !== PLACEHOLDER_IMG) img.src = PLACEHOLDER_IMG; };
    }

    const titleEl = node.querySelector(".card-caption-heading");
    if (titleEl) titleEl.textContent = r.name || "Ristorante";

    const subEl = node.querySelector(".card-caption-subheading.category");
    if (subEl) subEl.textContent = r.category || "Ristorante";
    const addressEl = node.querySelector(".card-caption-subheading.address");
    if (addressEl) addressEl.textContent = r.address || "Unknown Address";

    frag.appendChild(node);
  }

  // inserisci prima del template così il template resta in fondo
  container.insertBefore(frag, templateEl);
  BUILT = true;
}

// ===== 3) Filtra SENZA ricostruire: toggla visibilità =====
function filterInPlace(query = "") {
  const q = (query || "").toLowerCase();
  // mappa id -> match
  const matches = new Set(
    ALL_RESTAURANTS
      .filter(r => {
        const name = (r?.name || "").toLowerCase();
        const cat  = (r?.category || "").toLowerCase();
        const address = (r?.address || "").toLowerCase();
        return name.includes(q) || cat.includes(q) || address.includes(q);
      })
      .map(r => String(r._id))
  );

  // mostra/nascondi
  container.querySelectorAll(".js-restaurant-card").forEach(node => {
    const id = node.dataset.restaurantId;
    if (!id) return;
    if (matches.has(id)) {
      node.classList.remove("d-none");
    } else {
      node.classList.add("d-none");
    }
  });

  // messaggio "nessun risultato"
  showEmptyIfNeeded(matches.size === 0);
}

let emptyAlertEl = null;
function showEmptyIfNeeded(show) {
  if (show) {
    if (!emptyAlertEl) {
      emptyAlertEl = document.createElement("div");
      emptyAlertEl.className = "alert alert-info mt-2";
      emptyAlertEl.textContent = "Nessun risultato.";
      // mettila prima del template per coerenza
      container.insertBefore(emptyAlertEl, templateEl);
    }
  } else {
    if (emptyAlertEl) {
      emptyAlertEl.remove();
      emptyAlertEl = null;
    }
  }
}

// ===== 4) API pubblica: renderMenu =====
async function renderMenu(query = "") {
  try {
    await loadRestaurantsOnce();       // 1) fetch solo la prima volta
    buildAllCards(ALL_RESTAURANTS);    // 2) costruisci card solo una volta
    filterInPlace(query);              // 3) poi filtra in-place
  } catch (err) {
    console.error("Errore renderMenu:", err);
  }
}

// ===== 5) Bootstrap pagina + ricerca con debounce =====
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    const debounce = (fn, d = 200) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), d);} };
    searchInput.addEventListener("input", debounce(e => renderMenu(e.target.value), 200));
  }
});

// (opzionale) nascondi carrello
window.addEventListener("layout:ready", () => {
  const cartButton = document.getElementById("cart-button");
  if (cartButton) cartButton.classList.add("d-none");
});
