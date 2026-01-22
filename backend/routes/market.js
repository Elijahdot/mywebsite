const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Buy Item (Single) - Keep for compatibility if needed
router.post('/buy', async (req, res) => {
    try {
        const { userId, item } = req.body;
        // ... (existing logic)
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.balance < item.price) return res.status(400).json({ error: 'Insufficient balance' });

        user.balance -= item.price;
        user.inventory.push({
            productId: item.id,
            name: item.name,
            price: item.price,
            icon: item.icon,
            date: new Date(),
            status: 'active'
        });

        await user.save();
        res.json({ success: true, balance: user.balance, inventory: user.inventory });
    } catch (err) { res.status(500).json({ error: 'Purchase failed' }); }
});

// Checkout (Multiple Items)
router.post('/checkout', async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!userId || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Eksik veya geçersiz veri.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const totalCost = items.reduce((sum, item) => sum + parseFloat(item.price), 0);

        if (user.balance < totalCost) {
            return res.status(400).json({ error: 'Yetersiz bakiye. Sepet tutarı bakiyenizden fazla.' });
        }

        // Process all items
        items.forEach(item => {
            user.inventory.push({
                productId: item.id,
                name: item.name,
                price: item.price,
                icon: item.icon,
                date: new Date(),
                status: 'active'
            });
        });

        // Deduct Balance
        user.balance -= totalCost;

        // Log
        user.activityLog.push({
            type: 'purchase',
            details: `Sepet Alımı (${items.length} ürün): ${items.map(i => i.name).join(', ')}`,
            amount: -totalCost,
            date: new Date()
        });

        await user.save();

        res.json({
            success: true,
            balance: user.balance,
            inventory: user.inventory
        });

    } catch (err) {
        console.error('Checkout Error:', err);
        res.status(500).json({ error: 'Sepet onayı sırasında sunucu hatası oluştu.' });
    }
});

module.exports = router;
