import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    onSnapshot,
    updateDoc,
    serverTimestamp,
    addDoc,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import {
    Users,
    Play,
    BarChart2,
    CheckCircle,
    Smartphone,
    Monitor,
    ArrowRight,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    Type,
    List
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- CONFIGURATION ---
// USER MUST FILL THIS IN
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- UTILS ---
const generateSessionId = () => Math.floor(1000 + Math.random() * 9000).toString();

// --- COMPONENTS ---

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

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden ${className}`}>
        {children}
    </div>
);

const Input = ({ value, onChange, placeholder, className = '' }) => (
    <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all duration-200 bg-gray-50 focus:bg-white ${className}`}
    />
);

// --- MAIN APP ---

export default function App() {
    const [appState, setAppState] = useState('landing'); // landing, host, participant
    const [sessionId, setSessionId] = useState('');
    const [db, setDb] = useState(null);
    const [configError, setConfigError] = useState(false);

    // Initialize Firebase
    useEffect(() => {
        if (!firebaseConfig.apiKey) {
            setConfigError(true);
            return;
        }
        try {
            const app = initializeApp(firebaseConfig);
            setDb(getFirestore(app));
        } catch (err) {
            console.error("Firebase init error:", err);
            setConfigError(true);
        }
    }, []);

    // Check URL for session ID
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionParam = params.get('session');
        if (sessionParam) {
            setSessionId(sessionParam);
            setAppState('participant');
        }
    }, []);

    if (configError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Missing Configuration</h1>
                    <p className="text-gray-600 mb-6">
                        Please open <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">App.jsx</code> and fill in the <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">firebaseConfig</code> object with your project details.
                    </p>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-left text-xs font-mono overflow-x-auto">
                        <pre>{`const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "...",
  projectId: "...",
  // ...
};`}</pre>
                    </div>
                </Card>
            </div>
        );
    }

    if (!db) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {appState === 'landing' && <LandingPage setAppState={setAppState} setSessionId={setSessionId} db={db} />}
            {appState === 'host' && <HostView db={db} sessionId={sessionId} />}
            {appState === 'participant' && <ParticipantView db={db} initialSessionId={sessionId} />}
        </div>
    );
}

// --- LANDING PAGE ---

function LandingPage({ setAppState, setSessionId, db }) {
    const createSession = async () => {
        const newId = generateSessionId();
        try {
            await setDoc(doc(db, 'sessions', newId), {
                createdAt: serverTimestamp(),
                state: 'waiting',
                currentQuestion: null
            });
            setSessionId(newId);
            setAppState('host');
        } catch (err) {
            console.error("Error creating session:", err);
            alert("Failed to create session. Check console.");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
            </div>

            <div className="text-center mb-12 space-y-4">
                <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-lg mb-4">
                    <BarChart2 className="w-8 h-8 text-indigo-600" />
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-600">
                    Audience Pulse
                </h1>
                <p className="text-xl text-gray-500 max-w-lg mx-auto">
                    Real-time interactive polls and Q&A for your workshops and seminars.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                <button
                    onClick={createSession}
                    className="group relative flex flex-col items-center p-8 bg-white hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left"
                >
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Host a Session</h2>
                    <p className="text-gray-500 text-center">Create a new room, generate a QR code, and control the flow.</p>
                    <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center text-indigo-600 font-semibold">Get Started <ArrowRight className="w-4 h-4 ml-2" /></span>
                    </div>
                </button>

                <button
                    onClick={() => setAppState('participant')}
                    className="group relative flex flex-col items-center p-8 bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left"
                >
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Session</h2>
                    <p className="text-gray-500 text-center">Enter a code or scan a QR to participate in a live poll.</p>
                    <div className="absolute bottom-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center text-blue-600 font-semibold">Join Now <ArrowRight className="w-4 h-4 ml-2" /></span>
                    </div>
                </button>
            </div>
        </div>
    );
}

// --- HOST VIEW ---

function HostView({ db, sessionId }) {
    const [sessionData, setSessionData] = useState(null);
    const [responses, setResponses] = useState([]);
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState('choice'); // choice, text, reaction
    const [options, setOptions] = useState(['', '']);

    useEffect(() => {
        const unsubSession = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            setSessionData(doc.data());
        });

        const unsubResponses = onSnapshot(collection(db, 'sessions', sessionId, 'responses'), (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            setResponses(data);
        });

        return () => {
            unsubSession();
            unsubResponses();
        };
    }, [db, sessionId]);

    const startVoting = async () => {
        if (!questionText) return;
        await updateDoc(doc(db, 'sessions', sessionId), {
            currentQuestion: {
                text: questionText,
                type: questionType,
                options: questionType === 'choice' ? options.filter(o => o) : []
            },
            state: 'voting'
        });
        // Clear old responses? In a real app, maybe archive them. For now, we just show current.
        // Ideally we'd use a subcollection per question or a field to filter.
        // For this simple single-file demo, we'll just rely on the fact that we're "moving forward".
        // A better way for a persistent session is to query responses by question ID.
        // Let's add a timestamp ID to the question to filter responses.
        const questionId = Date.now().toString();
        await updateDoc(doc(db, 'sessions', sessionId), {
            'currentQuestion.id': questionId
        });
    };

    const stopVoting = async () => {
        await updateDoc(doc(db, 'sessions', sessionId), {
            state: 'results'
        });
    };

    const resetSession = async () => {
        await updateDoc(doc(db, 'sessions', sessionId), {
            state: 'waiting',
            currentQuestion: null
        });
        setQuestionText('');
        setOptions(['', '']);
    };

    // Filter responses for current question
    const currentResponses = useMemo(() => {
        if (!sessionData?.currentQuestion?.id) return [];
        return responses.filter(r => r.questionId === sessionData.currentQuestion.id);
    }, [responses, sessionData]);

    // Chart Data
    const chartData = useMemo(() => {
        if (!sessionData?.currentQuestion) return [];
        const counts = {};

        if (sessionData.currentQuestion.type === 'choice') {
            sessionData.currentQuestion.options.forEach(opt => counts[opt] = 0);
            currentResponses.forEach(r => {
                if (counts[r.answer] !== undefined) counts[r.answer]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }

        if (sessionData.currentQuestion.type === 'reaction') {
            ['👍', '❤️', '😂', '😮', '😢'].forEach(emoji => counts[emoji] = 0);
            currentResponses.forEach(r => {
                if (counts[r.answer] !== undefined) counts[r.answer]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }

        return [];
    }, [currentResponses, sessionData]);

    if (!sessionData) return <div className="p-8 text-center">Loading session...</div>;

    const sessionUrl = `${window.location.origin}${window.location.pathname}?session=${sessionId}`;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center mb-4 md:mb-0">
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mr-4">
                        <Monitor className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Session ID</h2>
                        <div className="text-3xl font-mono font-bold text-indigo-600 tracking-widest">{sessionId}</div>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                        <div className="text-sm text-gray-500">Participants</div>
                        <div className="text-xl font-bold text-gray-900 flex items-center justify-end">
                            <Users className="w-4 h-4 mr-2 text-gray-400" />
                            {currentResponses.length}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {/* QR Code Card */}
                    <Card className="p-6 flex flex-col items-center text-center">
                        <div className="bg-white p-2 rounded-xl border-2 border-gray-100 mb-4">
                            <QRCode value={sessionUrl} size={180} />
                        </div>
                        <p className="text-sm text-gray-500 font-medium break-all">{sessionUrl}</p>
                        <p className="text-xs text-gray-400 mt-2">Scan to join</p>
                    </Card>

                    {/* Control Panel */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Play className="w-5 h-5 mr-2 text-indigo-500" /> Control Panel
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                                <Input
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    placeholder="What would you like to ask?"
                                    className="text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'choice', icon: List, label: 'Choice' },
                                        { id: 'text', icon: Type, label: 'Text' },
                                        { id: 'reaction', icon: ImageIcon, label: 'React' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            onClick={() => setQuestionType(type.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${questionType === type.id
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                : 'border-gray-100 hover:border-gray-200 text-gray-500'
                                                }`}
                                        >
                                            <type.icon className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-medium">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {questionType === 'choice' && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Options</label>
                                    {options.map((opt, idx) => (
                                        <Input
                                            key={idx}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[idx] = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            placeholder={`Option ${idx + 1}`}
                                            className="py-2 text-sm"
                                        />
                                    ))}
                                    <div className="flex space-x-2">
                                        <button onClick={() => setOptions([...options, ''])} className="text-xs text-indigo-600 font-medium hover:underline">+ Add Option</button>
                                        {options.length > 2 && (
                                            <button onClick={() => setOptions(options.slice(0, -1))} className="text-xs text-red-500 font-medium hover:underline">- Remove</button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                {sessionData.state === 'waiting' || sessionData.state === 'results' ? (
                                    <Button onClick={startVoting} className="w-full" disabled={!questionText}>
                                        Start Voting
                                    </Button>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button onClick={stopVoting} variant="secondary">Reveal Results</Button>
                                        <Button onClick={resetSession} variant="ghost" className="text-red-500 hover:bg-red-50">Reset</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Live View */}
                <div className="lg:col-span-2">
                    <Card className="h-full min-h-[500px] p-8 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Live Results</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${sessionData.state === 'voting' ? 'bg-green-100 text-green-700 animate-pulse' :
                                sessionData.state === 'results' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {sessionData.state === 'voting' ? 'Live Voting' : sessionData.state === 'results' ? 'Results Final' : 'Waiting'}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            {!sessionData.currentQuestion ? (
                                <div className="text-center text-gray-400">
                                    <BarChart2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Waiting for a question to be launched...</p>
                                </div>
                            ) : (
                                <div className="w-full h-full">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{sessionData.currentQuestion.text}</h2>

                                    {sessionData.currentQuestion.type === 'text' ? (
                                        <div className="grid gap-4 max-h-[400px] overflow-y-auto">
                                            {currentResponses.map((r, i) => (
                                                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 animate-in fade-in slide-in-from-bottom-2">
                                                    {r.answer}
                                                </div>
                                            ))}
                                            {currentResponses.length === 0 && <p className="text-center text-gray-400 italic">No responses yet...</p>}
                                        </div>
                                    ) : (
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#10b981'][index % 4]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// --- PARTICIPANT VIEW ---

function ParticipantView({ db, initialSessionId }) {
    const [sessionId, setSessionId] = useState(initialSessionId || '');
    const [joined, setJoined] = useState(!!initialSessionId);
    const [sessionData, setSessionData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (!joined || !sessionId) return;

        const unsub = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                // If question ID changed, reset submission state
                setSessionData(prev => {
                    if (prev?.currentQuestion?.id !== data?.currentQuestion?.id) {
                        setSubmitted(false);
                        setAnswer('');
                    }
                    return data;
                });
            } else {
                alert("Session not found!");
                setJoined(false);
            }
        });

        return () => unsub();
    }, [joined, sessionId, db]);

    const joinSession = () => {
        if (sessionId.length === 4) setJoined(true);
    };

    const submitAnswer = async (val) => {
        const finalAnswer = val || answer;
        if (!finalAnswer) return;

        try {
            await addDoc(collection(db, 'sessions', sessionId, 'responses'), {
                questionId: sessionData.currentQuestion.id,
                answer: finalAnswer,
                timestamp: serverTimestamp()
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit. Try again.");
        }
    };

    if (!joined) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-sm w-full p-8 text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Smartphone className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Session</h2>
                    <p className="text-gray-500 mb-6">Enter the 4-digit code displayed on the host screen.</p>
                    <div className="space-y-4">
                        <Input
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            placeholder="1234"
                            className="text-center text-2xl tracking-[0.5em] font-mono uppercase"
                            maxLength={4}
                        />
                        <Button onClick={joinSession} className="w-full" disabled={sessionId.length !== 4}>
                            Join Now
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!sessionData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    if (sessionData.state === 'waiting' || !sessionData.currentQuestion) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-indigo-600 text-white">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <Users className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4">You're in!</h2>
                <p className="text-indigo-200 text-lg max-w-xs mx-auto">Waiting for the host to start the next question...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-emerald-500 text-white">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-lg transform scale-110 transition-transform">
                    <CheckCircle className="w-12 h-12 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Answer Sent!</h2>
                <p className="text-emerald-100 text-lg">Sit back and watch the results.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-6 max-w-md mx-auto justify-center">
            <div className="mb-8">
                <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
                    Live Question
                </span>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{sessionData.currentQuestion.text}</h2>
            </div>

            <div className="space-y-4">
                {sessionData.currentQuestion.type === 'choice' && (
                    <div className="grid gap-3">
                        {sessionData.currentQuestion.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => submitAnswer(opt)}
                                className="w-full p-4 text-left bg-white border-2 border-gray-100 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 font-medium text-gray-700 shadow-sm active:scale-95"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {sessionData.currentQuestion.type === 'text' && (
                    <div className="space-y-4">
                        <textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none h-40 resize-none"
                        />
                        <Button onClick={() => submitAnswer()} className="w-full" disabled={!answer}>
                            Submit Answer
                        </Button>
                    </div>
                )}

                {sessionData.currentQuestion.type === 'reaction' && (
                    <div className="grid grid-cols-3 gap-4">
                        {['👍', '❤️', '😂', '😮', '😢'].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => submitAnswer(emoji)}
                                className="aspect-square flex items-center justify-center text-4xl bg-white rounded-2xl shadow-sm border-2 border-gray-100 hover:border-indigo-500 hover:scale-110 transition-all duration-200"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
