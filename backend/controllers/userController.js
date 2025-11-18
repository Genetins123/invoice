const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1️⃣ Register
exports.registerUser = async (req, res) => {
    const { username, email, password, confirmPassword, phone } = req.body;

    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Please fill all required fields' });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword, phone });
        await newUser.save();
        
        // After registration, generate token for immediate login
        const token = jwt.sign({ id: newUser._id }, process.env.SECRET, { expiresIn: '1h' });


        res.status(201).json({ 
            message: 'User registered successfully and logged in', 
            token, 
            user: { _id: newUser._id, username: newUser.username, email: newUser.email, phone: newUser.phone } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 2️⃣ Login
exports.loginUser = async (req, res) => {
    const { emailOrPhone, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        });

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate token upon successful login
        const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '1h' });

        res.status(200).json({ 
            message: 'Login successful', 
            token, 
            user: { _id: user._id, username: user.username, email: user.email, phone: user.phone } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ⭐️ 3️⃣ FIX: Get Authenticated User Profile (The solution to your problem)
// This fetches data based on the token provided, ensuring unique data for each user.
exports.getProfile = async (req, res) => {
    // The user object is attached by the 'protect' middleware
    const user = req.user; 

    if (user) {
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt,
        });
    } else {
        // Fallback for cases where middleware fails to attach user
        res.status(404).json({ message: 'User profile not found' });
    }
};


// ⭐️ 4️⃣ Protected Profile Update Function (User updates their OWN profile)
// Uses the ID attached via the JWT token (req.user.id)
exports.updateUserProfile = async (req, res) => {
    // Get the ID from the middleware, NOT from the request body or params
    const userId = req.user.id; 
    
    const { username, email, phone, password } = req.body;

    if (!username && !email && !phone && !password) {
        return res.status(400).json({ message: 'No fields provided for update.' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Apply updates
        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (password) user.password = await bcrypt.hash(password, 10);

        const updatedUser = await user.save();

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                phone: updatedUser.phone,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during profile update', error: error.message });
    }
};

// --- Generic/Admin Routes (Best practice to secure these) ---

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 5️⃣ Update User (Admin-level route - allows updating ANY user)
exports.updateUser = async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: 'Request body is empty. Nothing to update.' });
    }

    const { username, email, phone, password } = req.body;
    
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        } 

        if (username) user.username = username;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (password) user.password = await bcrypt.hash(password, 10);

        await user.save();
        
        res.status(200).json({ 
            message: 'User updated successfully', 
            user: { _id: user._id, username: user.username, email: user.email, phone: user.phone } 
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// 6️⃣ Delete User (Admin-level route - allows deleting ANY user)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};