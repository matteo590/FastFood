document.addEventListener("DOMContentLoaded", async () => {
  /* =========================
   * Helpers & Utilities
   * ========================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]; //lista
  const formatPrice = (n) => Number(n || 0).toFixed(2) + "€";
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();

  // confronto ID “safe”: accetta stringhe/ObjectId/oggetti {_id}/{$oid}
  const idOf = (x) => {
    if (!x) return "";
    if (typeof x === "string") return x;
    if (typeof x === "object") {
      if (x.$oid) return x.$oid;
      if (x._id || x.id) return idOf(x._id || x.id);
      if (typeof x.toHexString === "function") return x.toHexString();
      const s = x.toString?.();
      const m = s?.match?.(/ObjectId\("([a-f0-9]{24})"\)/i); //i case insensitieve
      if (m) return m[1];
      if (/^[a-f0-9]{24}$/i.test(s)) return s;
    }
    return String(x);
  };
  const sameId = (a, b) => idOf(a) === idOf(b);

  const inMenu = (meal) => (menu || []).some((m) => sameId(m._id, meal._id));

  function showAlert(msg, type = "error") {
    const e = $("#alert-block");
    if (!e) return;
    e.textContent = msg;
    e.classList.remove("d-none");
    if (type === "success") {
      e.classList.remove("alert-danger");
      e.classList.add("alert-success");
    }
  }

  const mealMatches = (meal, q) => {
    if (!q) return true;
    const n = norm(q);
    return norm(meal.strMeal).includes(n) || norm(meal.strCategory).includes(n);
  };

  const debounce = (fn, ms = 150) => {
    let t;
    return (...args) => {
      //prende argomenti fn
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  function getSeparator(grid) {
    let sep = grid.querySelector("#meals-separator");
    if (!sep) {
      sep = document.createElement("div");
      sep.id = "meals-separator";
      sep.className = "col-12";
      sep.innerHTML = '<hr class="my-3 ciao">';
    }
    return sep;
  }

  function ensureSeparatorVisibility(grid) {
    const hasInMenu = !!grid.querySelector(".in-menu");
    const hasNotIn = !!grid.querySelector(".not-in-menu");
    const sep = grid.querySelector("#meals-separator");

    if (hasInMenu && hasNotIn) {
      if (!sep) {
        // Trova l'ultima card in-menu
        const inMenuCards = grid.querySelectorAll(".col-12.in-menu");
        if (inMenuCards.length > 0) {
          const lastInMenu = inMenuCards[inMenuCards.length - 1];
          lastInMenu.after(getSeparator(grid));
        }
      }
    } else {
      sep?.remove();
    }
  }

  function styleAsInMenu(col, meal) {
    const visWrap = col.querySelector(".vis-toggle-wrap");
    const visToggle = col.querySelector(".meal-visible-toggle");
    const visBadge = col.querySelector(".visibility-badge");
    const btnRemove = col.querySelector(".btn-remove");
    const btnAdd = col.querySelector(".btn-add");
    const btnEdit = col.querySelector(".btn-edit");

    col.classList.add("in-menu");
    col.classList.remove("not-in-menu");

    visWrap.classList.remove("d-none");
    visToggle.checked = !!meal.visible;
    updateVisibilityBadge(visBadge, visToggle.checked);

    btnRemove.classList.remove("d-none");
    btnAdd.classList.add("d-none");
    btnEdit.classList.remove("d-none");

    // badge colori “in menu”
    visBadge.classList.remove("bg-warning", "text-dark");
  }

  function styleAsNotInMenu(col) {
    const visWrap = col.querySelector(".vis-toggle-wrap");
    const visBadge = col.querySelector(".visibility-badge");
    const btnRemove = col.querySelector(".btn-remove");
    const btnAdd = col.querySelector(".btn-add");
    const btnEdit = col.querySelector(".btn-edit");

    col.classList.add("not-in-menu");
    col.classList.remove("in-menu");

    visWrap.classList.add("d-none");
    visBadge.textContent = "Not in menu";
    visBadge.classList.remove("bg-success", "bg-secondary");
    visBadge.classList.add("bg-warning", "text-dark");

    btnRemove.classList.add("d-none");
    btnAdd.classList.remove("d-none");
    btnEdit.classList.add("d-none");
  }

  // Sposta la card in alto (prima del separatore); se il separatore non c’è, lo crea quando necessario
  function promoteCardToMenu(col, meal) {
    const grid = document.querySelector("#meals-grid");

    // Apri il modal per modificare il prezzo prima di promuovere la card
    function openPriceModal() {
      // Crea modal semplice se non esiste
      let modal = document.getElementById("priceModal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "priceModal";
        modal.className = "modal fade";
        modal.tabIndex = -1;
        modal.innerHTML = `
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Imposta il prezzo</h5>
                    </div>
                    <div class="modal-body">
                      <input type="number" min="0" step="0.01" class="form-control" id="modal-price-input" value="${
                        meal.price || 0
                      }">
                      <div class="invalid-feedback">Inserisci un prezzo maggiore di zero.</div>
                    </div>
                    <div class="modal-footer">
                      <button type="button" class="btn btn-primary" id="modal-price-save">Salva</button>
                    </div>
                  </div>
                </div>
                `;
        document.body.appendChild(modal);
      } else {
        // aggiorna il valore se già esiste
        modal.querySelector("#modal-price-input").value = meal.price || 0;
      }
      const priceInput = modal.querySelector("#modal-price-input");
      const saveBtn = modal.querySelector("#modal-price-save");
      const feedback = modal.querySelector(".invalid-feedback");
      feedback.style.display = "none";

      // Blocca chiusura finché non valido
      const bsModal = new bootstrap.Modal(modal, {
        backdrop: "static",
        keyboard: false,
      });
      saveBtn.onclick = () => {
        const val = parseFloat(priceInput.value);
        if (isNaN(val) || val <= 0) {
          feedback.style.display = "block";
          priceInput.classList.add("is-invalid");
          return;
        }
        feedback.style.display = "none";
        priceInput.classList.remove("is-invalid");
        meal.price = val;

        //aggiorno prezzo

        fetch(`/api/meals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strMeal: meal.strMeal,
            strCategory: meal.strCategory,
            strMealThumb: meal.strMealThumb,
            ingredients: meal.ingredients,
            personalized: restaurant._id, // nuovo meal personalized del ristorante corrente
          }),
        })
          .then(async (res) => {
            if (!res.ok)
              throw new Error(
                "Errore creazione nuovo meal personalized: " + res.message
              );
            const newMeal = await res.json();
            console.debug("Creato meal:", newMeal);
            fetch(`/api/restaurants/${restaurantId}/menu`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ItemId: newMeal._id,
                price: meal.price,
                visible: true,
              }),
            });
            syncRestaurant(); // ricarica menu
            col.querySelector(".meal-price").textContent = formatPrice(
              meal.price
            );

            return;
          })
          .catch((err) => {
            console.error(err);
            bsModal.hide();
            showAlert("Errore nella creazione del piatto personalizzato.");
            throw err;
          });

        bsModal.hide();
      };
      priceInput.oninput = () => {
        feedback.style.display = "none";
        priceInput.classList.remove("is-invalid");
      };
      bsModal.show();
      return true;
    }

    if (!openPriceModal()) return false;

    styleAsInMenu(col, meal);

    // cerca separatore
    let sep = grid.querySelector("#meals-separator");

    if (sep) {
      grid.insertBefore(col, sep); // metti la card prima dell’hr
    } else {
      // se non c’è separatore, metti la card in cima
      const firstNonTpl = [...grid.children].find(
        (c) => c.id !== "meal-card-template"
      );
      if (firstNonTpl) grid.insertBefore(col, firstNonTpl);
      else grid.appendChild(col);
    }

    ensureSeparatorVisibility(grid);
    return true;
  }

  // Sposta la card sotto al separatore; se il separatore rimane inutile, lo rimuove
  function demoteCardFromMenu(col) {
    const grid = document.querySelector("#meals-grid");
    styleAsNotInMenu(col);

    let sep = grid.querySelector("#meals-separator");
    if (!sep) {
      // se ancora non c’è, mettila in fondo
      grid.appendChild(col);
    } else {
      // metti la card dopo il separatore
      grid.insertBefore(col, sep.nextSibling);
    }

    ensureSeparatorVisibility(grid);
  }

  /* =========================
   * State
   * ========================= */
  let searchQuery = "";

  const params = new URLSearchParams(window.location.search);
  const restaurantId = params.get("id");
  let creatingRestaurant = false;

  const userId = localStorage.getItem("user_id");
  if (!userId) {
    showAlert("Devi essere loggato per gestire il menu del ristorante.");
    return;
  }

  if (!restaurantId) {
    let restaurants = await getAllRestaurants();
    if (restaurants.length > 0) {
      const userRestaurant = restaurants.find((r) => r.owner._id === userId);
      console.log(userRestaurant);
      if (userRestaurant) {
        window.location.href = "/restSettings/?id=" + userRestaurant._id;
      } else {
        creatingRestaurant = true;
        document.getElementById("restaurant-name").textContent =
          "Create your restaurant";
        document.querySelector("main").classList.add("d-none");
        document.getElementById("nav-tabs").classList.add("d-none");
        document.getElementById("main-title").classList.add("d-none");
        document.getElementById("delete-btn").classList.add("d-none");
      }
    }
  }

  document.getElementById("delete-btn").addEventListener("click", async () => {
    if (
      confirm(
        "Are you sure you want to delete this restaurant? This action cannot be undone."
      )
    ) {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Errore eliminazione ristorante");
        const data = await res.json();
        const res2 = await fetch(`/api/users/${userId}/setRole/cliente`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        });
        if (!res2.ok) throw new Error("Errore assegnazione ruolo cliente");
        alert(data.message || "Ristorante eliminato con successo.");
        window.location.href = "/profile";
      } catch (err) {
        console.error(err);
        alert("Errore durante l'eliminazione del ristorante.");
      }
    }
  });
  let restaurant = null;
  let meals = []; // tutti i piatti disponibili (normalizzati)
  let menu = []; // piatti in menu (normalizzati, con visible)
  let isOwner = false;
  let editingMeal = null;

  /* =========================
   * Normalizers
   * ========================= */
  function normalizeMeal(m) {
    return {
      _id: m._id || null,
      strMeal: m.strMeal || m.name || "Senza nome",
      strCategory: m.strCategory || m.category || "",
      strMealThumb: m.strMealThumb || m.image || "",
      price: 0,
      ingredients: Array.isArray(m.ingredients)
        ? m.ingredients
        : m.ingredients
        ? String(m.ingredients)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      visible: typeof m.visible === "boolean" ? m.visible : true,
    };
  }

  function normalizeMenu(m) {
    // m: { meal: <obj>, visible: bool } (popolato lato backend)
    return {
      _id: m.meal._id || null,
      strMeal: m.meal.strMeal || m.meal.name || "Unnamed",
      strCategory: m.meal.strCategory || m.meal.category || "",
      strMealThumb: m.meal.strMealThumb || m.meal.image || "",
      price: Number(m.price),
      ingredients: Array.isArray(m.meal.ingredients)
        ? m.meal.ingredients
        : m.meal.ingredients
        ? String(m.meal.ingredients)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      visible: typeof m.visible === "boolean" ? m.visible : true,
    };
  }

  /* =========================
   * Fetch & Init
   * ========================= */
  async function syncRestaurant() {
    // ricarica ristorante
    let res = await fetch(`/api/restaurants/${restaurantId}`);
    if (!res.ok)
      throw new Error("Impossibile caricare il ristorante: " + res.status);
    restaurant = await res.json();
    // Menu (dal ristorante, già popolato)
    const rawMenu = restaurant.menu;
    menu = (rawMenu || []).map(normalizeMenu);
    console.debug("Menu:", menu);
  }

  try {
    if (!creatingRestaurant) {
      // Ristorante
      await syncRestaurant();

      isOwner = String(idOf(restaurant.owner)) === String(idOf(userId));
      if (!isOwner) {
        showAlert("Non sei il proprietario di questo ristorante.");
        return;
      }
      //POPOPOLA FORM
      $("#name").value = restaurant.name || "";
      $("#category").value = restaurant.category || "";
      $("#address").value = restaurant.address || "";
      $("#piva").value = restaurant.piva || "";
      $("#logo").value = restaurant.logo || "";
      $("#tel").value = restaurant.tel || "";

      // Meals (tutti)
      res = await fetch(`/api/meals/byRestaurant/${restaurantId}`);
      if (!res.ok) throw new Error("Impossibile caricare meals");
      meals = ((await res.json()) || []).map(normalizeMeal);
      //menu gia filtrato da syncRestaurant()

      renderMealsGrid();
      wireAddMeal();
      wireModal();
      wireSearch();
    }
    wireForm();
  } catch (err) {
    console.error(err);
    showAlert("Errore nel caricamento del ristorante.");
  }

  /* =========================
   * Rendering
   * ========================= */
  function updateVisibilityBadge(badgeEl, visible) {
    if (!badgeEl) return;
    if (visible) {
      badgeEl.textContent = "Visibile";
      badgeEl.classList.remove("bg-secondary");
      badgeEl.classList.add("bg-success");
    } else {
      badgeEl.textContent = "Hidden";
      badgeEl.classList.remove("bg-success");
      badgeEl.classList.add("bg-secondary");
    }
  }

  function renderMealsGrid() {
    const grid = $("#meals-grid");
    const tpl = $("#meal-card-template");
    if (!grid || !tpl) return;

    // pulizia
    grid
      .querySelectorAll(".col-12:not(#meal-card-template)")
      .forEach((n) => n.remove());

    let listInMenu = menu.filter((m) => mealMatches(m, searchQuery || ""));
    let listNotIn = meals.filter(
      (m) => !inMenu(m) && mealMatches(m, searchQuery || "")
    );

    // helper di render
    const renderList = (list, { inMenu }) => {
      list.forEach((meal) => {
        const col = tpl.cloneNode(true);
        col.id = "";
        col.classList.remove("d-none");

        const card = $(".card", col);
        card.dataset.mealId = meal._id || meal.id || "";

        $(".meal-img", col).src =
          meal.strMealThumb ||
          "https://dummyimage.com/600x400/dee2e6/6c757d.jpg";
        $(".meal-img", col).alt = meal.strMeal || "Meal";
        $(".meal-name", col).textContent = meal.strMeal || "Unnamed";
        $(".meal-category", col).textContent = meal.strCategory || "Generic";
        $(".meal-price", col).textContent = formatPrice(meal.price);

        const visToggle = $(".meal-visible-toggle", col);
        const visBadge = $(".visibility-badge", col);
        const btnEdit = $(".btn-edit", col);
        const btnRemove = $(".btn-remove", col);
        const btnAdd = $(".btn-add", col);

        if (inMenu) {
          console.debug("Rendering meal:", meal);
          styleAsInMenu(col, meal);

          // toggle visibilità -> aggiorna ristorante.menu e UI
          visToggle.addEventListener("change", async () => {
            meal.visible = visToggle.checked;
            updateVisibilityBadge(visBadge, meal.visible);
            //const update = restaurant;
            //const mm = update.menu.find(m => sameId(m.meal?._id || m.meal, meal._id));
            //if (mm) mm.visible = meal.visible;

            try {
              const res = await fetch(`/api/restaurants/${restaurantId}/menu`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  ItemId: meal._id,
                  visible: meal.visible,
                }),
              });
              console.debug("res:", res.ok);
              syncRestaurant(); // ricarica menu
            } catch (e) {
              console.warn("update ristorante non riuscito", e);
            }
          });

          // rimuovi dal menu
          btnRemove.addEventListener("click", async () => {
            if (!confirm(`Remove "${meal.strMeal}" from menu?`)) return;
            try {
              try {
                await fetch(
                  `/api/restaurants/${restaurantId}/menu/${meal._id}`,
                  {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                  }
                );
                if (meal.personalized != false) {
                  // se è un meal personalized, lo elimino anche dal db
                  await fetch(`/api/meals/${meal._id}`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                  });
                }
                syncRestaurant(); // ricarica menu
              } catch (e) {
                console.warn("update ristorante non riuscito", e);
              }

              demoteCardFromMenu(col);
            } catch (e) {
              console.error(e);
              alert("Errore nella rimozione dal menu.");
            }
          });
        } else {
          styleAsNotInMenu(col);

          // aggiungi al menu
          btnAdd.addEventListener("click", async () => {
            try {
              promoteCardToMenu(col, meal);
            } catch (e) {
              console.error(e);
              alert("Errore nell’aggiunta al menu.");
            }
          });
        }

        // modifica (apre modal)
        btnEdit.addEventListener("click", () => openModalFor(meal));

        grid.appendChild(col);
      });
    };

    // 1) sezione in menu
    renderList(listInMenu, { inMenu: true });

    // 3) sezione non in menu
    renderList(listNotIn, { inMenu: false });
    ensureSeparatorVisibility(grid);
  }

  /* =========================
   * UI Wiring
   * ========================= */
  function wireForm() {
    document.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault(); // evita il reload della pagina

      // prendi i valori
      const name = document.getElementById("name").value.trim();
      const category = document.getElementById("category").value.trim();
      const address = document.getElementById("address").value.trim();
      const piva = document.getElementById("piva").value.trim();
      const logo = document.getElementById("logo").value.trim();
      const tel = document.getElementById("tel").value.trim();

      // validazione base
      if (!name || !category || !address || !piva || !logo || !tel) {
        showAlert("Compila tutti i campi obbligatori.");
        return;
      }

      try {
        if (!creatingRestaurant) {
          //aggiorno parametri
          restaurant.name = name;
          restaurant.category = category;
          restaurant.address = address;
          restaurant.piva = piva;
          restaurant.logo = logo;
          restaurant.tel = tel;

          console.debug("Salvo ristorante:", restaurant);
          const route = "/api/restaurants/" + restaurantId;
          const res = await fetch(route, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              category,
              address,
              piva,
              logo,
              tel,
            }),
          });

          let data = null;
          try {
            data = await res.json();
          } catch {
            console.debug(data);
            data = {};
          }
          console.debug(data);
          if (res.ok) {
            showAlert(
              data.message || "Ristorante aggiornato con successo!",
              (type = "success")
            );
          }
        } else {
          //creo json ristorante
          console.debug("Creo ristorante:", restaurant);
          const route = "/api/restaurants";
          fetch(route, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name,
              category,
              address,
              piva,
              owner: userId,
              logo,
              tel,
            }),
          })
            .then(async (res) => {
              if (!res.ok) {
                showAlert("Errore nella creazione del ristorante.");
                throw new Error("Errore creazione ristorante: " + res.message);
              }
              let data = await res.json();
              console.debug(data);

              fetch(`/api/users/${userId}/setRole/ristoratore`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
              }).then((res2) => {
                if (res2.ok) {
                  showAlert(
                    "Ristorante creato con successo!",
                    (type = "success")
                  );
                  setTimeout(() => window.location.reload(), 1200);
                } else {
                  showAlert(
                    "Errore nell'assegnazione del ruolo di ristoratore."
                  );
                }
              });
            })
            .catch((err) => {
              console.error(err);
              showAlert("Errore nella creazione del ristorante.");
            });
        }
      } catch (err) {
        console.error(err);
        showAlert("Errore nel salvataggio del ristorante.");
      }
    });
  }
  function wireAddMeal() {
    const btn = $("#add-meal-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const empty = normalizeMeal({
        _id: null,
        strMeal: "",
        strCategory: "",
        strMealThumb: "",
        price: 0,
        ingredients: [],
        visible: true,
      });
      openModalFor(empty, true);
    });
  }

  function wireModal() {
    const saveBtn = $("#modal-save-btn");
    if (!saveBtn) return;
    saveBtn.addEventListener("click", onModalSave);
  }

  function wireSearch() {
    const searchInput = $("#meal-search");
    const searchClear = $("#meal-search-clear");
    if (searchInput) {
      const onSearch = debounce((e) => {
        searchQuery = e.target.value || "";
        renderMealsGrid();
      }, 200);
      searchInput.addEventListener("input", onSearch);
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchQuery = "";
        if (searchInput) searchInput.value = "";
        renderMealsGrid();
      });
    }
  }

  /* =========================
   * Modal (edit/create)
   * ========================= */
  function openModalFor(meal, isNew = false) {
    editingMeal = { ...meal }; // copia
    $("#modal-title-action").textContent = isNew ? "Aggiungi" : "Modifica";
    $("#meal-id").value = editingMeal._id || "";
    $("#meal-name").value = editingMeal.strMeal || "";
    $("#meal-category").value = editingMeal.strCategory || "";
    $("#meal-price").value = (Number(editingMeal.price) || 0).toFixed(2);
    $("#meal-img").value = editingMeal.strMealThumb || "";
    $("#meal-ingredients").value = (editingMeal.ingredients || []).join(", ");
    $("#meal-visible").checked = !!editingMeal.visible;

    new bootstrap.Modal($("#mealModal")).show();
  }

  async function onModalSave() {
    if (!editingMeal) return;
    console.debug("editingMeal: ", editingMeal);

    const isPersonalized = !!editingMeal.personalized;

    // Leggi form
    const updated = {
      id: editingMeal._id,
      strMeal: $("#meal-name").value.trim(),
      strCategory: $("#meal-category").value.trim(),
      price: Number($("#meal-price").value || 0),
      strMealThumb: $("#meal-img").value.trim(),
      ingredients: $("#meal-ingredients")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      visible: $("#meal-visible").checked,
      personalized: restaurant._id,
    };

    if (
      !updated.strMeal ||
      !updated.strCategory ||
      !updated.strMealThumb ||
      !updated.ingredients ||
      !updated.price
    ) {
      alert("Inserisci tutti i campi");
      return;
    }

    try {
      if (isPersonalized) {
        // ------ EDIT ESISTENTE ------
        // Caso 1: sto modificando un meal GIA' personalized -> UPDATE SOLO QUELLO
        const res = await fetch(`/api/meals/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strMeal: updated.strMeal,
            strCategory: updated.strCategory,
            strMealThumb: updated.strMealThumb,
            ingredients: updated.ingredients,
            visible: updated.visible,
            personalized: restaurant._id,
          }),
        });
        if (!res.ok) throw new Error("Errore aggiornamento meal personalized");

        const res1 = await fetch(`/api/restaurants/${restaurant._id}/menu`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ItemId: updated.id, price: updated.price }),
        });
        if (!res1.ok) throw new Error("Errore aggiornamento meal personalized");
      } else {
        // ------ CREAZIONE NUOVO ------
        console.debug(
          "Creo nuovo meal personalized e lo associo al ristorante"
        );
        const resCreate = await fetch(`/api/meals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strMeal: updated.strMeal,
            strCategory: updated.strCategory,
            price: updated.price,
            strMealThumb: updated.strMealThumb,
            ingredients: updated.ingredients,
            personalized: restaurant._id, // nuovo meal personalized del ristorante corrente
          }),
        });
        if (!resCreate.ok)
          throw new Error(
            "Errore creazione nuovo meal personalized: " + resCreate.message
          );
        const created = await resCreate.json();
        console.debug("Creato meal:", created);
        // Associa al ristorante
        let resAssoc = await fetch(`/api/restaurants/${restaurantId}/menu`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ItemId: created._id,
            price: updated.price,
            visible: updated.visible,
          }),
        });
        if (!resAssoc.ok)
          throw new Error("Errore associazione meal al ristorante");

        //evita duplicati in menu
        if (editingMeal._id) {
          resAssoc = await fetch(
            `/api/restaurants/${restaurantId}/menu/${editingMeal._id}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            }
          );
          if (!resAssoc.ok)
            throw new Error("Errore associazione meal al ristorante");
        }
      }

      // Refresh UI
      syncRestaurant().then(() => {
        renderMealsGrid();
        bootstrap.Modal.getInstance($("#mealModal"))?.hide();
      });
    } catch (e) {
      console.error(e);
      alert("Errore durante il salvataggio del piatto.");
    }
  }
});

window.addEventListener("layout:ready", () => {
  const cartButton = document.getElementById("cart-button");
  cartButton.classList.add("d-none");
});
