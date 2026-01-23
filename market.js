// --- Product Data ---
const productsData = {
    'vip': {
        name: 'VIP Üyelik',
        price: 50,
        icon: 'fa-crown',
        shortDesc: 'Hızlı kitler, özel chat rengi ve uçuş hakkı.',
        longDesc: 'VIP Üyelik ile sunucumuzda ayrıcalıklı bir deneyim yaşayın. \n\n• /fly komutu ile uçuş hakkı\n• Özel [VIP] ön eki\n• VIP özel kitleri\n• Dolu sunucuya giriş hakkı\n• Renkli chat yazma özgürlüğü'
    },
    'mvp': {
        name: 'MVP Üyelik',
        price: 120,
        icon: 'fa-shield-halved',
        shortDesc: '2x Kredi, özel efektler ve MVP kitleri.',
        longDesc: 'MVP Üyelik, VIP özelliklerinin üzerine ekstra güç katar. \n\n• VIP+ Tüm özellikleri içerir\n• 2x Daha fazla kredi kazanımı\n• Özel giriş mesajı\n• Sanal market (/market) erişimi\n• MVP özel kitleri'
    },
    'mvp_plus': {
        name: 'MVP+ Üyelik',
        price: 200,
        icon: 'fa-star',
        shortDesc: 'Sınırsız özellikler, özel tag ve daha fazlası.',
        longDesc: 'Sunucumuzun en üst düzey üyeliği! \n\n• Tüm üyeliklerin özelliklerini içerir\n• Sınırsız sanal depo alanı\n• Özel efektler ve partiküller\n• Sunucu etkinliklerinde öncelik\n• MVP+ Özel VIP kiti'
    },
    'key_legend': {
        name: 'Efsanevi Kasa Anahtarı',
        price: 15,
        icon: 'fa-key',
        shortDesc: 'Efsanevi kasa açmak için kullanılır.',
        longDesc: 'Efsanevi kasalardan en nadir eşyaları çıkarma şansı yakalayın! \n\n• %5 şansla Verimlilik X kazma\n• %2 şansla Özel Kanatlar\n• Nadir kozmetikler ve oyun parası'
    },
    'key_rare': {
        name: 'Nadir Kasa Anahtarı',
        price: 10,
        icon: 'fa-key',
        shortDesc: 'Nadir eşyalar içerir.',
        longDesc: 'Nadir kasa anahtarı ile kasanızı açın ve gelişiminizi hızlandırın. \n\n• Güçlü zırhlar ve silahlar\n• Başlangıç seviyesi büyülü kitaplar\n• Oyun parası paketleri'
    },
    'tool_pickaxe': {
        name: 'Verimlilik X Kazma',
        price: 40,
        icon: 'fa-hammer',
        shortDesc: 'Ada kazmak artık çok daha hızlı!',
        longDesc: 'Bu özel kazma ile madenleri ve adanızı ışık hızında kazın. \n\n• Verimlilik 10 (Efficiency X)\n• Kırılmazlık 10 (Unbreaking X)\n• Servet 5 (Fortune V)'
    },
    'coin_1m': {
        name: '1M Oyun Parası',
        price: 25,
        icon: 'fa-sack-dollar',
        shortDesc: 'Ekonomiye hızlı bir giriş yap.',
        longDesc: 'Adanızı büyütmek veya marketten eşya almak için ihtiyacınız olan nakit desteği. \n\n• Hesabınıza anında 1.000.000 Oyun Parası eklenir.'
    }
};

let cart = JSON.parse(localStorage.getItem('cart')) || [];

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

    document.querySelectorAll('.product-group').forEach(el => el.classList.add('hidden'));
    document.getElementById(`prod-${cat}`).classList.remove('hidden');

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

// --- Detail Modal Functions ---

function showProductDetails(id) {
    const product = productsData[id];
    if (!product) return;

    document.getElementById('modal-title').textContent = product.name;
    document.getElementById('modal-price').textContent = `₺${product.price.toFixed(2)}`;

    // Format longDesc: replace bullets with checkmarks and wrap in list styling
    const formattedDesc = product.longDesc
        .replace(/•/g, '<i class="fa-solid fa-check" style="color:var(--primary); margin-right:8px; font-size:0.9rem;"></i>')
        .replace(/\n/g, '<br>');

    document.getElementById('modal-desc').innerHTML = formattedDesc;
    document.getElementById('modal-icon-container').innerHTML = `<i class="fa-solid ${product.icon}"></i>`;

    // Set Action Buttons
    const addCartBtn = document.getElementById('modal-add-cart-btn');
    const buyNowBtn = document.getElementById('modal-buy-now-btn');

    addCartBtn.onclick = () => {
        addToCart(id, product.name, product.price, product.icon);
        closeProductModal();
    };

    buyNowBtn.onclick = () => {
        addToCart(id, product.name, product.price, product.icon);
        toggleCart(true); // Open cart automatically
        closeProductModal();
    };

    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.add('hidden');
}

// --- Cart Functions ---

function toggleCart(forceOpen = null) {
    const drawer = document.getElementById('cart-drawer');
    if (forceOpen === true) drawer.classList.add('active');
    else if (forceOpen === false) drawer.classList.remove('active');
    else drawer.classList.toggle('active');

    if (drawer.classList.contains('active')) {
        renderCart();
    }
}

function addToCart(id, name, price, icon) {
    cart.push({ id, name, price, icon, cartId: Date.now() + Math.random() });
    saveCart();
    updateCartBadge();
    showToast(`${name} sepete eklendi!`, 'success');
}

function removeFromCart(cartId) {
    cart = cart.filter(item => item.cartId !== cartId);
    saveCart();
    renderCart();
    updateCartBadge();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadge() {
    document.getElementById('cart-count').textContent = cart.length;
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-msg">Sepetiniz boş.</p>';
        totalEl.textContent = '₺0.00';
        checkoutBtn.disabled = true;
        return;
    }

    checkoutBtn.disabled = false;
    let total = 0;
    container.innerHTML = '';

    cart.forEach(item => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-icon"><i class="fa-solid ${item.icon}"></i></div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>₺${item.price.toFixed(2)}</span>
            </div>
            <button class="btn-remove-cart" onclick="removeFromCart(${item.cartId})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        container.appendChild(div);
    });

    totalEl.textContent = `₺${total.toFixed(2)}`;
}

async function processCheckout() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userId = user?.id || user?._id;

    if (!user || !userId) {
        showToast('Ödeme yapmak için giriş yapmalısınız!', 'error');
        return;
    }

    let total = cart.reduce((sum, item) => sum + item.price, 0);
    if (user.balance < total) {
        showToast('Yetersiz Bakiye!', 'error');
        return;
    }

    showConfirmModal(`Toplam ₺${total.toFixed(2)} tutarındaki sepetinizi bakiye ile onaylıyor musunuz?`, async () => {
        try {
            const res = await fetch('/api/market/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    items: cart
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'İşlem başarısız.');

            // Success
            user.balance = data.balance;
            user.inventory = data.inventory;
            localStorage.setItem('currentUser', JSON.stringify(user));

            cart = [];
            saveCart();
            updateCartBadge();
            toggleCart(false);

            showToast('Sipariş başarıyla tamamlandı! Eşyalar sandığınıza eklendi.', 'success');

        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// Initial Run
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});
