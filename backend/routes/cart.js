const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const { userId, name, price, image } = req.body;
        if (!userId || !name || !price || !image) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        // Check if the item already exists in the user's cart
        let cartItem = await Cart.findOne({ userId, name });
        if (cartItem) {
            // Increment quantity if item exists
            cartItem.quantity += 1;
            await cartItem.save();
        } else {
            // Add new item to cart
            cartItem = new Cart({ userId, name, price, image, quantity: 1 });
            await cartItem.save();
        }

        res.json({ success: true, message: `${name} added to cart!` });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, error: 'Failed to add to cart' });
    }
});

// Get user's cart
router.get('/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const cartItems = await Cart.find({ userId });
        res.json({ success: true, cart: cartItems });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch cart' });
    }
});

// Remove item from cart
router.delete('/remove/:userId/:itemId', async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        await Cart.findOneAndDelete({ _id: itemId, userId });
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, error: 'Failed to remove from cart' });
    }
});

// Clear cart (for checkout)
router.delete('/clear/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        await Cart.deleteMany({ userId });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, error: 'Failed to clear cart' });
    }
});

module.exports = router;