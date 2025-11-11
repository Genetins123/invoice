import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; 

// 🔑 Now accepts an onSuccess prop to close the modal
const AuthForm = ({ onSuccess }) => {
    // 2. Use the authentication context
    const { login } = useAuth();

    // NOTE: Replace this placeholder URL with your actual backend URL
    const API_URL = 'http://localhost:5000/api/user'; 

    const [isSignIn, setIsSignIn] = useState(true);
    const [error, setError] = useState(null); 
    const [loading, setLoading] = useState(false); 
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '' 
    });

    const buttonText = isSignIn ? 'Sign In' : 'Sign Up';
    const switchText = isSignIn ? "Don't have an account?" : "Already have an account?";
    const switchLinkText = isSignIn ? 'Sign Up' : 'Sign In';
    const title = isSignIn ? 'Welcome Back' : 'Create Account';

    const toggleView = () => {
        setIsSignIn(prevState => !prevState);
        setError(null);
        setFormData({ 
            username: '', email: '', password: '', confirmPassword: '', phone: '' 
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!isSignIn && formData.password !== formData.confirmPassword) {
                setError("Passwords do not match!");
                setLoading(false);
                return;
            }

            const endpoint = isSignIn ? '/login' : '/register';
            const dataToSend = isSignIn 
                ? { emailOrPhone: formData.email, password: formData.password }
                : { 
                    username: formData.username, 
                    email: formData.email, 
                    password: formData.password,
                    confirmPassword: formData.confirmPassword, 
                    phone: formData.phone
                };

            const response = await fetch(`${API_URL}${endpoint}`, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const result = await response.json();

            if (response.ok) {
                
                // Log user in for both Sign In and Sign Up
                login(result.token, result.user); 
                
                if (isSignIn) {
                    console.log('Login successful. User:', result.user.username);
                } else {
                    // ⭐️ ADDED: Alert message for successful registration 
                    alert('Registration successful! You are now logged in. 🎉');
                    console.log('Registration successful. Automatically logged in.');
                }
                
                // Closes the modal/form for both successful login and registration
                if (onSuccess) {
                    onSuccess();
                }

            } else {
                setError(result.message || (isSignIn ? 'Login failed.' : 'Registration failed.'));
            }
        } catch (err) {
            console.error("Authentication Error:", err);
            setError('A network or server error occurred. Check your server connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        // The rest of the return block is unchanged
        <div className="w-full max-w-md mx-auto p-8 rounded-xl shadow-2xl bg-white">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-6">{title}</h2>
            
            {/* Error Message */}
            {error && (
                <div className="p-3 mb-4 text-sm text-red-800 bg-red-100 rounded-lg" role="alert">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Username Field (Sign Up Only) */}
                {!isSignIn && (
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                )}

                {/* Email Field */}
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                />

                {/* Password Field */}
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                />

                {/* Confirm Password Field (Sign Up Only) */}
                {!isSignIn && (
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                )}
                
                {/* Phone Field (Sign Up Only) */}
                {!isSignIn && (
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Phone (Optional)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    />
                )}

                {/* Extra link for Sign In (Forgot Password) */}
                {isSignIn && (
                    <div className="mb-6 flex justify-end">
                        <a 
                            href="#" 
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition duration-150"
                        >
                            Forgot Password?
                        </a>
                    </div>
                )}

                {/* Submission Button */}
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition duration-150 ease-in-out shadow-md disabled:opacity-50"
                >
                    {loading ? 'Processing...' : buttonText}
                </button>
                
            </form>
            
            {/* View Switcher Link */}
            <div className="mt-6 text-center text-sm">
                {switchText}
                <button 
                    onClick={toggleView}
                    className="ml-1 text-indigo-600 hover:text-indigo-800 font-medium hover:underline focus:outline-none"
                >
                    {switchLinkText}
                </button>
            </div>
        </div>
    );
};

export default AuthForm;