import React, { useState } from 'react';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, Circle, ChevronDown, LayoutGrid } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function LiveResults({ question, responses, darkMode }) {
    const [chartType, setChartType] = useState('bar'); // bar, pie, donut, line
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const chartData = React.useMemo(() => {
        if (!question) return [];
        const counts = {};
        if (question.type === 'choice') {
            question.options?.forEach(opt => counts[opt] = 0);
            responses.forEach(r => {
                if (counts[r.answer] !== undefined) counts[r.answer]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
        if (question.type === 'reaction') {
            ['👍', '❤️', '😂', '😮', '😢'].forEach(emoji => counts[emoji] = 0);
            responses.forEach(r => {
                if (counts[r.answer] !== undefined) counts[r.answer]++;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
        return [];
    }, [question, responses]);

    if (!question) return null;

    // Calculate max value for scaling
    const maxValue = Math.max(...chartData.map(d => d.value), 1);

    const renderChart = () => {
        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }}
                                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                            />
                            <Legend formatter={(value) => <span style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'donut':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }}
                                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                            />
                            <Legend formatter={(value) => <span style={{ color: darkMode ? '#cbd5e1' : '#475569' }}>{value}</span>} />
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} />
                            <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} />
                            <Tooltip
                                contentStyle={{ backgroundColor: darkMode ? '#1e293b' : '#fff', borderColor: darkMode ? '#334155' : '#e2e8f0', borderRadius: '12px', color: darkMode ? '#fff' : '#000' }}
                                itemStyle={{ color: darkMode ? '#fff' : '#000' }}
                            />
                            <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'bar':
            default:
                return (
                    <div className="w-full h-full flex items-end justify-around pb-32 relative px-4">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-32 opacity-10">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-full h-px border-t border-dashed ${darkMode ? 'border-white' : 'border-slate-800'}`} />
                            ))}
                        </div>

                        {chartData.map((data, index) => {
                            const heightPercentage = (data.value / maxValue) * 100;
                            return (
                                <div key={index} className="relative h-full w-20 flex flex-col justify-end items-center group z-10">
                                    {/* Bar Track (Ghost Bar) */}
                                    <div className={`absolute bottom-0 w-full h-full rounded-xl -z-10 ${darkMode ? 'bg-white/5' : 'bg-slate-200/50'}`} />

                                    {/* The Bar */}
                                    <div
                                        className="w-full rounded-xl relative transition-all duration-1000 ease-out group-hover:brightness-110 cursor-pointer"
                                        style={{
                                            height: `${heightPercentage}%`,
                                            background: 'linear-gradient(to top, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
                                            boxShadow: '0 0 25px rgba(6, 182, 212, 0.25)',
                                            minHeight: data.value > 0 ? '10px' : '0'
                                        }}
                                    >
                                        {/* Value Label (Floating above) */}
                                        <span className={`absolute -top-10 left-1/2 -translate-x-1/2 text-xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                                            {data.value}
                                        </span>
                                    </div>

                                    {/* Labels (Below) */}
                                    <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-40">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border shadow-sm ${darkMode ? 'bg-white/10 border-white/10 text-white group-hover:bg-white group-hover:text-indigo-600' : 'bg-white border-slate-200 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'} transition-colors`}>
                                            {String.fromCharCode(65 + index)}
                                        </div>
                                        <span className={`text-sm md:text-base font-bold text-center leading-tight ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                            {data.name}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
        }
    };

    const chartOptions = [
        { id: 'bar', label: 'Bar Chart', icon: BarChartIcon },
        { id: 'pie', label: 'Pie Chart', icon: PieChartIcon },
        { id: 'donut', label: 'Donut Chart', icon: Circle },
        { id: 'line', label: 'Line Chart', icon: LineChartIcon },
    ];

    return (
        <div className={`rounded-3xl p-8 h-full flex flex-col border-2 relative overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-slate-900/75 backdrop-blur-xl border-white/10' : 'bg-gray-200/50 border-purple-400/30'}`}>

            {/* Chart Type Selector */}
            <div className="absolute top-6 right-6 z-50">
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                            >
                                {chartOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => {
                                            setChartType(opt.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${chartType === opt.id
                                            ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600')
                                            : (darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50')
                                            }`}
                                    >
                                        <opt.icon size={16} />
                                        {opt.label}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="text-center mb-16 z-10">
                <div className={`text-2xl font-bold uppercase tracking-[0.2em] mb-2 ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>Live Results</div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{question.text}</h2>
            </div>

            <div className="flex-1 w-full flex items-center justify-center z-10 relative min-h-0">
                {question.type === 'text' ? (
                    <div className="w-full grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {responses.map((r, i) => (
                            <div key={i} className={`p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-2 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-gray-700'}`}>
                                <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>{r.nickname || 'Anonymous'}</div>
                                {r.answer}
                            </div>
                        ))}
                        {responses.length === 0 && <p className={`italic ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Waiting for responses...</p>}
                    </div>
                ) : (
                    renderChart()
                )}
            </div>
        </div>
    );
}
