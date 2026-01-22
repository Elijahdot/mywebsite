const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('../../backend/db');
require('dotenv').config();

// Initialize App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection Middleware
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error('CRITICAL: Database connection failed in middleware.');
        console.error(error); // Log the full error object
        res.status(500).json({
            error: 'Database connection failed',
            details: error.message
        });
    }
});

// Import Routes
const authRoutes = require('../../backend/routes/auth');
app.use('/api/auth', authRoutes);

const paymentRoutes = require('../../backend/routes/payment');
app.use('/api/payment', paymentRoutes);

const marketRoutes = require('../../backend/routes/market');
app.use('/api/market', marketRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Export handler
module.exports.handler = serverless(app);
