import React from 'react';
import { BarChart2, Monitor, ArrowRight, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { generateSessionId } from '../utils';

export default function LandingPage({ setAppState, setSessionId, db }) {
    const [savedSessionId, setSavedSessionId] = React.useState(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('host_session_id');
        if (saved) {
            setSavedSessionId(saved);
        }
    }, []);

    const createSession = async () => {
        const newId = generateSessionId();
        try {
            // Set expiration to 6 hours from now
            const expireAtDate = new Date();
            expireAtDate.setHours(expireAtDate.getHours() + 6);

            await setDoc(doc(db, 'sessions', newId), {
                createdAt: serverTimestamp(),
                expireAt: Timestamp.fromDate(expireAtDate),
                state: 'waiting',
                currentQuestion: null,
                requireName: false
            });
            localStorage.setItem('host_session_id', newId);
            setSessionId(newId);
            setAppState('host');
        } catch (err) {
            console.error("Error creating session:", err);
            toast.error("Failed to create session. Check console.");
        }
    };

    const rejoinSession = () => {
        if (savedSessionId) {
            setSessionId(savedSessionId);
            setAppState('host');
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

                {savedSessionId && (
                    <div className="pt-4 animate-in fade-in slide-in-from-top-4">
                        <button
                            onClick={rejoinSession}
                            className="inline-flex items-center px-6 py-3 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 font-semibold shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all"
                        >
                            Rejoin Session {savedSessionId} <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                <button
                    onClick={createSession}
                    className="group relative flex flex-col items-center p-8 bg-white hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left h-full"
                >
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Host a Session</h2>
                    <p className="text-gray-500 text-center mb-8">Create a new room, generate a QR code, and control the flow.</p>
                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center text-indigo-600 font-semibold">Get Started <ArrowRight className="w-4 h-4 ml-2" /></span>
                    </div>
                </button>

                <button
                    onClick={() => setAppState('participant')}
                    className="group relative flex flex-col items-center p-8 bg-white hover:bg-blue-50 border-2 border-transparent hover:border-blue-200 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-left h-full"
                >
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                        <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Session</h2>
                    <p className="text-gray-500 text-center mb-8">Enter a code or scan a QR to participate in a live poll.</p>
                    <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="flex items-center text-blue-600 font-semibold">Join Now <ArrowRight className="w-4 h-4 ml-2" /></span>
                    </div>
                </button>
            </div>
        </div>
    );
}
