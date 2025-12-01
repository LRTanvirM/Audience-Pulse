import React from 'react';
import { Plus, Trash2, Timer, Palette, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'framer-motion';

const DraggableOption = ({ opt, idx, onChange, onRemove, isFocus, darkMode }) => {
    const dragControls = useDragControls();
    return (
        <Reorder.Item
            value={opt}
            id={opt.id}
            dragListener={false}
            dragControls={dragControls}
            className={`group flex items-center gap-3 p-1.5 pr-3 rounded-xl border shadow-sm hover:shadow-md transition-all focus-within:ring-4 ${darkMode ? 'bg-slate-900/50 border-white/10 hover:border-white/20 focus-within:border-indigo-500/50 focus-within:ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-indigo-500/10'}`}
        >
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className={`p-2 cursor-grab active:cursor-grabbing touch-none ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-300 hover:text-slate-500'}`}
            >
                <GripVertical size={18} />
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm select-none ${darkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {String.fromCharCode(65 + idx)}
            </div>
            <input
                type="text"
                value={opt.text}
                onChange={(e) => onChange(idx, e.target.value)}
                className={`flex-1 border-none outline-none font-medium bg-transparent py-2 ${darkMode ? 'text-white placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-300'}`}
                placeholder={`Option ${idx + 1}`}
                autoFocus={isFocus}
            />
            <button
                onClick={() => onRemove(idx)}
                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
            >
                <Trash2 size={16} />
            </button>
        </Reorder.Item>
    );
};

export default function QuestionEditor({ question, onChange, onSave, onDelete, brandColor, darkMode }) {
    const [activePopover, setActivePopover] = React.useState(null); // 'timer' | 'color' | null

    if (!question) return <div className={`flex items-center justify-center h-full font-medium ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>Select or add a question</div>;

    const handleTextChange = (e) => {
        onChange({ ...question, text: e.target.value });
    };

    const handleOptionChange = (idx, val) => {
        const newOptions = [...question.options];
        newOptions[idx] = { ...newOptions[idx], text: val };
        onChange({ ...question, options: newOptions });
    };

    const addOption = () => {
        if (question.options.length < 10) {
            onChange({
                ...question,
                options: [...question.options, { id: crypto.randomUUID(), text: '' }]
            });
        }
    };

    const removeOption = (idx) => {
        const newOptions = question.options.filter((_, i) => i !== idx);
        onChange({ ...question, options: newOptions });
    };

    const handleReorderOptions = (newOptions) => {
        onChange({ ...question, options: newOptions });
    };



    const timerOptions = [
        { value: 'none', label: 'No Timer' },
        { value: '10', label: '10 Seconds' },
        { value: '30', label: '30 Seconds' },
        { value: '60', label: '1 Minute' },
        { value: '120', label: '2 Minutes' },
    ];

    const currentTimerLabel = timerOptions.find(t => t.value === (question.timer || 'none'))?.label || 'No Timer';

    return (
        <div className={`rounded-2xl shadow-sm border h-full flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8" onClick={() => setActivePopover(null)}>

                {/* Settings Toolbar (Moved to Top) */}
                <div className="flex gap-4 mb-6 justify-center">
                    {/* Timer Setting */}
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setActivePopover(activePopover === 'timer' ? null : 'timer');
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors ${darkMode ? 'bg-white/5 hover:bg-white/10 text-slate-300' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'}`}
                        >
                            <Timer size={16} />
                            <span>{currentTimerLabel}</span>
                        </button>

                        {activePopover === 'timer' && (
                            <div className={`absolute top-full left-0 mt-2 rounded-xl shadow-xl border overflow-hidden z-50 min-w-[160px] py-1 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                                {timerOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => {
                                            onChange({ ...question, timer: opt.value });
                                            setActivePopover(null);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm font-medium ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'} ${(question.timer || 'none') === opt.value ? (darkMode ? 'text-indigo-400 bg-indigo-500/10' : 'text-indigo-600 bg-indigo-50') : (darkMode ? 'text-slate-400' : 'text-slate-600')}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>


                </div>

                {/* Question Title Input (Moved Below Settings) */}
                <div className={`p-4 rounded-xl border mb-8 transition-all focus-within:border-indigo-500 focus-within:bg-indigo-500/5 ${darkMode ? 'bg-slate-900/50 border-white/10' : 'bg-slate-50 border-transparent'}`}>
                    <input
                        type="text"
                        value={question.text || ''}
                        onChange={handleTextChange}
                        placeholder="Type your question here..."
                        className={`w-full text-2xl font-bold border-none outline-none bg-transparent ${darkMode ? 'text-white placeholder:text-slate-600' : 'text-slate-800 placeholder:text-slate-300'}`}
                    />
                </div>

                {/* Options List */}
                {question.type === 'choice' && (
                    <div className="flex flex-col gap-4 mb-6">
                        <Reorder.Group axis="y" values={question.options} onReorder={handleReorderOptions} className="flex flex-col gap-4">
                            {question.options?.map((opt, idx) => (
                                <DraggableOption
                                    key={opt.id}
                                    opt={opt}
                                    idx={idx}
                                    onChange={handleOptionChange}
                                    onRemove={removeOption}
                                    darkMode={darkMode}
                                />
                            ))}
                        </Reorder.Group>

                        {question.options.length < 10 && (
                            <button
                                onClick={addOption}
                                className={`w-full py-3 border-2 border-dashed rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${darkMode ? 'border-white/10 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/10' : 'border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                            >
                                <Plus size={18} />
                                Add Option
                            </button>
                        )}
                    </div>
                )}

                {question.type === 'text' && (
                    <div className={`w-full p-8 rounded-2xl border-2 border-dashed text-center font-medium ${darkMode ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                        Participants will type their answer here...
                    </div>
                )}

                {question.type === 'reaction' && (
                    <div className="flex gap-4 justify-center py-8 opacity-50 grayscale">
                        <span className="text-5xl">👍</span>
                        <span className="text-5xl">❤️</span>
                        <span className="text-5xl">😂</span>
                        <span className="text-5xl">😮</span>
                        <span className="text-5xl">😢</span>
                    </div>
                )}

                {/* Save Button Area */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={onSave}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all active:scale-95 active:translate-y-0"
                        style={{ backgroundColor: brandColor }}
                    >
                        Save Question
                    </button>
                </div>

            </div>
        </div>
    );
}
