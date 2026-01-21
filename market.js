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

function buyItem(id, name, price, icon) {
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        showToast('Satın almak için giriş yapmalısınız!', 'error');
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    if (parseFloat(user.balance) < price) {
        showToast('Yetersiz Bakiye! Lütfen bakiye yükleyiniz.', 'error');
        return;
    }

    showConfirmModal(`${name} ürününü ${price} TL karşılığında satın almak istiyor musunuz?`, () => {
        // Deduct Balance
        user.balance = (parseFloat(user.balance) - price).toFixed(2);

        // Add to Inventory
        if (!user.inventory) user.inventory = [];
        const newItem = {
            id: '_' + Math.random().toString(36).substr(2, 9),
            productId: id,
            name: name,
            price: price,
            icon: icon,
            date: new Date().toISOString(),
            status: 'active' // active, used, gifted
        };
        user.inventory.push(newItem);

        // Log Activity
        if (!user.activityLog) user.activityLog = [];
        user.activityLog.push({
            type: 'purchase',
            details: `${name} satın alındı.`,
            amount: -price,
            date: new Date().toISOString()
        });

        // Save
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Sync with main DB (vino_users) for persistence across re-logins
        const users = JSON.parse(localStorage.getItem('vion_users')) || [];
        const idx = users.findIndex(u => u.username === user.username);
        if (idx > -1) {
            users[idx] = user;
            localStorage.setItem('vion_users', JSON.stringify(users));
        }

        showToast(`${name} başarıyla satın alındı!`, 'success');
    });
}
