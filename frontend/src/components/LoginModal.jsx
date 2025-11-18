import React from 'react';
import AuthForm from './AuthForm.jsx'; // ⭐️ FIX: Added .jsx extension
import { XMarkIcon } from '@heroicons/react/24/outline'; // Close icon

const LoginModal = ({ isOpen, onClose }) => {
    if (!isOpen) {
        return null;
    }

    return (
        // Modal Backdrop
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4"
            // Clicking the backdrop closes the modal
            onClick={onClose} 
        >
            {/* Modal Container */}
            <div 
                className="relative bg-white rounded-xl max-w-lg w-full transform transition-all shadow-2xl overflow-hidden"
                // Prevent click on modal content from closing the modal
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 z-10 p-1 rounded-full hover:bg-gray-100 transition"
                    aria-label="Close modal"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                
                {/* AuthForm is rendered inside the modal */}
                <div className="pt-10 pb-8 px-6">
                    {/* onSuccess is called by AuthForm upon successful login/signup, which then closes the modal */}
                    <AuthForm onSuccess={onClose} />
                </div>
            </div>
        </div>
    );
};

export default LoginModal;  