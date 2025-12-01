import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, icon: Icon }) => {
    const baseStyles = "flex items-center justify-center px-6 py-3 rounded-xl font-bold transition-all duration-200 transform active:scale-95 shadow-lg";
    const variants = {
        primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30",
        secondary: "bg-white text-gray-800 hover:bg-gray-50 border-2 border-gray-200 shadow-gray-200/50",
        danger: "bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-red-500/30",
        success: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/30",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100 shadow-none"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed transform-none' : ''} ${className}`}
        >
            {Icon && <Icon className="w-5 h-5 mr-2" />}
            {children}
        </button>
    );
};

export default Button;
