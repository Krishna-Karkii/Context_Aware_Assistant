import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, MoreVertical, Database, BookOpen, FileText } from 'lucide-react';

// --- MOCK DATA FOR CITATIONS ---
const MOCK_CITATIONS = [
  { id: '1', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', authors: 'Lewis et al.', year: '2020', source: 'NeurIPS' },
  { id: '2', title: 'Precise Zero-Shot Dense Retrieval without Relevance Labels', authors: 'Gao et al.', year: '2022', source: 'arXiv' },
  { id: '3', title: 'Graph RAG: Unlocking LLM discovery on narrative private data', authors: 'Edge et al.', year: '2024', source: 'Microsoft Research' },
];

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: (
    <span>
      Hello! I am your <strong>ML Research Assistant</strong>. I can help you find connections between academic papers, datasets, and methods.<br/><br/>
      Try asking: <em>"How does Graph RAG improve upon standard RAG?"</em>
    </span>
  ),
  citations: []
};

// --- COMPONENT: CITATION CARD ---
const CitationCard = ({ id, title, authors, year, source, isHighlighted }) => (
  <div className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer mb-3 ${
    isHighlighted 
      ? 'bg-blue-50 border-blue-400 shadow-md transform scale-[1.02]' 
      : 'bg-white border-slate-200 hover:shadow-sm'
  }`}>
    <div className="flex justify-between items-start gap-2">
      <h4 className="text-sm font-bold text-slate-800 leading-snug">{title}</h4>
      <span className="flex-shrink-0 text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
        [{id}]
      </span>
    </div>
    <p className="text-xs text-slate-500 mt-1 mb-2">{authors} • {year}</p>
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-100">
        <FileText size={10} />
        {source}
      </span>
    </div>
  </div>
);

// --- COMPONENT: LOADING INDICATOR ---
const ThinkingIndicator = () => (
  <div className="flex gap-3 mb-6 animate-in fade-in duration-300">
    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center flex-shrink-0">
      <Bot size={16} className="text-white" />
    </div>
    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
      </div>
      <span className="text-xs text-slate-500 font-medium">Analyzing research papers...</span>
    </div>
  </div>
);

// --- MAIN APP COMPONENT ---
export default function MLResearchAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [highlightedCitation, setHighlightedCitation] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle User Input
  const handleSend = async () => {
    if (!inputValue.trim()) return;

    // 1. Add User Message
    const userMsg = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    // 2. SIMULATE ALGORITHM DELAY
    setTimeout(() => {
      // 3. Add AI Response
      const aiMsg = {
        role: 'assistant',
        content: (
          <span>
            <p className="mb-3">
              Graph RAG improves upon standard RAG by introducing a <strong>knowledge graph structure</strong> that captures relationships between entities, rather than just retrieving similar text chunks.
            </p>
            <p className="mb-2 font-semibold text-slate-800">Key Differences:</p>
            <ul className="list-disc pl-4 space-y-2 mb-3 text-slate-700">
              <li>
                Standard RAG relies on vector similarity, which can miss multi-hop reasoning [1].
              </li>
              <li>
                Graph RAG traverses connected nodes to find relevant context that may not be semantically similar but is structurally related [3].
              </li>
              <li>
                This reduces hallucinations by grounding answers in verifiable graph paths [2].
              </li>
            </ul>
          </span>
        ),
        citations: ['1', '3', '2']
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setIsThinking(false);
    }, 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* 1. LEFT SIDEBAR (Minimal Navigation) */}
      <div className="w-16 md:w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 z-20 flex-shrink-0">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50 mb-2">
          <Database size={20} />
        </div>
        
        <div className="mt-auto mb-4">
          <button className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-600 transition-colors">
            <User size={18} />
          </button>
        </div>
      </div>

      {/* 2. MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Research Assistant</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 font-medium">Model: Graph-RAG-v1</p>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors">
            <MoreVertical size={20} />
          </button>
        </header>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-blue-600' : 'bg-slate-900'}`}>
                    {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
                  </div>
                  
                  {/* Bubble */}
                  <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-4 rounded-2xl text-sm leading-7 shadow-sm ${
                      isUser 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    
                    {/* Citations (Bot only) */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {msg.citations.map((citeId) => (
                          <button 
                            key={citeId}
                            onMouseEnter={() => setHighlightedCitation(citeId)}
                            onMouseLeave={() => setHighlightedCitation(null)}
                            className="text-[10px] font-bold flex items-center gap-1 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 px-2 py-1 rounded-md transition-all shadow-sm"
                          >
                            Source [{citeId}]
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {isThinking && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-slate-100 p-4 md:p-6">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              placeholder={isThinking ? "Analyzing..." : "Ask a question about papers..."}
              className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isThinking}
              className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Send size={18} />
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">
              AI can make mistakes. Please verify citations.
            </p>
          </div>
        </div>
      </div>

      {/* 3. RIGHT SIDEBAR (Citations Option) */}
      {/* Only visible after conversation starts (messages > 1) */}
      {messages.length > 1 && (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-500 shadow-xl z-20">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-600" />
              References
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {MOCK_CITATIONS.map((citation) => (
              <CitationCard 
                key={citation.id} 
                {...citation} 
                isHighlighted={highlightedCitation === citation.id}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
}