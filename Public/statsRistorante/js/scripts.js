function showAlert(msg, type = "error") {
    const e = $('#alert-block');
    if (!e) return;
    e.textContent = msg;
    e.classList.remove('d-none');
    if (type === "success") {
        e.classList.remove("alert-danger")
        e.classList.add("alert-success")
    }

};


document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = params.get("id");

    const userId = localStorage.getItem("user_id");
    if (!userId) {
        showAlert("Devi essere loggato per visualizzare le statistiche del ristorante.");
        return;
    }


    if (!restaurantId) {
        let restaurants = await getAllRestaurants()
        if (restaurants.length > 0) {
            const userRestaurant = restaurants.find(r => r.owner._id === userId);
            if (userRestaurant) {
                window.location.href = "/stats/?id=" + userRestaurant._id

            }else{
                showAlert("Non sei proprietario di nessun ristorante.");
            }
        }
        return;
    }


    // Carica i dati delle statistiche dal server
    let orders = {};
    try {
        const response = await fetch('/api/restaurants/' + restaurantId + '/orders');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        orders = await response.json();
    } catch (error) {
        console.error("Errore nel caricamento delle statistiche:", error);
    }

    console.log(orders);

    // Calcola le statistiche
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.state === "delivered").length;
    const progress  =  Math.round(completedOrders / totalOrders * 100);
    const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;
    const monthlyRevenue = (() => {
        const revenueByMonth = {};
        orders.forEach(order => {
            const month = new Date(order.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            if (!revenueByMonth[month]) revenueByMonth[month] = 0;
            revenueByMonth[month] += order.price;
        });
        return revenueByMonth;
    })();
    const mostPopularItem = (() => {
        const itemCounts = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                itemCounts[item.meal.strMeal] = (itemCounts[item.strMeal] || 0) + 1;
            });
        });
        let maxCount = 0;
        let popularItem = null;
        for (const [item, count] of Object.entries(itemCounts)) {
            if (count > maxCount) {
                maxCount = count;
                popularItem = item;
            }
        }
        return popularItem || "N/A";
    })();
    const customerCount = new Set(orders.map(order => order.client._id)).size;
    const averageItemsPerOrder = totalOrders > 0 ? (orders.reduce((sum, order) => sum + order.items.length, 0) / totalOrders).toFixed(2) : 0;


    // Aggiorna l'interfaccia utente con le statistiche calcolate
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('completed-orders').textContent = completedOrders;
    document.getElementById('total-revenue').textContent = totalRevenue.toFixed(2) + " €";
    document.getElementById('average-order-value').textContent = averageOrderValue + " €";
    document.getElementById('most-popular-item').textContent = mostPopularItem;
    document.getElementById('customer-count').textContent = customerCount;
    document.getElementById('average-items-per-order').textContent = averageItemsPerOrder;
    document.getElementById('orders-progress-bar').style.width = progress + "%";
    document.getElementById('orders-progress-bar').innerHTML = progress + "%";
    document.getElementById('monthly-revenue').textContent = monthlyRevenue[Object.keys(monthlyRevenue).slice(-1)[0]].toFixed(2) + " €";

    // Grafico delle entrate mensili
    const ctx = document.getElementById('monthly-revenue-chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(monthlyRevenue),
            datasets: [{
                label: 'Entrate Mensili (€)',
                data: Object.values(monthlyRevenue),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});


window.addEventListener("layout:ready", () => {

    const cartButton = document.getElementById("cart-button");
    cartButton.classList.add("d-none");
});