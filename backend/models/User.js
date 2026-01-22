const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    balance: {
        type: Number,
        default: 0
    },
    inventory: [
        {
            productId: String,
            name: String,
            price: Number,
            icon: String,
            date: Date,
            status: { type: String, default: 'active' }
        }
    ],
    activityLog: [
        {
            type: { type: String }, // purchase, use, gift
            details: String,
            amount: Number,
            date: Date
        }
    ],
    isAdmin: {
        type: Boolean,
        default: false
    },
    joinDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
