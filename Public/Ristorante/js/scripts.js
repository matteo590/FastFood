document.addEventListener('DOMContentLoaded', async () => {

    // MODIFICA MENU
    let template = document.getElementById('clone');
    let modal = document.getElementById('cloneModal');

    // Prendo l'id dai parametri GET dell'URL
    let params = new URLSearchParams(window.location.search);
    let id = params.get("id"); // esempio: ?id=681c717ea327223432641b28

    if (!id) {
        console.error("Parametro 'id' mancante nell'URL");
        return;
    }

    try {
        let response = await fetch("/api/restaurants/" + id);
        let restaurant = await response.json();

        if (!restaurant.menu || restaurant.menu.length === 0) {
            console.warn("Nessun piatto disponibile per questo ristorante");
            return;
        }

        document.getElementById('restaurant-name').textContent = restaurant.name;
        document.getElementById('tel').textContent = restaurant.tel;
        document.getElementById('address').textContent = restaurant.address;
        document.getElementById('piva').textContent = "P.IVA: " + restaurant.piva;

        // array di piatti disponibili (serve per ricerca)
        let dishes = restaurant.menu.filter(dish => dish.visible !== false);

        // stato UI corrente
        let currentFilter = "";
        let currentSort = "";

        // funzione che restituisce il comparatore in base al sortSelect
        function getSortComparator(sortValue) {
            switch (sortValue) {
                case "name-asc":
                    return (a, b) => (a.meal.strMeal || "").localeCompare(b.meal.strMeal || "", undefined, { sensitivity: "base" });
                case "name-desc":
                    return (a, b) => (b.meal.strMeal || "").localeCompare(a.meal.strMeal || "", undefined, { sensitivity: "base" });
                case "price-asc":
                    return (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0);
                case "price-desc":
                    return (a, b) => (Number(b.price) || 0) - (Number(a.price) || 0);
                default:
                    return null; // nessun ordinamento
            }
        }

        // funzione che ridisegna le card filtrate e ordinate
        function renderMenu(filter = currentFilter, sort = currentSort) {
            currentFilter = filter; // aggiorna stato
            currentSort = sort;

            const body = document.getElementById('body');
            body.querySelectorAll('.col:not(#clone)').forEach(n => n.remove()); // pulizia

            // 1) filtro
            const list = dishes.filter(d =>
                (d.meal.strMeal || "").toLowerCase().includes(filter.toLowerCase()) ||
                ((d.meal.strCategory || "").toLowerCase().includes(filter.toLowerCase()))
            );

            // 2) sort (se richiesto)
            const cmp = getSortComparator(sort);
            if (cmp) list.sort(cmp);

            // 3) render
            list.forEach((dish, index) => {
                let cloneDish = template.cloneNode(true);
                let cloneModal = modal.cloneNode(true);
                const modalIndex = 'dishModal-' + index;

                cloneDish.id = dish.meal._id;
                cloneDish.classList.remove('d-none');

                const img = cloneDish.querySelector('img');
                img.src = dish.meal.strMealThumb;
                img.alt = dish.meal.strMeal;
                img.setAttribute('data-bs-target', '#' + modalIndex);

                cloneDish.querySelector('.name').textContent = dish.meal.strMeal;
                cloneDish.querySelector('.category').textContent = dish.meal.strCategory || "Piatto";
                cloneDish.querySelector('.price').textContent = ((Number(dish.price) || 0).toFixed(2)) + "€";

                function addToCart() {
                    let quantityInput = cloneModal.querySelector('#inputQuantity') || { value: '1' };
                    let quantity = parseInt(quantityInput.value) || 1;

                    let cart = JSON.parse(localStorage.getItem('cart')) || [];
                    let existingItem = cart.find(item => item.id === dish.meal._id);
                    if (existingItem) {
                        existingItem.quantity += quantity;
                    } else {
                        cart.push({ id: dish.meal._id, quantity: quantity });
                    }
                    saveCart(cart);
                    updateCartBadge();
                }

                cloneDish.querySelector('.add-to-cart').addEventListener('click', addToCart);

                cloneModal.id = modalIndex;
                cloneModal.classList.remove('d-none');
                const mImg = cloneModal.querySelector('img');
                mImg.src = dish.meal.strMealThumb;
                mImg.alt = dish.meal.strMeal;

                cloneModal.querySelector('.name').textContent = dish.meal.strMeal;
                cloneModal.querySelector('.category').textContent = dish.meal.strCategory || "Piatto";
                cloneModal.querySelector('.price').textContent = ((Number(dish.price) || 0).toFixed(2)) + "€";
                cloneModal.querySelector('.description').textContent = (dish.meal.ingredients || []).join(", ");
                cloneModal.querySelector('.add-to-cart').addEventListener('click', addToCart);

                modal.before(cloneModal);
                template.before(cloneDish);
            });
        }


        // prima render completa
        renderMenu();

        // evento input ricerca
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', e => {
            renderMenu(e.target.value, currentSort);
        });

        const sortSelect = document.getElementById('sortSelect');
        sortSelect.addEventListener('change', (e) => {
            // ri-render con filtro corrente e nuovo sort
            renderMenu(currentFilter, e.target.value);
        });


    } catch (err) {
        console.error('Errore nel caricamento del ristorante:', err);
    }
});