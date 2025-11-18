const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

// Middleware to protect routes and attach user data
const protect = async (req, res, next) => {
    let token;

    // 1. Check for the token in the 'Authorization' header (Bearer <TOKEN>)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (removes 'Bearer ')
            token = req.headers.authorization.split(' ')[1];

            // 2. Verify the token using your secret
            const decoded = jwt.verify(token, process.env.SECRET);

            // 3. Find the user by the ID in the token payload 
            // Fetch the user and attach the full object (excluding password) to req.user
            req.user = await User.findById(decoded.id).select('-password');
            
            // For cleaner access to the ID in controllers
            if (req.user) {
                req.user.id = req.user._id; 
                next();
            } else {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

        } catch (error) {
            console.error('JWT Verification Error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

module.exports = { protect };