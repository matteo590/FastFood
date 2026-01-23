function showAlert(msg, type = "error") {
    const e = document.querySelector('#alert-block');
    if (!e) return;
    e.textContent = msg;
    e.classList.remove('d-none');
    if (type === "success") {
        e.classList.remove("alert-danger")
        e.classList.add("alert-success")
    }

};


document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('profile-form');
    if (!form) return;

    // Gestione eliminazione account
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const deleteAccountSpan = document.getElementById('deleteAccountSpan');
    let tooltipDeleteAccount = new bootstrap.Tooltip(deleteAccountSpan);
    tooltipDeleteAccount.disable();

    deleteAccountBtn.addEventListener('click', async () => {
        if (confirm("Sei sicuro di voler eliminare il tuo account?")) {
            try {
                const res = await fetch('/api/users/' + localStorage.getItem('user_id'), {
                    method: 'DELETE',
                });
                const result = await res.json();
                if (!res.ok) {
                    showAlert(result.message || "Si è verificato un errore. Riprova più tardi.", type = "error");
                } else {
                    showAlert(result.message || "Account eliminato con successo!", type = "success");
                    localStorage.removeItem('user_id');
                    // Reindirizza l'utente alla homepage o alla pagina di login
                    setTimeout(() => {
                        location.href = '/';
                    }, 2000);
                }
            } catch (err) {
                showAlert("Si è verificato un errore. Riprova più tardi.", type = "error");
                console.error(err.message);
            }
        }
    });

    //precompila il form con i dati dell'utente
    fetch('/api/users/' + localStorage.getItem('user_id'))
        .then(res => res.json())
        .then(data => {
            if (data) {
                if(data.role && data.role === 'ristoratore'){
                    // Nascondi il pulsante di eliminazione account per i ristoratori
                    deleteAccountBtn.classList.add('disabled');
                    tooltipDeleteAccount.enable();
                    document.getElementById("createRestaurantBtn").classList.add("d-none");
                }

                document.getElementById('firstname').value = data.name || '';
                document.getElementById('lastname').value = data.surname || '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('paymentMethod').value = data.payment || '';
                // Converte la data MongoDB  in formato yyyy-mm-dd"
                if (data.birthday) {
                    const date = new Date(data.birthday);
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    document.getElementById('birthday').value = `${yyyy}-${mm}-${dd}`;
                } else {
                    document.getElementById('birthday').value = '';
                }
            }
        })
        .catch(err => console.error(err));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        if (!data.firstname || !data.lastname || !data.email || !data.birthday) {
            showAlert("Compila tutti i campi obbligatori", type = "error");
            return;
        }
        data.id = localStorage.getItem('user_id');
        console.log(data);
        try {
            const res = await fetch('/api/login/' + data.id, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await res.json();
            console.debug("Result:", result);
            if (!res.ok) {
                showAlert(result.message || "Si è verificato un errore. Riprova più tardi.", type = "error");
            } else {
                showAlert(result.message || "Profilo aggiornato con successo!", type = "success");
            }
        } catch (err) {

            showAlert("Si è verificato un errore. Riprova più tardi.", type = "error");
            console.error(err.message);
        }
    });
});


window.addEventListener("layout:ready", () => {
    const cartButton = document.getElementById("cart-button");
    cartButton.classList.add("d-none");
});