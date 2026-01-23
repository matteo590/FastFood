document.addEventListener("DOMContentLoaded", () => {
    function calculateTotal() {
        const total = cartItemsResults.reduce((sum, res) => {

            if (!res.ok) return 0;
            const cartItem = res.cartItem;
            const item = res.item;
            return sum + (item.price * cartItem.quantity);
        }, 0);
        document.getElementById("total-price").textContent = "Total: " + total.toFixed(2) + "€";
        console.debug("Total price calculated:", total);
        return total;
    }



    function updateQuantity(id, newQty) {
        const cart = loadCart();
        const idx = cart.findIndex(p => p.id === id);
        if (idx === -1) return;

        const qty = parseInt(newQty, 10);
        let row = document.getElementById(id);

        if (qty <= 0) {
            cart.splice(idx, 1); // rimuovi dal carrello
            if (row) row.remove(); row = null;


        } else {
            cart[idx].quantity = qty;
        }
        saveCart(cart);
        cir = cartItemsResults.find(r => String(r.meal._id) === String(id))
        cir.cartItem.quantity = qty;

        updateCartBadge();

        //update total price
        if (row) {
            const priceCell = row.querySelector(".itemPrice");
            const itemPrice = cir.item.price;
            priceCell.textContent = (itemPrice * cart[idx].quantity).toFixed(2) + "€";
        }



        calculateTotal();
    }





    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let tbody = document.getElementById("cart-table-body");



    async function loadCartItems(cart) {
        const results = await Promise.all(cart.map(async (cartItem) => {
            try {
                // 1) fetch meal (per-item: step in serie)
                const rMeal = await fetch(`/api/meals/${cartItem.id}`);
                if (!rMeal.ok) throw new Error(`Meal ${cartItem.id} non trovato`);
                const meal = await rMeal.json();
                console.debug("Fetched meal:", meal);

                // 2) ricava restaurantId dal meal (adatta il campo al tuo schema)
                const restaurant = meal.personalized;
                console.debug("Meal restaurant:", restaurant);
                if (!restaurant) throw new Error(`Restaurant ${meal.personalized} non trovato`);


                // 3) trova l'entry corrispondente nel menu

                const item = restaurant.menu.find(m => String(m.meal) === String(meal._id));
                if (!item) throw new Error(`Item menu per meal ${meal._id} non trovato nel ristorante ${restaurant._id}`);
                console.debug("Found menu item:", item);
                return { ok: true, cartItem, meal, restaurant, item };
            } catch (err) {
                console.error("Errore item carrello:", cartItem, err);
                return { ok: false, cartItem, error: String(err?.message || err) };
            }
        }));

        return results;
    }

    tbody.innerHTML = ""; // pulisce prima
    cartItemsResults = [];
    loadCartItems(cart).then(results => {
        for (let res of results) {
            if (res.ok) {


                console.debug(res);

                let row = document.createElement("tr");
                row.id = res.meal._id;

                row.innerHTML = `
                        <td>
                        <img src="${res.meal.strMealThumb}" alt="${res.meal.strMeal}" 
                            style="width:60px; height:60px; object-fit:cover;" class="rounded">
                        </td>
                        <td>${res.meal.strMeal}</td>
                        <td>${res.restaurant.name}</td>
                        <td>
                        <div class="input-group justify-content-center" style="max-width: 200px; margin: 0 auto;">
                            <button class="btn btn-outline-secondary btn-qty" data-action="dec" type="button">−</button>
                            <input type="number" class="form-control text-center qty-input" min="1" step="1" value="${res.cartItem.quantity}">
                            <button class="btn btn-outline-secondary btn-qty" data-action="inc" type="button">+</button>
                        </div>
                        </td>
                        <td class="itemPrice">${(res.item.price * res.cartItem.quantity).toFixed(2)}€</td>
                        <td><button class="btn btn-danger btn-sm" title="Rimuovi"><i class="bi bi-trash btn-remove"></i></button></td>
                        
                        `;
                tbody.appendChild(row);
            }
        }
        cartItemsResults = results;
        calculateTotal();
    });





    // Event delegation per +/− e input number
    tbody.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-qty");
        const remove = e.target.closest(".btn-remove");
        const tr = e.target.closest("tr");
        const id = tr.id;
        const input = tr.querySelector(".qty-input");
        const current = parseInt(input.value || "1", 10);


        if (remove) {
            updateQuantity(id, 0); // rimuovi dal carrello
        }


        if (btn) {


            if (btn.dataset.action === "inc") {
                input.value = current + 1;
            } else if (btn.dataset.action === "dec") {
                input.value = Math.max(1, current - 1);
            }
            updateQuantity(id, input.value);
        }
    });

    tbody.addEventListener("change", (e) => {
        const tr = e.target.closest("tr");
        const id = tr.id;
        updateQuantity(id, e.target.value);
    });


    // Inizializzazione tooltip Bootstrap
    let checkoutSpan = document.getElementById("checkout-span");
    let checkoutBtn = document.getElementById("checkout-btn");
    let tooltip = new bootstrap.Tooltip(checkoutSpan);


    let isLoggedIn = localStorage.getItem("user_id") || false;
    if (!isLoggedIn) {
        checkoutBtn.classList.add("disabled");
        tooltip.enable(); // mostro "Login first"
    } else {
        checkoutBtn.classList.remove("disabled");
        tooltip.disable(); // rimuovo il tooltip del tutto
    }



    checkoutBtn.addEventListener("click", () => {
        if (isLoggedIn) {
            // Raggruppa i piatti per ristorante
            const ordersByRestaurant = {};
            for (const res of cartItemsResults) {
                if (!res.ok) continue;
                const restId = res.restaurant._id;
                if (!ordersByRestaurant[restId]) {
                    ordersByRestaurant[restId] = {
                        restaurant: res.restaurant,
                        items: []
                    };
                }
                ordersByRestaurant[restId].items.push({ meal: res.meal._id, quantity: res.cartItem.quantity, price: res.item.price });// aggiungi id piatto e quantità
            }
            console.debug("Orders by restaurant:", ordersByRestaurant);
            // Crea un ordine per ogni ristorante
            for (const restId in ordersByRestaurant) {
                const order = {
                    state: "ordered",
                    price: ordersByRestaurant[restId].items.reduce((sum, it) => sum + (it.price * it.quantity), 0),
                    items: ordersByRestaurant[restId].items,
                    client: localStorage.getItem("user_id"),
                    restaurant: restId
                };
                // Esegui la chiamata API per creare l'ordine (esempio POST)
                fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(order)
                })
                .then(response => response.json())
                .then(data => {

                    console.log('Ordine creato:', data);
                    // Svuota il carrello
                    localStorage.removeItem("cart");
                    updateCartBadge();
                    const restaurantId = ordersByRestaurant[restId].restaurant._id;
                    fetch(`/api/restaurants/${restaurantId}/orders`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: String(data._id) })
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Collegamento ordine-ristorante:', data);
                        window.location.href = "/orders"; // vai a pagina ordini
                    })
                    .catch(err => {
                        console.error('Errore collegamento ordine-ristorante:', err);
                        
                    });
                })
                .catch(err => {
                    console.error('Errore creazione ordine:', err);
                });
            }
            
        }
    });
});
