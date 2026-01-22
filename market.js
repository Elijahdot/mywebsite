function selectGameMode(mode) {
    if (mode === 'skyblock') {
        document.getElementById('step-gamemode').classList.add('hidden');
        document.getElementById('step-category').classList.remove('hidden');
    }
}

function goBackToGameMode() {
    document.getElementById('step-category').classList.add('hidden');
    document.getElementById('step-gamemode').classList.remove('hidden');
}

function selectCategory(cat) {
    document.getElementById('step-category').classList.add('hidden');
    document.getElementById('step-products').classList.remove('hidden');

    // Hide all groups
    document.querySelectorAll('.product-group').forEach(el => el.classList.add('hidden'));

    // Show selected
    document.getElementById(`prod-${cat}`).classList.remove('hidden');

    // Update Title
    const titles = {
        'vip': '👑 Ayrıcalıklı Üyelikler',
        'keys': '🗝️ Kasa Anahtarları',
        'coins': '💰 Oyun Parası ve Eşyalar'
    };
    document.getElementById('selected-category-title').textContent = titles[cat];
}

function goBackToCategory() {
    document.getElementById('step-products').classList.add('hidden');
    document.getElementById('step-category').classList.remove('hidden');
}

// --- Purchase Logic ---

async function buyItem(id, name, price, icon) {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user || !user.id) {
        showToast('Satın almak için giriş yapmalısınız!', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (parseFloat(user.balance) < price) {
        showToast('Yetersiz Bakiye! Lütfen bakiye yükleyiniz.', 'error');
        return;
    }

    showConfirmModal(`${name} ürününü ${price} TL karşılığında satın almak istiyor musunuz?`, async () => {
        try {
            const res = await fetch('/api/market/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    item: { id, name, price, icon }
                })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Satın alma başarısız.');

            // Update Local State
            user.balance = data.balance;
            user.inventory = data.inventory;
            user.activityLog = data.activityLog;
            localStorage.setItem('currentUser', JSON.stringify(user));

            showToast(`${name} başarıyla satın alındı!`, 'success');

        } catch (err) {
            console.error(err);
            showToast(err.message, 'error');
        }
    });
}
