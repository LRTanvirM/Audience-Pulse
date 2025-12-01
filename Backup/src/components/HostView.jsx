import React, { useState, useEffect, useMemo, useRef } from 'react';
import { doc, onSnapshot, collection, updateDoc, addDoc, deleteDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { AlertCircle, Link, Check } from 'lucide-react';
import QRCode from 'react-qr-code';
import { AnimatePresence, motion } from 'framer-motion';

import Sidebar from './host/Sidebar';
import TopBar from './host/TopBar';
import QuestionEditor from './host/QuestionEditor';
import TypeSelector from './host/TypeSelector';
import LiveResults from './host/LiveResults';
import SettingsModal from './host/SettingsModal';
import Card from './ui/Card';
import Button from './ui/Button';
import DeleteConfirmationModal from './host/DeleteConfirmationModal';
import EndSessionModal from './host/EndSessionModal';

export default function HostView({ db, sessionId }) {
    const [sessionData, setSessionData] = useState(null);
    const [responses, setResponses] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [isExpired, setIsExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isCreatingRef = useRef(false);

    // UI State
    const [viewMode, setViewMode] = useState('setup'); // 'setup' | 'control'
    const [showQr, setShowQr] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, questionId: null });
    const [endSessionModal, setEndSessionModal] = useState(false);

    const handleCopyLink = () => {
        const url = `${window.location.origin}?session=${sessionId}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Editor State
    const [currentQuestion, setCurrentQuestion] = useState({
        id: 'new',
        text: '',
        type: 'choice',
        options: [{ id: 'opt-1', text: '' }, { id: 'opt-2', text: '' }]
    });

    // --- DATA SYNC ---
    useEffect(() => {
        const unsubSession = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            const data = doc.data({ serverTimestamps: 'estimate' });
            if (data) {
                if (data.expiresAt?.toDate() && new Date() > data.expiresAt.toDate()) {
                    setIsExpired(true);
                }
                setSessionData(data);

                // Auto-switch to control mode if voting is active
                if (data.state === 'voting' || data.state === 'results') {
                    setViewMode('control');
                }
            }
        });

        const unsubResponses = onSnapshot(collection(db, 'sessions', sessionId, 'responses'), (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            setResponses(data);
        });

        const qQuery = query(collection(db, 'sessions', sessionId, 'questions'), orderBy('order', 'asc'));
        const unsubQuestions = onSnapshot(qQuery, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuestions(data);
            setIsLoading(false);
        });

        // Migration: Ensure all questions have 'order'
        const migrateQuestions = async () => {
            const allQ = await getDocs(collection(db, 'sessions', sessionId, 'questions'));
            const missingOrder = allQ.docs.filter(d => d.data().order === undefined);
            if (missingOrder.length > 0) {
                const updates = missingOrder.map((d, idx) =>
                    updateDoc(doc(db, 'sessions', sessionId, 'questions', d.id), { order: idx })
                );
                await Promise.all(updates);
            }
        };
        migrateQuestions();

        return () => {
            unsubSession();
            unsubResponses();
            unsubQuestions();
        };
    }, [db, sessionId]);

    // --- ACTIONS ---

    const handleAddQuestion = async () => {
        const newQuestion = {
            text: '',
            type: 'choice',
            options: ['', ''],
            createdAt: serverTimestamp(),
            order: questions.length // Add order
        };

        const docRef = await addDoc(collection(db, 'sessions', sessionId, 'questions'), newQuestion);

        setCurrentQuestion({
            id: docRef.id,
            ...newQuestion,
            options: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        });
        setViewMode('setup');
    };

    const handleSelectQuestion = (q) => {
        // Convert string options to objects for editor
        const optionsAsObjects = q.options?.map(opt => ({
            id: crypto.randomUUID(),
            text: opt
        })) || [];

        setCurrentQuestion({
            ...q,
            options: optionsAsObjects.length > 0 ? optionsAsObjects : [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        });

        if (viewMode === 'control') {
            setViewMode('setup');
        }
    };

    const handleDeleteClick = (qId) => {
        setDeleteModal({ isOpen: true, questionId: qId });
    };

    const confirmDeleteQuestion = async () => {
        const qId = deleteModal.questionId;
        if (qId) {
            await deleteDoc(doc(db, 'sessions', sessionId, 'questions', qId));
            if (currentQuestion.id === qId) {
                handleAddQuestion();
            }
        }
        setDeleteModal({ isOpen: false, questionId: null });
    };

    const handleReorder = async (newQuestions) => {
        setQuestions(newQuestions); // Optimistic update

        // Update order in Firestore
        const updates = newQuestions.map((q, index) =>
            updateDoc(doc(db, 'sessions', sessionId, 'questions', q.id), { order: index })
        );
        await Promise.all(updates);
    };

    const handleUpdateSettings = async (settings) => {
        try {
            await updateDoc(doc(db, 'sessions', sessionId), settings);
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    // Auto-create first question if empty
    useEffect(() => {
        if (!isLoading && questions.length === 0 && !isCreatingRef.current) {
            isCreatingRef.current = true;
            handleAddQuestion().finally(() => {
                isCreatingRef.current = false;
            });
        }
    }, [isLoading, questions.length]);

    // Auto-save effect
    useEffect(() => {
        if (currentQuestion.id === 'new' || !currentQuestion.id) return;

        const timer = setTimeout(async () => {
            const questionData = {
                text: currentQuestion.text,
                type: currentQuestion.type,
                // Convert object options back to strings
                options: currentQuestion.type === 'choice' ? currentQuestion.options.map(o => o.text) : [],
                timer: currentQuestion.timer || null,
                color: currentQuestion.color || null,
            };

            await updateDoc(doc(db, 'sessions', sessionId, 'questions', currentQuestion.id), questionData);
        }, 1000);

        return () => clearTimeout(timer);
    }, [currentQuestion, db, sessionId]);

    const handleSaveQuestion = async () => {
        const questionData = {
            text: currentQuestion.text,
            type: currentQuestion.type,
            options: currentQuestion.type === 'choice' ? currentQuestion.options.map(o => o.text) : [],
            timer: currentQuestion.timer || null,
            color: currentQuestion.color || null,
        };
        await updateDoc(doc(db, 'sessions', sessionId, 'questions', currentQuestion.id), questionData);
    };

    const handleSendToAudience = async () => {
        if (!currentQuestion.text) return;

        const optionsToSave = currentQuestion.type === 'choice'
            ? currentQuestion.options.map(o => o.text).filter(t => t)
            : [];

        const questionData = {
            text: currentQuestion.text,
            type: currentQuestion.type,
            options: optionsToSave,
            timer: currentQuestion.timer || null,
            color: currentQuestion.color || null,
        };

        await updateDoc(doc(db, 'sessions', sessionId, 'questions', currentQuestion.id), questionData);

        await updateDoc(doc(db, 'sessions', sessionId), {
            currentQuestion: { ...questionData, id: currentQuestion.id, startTime: serverTimestamp() },
            state: 'voting'
        });

        setViewMode('control');
    };

    const handleStopQuestion = async () => {
        await updateDoc(doc(db, 'sessions', sessionId), {
            state: 'setup',
            currentQuestion: null
        });
        setViewMode('setup');
    };

    const handleEndSession = () => {
        setEndSessionModal(true);
    };

    const confirmEndSession = async () => {
        try {
            await deleteDoc(doc(db, 'sessions', sessionId));
            localStorage.removeItem('host_session_id');
            window.location.reload();
        } catch (error) {
            console.error("Error ending session:", error);
            alert("Failed to end session. Please try again.");
        }
        setEndSessionModal(false);
    };

    // Filter responses
    const currentResponses = useMemo(() => {
        if (!sessionData?.currentQuestion?.id) return [];
        return responses.filter(r => r.questionId === sessionData.currentQuestion.id);
    }, [responses, sessionData]);


    // Dark Mode State
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('host_theme');
        return saved ? saved === 'dark' : true;
    });

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const newVal = !prev;
            localStorage.setItem('host_theme', newVal ? 'dark' : 'light');
            return newVal;
        });
    };

    if (isExpired) return <ExpiredView />;
    if (!sessionData) return (
        <div className={`flex items-center justify-center h-screen transition-colors duration-300 ${darkMode ? 'bg-[#020617] text-white' : 'bg-slate-100 text-slate-800'}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="font-medium animate-pulse">Loading Session...</p>
            </div>
        </div>
    );

    const brandColor = sessionData.brandColor || '#4f46e5'; // Default indigo-600
    const isSetupMode = sessionData?.isSetup === false;
    console.log('DEBUG: HostView render', { isSetup: sessionData?.isSetup, isSetupMode, sessionData });

    return (
        <div className={`h-screen w-screen flex flex-col p-5 gap-8 overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-slate-100 text-slate-800'}`}>

            {/* Dark Mode Background Blobs */}
            {darkMode && (
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-[#581c87] rounded-full blur-[80px] opacity-50 animate-float" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-[#1e3a8a] rounded-full blur-[80px] opacity-50 animate-float" style={{ animationDelay: '-5s' }} />
                    <div className="absolute top-[40%] left-[40%] w-[40vw] h-[40vw] bg-[#be185d] rounded-full blur-[80px] opacity-30 animate-float" style={{ animationDelay: '-10s' }} />
                </div>
            )}

            {/* QR Overlay */}
            <AnimatePresence>
                {showQr && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center"
                        onClick={() => setShowQr(false)}
                    >
                        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-gray-100" onClick={e => e.stopPropagation()}>
                            <QRCode value={`${window.location.origin}?session=${sessionId}`} size={300} />
                            <p className="text-center mt-8 text-5xl font-black text-gray-900 tracking-widest">{sessionId}</p>
                            <button
                                onClick={handleCopyLink}
                                className="mt-6 flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors w-full justify-center"
                                style={{
                                    color: brandColor,
                                    backgroundColor: `color-mix(in srgb, ${brandColor}, white 90%)`
                                }}
                            >
                                {copied ? <Check size={20} /> : <Link size={20} />}
                                {copied ? 'Copied!' : 'Copy Link'}
                            </button>
                        </div>
                        <p className="mt-8 text-gray-500 font-medium">Click anywhere to close</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <SettingsModal
                isOpen={isSettingsOpen || isSetupMode}
                onClose={() => !isSetupMode && setIsSettingsOpen(false)}
                sessionName={sessionData?.name}
                brandColor={sessionData?.brandColor}
                requireName={sessionData?.requireName}
                onUpdateSettings={async (settings) => {
                    const newSettings = { ...settings };
                    if (isSetupMode) {
                        newSettings.isSetup = true;
                    }
                    await handleUpdateSettings(newSettings);
                }}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
                isSetupMode={isSetupMode}
            />

            <TopBar
                sessionId={sessionId}
                sessionName={sessionData.name}
                participantCount={currentResponses.length}
                onToggleQr={() => setShowQr(true)}
                onSendToAudience={handleSendToAudience}
                onStopQuestion={handleStopQuestion}
                onEndSession={handleEndSession}
                isLive={sessionData.state === 'voting' || sessionData.state === 'results'}
                liveQuestionId={sessionData.currentQuestion?.id}
                liveQuestion={sessionData.currentQuestion}
                currentQuestionId={currentQuestion.id}
                brandColor={brandColor}
                requireName={sessionData.requireName}
                onUpdateSettings={handleUpdateSettings}
                darkMode={darkMode}
                onToggleDarkMode={toggleDarkMode}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />

            <main className={`flex-1 grid gap-5 min-h-0 items-start z-10 relative ${viewMode === 'setup' ? 'grid-cols-[260px_1fr_260px]' : 'grid-cols-[260px_1fr]'}`}>
                {/* Left Sidebar - Question List */}
                <aside className="h-full min-h-0 flex flex-col">
                    <Sidebar
                        questions={questions}
                        currentQuestionId={currentQuestion.id}
                        liveQuestionId={sessionData.currentQuestion?.id}
                        onSelectQuestion={handleSelectQuestion}
                        onAddQuestion={handleAddQuestion}
                        onDeleteQuestion={handleDeleteClick}
                        onReorder={handleReorder}
                        darkMode={darkMode}
                    />
                </aside>

                {/* Center Area */}
                <section className="h-full min-h-0">
                    {viewMode === 'setup' ? (
                        <QuestionEditor
                            question={currentQuestion}
                            onChange={setCurrentQuestion}
                            onSave={handleSaveQuestion}
                            onDelete={() => handleDeleteClick(currentQuestion.id)}
                            brandColor={brandColor}
                            darkMode={darkMode}
                        />
                    ) : (
                        <LiveResults
                            question={sessionData.currentQuestion}
                            responses={currentResponses}
                            darkMode={darkMode}
                        />
                    )}
                </section>

                {/* Right Sidebar - Type Selector (Only in Setup) */}
                {viewMode === 'setup' && (
                    <aside className="h-full min-h-0">
                        <TypeSelector
                            currentType={currentQuestion.type}
                            onSelectType={(type) => setCurrentQuestion({ ...currentQuestion, type })}
                            darkMode={darkMode}
                        />
                    </aside>
                )}
            </main>

            <DeleteConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, questionId: null })}
                onConfirm={confirmDeleteQuestion}
            />

            <EndSessionModal
                isOpen={endSessionModal}
                onClose={() => setEndSessionModal(false)}
                onConfirm={confirmEndSession}
                darkMode={darkMode}
            />
        </div>
    );
}

function ExpiredView() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
                <p className="text-gray-600">This session has exceeded the time limit.</p>
                <Button className="mt-6 w-full" onClick={() => window.location.reload()}>Return to Home</Button>
            </Card>
        </div>
    );
}
