const express = require('express');
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'anvayasrh@gmail.com',
        pass: 'wgla pbco yohw umby'
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const usernameRegex = /^[a-zA-Z0-9]{6,}$/; // Min 6 chars, letters and numbers only
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ success: false, error: 'Username must be at least 6 characters and contain only letters and numbers.' });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ success: false, error: 'Password must be 8+ characters, with uppercase, lowercase, number, and symbol.' });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'Username or email already exists' });
        }

        const user = new User({ username, email, password });
        await user.save();
        res.json({ success: true, userId: user._id.toString() });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, error: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        res.json({ success: true, userId: user._id.toString() });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body; // Changed from username to email
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        const user = await User.findOne({ email }); // Changed to find by email
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetToken = resetToken;
        await user.save();

        const resetLink = `http://localhost:3000/reset-password.html?token=${resetToken}`;
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: user.email,
            subject: 'Password Reset - Anvaya',
            text: `Click this link to reset your password: ${resetLink}`
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: `Password reset link sent to ${user.email}.` });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Forgot password failed.', details: error.message });
    }
});
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'Password must be 8+ characters, with uppercase, lowercase, number, and symbol.' });
        }

        const user = await User.findOne({ resetToken: token });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        user.password = newPassword;
        user.resetToken = null;
        await user.save();
        res.json({ success: true, message: 'Password reset successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ success: false, message: 'Password reset failed.' });
    }
});

module.exports = router;