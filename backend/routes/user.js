const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/user/transfer-balance
// Gönderen kullanıcıdan alıp alıcı kullanıcıya aktarır
router.post('/transfer-balance', async (req, res) => {
    try {
        const { senderId, targetUsername, amount } = req.body;

        // Validasyon
        if (!senderId || !targetUsername || !amount || amount <= 0) {
            return res.status(400).json({ error: 'Geçersiz bilgiler.' });
        }

        // 1. Göndereni bul
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({ error: 'Gönderen kullanıcı bulunamadı.' });
        }

        // 2. Bakiyeyi kontrol et
        if (sender.balance < amount) {
            return res.status(400).json({ error: 'Yetersiz bakiye.' });
        }

        // 3. Alıcıyı bul (Case-insensitive)
        const receiver = await User.findOne({
            username: { $regex: new RegExp("^" + targetUsername + "$", "i") }
        });

        if (!receiver) {
            return res.status(404).json({ error: 'Alıcı kullanıcı bulunamadı.' });
        }

        if (sender._id.toString() === receiver._id.toString()) {
            return res.status(400).json({ error: 'Kendinize bakiye gönderemezsiniz.' });
        }

        // 4. Transfer işlemini gerçekleştir
        sender.balance -= amount;
        receiver.balance += amount;

        // 5. Kayıtları ekle (Activity Log)
        sender.activityLog.push({
            type: 'transfer_sent',
            details: `${targetUsername} kullanıcısına ${amount} ₺ gönderildi.`,
            date: new Date()
        });

        receiver.activityLog.push({
            type: 'transfer_received',
            details: `${sender.username} kullanıcısından ${amount} ₺ alındı.`,
            date: new Date()
        });

        // 6. Kaydet
        await sender.save();
        await receiver.save();

        res.json({
            message: 'Transfer başarıyla gerçekleşti.',
            newBalance: sender.balance
        });

    } catch (error) {
        console.error('Transfer hatası:', error);
        res.status(500).json({ error: 'Sunucu hatası.' });
    }
});

module.exports = router;
