import React, { useState } from 'react';

const AuthForm = () => {
    // State to toggle between 'signin' and 'signup' views
    const [isSignIn, setIsSignIn] = useState(true);
    
    // State to hold form data
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '' 
    });

    // Toggle function to switch views
    const toggleView = () => {
        setIsSignIn(prevState => !prevState);
        // Reset form data when switching
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    };

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isSignIn) {
            // **Sign In Logic**
            console.log('Signing In with:', { email: formData.email, password: formData.password });
            // TODO: Call your Sign In API endpoint
        } else {
            // **Sign Up Logic**
            if (formData.password !== formData.confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            console.log('Signing Up with:', { 
                name: formData.name, 
                email: formData.email, 
                password: formData.password 
            });
            // TODO: Call your Sign Up API endpoint
        }
    };

    const title = isSignIn ? 'Sign In to Invoice System' : 'Create Your Account';
    const buttonText = isSignIn ? 'Log In' : 'Sign Up';
    const switchText = isSignIn ? "Don't have an account?" : "Already have an account?";
    const switchLinkText = isSignIn ? "Sign Up" : "Sign In";

    return (
        // Full page container: centers content, light background
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            
            {/* Auth Card/Container */}
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl transition-all duration-300">
                
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
                    {title}
                </h2>

                <form onSubmit={handleSubmit}>
                    
                    {/* Name Field (Only for Sign Up) */}
                    {!isSignIn && (
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input 
                                type="text" 
                                id="name" 
                                name="name" 
                                placeholder="Enter your full name" 
                                value={formData.name}
                                onChange={handleChange}
                                required={!isSignIn}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                    )}
                    
                    {/* Email Field (Used for both) */}
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            placeholder="your.email@example.com" 
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        />
                    </div>
                    
                    {/* Password Field (Used for both) */}
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input 
                            type="password" 
                            id="password" 
                            name="password" 
                            placeholder="Enter your password" 
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        />
                    </div>

                    {/* Confirm Password Field (Only for Sign Up) */}
                    {!isSignIn && (
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                placeholder="Re-enter your password" 
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required={!isSignIn}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            />
                        </div>
                    )}
                    
                    {/* Extra link for Sign In (Forgot Password) */}
                    {isSignIn && (
                        <div className="mb-6 flex justify-end">
                            <a 
                                href="#" 
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition duration-150"
                            >
                                Forgot Password?
                            </a>
                        </div>
                    )}

                    {/* Submission Button */}
                    <button 
                        type="submit" 
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-150 ease-in-out shadow-md"
                    >
                        {buttonText}
                    </button>
                    
                </form>
                
                {/* View Switcher Link */}
                <div className="mt-6 text-center text-sm">
                    {switchText}
                    <button 
                        onClick={toggleView}
                        className="ml-1 text-blue-600 hover:text-blue-800 font-medium hover:underline focus:outline-none"
                    >
                        {switchLinkText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthForm; 