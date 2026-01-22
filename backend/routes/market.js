const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Buy Item
router.post('/buy', async (req, res) => {
    try {
        const { userId, item } = req.body;

        if (!userId || !item) {
            return res.status(400).json({ error: 'Eksik veri.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const price = parseFloat(item.price);
        if (user.balance < price) {
            return res.status(400).json({ error: 'Yetersiz bakiye.' });
        }

        // Deduct Balance
        user.balance -= price;

        // Add to Inventory
        const newItem = {
            productId: item.id, // e.g. 'vip', 'key_rare'
            name: item.name,
            price: price, // Store purchase price
            icon: item.icon,
            date: new Date(),
            status: 'active'
        };
        user.inventory.push(newItem);

        // Log
        user.activityLog.push({
            type: 'purchase',
            details: `${item.name} satın alındı.`,
            amount: -price,
            date: new Date()
        });

        await user.save();

        res.json({
            success: true,
            balance: user.balance,
            inventory: user.inventory,
            activityLog: user.activityLog
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Satın alma işlemi başarısız.' });
    }
});

module.exports = router;
