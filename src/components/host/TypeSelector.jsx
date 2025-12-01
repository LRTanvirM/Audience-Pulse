import React from 'react';
import { ListChecks, Type, Smile, BarChart2, MoreHorizontal } from 'lucide-react';

export default function TypeSelector({ currentType, onSelectType, darkMode }) {
    const types = [
        { id: 'choice', label: 'Choice', icon: ListChecks },
        { id: 'text', label: 'Text', icon: Type },
        { id: 'reaction', label: 'Reaction', icon: Smile },
        { id: 'poll', label: 'Poll', icon: BarChart2 },
        { id: 'more', label: 'More...', icon: MoreHorizontal },
    ];

    return (
        <div className={`rounded-2xl p-5 h-full flex flex-col shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Question Type</h3>

            <div className="flex flex-col gap-2">
                {types.map(type => {
                    const Icon = type.icon;
                    const isActive = currentType === type.id;

                    return (
                        <button
                            key={type.id}
                            onClick={() => onSelectType(type.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${isActive
                                ? (darkMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25')
                                : (darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800')
                                }`}
                        >
                            <Icon size={20} />
                            <span>{type.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
