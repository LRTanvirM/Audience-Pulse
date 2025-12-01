import React, { useState, useEffect, useRef } from 'react';
import { Users, QrCode, Menu, X, Check, Link, Send, Square, Power, Settings, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SettingsModal from './SettingsModal';

export default function TopBar({ sessionId, sessionName, participantCount, onToggleQr, onSendToAudience, onStopQuestion, onEndSession, isLive, liveQuestionId, liveQuestion, currentQuestionId, brandColor, requireName, onUpdateSettings, darkMode, onToggleDarkMode }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState(sessionName || '');
    const nameInputRef = useRef(null);

    const skewRef = useRef(0);
    const lastQuestionIdRef = useRef(null);
    const hasStoppedRef = useRef(false);

    // Timer Logic
    useEffect(() => {
        if (!liveQuestion?.timer || liveQuestion.timer === 'none' || !liveQuestion.startTime) {
            setTimeLeft(null);
            return;
        }

        // Reset skew and stop flag if question changed
        if (lastQuestionIdRef.current !== liveQuestion.id) {
            skewRef.current = 0;
            lastQuestionIdRef.current = liveQuestion.id;
            hasStoppedRef.current = false;
        }

        const duration = parseInt(liveQuestion.timer, 10);
        const startTime = liveQuestion.startTime?.toDate ? liveQuestion.startTime.toDate() : new Date(liveQuestion.startTime);
        const endTime = new Date(startTime.getTime() + duration * 1000);

        const updateTimer = () => {
            if (hasStoppedRef.current) return;

            const now = new Date();
            const rawRemaining = (endTime - now) / 1000;

            // Detect clock skew: If remaining time is significantly greater than duration,
            // it means the client clock is behind the server clock.
            // We calculate the skew and subtract it to normalize the countdown.
            if (rawRemaining > duration + 0.5) {
                skewRef.current = rawRemaining - duration;
            }

            const adjustedRemaining = Math.ceil(rawRemaining - skewRef.current);

            if (adjustedRemaining <= -5) {
                hasStoppedRef.current = true;
                onStopQuestion();
                return;
            }

            if (adjustedRemaining <= 0) {
                setTimeLeft(0);
            } else {
                setTimeLeft(adjustedRemaining);
            }
        };

        updateTimer(); // Initial check
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [liveQuestion]);

    useEffect(() => {
        if (isEditingName && nameInputRef.current) {
            nameInputRef.current.focus();
        }
    }, [isEditingName]);

    const handleCopyLink = () => {
        const url = `${window.location.href.split('?')[0]}?session=${sessionId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNameSave = () => {
        if (tempName.trim()) {
            onUpdateSettings({ name: tempName });
        } else {
            setTempName(sessionName || '');
        }
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleNameSave();
        } else if (e.key === 'Escape') {
            setTempName(sessionName || '');
            setIsEditingName(false);
        }
    };

    const isCurrentLive = isLive && liveQuestionId === currentQuestionId;

    return (
        <>
            <header className={`rounded-2xl shadow-sm border flex justify-between items-center px-6 py-4 relative transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
                {/* Left: Session Info & Timer */}
                <div className="flex items-center gap-6 z-10">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className={`p-2 rounded-xl transition-colors mr-2 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={onToggleDarkMode}
                            className={`p-2 rounded-xl transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <div className={`h-6 w-px mx-2 ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-sm ${darkMode ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600'}`}>
                            #{sessionId}
                        </span>
                    </div>
                    <div className={`flex items-center gap-2 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Users size={20} />
                        <span>{participantCount}</span>
                    </div>

                    {/* Timer Display (Moved to Left) */}
                    {timeLeft !== null && (
                        <>
                            <div className={`h-6 w-px mx-2 ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                            <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : (darkMode ? 'text-slate-200' : 'text-slate-700')}`}>
                                <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Center: Session Name (Editable) */}
                <div className="flex-1 mx-4 min-w-0 text-center pointer-events-none">
                    {isEditingName ? (
                        <input
                            ref={nameInputRef}
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleNameSave}
                            onKeyDown={handleNameKeyDown}
                            className={`text-lg font-bold text-center border rounded-lg px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-500/20 pointer-events-auto ${darkMode ? 'bg-slate-800 text-white border-indigo-500/50' : 'bg-slate-50 text-slate-800 border-indigo-200'}`}
                        />
                    ) : (
                        <h2
                            onDoubleClick={() => {
                                setTempName(sessionName || '');
                                setIsEditingName(true);
                            }}
                            className={`text-lg font-bold truncate px-4 py-1 rounded-lg cursor-pointer transition-colors select-none inline-block max-w-full pointer-events-auto ${darkMode ? 'text-white hover:bg-white/5' : 'text-slate-800 hover:bg-slate-50'}`}
                            title="Double click to edit"
                        >
                            {sessionName || 'Untitled Session'}
                        </h2>
                    )}
                </div>

                {/* Right: Header Actions */}
                <div className="flex gap-3 z-10">
                    <button
                        onClick={onEndSession}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-colors ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                        title="End Session"
                    >
                        <Power size={18} />
                        <span className="hidden sm:inline">End</span>
                    </button>

                    <button
                        onClick={handleCopyLink}
                        className={`flex items-center justify-center w-10 h-10 border rounded-xl transition-all ${darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                        title="Copy Link"
                    >
                        {copied ? <Check size={18} /> : <Link size={18} />}
                    </button>

                    <button
                        onClick={onToggleQr}
                        className={`flex items-center justify-center w-10 h-10 border rounded-xl transition-all ${darkMode ? 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'}`}
                        title="Show QR"
                    >
                        <QrCode size={18} />
                    </button>

                    <button
                        onClick={isCurrentLive ? onStopQuestion : onSendToAudience}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 ${isCurrentLive
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/25'
                            : 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/25'
                            }`}
                        style={{
                            backgroundColor: isCurrentLive ? undefined : brandColor,
                            boxShadow: isCurrentLive ? undefined : `0 4px 12px color-mix(in srgb, ${brandColor}, transparent 75%)`
                        }}
                    >
                        {isCurrentLive ? <Square size={18} fill="currentColor" /> : <Send size={18} />}
                        <span>{isCurrentLive ? 'Stop' : (isLive ? 'Switch' : 'Live Now')}</span>
                    </button>
                </div>

            </header>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                sessionName={sessionName}
                brandColor={brandColor}
                requireName={requireName}
                onUpdateSettings={onUpdateSettings}
                darkMode={darkMode}
            />
        </>
    );
}
