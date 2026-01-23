document.addEventListener("DOMContentLoaded", async () => {
    const card = document.getElementById("card");
    const card_body = document.getElementById("card_body");

    const orders = await fetch('/api/orders/by-user/' + localStorage.getItem('user_id'));
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
            <p class="card-text">You haven't placed any orders yet. Go back to the <a href="/">home</a> page to make your first order!</p>
        </div>`;
        card.classList.remove("d-none");
        return;
    }

    // Render each order
    ordersData.forEach(order => {
        console.debug("Rendering order:", order);

        const orderCard = card.cloneNode(true);
        orderCard.id = order.id;
        orderCard.classList.remove("d-none");
        orderCard.querySelector(".title").textContent = `Order #${order._id}`;
        orderCard.querySelector(".date").textContent = `Date: ${new Date(order.date).toLocaleDateString()}`;
        orderCard.querySelector(".totale").textContent = `Total: €${order.price.toFixed(2)}`;
        orderCard.querySelector(".ristorante").textContent = `Restaurant: ${order.restaurant.name}`;

        const waitingTime = () =>{
            console.debug("Queue: ", order.restaurant.orders);
            const currentOrderIndex = order.restaurant.orders.findIndex(o => o._id === order._id);
            let waitingOrders = order.restaurant.orders.slice(0, currentOrderIndex + 1).filter(o =>
                o.state === "preparing" || o.state === "ordered"
            );
            let totalDishes = waitingOrders.reduce((sum, o) => {
                return sum + o.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
            }, 0);
            return totalDishes * 10;
        }

        orderCard.querySelector(".waitingTime").textContent = `Tempo di attesa: ${waitingTime()} min`;

        function updateProgressBar() {
            // Update progress bar con animazione
            const progressBar = orderCard.querySelector(".progress-bar");
            const steps = ["ordered", "preparing", "on the way", "delivered"];
            const currentStepIndex = steps.indexOf(order.state);
            const progressPercent = (currentStepIndex / (steps.length - 1)) * 100;

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


        // abilita pulsante consegna
        const deliverButton = orderCard.querySelector(".delivered_btn");
        if (order.state === "on the way") {
            deliverButton.classList.remove("disabled");
            deliverButton.classList.remove("btn-outline-primary");
            deliverButton.classList.add("btn-primary");
        }

        deliverButton.onclick = async () => {
            deliverButton.classList.add("btn-outline-primary");
            deliverButton.classList.add("disabled");
            deliverButton.classList.remove("btn-primary");

            // Invia la richiesta di aggiornamento dello stato dell'ordine
            fetch(`/api/orders/${order._id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ state: "delivered" })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error("Failed to update order status");
                    }
                    console.log("Order status updated:", response);
                    // Aggiorna l'interfaccia utente in base al nuovo stato
                    order.state = "delivered";
                    updateProgressBar();
                })
                .catch(error => {
                    console.error("Error updating order status:", error);
                });
        }
        // Aggiungi la carta dell'ordine al corpo della carta principale
        card_body.appendChild(orderCard);
    });
});


window.addEventListener("layout:ready", () => {
    
    const cartButton = document.getElementById("cart-button");
    cartButton.classList.add("d-none");
    
});