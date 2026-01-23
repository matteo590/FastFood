document.addEventListener("DOMContentLoaded", async () => {
    const card = document.getElementById("card");
    const card_body = document.getElementById("card_body");
    let restaurants = await getAllRestaurants()
    const userRestaurant = restaurants.find(r => r.owner._id === localStorage.getItem('user_id'));
    if (!userRestaurant) {
        card.innerHTML = `<div class="card-body">
            <h5 class="card-title   ">No orders found</h5>
            <p class="card-text">You don't have a restaurant yet. Please create one first.</p>
        </div>`;
        card.classList.remove("d-none");
        return;
    }


    // Fetch gli ordini dal backend

    const orders = await fetch('/api/restaurants/' + userRestaurant._id + '/orders');
    if (!orders.ok) {
        card.innerHTML = `<div class="card-body">
            <h5 class="card-title">Error loading orders</h5>
            <p class="card-text">An error occurred while loading your orders. Please try again later.</p>
        </div>`;
        card.classList.remove("d-none");
        return;
    }
    const ordersData = await orders.json();
    console.debug("ordersData", ordersData);

    if (!ordersData || ordersData.length === 0) {
        card.innerHTML = `<div class="card-body">
            <h5 class="card-title">No orders placed</h5>
            <p class="card-text">You don't have any orders yet.</p>
        </div>`;
        card.classList.remove("d-none");
        return;
    }

    // Altrimenti, mostra gli ordini
    ordersData.forEach(order => {
        console.debug("Rendering order:", order);
        if (order.state === "on the way") return; // salta ordini in consegna
        const orderCard = card.cloneNode(true);
        orderCard.id = order.id;
        orderCard.classList.remove("d-none");
        orderCard.querySelector(".title").textContent = `Order #${order._id}`;
        orderCard.querySelector(".date").textContent = `Date: ${new Date(order.date).toLocaleDateString()}`;
        orderCard.querySelector(".totale").textContent = `Total: €${order.price.toFixed(2)}`;

        function updateProgressBar() {
            // Update progress bar con animazione
            const progressBar = orderCard.querySelector(".progress-bar");
            const steps = ["ordered", "preparing", "on the way", "delivered"];
            const currentStepIndex = steps.indexOf(order.state);
            const progressPercent = currentStepIndex * 33.3;

            // imposta subito la width finale
            progressBar.style.width = `${progressPercent}%`;
            progressBar.setAttribute("aria-valuenow", Math.round(progressPercent));

            // reset animazione (serve se ricarichi più ordini)
            progressBar.classList.remove('animate-fill');
            void progressBar.offsetWidth; // forza reflow

            // aggiungi la classe che fa partire l'animazione
            progressBar.classList.add('animate-fill');

            // Update step labels
            // Aggiorna etichette: completati=success, corrente=primary, futuri=subtle
            const labels = orderCard.querySelectorAll(".labels span");
            labels.forEach((label, index) => {
                // reset classi bootstrap badge
                label.className = 'badge rounded-pill';
                if (index < currentStepIndex) {
                    label.classList.add('bg-success');                 // completati
                } else if (index === currentStepIndex) {
                    label.classList.add('bg-primary');                 // corrente
                } else {
                    label.classList.add('bg-secondary-subtle', 'text-secondary', 'border'); // futuri
                }
            });
        }
        updateProgressBar();
        // Aggiungi i dettagli dell'ordine
        const tableBody = orderCard.querySelector("tbody");
        tableBody.innerHTML = ""; // Pulisci il corpo della tabella
        order.items.forEach(item => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td><img src="${item.meal.strMealThumb}" alt="${item.meal.strMeal}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;"></td>
                <td>${item.meal.strMeal}</td>
                <td>${item.quantity}</td>
                <td>€${item.price.toFixed(2)} <sub>/cad.</sub></td>
            `;
            tableBody.appendChild(row);
        });




        function setOrderStatus(newStatus) {
            function removeCard(card) {
                // aggiungo la classe che attiva la transizione
                card.classList.add("fade-out");

                // forzo il reflow per assicurarmi che la transizione parta
                card.offsetHeight;

                // faccio partire la dissolvenza
                card.classList.add("hide");

                // quando la transizione è finita, rimuovo il nodo dal DOM
                card.addEventListener("transitionend", () => {
                    card.remove();
                }, { once: true });
            }
            if (newStatus === order.state) return; // niente da fare
            if (newStatus === "on the way") {
                setTimeout(() => {
                    removeCard(orderCard);
                }, 1500);
            }
            // Invia la richiesta di aggiornamento dello stato dell'ordine
            fetch(`/api/orders/${order._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ state: newStatus })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to update order status");
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("Order status updated:", data);
                    // Aggiorna l'interfaccia utente in base al nuovo stato
                    order.state = newStatus;
                    updateButtons();
                    updateProgressBar();
                })
                .catch(error => {
                    console.error("Error updating order status:", error);
                });
        }

        function enableButton(btn, newStatus) {
            btn.disabled = false;
            btn.classList.remove("btn-outline-primary");
            btn.classList.add("btn-primary");
            btn.onclick = () => {
                setOrderStatus(newStatus);
            };
        }

        function updateButtons() {
            // Gestione bottoni cambio stato
            const in_progress_btn = orderCard.querySelector(".in_progress_btn");
            const on_the_way_btn = orderCard.querySelector(".on_the_way_btn");

            // Disabilita tutti i bottoni
            [in_progress_btn, on_the_way_btn].forEach(btn => {
                btn.disabled = true;
                btn.classList.remove("btn-primary");
                btn.classList.add("btn-outline-primary");
                btn.onclick = null;
            });
            // Abilita solo i bottoni validi per lo stato corrente
            if (order.state === "ordered") {
                enableButton(in_progress_btn, "preparing");
            } else if (order.state === "preparing") {
                enableButton(on_the_way_btn, "on the way");
            }
        }
        updateButtons();

        // Aggiungi la carta dell'ordine al corpo della carta principale

        card_body.appendChild(orderCard);
    });
});


window.addEventListener("layout:ready", () => {

    const cartButton = document.getElementById("cart-button");
    cartButton.classList.add("d-none");
});