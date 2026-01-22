const mongoose = require('mongoose');

// Cache connection for serverless
let conn = null;

const connectDB = async () => {
    if (conn) {
        return conn;
    }

    const uri = process.env.MONGODB_URI;

    console.log('DEBUG: Checking MONGODB_URI...');
    if (!uri) {
        console.error('ERROR: MONGODB_URI is undefined.');
        throw new Error('MONGODB_URI is not defined in environment variables.');
    }
    console.log(`DEBUG: MONGODB_URI found (Length: ${uri.length}).`);

    // Extract and log username (safely)
    const userMatch = uri.match(/mongodb\+srv:\/\/([^:]+):/);
    if (userMatch && userMatch[1]) {
        console.log(`DEBUG: Authenticating as user: '${userMatch[1]}'`);
    } else {
        console.warn('DEBUG: Could not extract username from URI. Check format.');
    }

    try {
        console.log('DEBUG: Attempting mongoose.connect...');
        conn = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('DEBUG: MongoDB Connected information:', conn.connection.host);
        return conn;
    } catch (error) {
        console.error('DEBUG: MongoDB Connection FAILED.');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);
        throw error;
    }
};

module.exports = connectDB;
