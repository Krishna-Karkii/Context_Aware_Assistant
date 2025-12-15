import React, { useState } from 'react';
import { Send, Share2, BookOpen, User, Bot, Search, Menu, MoreVertical, FileText } from 'lucide-react';

// --- Components ---

// 1. Citation Card Component
const CitationCard = ({ id, title, authors, year, source }) => (
  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow mb-3 cursor-pointer">
    <div className="flex justify-between items-start">
      <h4 className="text-sm font-semibold text-slate-800 leading-tight mb-1">{title}</h4>
      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
        [{id}]
      </span>
    </div>
    <p className="text-xs text-slate-500 mb-2">{authors} • {year}</p>
    <div className="flex items-center gap-1 text-xs text-teal-600 font-medium">
      <FileText size={12} />
      <span>{source}</span>
    </div>
  </div>
);

// 2. Message Bubble Component
const MessageBubble = ({ role, content, citations }) => {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-600' : 'bg-slate-900'}`}>
        {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
      </div>
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
          isUser 
            ? 'bg-blue-600 text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
        }`}>
          {content}
        </div>
        
        {/* Render Citations if they exist (Bot only) */}
        {!isUser && citations && citations.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {citations.map((cite) => (
              <button key={cite} className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors">
                <BookOpen size={12} />
                Source [{cite}]
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 3. Knowledge Graph Visualization (Static SVG Mock)
const KnowledgeGraphMock = () => (
  <div className="relative w-full h-64 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden mb-4 flex items-center justify-center">
    <svg width="100%" height="100%" viewBox="0 0 400 250" className="absolute inset-0">
      {/* Edges (Lines) */}
      <line x1="200" y1="125" x2="120" y2="80" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="200" y1="125" x2="280" y2="80" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="200" y1="125" x2="200" y2="200" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="120" y1="80" x2="80" y2="150" stroke="#cbd5e1" strokeWidth="2" />
      
      {/* Nodes (Circles) */}
      {/* Central Node: Query */}
      <circle cx="200" cy="125" r="25" fill="#3b82f6" opacity="0.1" />
      <circle cx="200" cy="125" r="6" fill="#3b82f6" />
      <text x="200" y="145" textAnchor="middle" className="text-[10px] fill-slate-500 font-medium">Query</text>

      {/* Related Node 1 */}
      <circle cx="120" cy="80" r="20" fill="#8b5cf6" opacity="0.1" />
      <circle cx="120" cy="80" r="5" fill="#8b5cf6" />
      <text x="120" y="60" textAnchor="middle" className="text-[10px] fill-slate-500">RAG</text>

      {/* Related Node 2 */}
      <circle cx="280" cy="80" r="20" fill="#8b5cf6" opacity="0.1" />
      <circle cx="280" cy="80" r="5" fill="#8b5cf6" />
      <text x="280" y="60" textAnchor="middle" className="text-[10px] fill-slate-500">LLMs</text>
      
      {/* Related Node 3 */}
      <circle cx="200" cy="200" r="20" fill="#14b8a6" opacity="0.1" />
      <circle cx="200" cy="200" r="5" fill="#14b8a6" />
      <text x="200" y="225" textAnchor="middle" className="text-[10px] fill-slate-500">Vector DB</text>
    </svg>
    
    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] font-semibold text-slate-500 border border-slate-200">
      Graph View
    </div>
  </div>
);

// --- Main Application ---

export default function MLResearchAssistant() {
  const [input, setInput] = useState("");

  // Mock Data
  const messages = [
    { 
      role: 'user', 
      content: 'How does Retrieval-Augmented Generation (RAG) improve factual accuracy in LLMs?' 
    },
    { 
      role: 'assistant', 
      content: (
        <span>
          <p className="mb-2">Retrieval-Augmented Generation (RAG) improves factual accuracy by allowing the model to reference external, verifiable data before generating a response, rather than relying solely on its pre-trained weights.</p>
          <p className="mb-2 font-semibold text-slate-900">Key Mechanisms:</p>
          <ul className="list-disc pl-4 space-y-1 mb-2">
            <li>It retrieves relevant documents using vector similarity [1].</li>
            <li>It grounds the generation in specific context, reducing hallucinations [2].</li>
            <li>Recent approaches combine this with Knowledge Graphs for better reasoning [3].</li>
          </ul>
        </span>
      ),
      citations: ['1', '2', '3']
    }
  ];

  const citations = [
    { id: '1', title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', authors: 'Lewis et al.', year: '2020', source: 'NeurIPS' },
    { id: '2', title: 'Precise Zero-Shot Dense Retrieval without Relevance Labels', authors: 'Gao et al.', year: '2022', source: 'arXiv' },
    { id: '3', title: 'Graph RAG: Unlocking LLM discovery on narrative private data', authors: 'Edge et al.', year: '2024', source: 'Microsoft Research' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Sidebar (Navigation) */}
      <div className="w-16 bg-slate-900 flex flex-col items-center py-6 gap-6 text-slate-400">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/50 mb-4">
          <Share2 size={20} />
        </div>
        <button className="p-2 bg-slate-800 text-white rounded-lg"><Search size={20} /></button>
        <button className="p-2 hover:text-white transition-colors"><BookOpen size={20} /></button>
        <button className="p-2 hover:text-white transition-colors"><Share2 size={20} /></button>
        <div className="mt-auto">
          <button className="p-2 hover:text-white transition-colors"><User size={20} /></button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Chat Interface */}
        <div className="flex-1 flex flex-col max-w-3xl border-r border-slate-200">
          
          {/* Header */}
          <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur sticky top-0 z-10">
            <div>
              <h1 className="font-semibold text-slate-800">ML Research Assistant</h1>
              <p className="text-xs text-slate-500">Powered by Graph RAG</p>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
              <MoreVertical size={20} />
            </button>
          </header>

          {/* Chat Stream */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} {...msg} />
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white border-t border-slate-200">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about machine learning papers..."
                className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm text-sm"
              />
              <button className="absolute right-2 top-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm">
                <Send size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>

        {/* Right Panel: Knowledge Context */}
        <div className="w-[400px] bg-white flex flex-col border-l border-slate-200 shadow-xl z-20 hidden xl:flex">
          <div className="p-6 h-full overflow-y-auto">
            
            {/* Section 1: Visualization */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Share2 size={16} className="text-purple-500" />
                  Knowledge Graph
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Live View</span>
              </div>
              <KnowledgeGraphMock />
              <p className="text-xs text-slate-500 leading-relaxed">
                Visualizing relationships between <span className="text-purple-600 font-medium">Retrieval Methods</span> and <span className="text-teal-600 font-medium">Vector Databases</span> based on your query.
              </p>
            </div>

            {/* Section 2: References */}
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <BookOpen size={16} className="text-blue-500" />
                References
              </h3>
              {citations.map((cite) => (
                <CitationCard key={cite.id} {...cite} />
              ))}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}