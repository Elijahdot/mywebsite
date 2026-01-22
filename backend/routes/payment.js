const express = require('express');
const router = express.Router();
const User = require('../models/User');

// --- Shopier Configuration ---
// These should be in .env
const SHOPIER_API_KEY = process.env.SHOPIER_API_KEY || 'YOUR_SHOPIER_API_KEY';
const SHOPIER_API_SECRET = process.env.SHOPIER_API_SECRET || 'YOUR_SHOPIER_API_SECRET';
const CALLBACK_URL = process.env.CALLBACK_URL || 'https://vionnetwork.netlify.app/.netlify/functions/api/payment/callback';

// 1. Create Payment (Frontend calls this)
router.post('/create', async (req, res) => {
    try {
        const { amount, userId } = req.body;

        if (!amount || !userId) {
            return res.status(400).json({ error: 'Miktar ve kullanıcı ID gerekli.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        // Generate Order ID
        const orderId = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // In a real Shopier implementation, you typically rendering a form that auto-submits to Shopier.
        // Or you use a library that generates the payment page data.
        // Since we are mocking the specific library usage or raw HTTP post generation:

        // This is where you would sign the data with your Shopier Secret.
        // For now, we will return the data needed for the frontend to redirect or 
        // in a real scenario, we might even redirect from here or return HTML.

        // Let's assume we return a mock success for the frontend to simulate the "Redirect" 
        // OR we return the actual Shopier Form Params if we had the SDK.

        // MOCK RESPONSE for now since we don't have actual keys:
        res.json({
            status: 'success',
            orderId: orderId,
            shopierUrl: 'https://www.shopier.com/ShowProduct/api_pay4.php', // Example URL
            // Params to post
            params: {
                API_KEY: SHOPIER_API_KEY,
                website_index: 1,
                platform_order_id: orderId,
                product_name: `${amount} TL Bakiye Yükleme`,
                product_type: 0, // Downloadable/Virtual
                buyer_name: user.username,
                buyer_surname: 'Oyuncu',
                buyer_email: user.email,
                buyer_phone_number: '05555555555', // Required by Shopier usually
                billing_address: 'Türkiye',
                city: 'Istanbul',
                total_order_value: amount,
                currency: 0, // TL
                callback_url: CALLBACK_URL
            }
        });

    } catch (error) {
        console.error('Payment Create Error:', error);
        res.status(500).json({ error: 'Ödeme oluşturulamadı.' });
    }
});

// 2. Callback (Shopier calls this)
router.post('/callback', async (req, res) => {
    try {
        // Shopier sends POST data here.
        // Verification logic would go here (checking signature).

        // For demonstration (and simulation), we assume it's valid.
        // Shopier typically sends "custom_params" or we use the order ID to look up the pending transaction.
        // Let's assume we receive `platform_order_id` back.

        // WARNING: IN PRODUCTION, VERIFY THE SIGNATURE (SHASUM) TO PREVENT FAKE REQUESTS.

        // Since we are stateless here, we might need to rely on the "custom_params" we sent passing the UserID back, 
        // or look up the OrderID in a "Transactions" collection. 
        // For simplicity in this edit, let's assume Shopier sends back the order ID 
        // AND we are just simulating looking up the user from a temporary hack or expecting 
        // the callback to contain enough info.

        // Actually, without a "PendingTransactions" DB table, linking callback to User is hard if Shopier doesn't echo custom fields.
        // Shopier DOES allow sending a custom parameter (user_id).

        // Let's assume we retrieve userId from a db lookup or custom param.
        // For this code to work REALISTICALLY, we need to save the order first.

        // But since the user wants the structure:
        // We will just return "OK" to Shopier.

        res.status(200).send('OK');

    } catch (error) {
        console.error('Callback Error:', error);
        res.status(500).send('Error');
    }
});

// 3. Mock Success (For testing without Real Shopier)
// Frontend can call this to simulate a successful payment for testing purposes
router.post('/mock-success', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const val = parseFloat(amount);
        user.balance += val;

        // Log
        user.activityLog.push({
            type: 'purchase', // or 'deposit'
            details: `Bakiye Yüklendi (Kredi Kartı/Shopier)`,
            amount: val,
            date: new Date()
        });

        await user.save();
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Mock payment failed' });
    }
});

module.exports = router;
