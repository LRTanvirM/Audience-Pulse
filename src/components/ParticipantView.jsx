import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Smartphone, Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Button from './ui/Button';
import Card from './ui/Card';
import Input from './ui/Input';

export default function ParticipantView({ db, initialSessionId }) {
    const [sessionId, setSessionId] = useState(initialSessionId || '');
    const [nickname, setNickname] = useState(localStorage.getItem('participant_name') || '');
    const [step, setStep] = useState(initialSessionId ? 'verifying' : 'join'); // join, verifying, name, participating
    const [sessionData, setSessionData] = useState(null);
    const [answer, setAnswer] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        if (step === 'join' || !sessionId) return;

        const unsub = onSnapshot(doc(db, 'sessions', sessionId), (doc) => {
            if (doc.exists()) {
                const data = doc.data();

                // Check for expiration
                const expiresAt = data.expiresAt?.toDate();
                if (expiresAt && new Date() > expiresAt) {
                    setIsExpired(true);
                }

                setSessionData(prev => {
                    if (prev?.currentQuestion?.id !== data?.currentQuestion?.id) {
                        setSubmitted(false);
                        setAnswer('');
                    }
                    return data;
                });

                // Handle step transitions based on requireName
                if (step === 'verifying') {
                    if (data.requireName) {
                        setStep('name');
                    } else {
                        setNickname('Anonymous');
                        localStorage.setItem('participant_name', 'Anonymous');
                        setStep('participating');
                    }
                }
            } else {
                toast.error("Session not found!");
                setStep('join');
            }
        });

        return () => unsub();
    }, [step, sessionId, db]);

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

    const handleJoin = () => {
        if (sessionId.length === 4) setStep('verifying');
    };

    const handleNameSubmit = () => {
        if (!nickname.trim()) return;
        localStorage.setItem('participant_name', nickname);
        setStep('participating');
    };

    const submitAnswer = async (val) => {
        const finalAnswer = val || answer;
        if (!finalAnswer) return;

        try {
            const auth = getAuth();
            await addDoc(collection(db, 'sessions', sessionId, 'responses'), {
                questionId: sessionData.currentQuestion.id,
                answer: finalAnswer,
                nickname: nickname,
                uid: auth.currentUser.uid,
                timestamp: serverTimestamp()
            });
            setSubmitted(true);
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("Failed to submit. Try again.");
        }
    };

    if (step === 'join') {
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
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                        <Button onClick={handleJoin} className="w-full" disabled={sessionId.length !== 4}>
                            Next
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (step === 'verifying') {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    if (step === 'name') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-sm w-full p-8 text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Who are you?</h2>
                    <p className="text-gray-500 mb-6">Enter your name so the host knows who's answering.</p>
                    <div className="space-y-4">
                        <Input
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Your Name"
                            className="text-center text-lg"
                        />
                        <Button onClick={handleNameSubmit} className="w-full" disabled={!nickname.trim()}>
                            Join Session
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    if (!sessionData) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    if (sessionData.state === 'ended') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-900 text-white">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-8">
                    <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Session Ended</h2>
                <p className="text-gray-400 text-lg mb-8">The host has ended this session.</p>
                <Button onClick={() => window.location.reload()} variant="secondary">
                    Back to Home
                </Button>
            </div>
        );
    }

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
        <div className="min-h-screen flex flex-col p-4 md:p-6 max-w-md mx-auto justify-center">
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
                            className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 outline-none h-40 resize-none text-base"
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
