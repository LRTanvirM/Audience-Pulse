import React, { useRef, useEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';
import { Reorder, useDragControls, AnimatePresence } from 'framer-motion';

const SidebarItem = ({ q, idx, isActive, isLive, onSelect, onDelete, containerRef, darkMode }) => {
    const dragControls = useDragControls();

    return (
        <Reorder.Item
            value={q}
            id={q.id}

            // Force hardware acceleration
            style={{
                transform: "translateZ(0)",
                position: 'relative'
            }}

            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}

            // Rigid Drag Config
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={containerRef}
            dragElastic={0}
            dragMomentum={false}

            // Snappy Sorting Animation
            transition={{
                type: "spring",
                stiffness: 600,
                damping: 40
            }}

            whileDrag={{
                scale: 1.02,
                backgroundColor: darkMode ? "rgba(30, 41, 59, 1)" : "rgba(255, 255, 255, 1)",
                boxShadow: "0px 10px 20px rgba(0,0,0,0.15)",
                zIndex: 100
            }}

            className={`group relative p-4 rounded-xl mb-3 flex items-center gap-3 select-none transition-all border ${isActive
                ? (darkMode ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.5)]' : 'bg-white border-indigo-500 shadow-[0_0_0_2px_rgba(224,231,255,1)]') // Active
                : (darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300') // Inactive
                } ${isLive ? (darkMode ? 'bg-green-500/10 border-green-500/30' : 'bg-green-50 border-green-200') : ''}`} // Live

            onClick={() => onSelect(q)}
        >
            {/* DRAG HANDLE */}
            <div
                onPointerDown={(e) => dragControls.start(e)}
                className={`transition-colors cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md touch-none ${darkMode ? 'text-slate-500 group-hover:text-slate-300 hover:bg-white/10' : 'text-slate-300 group-hover:text-slate-500 hover:bg-slate-100'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={18} />
            </div>

            <div className="flex-1 min-w-0 pointer-events-none">
                <div className={`text-sm font-bold mb-0.5 line-clamp-1 ${isActive ? (darkMode ? 'text-indigo-300' : 'text-indigo-600') : (darkMode ? 'text-slate-200' : 'text-slate-700')}`}>
                    {q.text || 'New Question'}
                    {isLive && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                </div>
                <div className={`text-xs font-medium capitalize ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{q.type}</div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(q.id);
                }}
                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
            >
                <X size={16} />
            </button>
        </Reorder.Item>
    );
};

export default function Sidebar({ questions, currentQuestionId, liveQuestionId, onSelectQuestion, onAddQuestion, onDeleteQuestion, onReorder, darkMode }) {
    const containerRef = useRef(null);
    const [isHovered, setIsHovered] = React.useState(false);

    // ROBUST AUTO-SELECT FIX
    useEffect(() => {
        if (questions && questions.length > 0) {
            if (!currentQuestionId) {
                onSelectQuestion(questions[0]);
            }
            else {
                const exists = questions.some(q => q.id === currentQuestionId);
                if (!exists) {
                    onSelectQuestion(questions[0]);
                }
            }
        }
    }, [questions, currentQuestionId, onSelectQuestion]);

    return (
        <div className={`rounded-2xl p-5 h-full flex flex-col shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Questions</h2>

            <div
                className="flex-1 overflow-y-auto custom-scrollbar pr-1"
                ref={containerRef}
            >
                <Reorder.Group
                    axis="y"
                    values={questions}
                    onReorder={onReorder}
                    className="list-none"
                    layoutScroll
                >
                    <AnimatePresence initial={false} mode="popLayout">
                        {questions.map((q, idx) => (
                            <SidebarItem
                                key={q.id}
                                q={q}
                                idx={idx}
                                containerRef={containerRef}
                                isActive={currentQuestionId === q.id}
                                isLive={liveQuestionId === q.id}
                                onSelect={onSelectQuestion}
                                onDelete={onDeleteQuestion}
                                darkMode={darkMode}
                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>
            </div>

            <button
                onClick={onAddQuestion}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`w-full py-3 px-4 bg-transparent border-2 border-dashed rounded-xl font-semibold transition-all mt-4 flex items-center justify-center gap-2 ${darkMode ? 'border-white/10 text-slate-500 hover:border-indigo-500/50 hover:text-indigo-300 hover:bg-indigo-500/10' : 'border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
                <Plus size={18} />
                Add Question
            </button>
        </div>
    );
}