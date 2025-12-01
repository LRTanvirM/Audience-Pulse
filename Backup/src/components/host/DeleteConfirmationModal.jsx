import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, title = "Delete Question?", message = "Are you sure you want to delete this question? This action cannot be undone." }) {
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
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 pointer-events-auto overflow-hidden border border-gray-100">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle size={20} />
                                    <h2 className="text-lg font-bold">{title}</h2>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-gray-600 font-medium leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                                >
                                    <Trash2 size={18} />
                                    Delete
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
