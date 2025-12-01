import React from 'react';
import { BarChart2, Monitor, ArrowRight, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { doc, setDoc, deleteDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { generateSessionId } from '../utils';
import NebulaBackground from './ui/NebulaBackground';

export default function LandingPage({ setAppState, setSessionId, db }) {
    const [savedSessionId, setSavedSessionId] = React.useState(null);

    React.useEffect(() => {
        const saved = localStorage.getItem('host_session_id');
        if (saved) {
            setSavedSessionId(saved);
        }
    }, []);

    const createSession = async () => {
        // Cleanup previous session if exists
        const oldSessionId = localStorage.getItem('host_session_id');
        if (oldSessionId) {
            try {
                await deleteDoc(doc(db, 'sessions', oldSessionId));
            } catch (e) {
                console.warn("Could not delete old session (might already be gone):", e);
            }
        }

        const newId = generateSessionId();
        try {
            // Set expiration to 6 hours from now
            const expireAtDate = new Date();
            expireAtDate.setHours(expireAtDate.getHours() + 6);

            const auth = getAuth();
            await setDoc(doc(db, 'sessions', newId), {
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expireAtDate),
                hostId: auth.currentUser.uid,
                state: 'waiting',
                currentQuestion: null,
                requireName: false,
                isSetup: false
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
        <NebulaBackground>
            <div className="h-[100dvh] w-full flex flex-col items-center justify-between p-4 py-6 md:py-8 overflow-hidden">

                <div className="flex-1 flex flex-col items-center justify-center text-center w-full relative z-10 px-4 min-h-0">
                    <div className="inline-flex items-center justify-center p-3 md:p-4 bg-white/5 rounded-2xl shadow-2xl mb-4 md:mb-6 backdrop-blur-sm border border-white/10 animate-in fade-in zoom-in duration-700 shrink-0">
                        <BarChart2 className="w-8 h-8 md:w-12 md:h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-2 md:mb-4 drop-shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 shrink-0">
                        Audience Pulse
                    </h1>
                    <p className="text-sm sm:text-base md:text-xl lg:text-2xl text-blue-100/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 shrink-0">
                        Real-time interactive polls and Q&A for your workshops and seminars.
                    </p>

                    {savedSessionId && (
                        <div className="mt-6 md:mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 shrink-0">
                            <button
                                onClick={rejoinSession}
                                className="group inline-flex items-center px-6 py-3 md:px-8 md:py-4 rounded-full bg-white text-indigo-900 font-bold shadow-[0_0_40px_-10px_rgba(255,255,255,0.6)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.8)] hover:scale-105 transition-all duration-300 text-sm md:text-base"
                            >
                                Rejoin Session {savedSessionId}
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl px-4 shrink-0 mt-4 md:mt-0">
                    <button
                        onClick={createSession}
                        className="group relative flex flex-col items-center p-4 sm:p-6 md:p-8 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-[24px] md:rounded-[32px] shadow-2xl transition-all duration-300 text-center h-full hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 md:w-20 md:h-20 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300 border border-indigo-500/30 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]">
                            <Monitor className="w-6 h-6 md:w-10 md:h-10 text-indigo-300" />
                        </div>
                        <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-3">Host a Session</h2>
                        <p className="text-blue-100/60 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed hidden sm:block">Create a new room, generate a QR code, and control the flow.</p>
                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
                            <span className="inline-flex items-center text-white font-bold bg-white/10 px-5 py-2 md:px-6 md:py-2 rounded-full border border-white/10 text-sm md:text-base">
                                Get Started <ArrowRight className="w-4 h-4 ml-2" />
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => setAppState('participant')}
                        className="group relative flex flex-col items-center p-4 sm:p-6 md:p-8 bg-slate-900/30 hover:bg-slate-900/50 backdrop-blur-xl border border-white/10 hover:border-white/30 rounded-[24px] md:rounded-[32px] shadow-2xl transition-all duration-300 text-center h-full hover:-translate-y-1"
                    >
                        <div className="w-12 h-12 md:w-20 md:h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300 border border-blue-500/30 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]">
                            <Smartphone className="w-6 h-6 md:w-10 md:h-10 text-blue-300" />
                        </div>
                        <h2 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-3">Join Session</h2>
                        <p className="text-blue-100/60 text-sm md:text-lg mb-4 md:mb-8 leading-relaxed hidden sm:block">Enter a code or scan a QR to participate in a live poll.</p>
                        <div className="mt-auto opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
                            <span className="inline-flex items-center text-white font-bold bg-white/10 px-5 py-2 md:px-6 md:py-2 rounded-full border border-white/10 text-sm md:text-base">
                                Join Now <ArrowRight className="w-4 h-4 ml-2" />
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </NebulaBackground>
    );
}
