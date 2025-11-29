import React from 'react';

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
        {children}
    </div>
);

export default Card;
