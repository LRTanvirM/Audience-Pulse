import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import { Toaster } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import LandingPage from './components/LandingPage';
import HostView from './components/HostView';
import ParticipantView from './components/ParticipantView';
import Card from './components/ui/Card';

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

// --- MAIN APP ---

export default function App() {
    const [appState, setAppState] = useState('landing'); // landing, host, participant
    const [sessionId, setSessionId] = useState('');
    const [db, setDb] = useState(null);
    const [configError, setConfigError] = useState(false);
    const [authError, setAuthError] = useState(null);

    // Initialize Firebase
    useEffect(() => {
        if (!firebaseConfig.apiKey) {
            setConfigError(true);
            return;
        }
        try {
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);

            // Sign in anonymously
            signInAnonymously(auth).catch((error) => {
                console.error("Auth Error:", error);
                setAuthError(error.message);
            });

            // Wait for auth state
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setDb(getFirestore(app));
                }
            });

            return () => unsubscribe();
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
                </Card>
            </div>
        );
    }

    if (authError) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
                    <p className="text-gray-600 mb-4">
                        Could not sign in to Firebase.
                    </p>
                    <div className="bg-red-50 p-4 rounded-lg text-left text-xs font-mono text-red-800 overflow-x-auto mb-6">
                        {authError}
                    </div>
                    <p className="text-sm text-gray-500">
                        <strong>Tip:</strong> Ensure "Anonymous" sign-in is enabled in your Firebase Console (Authentication &gt; Sign-in method).
                    </p>
                </Card>
            </div>
        );
    }

    if (!db) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <Toaster position="top-center" richColors />
            <AnimatePresence mode="wait">
                {appState === 'landing' && (
                    <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
                        <LandingPage setAppState={setAppState} setSessionId={setSessionId} db={db} />
                    </motion.div>
                )}
                {appState === 'host' && (
                    <motion.div key="host" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
                        <HostView db={db} sessionId={sessionId} />
                    </motion.div>
                )}
                {appState === 'participant' && (
                    <motion.div key="participant" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }} className="w-full">
                        <ParticipantView db={db} initialSessionId={sessionId} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
