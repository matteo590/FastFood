


window.addEventListener("layout:ready", () => {

  const form = document.getElementById("auth-form");


  if (!form) return;

  const modalEl = document.getElementById('authModal');
  const card = document.getElementById('login-card');
  const imgCol = modalEl.querySelector('.login100-pic');      // colonna immagine
  const signupExtra = document.getElementById('signup-extra');      // blocco extra
  const modeInput = document.getElementById('mode');              // hidden mode
  const titleEl = modalEl.querySelector('.login100-form-title');
  const submitBtn = document.getElementById('submit-btn');
  const toggleText = modalEl.querySelector('#toggle-signup .toggle-text');
  const msgBox = document.getElementById("alert-message");   // <span id="alert-message" class="d-none">
  const toggleButton = document.querySelector('#toggle-signup');


  function setMode(mode) {
    msgBox.classList.add("d-none");

    const isSignup = mode === 'signup';
    modeInput.value = mode;

    // 1) mostra/nascondi extra e immagine
    signupExtra.classList.toggle('d-none', !isSignup);
    imgCol.classList.toggle('d-none', isSignup);

    // 2) allarga il form quando l’immagine è nascosta
    form.classList.toggle('w-100', isSignup);
    form.classList.toggle('flex-grow-1', isSignup);

    // (facoltativo) se vuoi più spazio in signup: porta il dialog a XL
    const dialog = modalEl.querySelector('.modal-dialog');
    dialog.classList.toggle('modal-lg', !isSignup);
    dialog.classList.toggle('modal-xl', isSignup);

    // 3) testi
    titleEl.textContent = isSignup ? 'Create Account' : 'Member Login';
    submitBtn.textContent = isSignup ? 'Create Account' : 'Login';

    // 4) link toggle interno
    titleEl.textContent = isSignup ? 'Create Account' : 'Member Login';
    submitBtn.textContent = isSignup ? 'Create Account' : 'Login';
    toggleText.textContent = isSignup
      ? 'Hai già un account? Accedi'
      : 'Create your Account';



  }
  setMode("login");









  toggleButton.addEventListener('click', (e) => {
    //e.preventDefault();
    setMode(modeInput.value === 'login' ? 'signup' : 'login');
  });

  // Reset quando chiudi il modal (torna login)
  modalEl.addEventListener('hidden.bs.modal', () => {
    setMode('login');
    form.reset();
  });





  

  // helper UI
  const setMsg = (html, type = "success") => {
    // usa solo testo colorato Bootstrap (text-success / text-danger)
    msgBox.classList.remove("d-none", "text-success", "text-danger");
    msgBox.classList.add(type === "success" ? "text-success" : "text-danger", "fw-bold");
    msgBox.innerHTML = html;
  };
  const clearMsg = () => {
    msgBox.classList.add("d-none");
    msgBox.classList.remove("text-success", "text-danger", "fw-bold");
    msgBox.textContent = "";
  };
  const lock = (locked) => {
    submitBtn.disabled = locked;
    submitBtn.style.opacity = locked ? 0.7 : 1;
  };

  // Decide endpoint + payload

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearMsg();

    const mode = (modeInput?.value || "login").toLowerCase(); // "login" | "signup"
    const endpoint = mode === "signup" ? "/api/login/signup" : "/api/login/login";

    // campi comuni
    const email = form.querySelector("input[name='email']")?.value.trim();
    const pass = form.querySelector("input[name='pass']")?.value.trim();

    // campi extra signup (se presenti)
    const payload = { email, pass };
    if (mode === "signup") {
      payload.firstname = form.querySelector("input[name='firstName']")?.value.trim();
      payload.lastname = form.querySelector("input[name='lastName']")?.value.trim();
      payload.birthday = form.querySelector("input[name='birthDate']")?.value; // yyyy-mm-dd
      payload.userType = "cliente"
      payload.paymentMethod = form.querySelector("select[name='paymentMethod']")?.value;
    }

    // validazioni minime lato client
    if (!email || !pass) {
      setMsg("❌ Inserisci email e password.", "danger");
      return;
    }
    if (mode === "signup") {
      if (!payload.firstname || !payload.lastname || !payload.birthday || !payload.userType || !payload.paymentMethod) {
        setMsg("❌ Compila tutti i campi per la registrazione.", "danger");
        return;
      }
    }

    try {
      lock(true);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try { data = await res.json(); } catch { console.log(data); data = {}; }
      console.log(data);
      if (res.ok) {
        // Successo
        setMsg("✅" + data?.message || (mode === "signup" ? "Registrazione avvenuta!" : "Login effettuato!"), "success");
        console.log("User:", data.user);
        localStorage.setItem("user_id", data.user.id);
        setTimeout(() => (window.location.reload()), 1200);
      } else {
        // Errore 
        const msg = data?.message || "Operazione non riuscita.";
        setMsg(`❌ ${msg}`, "danger");
      }
    } catch (err) {
      console.error(err);
      setMsg("Errore di connessione al server.", "danger");
    } finally {
      lock(false);
    }
  });
});
