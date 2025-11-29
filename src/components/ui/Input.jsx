import React from 'react';

const Input = ({ value, onChange, placeholder, className = '', inputMode, pattern, maxLength }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-200 bg-gray-50 focus:bg-white text-base ${className}`}
    />
);

export default Input;
