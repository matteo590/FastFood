function updateCartBadge() {
    // Update cart badge
    const cart_badge = document.getElementById("cart-items");
    if (!cart_badge) return;
    const cart = loadCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cart_badge.textContent = totalItems;
}


function loadCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    if (!Array.isArray(cart)) {
        console.error("Cart is not an array:", cart);
        return;
    }
    localStorage.setItem("cart", JSON.stringify(cart));
}


function logout() {
    localStorage.removeItem("user_id");
    window.location.href = "/";
}

async function loadFragment(el, name) {
    const res = await fetch(`/utils/${name}.html`);
    if (!res.ok) throw new Error(`Impossibile caricare ${name}.html`);
    el.innerHTML = await res.text();
}

async function isRistoratore() {
    const userId = localStorage.getItem("user_id");
    if (!userId) return false;

    try {
        let response = await fetch(`/api/users/${userId}`);
        let user = await response.json();
        return user.role === 'ristoratore';
    } catch (e) {
        console.error(e);
        return false;
    }
}
async function getAllRestaurants() {
    try {
        let response = await fetch(`/api/restaurants`);
        let restaurants = await response.json();
        return restaurants;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function mountIncludes() {
    const nodes = document.querySelectorAll("[data-include]");
    for (const el of nodes) {
        const name = el.getAttribute("data-include");
        await loadFragment(el, name);
    }

    (function () {
        const nav = document.getElementById('mainNav');

        function updateNavbar() {
            if (!nav) return;
            if (window.scrollY > 0) {
                nav.classList.add('navbar-shrink');
            } else {
                nav.classList.remove('navbar-shrink');
            }
        }

        // Inizializza e ascolta lo scroll
        document.addEventListener('DOMContentLoaded', updateNavbar);
        window.addEventListener('scroll', updateNavbar, { passive: true });
    })();

    updateCartBadge();

    const restSet = document.getElementById("restaurantSet");
    if (restSet && await isRistoratore()) {
        restSet.classList.remove("d-none");
        const restaurants = await getAllRestaurants();
        if (!restaurants) return;
        const userId = localStorage.getItem("user_id");
        const userRestaurant = restaurants.find(r => r.owner._id === userId);
        if (userRestaurant) {
            restSet.href = `/dashboard?id=${userRestaurant._id}`;
        }
    }

    const navLinks = document.getElementById("nav-links");
    let risto = await isRistoratore();
    if (risto) {
        
        const li = document.createElement("li");
        li.classList.add("nav-item");
        li.innerHTML = `<a class="nav-link" aria-current="page" href="/dashboard">Dashboard</a>`;
        navLinks.appendChild(li);
    }
    if(!localStorage.getItem("user_id")){
        navLinks.querySelector('a[href="/profile"]').classList.add("d-none");
        navLinks.querySelector('a[href="/orders"]').classList.add("d-none");
    }
        // Evidenzia la pagina corrente

    if(window.location.pathname === "/"){
        const homeLink = navLinks.querySelector('a[href="/"]');
        homeLink.classList.add("active");
    } else if(window.location.pathname === "/profile/"){
        const profileLink = navLinks.querySelector('a[href="/profile"]');
        profileLink.classList.add("active");
        
    }else if(window.location.pathname === "/orders/"){
        const ordersLink = navLinks.querySelector('a[href="/orders"]');
        ordersLink.classList.add("active");
    }else{
        const dashboardLink = navLinks.querySelector('a[href="/dashboard"]');
        if(dashboardLink) dashboardLink.classList.add("active");
    }



    initLoginArea();

    window.dispatchEvent(new CustomEvent("layout:ready"));
}

function initLoginArea() {
    const loginArea = document.getElementById("login-area");

    const userId = localStorage.getItem("user_id");
    if (!userId) {
        loginArea.innerHTML = `<button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#authModal">Login</button>`;
        return;
    }

    // utente loggato: recupera info e renderizza
    (async () => {
        try {
            fetch(`/api/users/${localStorage.getItem("user_id")}`)
                .then(response => response.json())
                .then(data => {
                    loginArea.querySelector('p').textContent = data.name;
                    loginArea.querySelector('img').src = data.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                });

        } catch (e) {
            console.error(e);
        }
    })();

    document.getElementById("logout").addEventListener("click", logout);
}

document.addEventListener("DOMContentLoaded", mountIncludes);