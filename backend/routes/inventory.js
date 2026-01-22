const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Use Item (Transfer to Game)
router.post('/use', async (req, res) => {
    try {
        const { userId, itemId } = req.body;

        if (!userId || !itemId) {
            return res.status(400).json({ error: 'Eksik veri.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Find the item in inventory subdocument
        const item = user.inventory.id(itemId);

        if (!item) {
            return res.status(404).json({ error: 'Eşya bulunamadı.' });
        }

        if (item.status !== 'active') {
            return res.status(400).json({ error: 'Bu eşya zaten kullanılmış veya transfer edilmiş.' });
        }

        // Update Status to 'transferred'
        // This relies on the game server/plugin polling the DB for 'transferred' items for this username
        item.status = 'transferred';

        // Log
        user.activityLog.push({
            type: 'use',
            details: `${item.name} oyuna aktarıldı. (${user.username})`,
            amount: 0,
            date: new Date()
        });

        await user.save();

        res.json({
            success: true,
            inventory: user.inventory,
            activityLog: user.activityLog,
            message: `"${item.name}" başarıyla ${user.username} hesabına aktarıldı.`
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'İşlem başarısız.', details: err.message });
    }
});

module.exports = router;
