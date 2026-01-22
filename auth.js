document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');

    // --- Helpers ---
    function setCurrentUser(user, token) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (token) localStorage.setItem('token', token);
    }

    function showAlert(msg, type = 'error') {
        if (!authAlert) return;
        authAlert.textContent = msg;
        authAlert.className = `alert-box ${type}`;
        authAlert.classList.remove('hidden');
    }

    // --- Actions ---
    // API_URL is relative because we are on same domain (netlify functions)
    const API_URL = '/api';

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;

            // Loading UI 
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Kayıt başarısız.');
                }

                setCurrentUser(data.user, data.token);
                showAlert('Kayıt başarılı! Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);

            } catch (err) {
                showAlert(err.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;

            // Loading UI
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            try {
                const res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Giriş başarısız.');
                }

                setCurrentUser(data.user, data.token);
                showAlert('Giriş başarılı! Yönlendiriliyorsunuz...', 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);

            } catch (err) {
                showAlert(err.message);
            } finally {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // --- Global Navbar Logic ---
    updateNavbarAuth();

    // Refresh User Profile on Page Load (if logged in)
    refreshUserProfile();
});

async function refreshUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            // Update local cache
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateNavbarAuth(); // Refresh nav with potentially new avatar/name
        } else {
            // Token invalid
            // localStorage.removeItem('token');
            // localStorage.removeItem('currentUser');
            // window.location.href = 'login.html';
        }
    } catch (e) {
        console.error('Failed to refresh profile', e);
    }
}


function updateNavbarAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const navCta = document.querySelector('.nav-cta');
    const existingActions = document.querySelector('.nav-actions');

    const targetEl = existingActions || navCta;
    if (!targetEl) return;

    if (user) {
        // Logged In: Chest + Profile

        const chestBtn = document.createElement('a');
        chestBtn.href = "inventory.html";
        chestBtn.className = "nav-icon-btn";
        chestBtn.innerHTML = `<i class="fa-solid fa-box-archive"></i>`;
        chestBtn.title = "Sandık (Envanter)";

        const headUrl = `https://mc-heads.net/avatar/${user.username}/32`;
        const profileBtn = document.createElement('a');
        profileBtn.href = "profile.html";
        profileBtn.className = "nav-profile-btn";
        profileBtn.innerHTML = `<img src="${headUrl}" alt="${user.username}" style="border-radius: 4px;">`;
        profileBtn.title = "Profil";

        if (!document.getElementById('nav-auth-styles')) {
            const style = document.createElement('style');
            style.id = 'nav-auth-styles';
            style.innerHTML = `
            .nav-actions { display: flex; gap: 15px; align-items: center; }
            
            .nav-icon-btn {
                width: 44px; height: 44px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 8px;
                display: flex; justify-content: center; align-items: center;
                color: white; font-size: 1.2rem;
                transition: 0.2s; cursor: pointer; text-decoration: none;
            }
            .nav-icon-btn:hover { background: var(--primary); border-color: var(--primary); transform: translateY(-2px); }

            .nav-profile-btn { 
                width: 44px; height: 44px; 
                border: 2px solid rgba(255,255,255,0.1); 
                border-radius: 8px; 
                display: flex; justify-content: center; align-items: center;
                transition: 0.2s; cursor: pointer;
            }
            .nav-profile-btn:hover { border-color: var(--primary); transform: translateY(-2px); }
            `;
            document.head.appendChild(style);
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'nav-actions';
        actionsDiv.appendChild(chestBtn);
        actionsDiv.appendChild(profileBtn);

        targetEl.replaceWith(actionsDiv);

    } else {
        // Guest: Only Login
        if (!document.getElementById('nav-guest-styles')) {
            const style = document.createElement('style');
            style.id = 'nav-guest-styles';
            style.innerHTML = `
             .nav-login-btn {
                 padding: 10px 25px;
                 border-radius: var(--radius-md);
                 font-weight: 600;
                 transition: 0.3s;
                 text-decoration: none;
                 color: white;
                 background: var(--primary);
                 box-shadow: 0 4px 15px rgba(231, 76, 60, 0.4);
             }
             .nav-login-btn:hover {
                 transform: translateY(-2px);
                 filter: brightness(1.1);
             }
            `;
            document.head.appendChild(style);
        }

        const loginBtn = document.createElement('a');
        loginBtn.href = "login.html";
        loginBtn.className = "nav-login-btn";
        loginBtn.textContent = "Giriş Yap";

        targetEl.replaceWith(loginBtn);
    }
}

// --- Global UI Helpers (Toasts & Modals) ---

// Toast Notification
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s ease-in forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Generic Confirm Modal
function showConfirmModal(message, onConfirm) {
    // Check if exists
    let overlay = document.getElementById('globalConfirmModal');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'globalConfirmModal';
        overlay.className = 'custom-modal-overlay';
        overlay.innerHTML = `
            <div class="custom-modal">
                <h3>Onay Gerekli</h3>
                <p id="globalModalMessage"></p>
                <div class="custom-modal-actions">
                    <button class="btn-modal-cancel" id="globalModalCancel">İptal</button>
                    <button class="btn-modal-confirm" id="globalModalConfirm">Onayla</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    const msgEl = document.getElementById('globalModalMessage');
    const cancelBtn = document.getElementById('globalModalCancel');
    const confirmBtn = document.getElementById('globalModalConfirm');

    msgEl.textContent = message;

    // Show
    overlay.classList.add('active');

    // Clean old listeners using clone or just logic
    // We'll define simple one-time wrappers

    function close() {
        overlay.classList.remove('active');
        cleanup();
    }

    function handleConfirm() {
        onConfirm();
        close();
    }

    function cleanup() {
        cancelBtn.onclick = null;
        confirmBtn.onclick = null;
    }

    cancelBtn.onclick = close;
    confirmBtn.onclick = handleConfirm;
}
