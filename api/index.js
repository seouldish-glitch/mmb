require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// 1. MONGODB SETUP
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB!'))
    .catch(err => console.error('MongoDB Connection Error. Did you put your URI?:', err.message));

// User Schema
const userSchema = new mongoose.Schema({
    fullName: String,
    dob: String,
    nationalId: String,
    phone: String,
    email: String,
    password: String,
    bloodType: String,
    height: String,
    weight: String,
    allergies: String,
    medications: String,
    conditions: String,
    
    // Emergency Contact Fields
    emName: String,
    emRelation: String,
    emPhone: String,
    emWorkPhone: String,
    emEmail: String,
    emDob: String,

    // Medical Fields
    smoking: String,
    familyDocName: String,
    familyDocPhone: String,

    // Insurance Fields
    insuranceProvider: String,
    policyNumber: String,
    ambulanceService: String,
    
    // SOS State (for Serverless Polling instead of SSE)
    sosActive: { type: Boolean, default: false },
    lastSosTime: { type: Date },

    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 3. REGISTRATION ROUTE
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        const savedUser = await newUser.save();
        res.status(201).json({ success: true, userId: savedUser._id });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 3.5 LOGIN ROUTE
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Find user by email and password
        const user = await User.findOne({ email: email, password: password });
        
        if (user) {
            res.status(200).json({ success: true, userId: user._id });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. GET USER DATA ROUTE
app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. ALERT ROUTE (UPDATED FOR SERVERLESS)
app.post('/api/send-alert', async (req, res) => {
    try {
        const { userId } = req.body;

        if (userId) {
            // Update the user's document to show an active SOS
            await User.findByIdAndUpdate(userId, { 
                sosActive: true, 
                lastSosTime: new Date() 
            });
            res.status(200).json({ success: true, message: "SOS Activated in Database" });
        } else {
            res.status(400).json({ success: false, message: "No user ID provided" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. CLEAR ALERT ROUTE (Optional, to turn off the flashing)
app.post('/api/clear-alert', async (req, res) => {
    try {
        const { userId } = req.body;
        if (userId) {
            await User.findByIdAndUpdate(userId, { sosActive: false });
            res.status(200).json({ success: true, message: "SOS Cleared" });
        } else {
            res.status(400).json({ success: false, message: "No user ID provided" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// IMPORTANT FOR VERCEL: Export the app instead of app.listen!
module.exports = app;
