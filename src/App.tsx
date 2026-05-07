/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart3, 
  Table as TableIcon, 
  TrendingUp, 
  AlertTriangle, 
  Upload, 
  Search,
  Activity,
  Layers,
  ChevronRight,
  Info,
  MessageCircle,
  X,
  Send
} from 'lucide-react';
import { analyzeElectionData, chatWithAnalysis, ElectionAnalysis, ChatMessage } from './services/dataService.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function App() {
  const [rawData, setRawData] = useState('');
  const [analysis, setAnalysis] = useState<ElectionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !analysis) return;
    
    const userMsg: ChatMessage = { role: 'user', content: currentMessage };
    setChatHistory(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setIsTyping(true);
    
    try {
      const response = await chatWithAnalysis(currentMessage, analysis, chatHistory);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response };
      setChatHistory(prev => [...prev, assistantMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAnalyze = async () => {
    if (!rawData.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeElectionData(rawData);
      setAnalysis(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderVisualization = (viz: any, index: number) => {
    return (
      <div key={index} className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 mb-8 hover:border-emerald-500/30 transition-colors shadow-xl">
        <h3 className="text-sm font-mono text-emerald-400 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          {viz.title.toUpperCase()}
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {viz.type === 'bar' ? (
              <BarChart data={viz.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : viz.type === 'pie' ? (
              <PieChart>
                <Pie
                  data={viz.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {viz.data.map((entry: any, i: number) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            ) : (
              <LineChart data={viz.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-bottom border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center">
            <Activity className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0">VoxPulse</h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-500">Election Data Analysis Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-slate-500 uppercase">System Status</span>
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              OPERATIONAL
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        {!analysis ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mt-20"
          >
            <div className="bg-[#141414] border border-[#222] rounded-xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Layers className="w-32 h-32" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <Upload className="w-6 h-6 text-emerald-500" />
                Initialize Dataset
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Paste raw election data, demographic stats, or swing reports below. Our AI engine will calibrate trends and identify anomalies.
              </p>

              <div className="space-y-4">
                <textarea
                  ref={inputRef}
                  value={rawData}
                  onChange={(e) => setRawData(e.target.value)}
                  placeholder="e.g., Ward 4: Candidate A - 4500 (45%), Candidate B - 5500 (55%). Shift from 2020: +2% for B..."
                  className="w-full h-48 bg-[#0d0d0d] border border-[#333] rounded-lg p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-700"
                />
                
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !rawData.trim()}
                  className={cn(
                    "w-full py-4 rounded-lg font-mono text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2",
                    isAnalyzing || !rawData.trim() 
                      ? "bg-[#222] text-slate-600 cursor-not-allowed" 
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Calibrating Data Flow...
                    </>
                  ) : (
                    <>
                      Execute Deep Analysis
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                {error && <p className="text-red-500 text-xs font-mono mt-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {error}</p>}
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: TrendingUp, label: "Trend Detection", color: "text-blue-400" },
                { icon: Search, label: "Anomaly Search", color: "text-amber-400" },
                { icon: TableIcon, label: "Metric Syncing", color: "text-purple-400" },
              ].map((item, i) => (
                <div key={i} className="bg-[#141414] border border-[#222] p-4 rounded-lg flex items-center gap-3">
                  <item.icon className={cn("w-5 h-5", item.color)} />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar - Key Metrics & Summary */}
            <div className="lg:col-span-4 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#141414] border border-[#222] rounded-xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Executive Summary
                  </h2>
                  <button 
                    onClick={() => {setAnalysis(null); setRawData('');}}
                    className="text-[10px] font-mono text-emerald-500 hover:underline"
                  >
                    RESET
                  </button>
                </div>
                <ul className="space-y-4">
                  {analysis.executiveSummary.map((bullet, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-300">
                      <span className="text-emerald-500 mt-1.5">•</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-[#141414] border border-[#222] rounded-xl p-6 overflow-x-auto"
              >
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                  <TableIcon className="w-4 h-4" />
                  Vital Statistics
                </h2>
                <div className="prose prose-invert prose-emerald max-w-none prose-sm font-mono text-[11px]">
                  <ReactMarkdown>{analysis.keyMetrics}</ReactMarkdown>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-red-950/20 border border-red-900/30 rounded-xl p-6"
              >
                <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-red-500 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Monitoring Alerts
                </h2>
                <ul className="space-y-3">
                  {analysis.monitoringAlerts.map((alert, i) => (
                    <li key={i} className="text-xs text-red-400 bg-red-950/40 p-3 rounded border border-red-900/50 flex gap-2">
                      <span className="font-bold">!</span>
                      {alert}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Main Content - Visualizations & Analysis */}
            <div className="lg:col-span-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {analysis.suggestedVisualizations.map((viz, i) => renderVisualization(viz, i))}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#141414] border border-[#222] rounded-xl p-8"
              >
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="text-emerald-500 w-6 h-6" />
                  <h2 className="text-xl font-bold text-white">Sentiment & Demographic Shifts</h2>
                </div>
                
                <div className="space-y-8">
                  <section>
                    <h3 className="text-xs font-mono uppercase text-emerald-500 mb-2">Voter Sentiment Analysis</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      {analysis.voterSentiment}
                    </p>
                  </section>
                  
                  <div className="h-[1px] bg-[#222]" />

                  <section>
                    <h3 className="text-xs font-mono uppercase text-emerald-500 mb-2">Demographic Shift Reporting</h3>
                    <p className="text-slate-400 leading-relaxed text-sm">
                      {analysis.demographicShifts}
                    </p>
                  </section>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-20 border-t border-[#1f1f1f] p-8 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#1a1a1a] border border-[#333] rounded">
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">VoxPulse Election Engine v4.2.0</span>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-600 uppercase">Analysis Engine</p>
              <p className="text-xs text-slate-400">Gemini-3.0 Large Context</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-slate-600 uppercase">Last Sync</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Chat Bot */}
      <AnimatePresence>
        {analysis && (
          <>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="fixed bottom-8 right-8 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-500 z-[100] transition-colors"
            >
              {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </motion.button>

            {isChatOpen && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                className="fixed bottom-24 right-8 w-[350px] sm:w-[400px] h-[500px] bg-[#141414] border border-[#333] rounded-2xl shadow-2xl flex flex-col z-[100] overflow-hidden"
              >
                {/* Chat Header */}
                <div className="p-4 border-b border-[#333] bg-[#1a1a1a] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">VoxPulse Assistant</h3>
                    <p className="text-[10px] text-emerald-500 font-mono">ENHANCED ANALYSIS MODE</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans scrollbar-hide">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-xs text-slate-500 font-mono">Ask me about trends, anomalies, or specific demographics in your dataset.</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                        msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-[#1a1a1a] border border-[#333] text-slate-300 rounded-bl-none'
                      )}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-[#1a1a1a] border border-[#333] rounded-2xl px-4 py-2 text-sm text-slate-500 flex gap-1">
                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-[#333] bg-[#1a1a1a]">
                  <div className="relative">
                    <input
                      type="text"
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask a question..."
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded-full py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isTyping}
                      className="absolute right-1.5 top-1.5 p-1 text-emerald-500 hover:text-emerald-400 disabled:text-slate-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
