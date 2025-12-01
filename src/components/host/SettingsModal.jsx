import React, { useState, useEffect } from 'react';
import { X, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BRAND_COLORS = [
    '#0ea5e9', // Sky (Default Blue)
    '#4f46e5', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#111827', // Gray
];

export default function SettingsModal({ isOpen, onClose, sessionName, brandColor, requireName: initialRequireName, showResultsByDefault: initialShowResults, onUpdateSettings, darkMode, isSetupMode }) {
    const [name, setName] = useState(sessionName || '');
    const [selectedColor, setSelectedColor] = useState(brandColor);
    const [requireName, setRequireName] = useState(false);
    const [showResultsByDefault, setShowResultsByDefault] = useState(false);
    const [isColorPickerExpanded, setIsColorPickerExpanded] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(sessionName || '');
            setSelectedColor(brandColor || '#0ea5e9'); // Default to blue
            setRequireName(initialRequireName || false);
            setShowResultsByDefault(initialShowResults !== undefined ? initialShowResults : true);
            setIsColorPickerExpanded(false);
        }
    }, [isOpen, sessionName, brandColor, initialRequireName, initialShowResults]);

    const handleSave = () => {
        onUpdateSettings({
            name: name,
            brandColor: selectedColor,
            requireName: requireName,
            showResultsByDefault: showResultsByDefault
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isSetupMode ? onClose : undefined}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"
                    >
                        <div className={`rounded-3xl shadow-2xl w-full max-w-md mx-4 pointer-events-auto overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900/40 backdrop-blur-2xl border border-white/20' : 'bg-white/40 backdrop-blur-2xl border border-gray-200/50'}`}>
                            {/* Header */}
                            <div className={`px-6 py-4 border-b flex items-center justify-center relative ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50/50 border-gray-100'}`}>
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    {isSetupMode ? 'Setup Your Session' : 'Session Settings'}
                                </h2>
                                {!isSetupMode && (
                                    <button
                                        onClick={onClose}
                                        className={`absolute right-4 p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-8">
                                {/* Session Name Input */}
                                <div className="space-y-3 text-center">
                                    <label className={`block text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                        Session Name
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter Session Name"
                                        className={`w-full bg-transparent border-b-2 text-center text-xl font-bold py-2 outline-none transition-colors placeholder:font-normal ${darkMode
                                            ? 'text-white border-slate-700 focus:border-indigo-500 placeholder:text-slate-600'
                                            : 'text-gray-900 border-gray-200 focus:border-indigo-500 placeholder:text-gray-300'
                                            }`}
                                    />
                                </div>

                                {/* Brand Color (Expandable) */}
                                <div className="flex flex-col items-center space-y-3">
                                    <label className={`block text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                        Brand Color
                                    </label>

                                    <div className="w-full flex flex-col items-center">
                                        <button
                                            onClick={() => setIsColorPickerExpanded(!isColorPickerExpanded)}
                                            className="w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center relative ring-4 ring-white/10"
                                            style={{ backgroundColor: selectedColor }}
                                        >
                                            <motion.div
                                                animate={{ rotate: isColorPickerExpanded ? 180 : 0 }}
                                                className="bg-black/20 p-1 rounded-full backdrop-blur-[2px]"
                                            >
                                                {/* Simple indicator */}
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </motion.div>
                                        </button>

                                        <AnimatePresence>
                                            {isColorPickerExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                    className="overflow-hidden w-full"
                                                >
                                                    <div className="grid grid-cols-4 gap-3 p-1">
                                                        {BRAND_COLORS.map(color => (
                                                            <button
                                                                key={color}
                                                                onClick={() => {
                                                                    setSelectedColor(color);
                                                                    setIsColorPickerExpanded(false);
                                                                }}
                                                                className="aspect-square rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 relative group"
                                                                style={{ backgroundColor: color }}
                                                            >
                                                                {selectedColor === color && (
                                                                    <motion.div
                                                                        initial={{ scale: 0 }}
                                                                        animate={{ scale: 1 }}
                                                                        className="bg-white/20 p-1 rounded-full backdrop-blur-sm"
                                                                    >
                                                                        <Check size={20} className="text-white stroke-[3]" />
                                                                    </motion.div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Toggles Container */}
                                <div className="space-y-4">
                                    {/* Require Name Toggle */}
                                    <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                Require Name
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setRequireName(!requireName)}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${requireName
                                                ? (darkMode ? 'bg-indigo-500' : 'bg-indigo-600')
                                                : (darkMode ? 'bg-slate-700' : 'bg-gray-300')
                                                }`}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ x: requireName ? 22 : 2 }}
                                                className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-1"
                                            />
                                        </button>
                                    </div>

                                    {/* Show Results by Default Toggle */}
                                    <div className={`flex items-center justify-between p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                Show Results by Default
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowResultsByDefault(!showResultsByDefault)}
                                            className={`w-12 h-7 rounded-full transition-colors relative ${showResultsByDefault
                                                ? (darkMode ? 'bg-indigo-500' : 'bg-indigo-600')
                                                : (darkMode ? 'bg-slate-700' : 'bg-gray-300')
                                                }`}
                                        >
                                            <motion.div
                                                initial={false}
                                                animate={{ x: showResultsByDefault ? 22 : 2 }}
                                                className="w-5 h-5 bg-white rounded-full shadow-sm absolute top-1"
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className={`px-6 py-4 border-t flex justify-center ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                                <button
                                    onClick={handleSave}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 text-lg"
                                    style={{
                                        backgroundColor: selectedColor,
                                        boxShadow: `0 4px 12px -2px ${selectedColor}40`
                                    }}
                                >
                                    {isSetupMode ? (
                                        <>
                                            Start Session
                                            <Check size={20} strokeWidth={3} />
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
