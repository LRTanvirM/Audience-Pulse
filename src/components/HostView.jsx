import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, collection, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { Monitor, Users, Play, List, Type, Image as ImageIcon, BarChart2, AlertCircle } from 'lucide-react';
import QRCode from 'react-qr-code';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

export default function HostView({ db, sessionId }) {
    const [sessionData, setSessionData] = useState(null);
    const [responses, setResponses] = useState([]);
    const [questionText, setQuestionText] = useState('');
    const [questionType, setQuestionType] = useState('choice'); // choice, text, reaction
    const [options, setOptions] = useState([{ id: '1', value: '' }, { id: '2', value: '' }]);
    const [questions, setQuestions] = useState([]);

    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const unsubSession = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            const data = doc.data();
            if (data) {
                // Check for expiration (6 hours)
                const createdAt = data.createdAt?.toDate();
                if (createdAt) {
                    const now = new Date();
                    const diffHours = (now - createdAt) / (1000 * 60 * 60);
                    if (diffHours >= 6) {
                        setIsExpired(true);
                    }
                }
                setSessionData(data);
            }
        });

        const unsubResponses = onSnapshot(collection(db, 'sessions', sessionId, 'responses'), (snapshot) => {
            const data = snapshot.docs.map(d => d.data());
            setResponses(data);
        });

        const qQuery = query(collection(db, 'sessions', sessionId, 'questions'), orderBy('createdAt', 'desc'));
        const unsubQuestions = onSnapshot(qQuery, (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setQuestions(data);
        });

        return () => {
            unsubSession();
            unsubResponses();
            unsubQuestions();
        };
    }, [db, sessionId]);

    if (isExpired) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
                    <p className="text-gray-600">
                        This session has exceeded the 6-hour time limit and is no longer active.
                    </p>
                    <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
                        Return to Home
                    </Button>
                </Card>
            </div>
        );
    }

    const startVoting = async () => {
        if (!questionText) return;

        const questionData = {
            text: questionText,
            type: questionType,
            options: questionType === 'choice' ? options.map(o => o.value).filter(o => o) : [],
            createdAt: serverTimestamp()
        };

        // 1. Add to history
        const qRef = await addDoc(collection(db, 'sessions', sessionId, 'questions'), questionData);

        // 2. Set as current
        await updateDoc(doc(db, 'sessions', sessionId), {
            currentQuestion: { ...questionData, id: qRef.id },
            state: 'voting'
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
        setOptions([{ id: '1', value: '' }, { id: '2', value: '' }]);
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
                    <div className="flex items-center space-x-2 mr-4">
                        <label className="text-sm text-gray-500 font-medium">Require Names</label>
                        <button
                            onClick={() => updateDoc(doc(db, 'sessions', sessionId), { requireName: !sessionData.requireName })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${sessionData.requireName ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${sessionData.requireName ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 border border-red-100"
                        onClick={async () => {
                            if (confirm("End session? This will disconnect all participants.")) {
                                await updateDoc(doc(db, 'sessions', sessionId), { state: 'ended' });
                                window.location.reload();
                            }
                        }}
                    >
                        End Session
                    </Button>
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
                                            key={opt.id}
                                            value={opt.value}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[idx].value = e.target.value;
                                                setOptions(newOpts);
                                            }}
                                            placeholder={`Option ${idx + 1}`}
                                            className="py-2 text-sm"
                                        />
                                    ))}
                                    <div className="flex space-x-2">
                                        <button onClick={() => setOptions([...options, { id: Date.now().toString(), value: '' }])} className="text-xs text-indigo-600 font-medium hover:underline">+ Add Option</button>
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

                    {/* History Panel */}
                    <Card className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <List className="w-5 h-5 mr-2 text-indigo-500" /> History
                        </h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {questions.length === 0 && <p className="text-sm text-gray-400 italic">No questions yet.</p>}
                            {questions.map((q) => (
                                <div key={q.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors cursor-pointer">
                                    <div className="text-sm font-medium text-gray-900 line-clamp-2">{q.text}</div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-gray-500 uppercase font-bold">{q.type}</span>
                                        <span className="text-xs text-gray-400">{q.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))}
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
                                                    <div className="text-xs text-gray-500 font-bold mb-1">{r.nickname || 'Anonymous'}</div>
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
