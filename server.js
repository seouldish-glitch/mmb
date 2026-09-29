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
    
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 2. SSE SETUP
let clients = [];

app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write('data: {"event":"CONNECTED"}\n\n');
    clients.push(res);
    req.on('close', () => { clients = clients.filter(client => client !== res); });
});

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

// 5. ALERT ROUTE
app.post('/api/send-alert', async (req, res) => {
    try {
        const { userId } = req.body;
        let userName = "A User";
        let contactEmail = "test@example.com"; // Fallback

        if (userId) {
            const user = await User.findById(userId);
            if(user) { 
                userName = user.fullName; 
                if (user.emEmail) {
                    contactEmail = user.emEmail;
                }
            }
        }

        // Broadcast to dashboard
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify({ event: 'EMERGENCY_SCAN', timestamp: new Date().toISOString() })}\n\n`);
        });

        res.status(200).json({ success: true, message: "Alert broadcasted to dashboard" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Emergency Alert Server running on http://localhost:${PORT}`);
});
