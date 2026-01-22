const mongoose = require('mongoose');

// Cache connection for serverless
let conn = null;

const connectDB = async () => {
    if (conn) {
        return conn;
    }

    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables.');
    }

    try {
        conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('MongoDB Connected');
        return conn;
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        throw error;
    }
};

module.exports = connectDB;
