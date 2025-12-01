import React from 'react';
import { X, AlertTriangle, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EndSessionModal({ isOpen, onClose, onConfirm, darkMode }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <div className={`rounded-3xl shadow-2xl w-full max-w-sm mx-4 pointer-events-auto overflow-hidden border ${darkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-100'}`}>
                            {/* Header */}
                            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? 'bg-red-500/10 border-white/5' : 'bg-red-50/50 border-gray-100'}`}>
                                <div className={`flex items-center gap-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                    <AlertTriangle size={20} />
                                    <h2 className="text-lg font-bold">End Session?</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className={`font-medium leading-relaxed ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                    Are you sure you want to end this session? This will delete all session data permanently.
                                </p>
                            </div>

                            {/* Footer */}
                            <div className={`px-6 py-4 border-t flex justify-end gap-3 ${darkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <button
                                    onClick={onClose}
                                    className={`px-4 py-2 font-bold rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95 ${darkMode ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'}`}
                                >
                                    <Power size={18} />
                                    End Session
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
