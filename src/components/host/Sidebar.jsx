import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Plus, X, GripVertical } from 'lucide-react';

const SidebarItem = ({ q, isActive, isLive, onSelect, onDelete, darkMode, onMouseDown, isDragging, isSpacer, style }) => {
    if (isSpacer) {
        return (
            <div
                className="mb-3 rounded-xl border-2 border-dashed transition-all duration-200"
                style={{
                    height: style?.height || '72px',
                    borderColor: darkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.3)',
                    backgroundColor: darkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.05)',
                }}
            />
        );
    }

    return (
        <div
            className={`group relative p-4 rounded-xl mb-3 flex items-center gap-3 select-none border transition-colors overflow-hidden ${isLive
                ? (darkMode ? 'bg-green-600 border-green-500 shadow-lg shadow-green-900/20' : 'bg-green-500 border-green-400 shadow-lg shadow-green-500/20')
                : isActive
                    ? (darkMode ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_0_1px_rgba(99,102,241,0.5)]' : 'bg-white border-indigo-500 shadow-[0_0_0_2px_rgba(224,231,255,1)]')
                    : (darkMode ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300')
                }`}
            style={style}
            onClick={() => !isDragging && onSelect(q)}
        >
            {/* DRAG HANDLE */}
            <div
                onMouseDown={(e) => onMouseDown(e, q)}
                className={`cursor-grab active:cursor-grabbing p-1 -ml-1 rounded-md touch-none ${isLive
                    ? 'text-green-100 hover:bg-white/20'
                    : darkMode ? 'text-slate-500 group-hover:text-slate-300 hover:bg-white/10' : 'text-slate-300 group-hover:text-slate-500 hover:bg-slate-100'
                    }`}
            >
                <GripVertical size={18} />
            </div>

            <div className="flex-1 min-w-0 pointer-events-none pr-3">
                <div className={`text-sm font-bold mb-0.5 line-clamp-1 ${isLive
                    ? 'text-white'
                    : isActive ? (darkMode ? 'text-indigo-300' : 'text-indigo-600') : (darkMode ? 'text-slate-200' : 'text-slate-700')
                    }`}>
                    {q.text || 'New Question'}
                </div>
                <div className={`text-xs font-medium capitalize ${isLive
                    ? 'text-green-100'
                    : darkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}>{q.type}</div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(q.id);
                }}
                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${isLive
                    ? 'text-green-100 hover:text-white hover:bg-white/20'
                    : darkMode ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                    }`}
            >
                <X size={16} />
            </button>
        </div>
    );
};

export default function Sidebar({ questions, currentQuestionId, liveQuestionId, onSelectQuestion, onAddQuestion, onDeleteQuestion, onReorder, darkMode }) {
    const containerRef = useRef(null);
    const ghostRef = useRef(null); // Ref for the ghost item
    const [isHovered, setIsHovered] = useState(false);

    // Dragging State
    const [draggingId, setDraggingId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 }); // Use Ref to avoid stale closures in event listeners
    const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });
    const [correction, setCorrection] = useState({ x: 0, y: 0 }); // Auto-calculated offset correction

    const [spacerIndex, setSpacerIndex] = useState(null);
    const spacerIndexRef = useRef(null); // Ref to track spacer index for event listeners (avoids stale state)

    const [draggedItemHeight, setDraggedItemHeight] = useState(0);
    const [draggedItemWidth, setDraggedItemWidth] = useState(0);

    // Refs for calculating positions
    const itemsRef = useRef(new Map());
    const questionsRef = useRef(questions); // Ref to access latest questions in event listeners

    // Update questions ref whenever questions change
    useEffect(() => {
        questionsRef.current = questions;
    }, [questions]);

    // Auto-select logic
    useEffect(() => {
        if (questions && questions.length > 0) {
            if (!currentQuestionId) {
                onSelectQuestion(questions[0]);
            } else {
                const exists = questions.some(q => q.id === currentQuestionId);
                if (!exists) {
                    onSelectQuestion(questions[0]);
                }
            }
        }
    }, [questions, currentQuestionId, onSelectQuestion]);

    // Cursor style management
    useEffect(() => {
        if (draggingId) {
            document.body.style.cursor = 'grabbing';
        } else {
            document.body.style.cursor = '';
            setCorrection({ x: 0, y: 0 }); // Reset correction
        }
        return () => {
            document.body.style.cursor = '';
        };
    }, [draggingId]);

    // Measure and correct offset automatically
    // This handles cases where the sidebar is a containing block (due to backdrop-filter)
    // causing position: fixed to be relative to the sidebar instead of the viewport.
    useLayoutEffect(() => {
        if (draggingId && ghostRef.current) {
            const ghostRect = ghostRef.current.getBoundingClientRect();
            const targetY = ghostPos.y;
            const targetX = ghostPos.x;

            // Calculate the difference between where we wanted it (target) and where it ended up (ghostRect)
            const diffY = targetY - ghostRect.top;
            const diffX = targetX - ghostRect.left;

            // Only update if there is a significant difference to avoid loops
            if (Math.abs(diffY) > 1 || Math.abs(diffX) > 1) {
                setCorrection(prev => ({
                    x: prev.x + diffX,
                    y: prev.y + diffY
                }));
            }
        }
    }, [draggingId, ghostPos]); // Run when ghostPos changes to ensure we stay corrected

    // --- DRAG HANDLERS ---

    const handleMouseDown = (e, question) => {
        e.preventDefault(); // Prevent text selection
        e.stopPropagation();

        const itemNode = itemsRef.current.get(question.id);
        if (!itemNode) return;

        const rect = itemNode.getBoundingClientRect();

        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        setDraggingId(question.id);
        dragOffset.current = { x: offsetX, y: offsetY }; // Update ref

        // Set initial target position to current viewport position
        setGhostPos({ x: rect.left, y: rect.top });

        setDraggedItemHeight(rect.height);
        setDraggedItemWidth(rect.width);

        // Initial spacer index is the current index of the item
        const currentIndex = questions.findIndex(q => q.id === question.id);
        setSpacerIndex(currentIndex);
        spacerIndexRef.current = currentIndex; // Sync ref

        // Add global listeners
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        // Update Ghost Position (Target Viewport Coordinates)
        setGhostPos(prev => ({
            x: prev.x, // Lock X axis
            y: e.clientY - dragOffset.current.y
        }));

        // Calculate Spacer Position
        // We need to find which item we are hovering over
        const container = containerRef.current;
        if (!container) return;

        // Filter out ghost item AND spacer (identified by border-dashed class or lack of id?)
        // The spacer is a div with border-dashed. The items are SidebarItem divs.
        // Let's use a more robust way: checking if it's the spacer.
        const siblings = Array.from(container.children).filter(child =>
            !child.classList.contains('ghost-item') &&
            !child.classList.contains('border-dashed') && // Tailwind class on spacer
            !child.querySelector('.border-dashed') // Just in case structure varies
        );

        // Simple logic: find the first item whose center is below the cursor

        let newIndex = siblings.length; // Default to end

        for (let i = 0; i < siblings.length; i++) {
            const box = siblings[i].getBoundingClientRect();
            const offset = e.clientY - box.top - (box.height / 2);

            if (offset < 0) {
                newIndex = i;
                break;
            }
        }

        setSpacerIndex(newIndex);
        spacerIndexRef.current = newIndex; // Sync ref
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        const finalSpacerIndex = spacerIndexRef.current; // Read from ref
        const currentQuestions = questionsRef.current; // Use ref for latest state

        // Commit the reorder
        if (draggingId !== null && finalSpacerIndex !== null) {
            const currentIndex = currentQuestions.findIndex(q => q.id === draggingId);
            if (currentIndex !== -1 && currentIndex !== finalSpacerIndex) {
                const newQuestions = [...currentQuestions];
                const [removed] = newQuestions.splice(currentIndex, 1);

                let targetIndex = finalSpacerIndex;

                // Clamp
                targetIndex = Math.max(0, Math.min(targetIndex, currentQuestions.length - 1));

                newQuestions.splice(targetIndex, 0, removed);
                onReorder(newQuestions);
            }
        }

        setDraggingId(null);
        setSpacerIndex(null);
        spacerIndexRef.current = null;
    };

    // --- RENDER HELPERS ---

    // We need to render the list with the spacer inserted
    const renderList = () => {
        if (!draggingId) return questions.map((q, idx) => (
            <div key={q.id} ref={el => itemsRef.current.set(q.id, el)}>
                <SidebarItem
                    q={q}
                    isActive={currentQuestionId === q.id}
                    isLive={liveQuestionId === q.id}
                    onSelect={onSelectQuestion}
                    onDelete={onDeleteQuestion}
                    darkMode={darkMode}
                    onMouseDown={handleMouseDown}
                    isDragging={false}
                />
            </div>
        ));

        // If dragging, we construct a new list
        const listWithSpacer = [];
        const draggingQuestion = questions.find(q => q.id === draggingId);

        // Filter out the dragging item from the "static" list
        const staticQuestions = questions.filter(q => q.id !== draggingId);

        staticQuestions.forEach((q, idx) => {
            // If the current index matches spacerIndex, insert spacer first
            if (idx === spacerIndex) {
                listWithSpacer.push(
                    <SidebarItem key="spacer" isSpacer style={{ height: draggedItemHeight }} darkMode={darkMode} />
                );
            }

            listWithSpacer.push(
                <div key={q.id} ref={el => itemsRef.current.set(q.id, el)}>
                    <SidebarItem
                        q={q}
                        isActive={currentQuestionId === q.id}
                        isLive={liveQuestionId === q.id}
                        onSelect={onSelectQuestion}
                        onDelete={onDeleteQuestion}
                        darkMode={darkMode}
                        onMouseDown={handleMouseDown}
                        isDragging={false}
                    />
                </div>
            );
        });

        // Handle case where spacer is at the very end
        if (spacerIndex >= staticQuestions.length) {
            listWithSpacer.push(
                <SidebarItem key="spacer" isSpacer style={{ height: draggedItemHeight }} darkMode={darkMode} />
            );
        }

        return listWithSpacer;
    };

    return (
        <div
            className={`rounded-2xl p-5 h-full flex flex-col shadow-sm border transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-white border-slate-200'}`}
        >
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Questions</h2>

            <div
                className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-1 pb-4 relative"
                ref={containerRef}
            >
                {renderList()}
            </div>

            {/* GHOST ITEM */}
            {draggingId && (
                <div
                    ref={ghostRef}
                    className="fixed z-[9999] pointer-events-none"
                    style={{
                        left: ghostPos.x + correction.x,
                        top: ghostPos.y + correction.y,
                        width: draggedItemWidth, // Use captured width
                        // transform: 'scale(1.05)', // Removed scale to prevent misalignment
                    }}
                >
                    <SidebarItem
                        q={questions.find(q => q.id === draggingId)}
                        isActive={currentQuestionId === draggingId}
                        isLive={liveQuestionId === draggingId}
                        onSelect={() => { }}
                        onDelete={() => { }}
                        darkMode={darkMode}
                        onMouseDown={() => { }}
                        isDragging={true}
                        style={{
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                            backgroundColor: darkMode ? '#1e293b' : 'white' // Ensure opacity
                        }}
                    />
                </div>
            )}

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
