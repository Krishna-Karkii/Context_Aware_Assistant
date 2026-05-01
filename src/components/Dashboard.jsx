import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, User, Bot, Database, BookOpen, LogOut,
  ChevronRight, Plus, MessageSquare, AlertCircle,
  Upload, Trash2, ExternalLink, FileText, X, CheckCircle, Clock,
} from 'lucide-react';
import { submitQuery, getThreads, getThread, logout } from '../api/client';
import apiClient from '../api/client';

const uploadDocument = async (doc) => {
  const res = await apiClient.post('/kb/upload', doc);
  return res.data;
};
const listDocuments = async () => {
  const res = await apiClient.get('/kb');
  return res.data;
};
const deleteDocument = async (id) => {
  await apiClient.delete(`/kb/${id}`);
};

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
      <span className="text-xs text-slate-500 font-medium">Searching knowledge base & thinking...</span>
    </div>
  </div>
);

const CitationCard = ({ citation, isHighlighted }) => (
  <div className={`p-3 rounded-xl border transition-all duration-200 mb-2 ${
    isHighlighted
      ? 'bg-blue-50 border-blue-300 shadow-sm'
      : 'bg-white border-slate-200 hover:border-slate-300'
  }`}>
    <div className="flex justify-between items-start gap-2">
      <p className="text-xs font-semibold text-slate-800 leading-snug">{citation.title}</p>
      {citation.url && (
        <a href={citation.url} target="_blank" rel="noreferrer"
          className="flex-shrink-0 text-blue-500 hover:text-blue-700 transition-colors">
          <ExternalLink size={12} />
        </a>
      )}
    </div>
    {citation.authors && (
      <p className="text-[11px] text-slate-500 mt-1">{citation.authors}{citation.year ? ` · ${citation.year}` : ''}</p>
    )}
    {citation.source && (
      <span className="inline-block mt-1.5 text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded">
        {citation.source}
      </span>
    )}
  </div>
);

const KBPanel = ({ onClose }) => {
  const [docs, setDocs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', year: '', source: '', url: '', abstract: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    try { setDocs(await listDocuments()); } catch { }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) { setError('Title and content are required.'); return; }
    setUploading(true);
    setError('');
    try {
      await uploadDocument(form);
      setForm({ title: '', authors: '', year: '', source: '', url: '', abstract: '', content: '' });
      setShowForm(false);
      await loadDocs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this document from the knowledge base?')) return;
    try { await deleteDocument(id); await loadDocs(); } catch { }
  };

  const statusIcon = (status) => {
    if (status === 'indexed') return <CheckCircle size={12} className="text-green-500" />;
    if (status === 'processing') return <Clock size={12} className="text-amber-500 animate-spin" />;
    return <Clock size={12} className="text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <Database size={18} className="text-blue-600" />
            Knowledge Base
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Add button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 text-sm font-medium transition-all mb-4"
            >
              <Plus size={16} /> Add Paper / Document
            </button>
          )}

          {/* Upload form */}
          {showForm && (
            <form onSubmit={handleUpload} className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-sm font-semibold text-slate-700 mb-3">Add a Source</p>

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Attention Is All You Need" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Authors</label>
                  <input value={form.authors} onChange={e => setForm(f => ({ ...f, authors: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Vaswani et al." />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Year</label>
                  <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="2017" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Venue / Source</label>
                  <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="NeurIPS 2017" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">URL / Link</label>
                  <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="https://arxiv.org/abs/1706.03762" />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Abstract</label>
                  <textarea value={form.abstract} onChange={e => setForm(f => ({ ...f, abstract: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Short summary of the paper..." />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase mb-1 block">Full Text / Content *</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    placeholder="Paste the full text, key sections, or excerpts from the paper here. The more content, the better the search results." />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors">
                  <Upload size={14} />
                  {uploading ? 'Uploading...' : 'Add to KB'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setError(''); }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Document list */}
          {docs.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No documents yet</p>
              <p className="text-xs text-slate-300 mt-1">Add data to enable citation-aware answers</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => (
                <div key={doc.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {statusIcon(doc.status)}
                      <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {doc.authors}{doc.year ? ` · ${doc.year}` : ''}{doc.source ? ` · ${doc.source}` : ''}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {doc.chunk_count} chunks · {doc.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noreferrer"
                        className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    <button onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("access_token")) navigate('/');
  }, [navigate]);

  const [threads, setThreads]                   = useState([]);
  const [currentThreadId, setCurrentThreadId]   = useState(null);
  const [messages, setMessages]                 = useState([]);
  const [inputValue, setInputValue]             = useState('');
  const [isThinking, setIsThinking]             = useState(false);
  const [error, setError]                       = useState('');
  const [isProfileOpen, setIsProfileOpen]       = useState(false);
  const [loadingThread, setLoadingThread]       = useState(false);
  const [showKB, setShowKB]                     = useState(false);
  const [highlightedCitation, setHighlightedCitation] = useState(null);
  const [activeCitations, setActiveCitations]   = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => { loadThreads(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const loadThreads = async () => {
    try { setThreads(await getThreads()); } catch { }
  };

  const openThread = async (threadId) => {
    if (loadingThread || threadId === currentThreadId) return;
    setLoadingThread(true);
    setError('');
    setActiveCitations([]);
    try {
      const data = await getThread(threadId);
      setCurrentThreadId(threadId);
      setMessages(data.messages.map(m => ({ role: m.role, content: m.content })));
    } catch {
      setError('Failed to load thread.');
    } finally {
      setLoadingThread(false);
    }
  };

  const newThread = () => {
    setCurrentThreadId(null);
    setMessages([]);
    setError('');
    setActiveCitations([]);
  };

  const handleSend = async () => {
    const query = inputValue.trim();
    if (!query || isThinking) return;

    setError('');
    setInputValue('');
    setActiveCitations([]);
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setIsThinking(true);

    try {
      const data = await submitQuery(query, currentThreadId);

      if (!currentThreadId) {
        setCurrentThreadId(data.thread_id);
        loadThreads();
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        citations: data.citations || [],
      }]);

      if (data.citations && data.citations.length > 0) {
        setActiveCitations(data.citations);
      }

    } catch (err) {
      const detail = err.response?.data?.detail || 'Something went wrong.';
      setError(detail);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const allCitations = messages
    .filter(m => m.citations && m.citations.length > 0)
    .flatMap(m => m.citations)
    .reduce((acc, c) => {
      if (!acc.find(x => x.id === c.id)) acc.push(c);
      return acc;
    }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">

      {showKB && <KBPanel onClose={() => setShowKB(false)} />}

      {/* ── LEFT SIDEBAR ── */}
      <div className="w-60 bg-slate-900 flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Database size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white">Context Aware</span>
        </div>

        <div className="px-3 pt-4 pb-2 space-y-2">
          <button onClick={newThread}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus size={15} /> New Thread
          </button>
          <button onClick={() => setShowKB(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
            <BookOpen size={15} /> Knowledge Base
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {threads.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 mt-3">
                Recent
              </p>
              {threads.map(t => (
                <button key={t.id} onClick={() => openThread(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm transition-colors mb-1 ${
                    currentThreadId === t.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}>
                  <MessageSquare size={13} className="flex-shrink-0 opacity-50" />
                  <span className="truncate">{t.title || 'Untitled'}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="border-t border-slate-700 p-3 relative">
          <button onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isProfileOpen ? 'bg-slate-700' : 'hover:bg-slate-800'}`}>
            <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <User size={13} className="text-slate-300" />
            </div>
            <span className="text-sm text-slate-300 truncate flex-1 text-left">
              {localStorage.getItem('user_email') || 'Account'}
            </span>
            <ChevronRight size={13} className="text-slate-500" />
          </button>

          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
              <div className="absolute left-3 bottom-16 w-52 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50">
                <button onClick={logout}
                  className="w-full flex items-center gap-2 p-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
          <div>
            <h1 className="text-sm font-bold text-slate-800">
              {currentThreadId ? 'Research Thread' : 'New Conversation'}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <p className="text-[11px] text-slate-400">llama3.2:3b · RAG enabled</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-3xl mx-auto p-6 space-y-6">

            {messages.length === 0 && !isThinking && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <BookOpen size={22} className="text-blue-500" />
                </div>
                <h2 className="text-base font-semibold text-slate-700 mb-1">Ask anything</h2>
                <p className="text-sm text-slate-400 max-w-xs">
                  Add papers to your Knowledge Base to get citation-backed answers.
                </p>
                <button onClick={() => setShowKB(true)}
                  className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  <Plus size={15} /> Add your data
                </button>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${isUser ? 'bg-blue-600' : 'bg-slate-900'}`}>
                    {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-7 whitespace-pre-wrap shadow-sm ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                    {/* Citation pills below assistant message */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.citations.map((c) => (
                          <button key={c.id}
                            onMouseEnter={() => setHighlightedCitation(c.id)}
                            onMouseLeave={() => setHighlightedCitation(null)}
                            className="flex items-center gap-1 text-[11px] font-medium bg-white border border-slate-200 hover:border-blue-400 text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg shadow-sm transition-all">
                            <FileText size={10} />
                            {c.title.length > 35 ? c.title.slice(0, 35) + '…' : c.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isThinking && <ThinkingIndicator />}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                <AlertCircle size={15} className="flex-shrink-0" /> {error}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-slate-100 p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <textarea rows={1} value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking || loadingThread}
              placeholder={isThinking ? 'Thinking...' : 'Ask about papers, methods, concepts...'}
              className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden"
              style={{ minHeight: '52px', maxHeight: '160px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
            />
            <button onClick={handleSend} disabled={!inputValue.trim() || isThinking || loadingThread}
              className="absolute right-2 bottom-2 p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-sm active:scale-95">
              <Send size={15} />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>

      {/* ── RIGHT CITATIONS SIDEBAR ── */}
      {allCitations.length > 0 && (
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
          <div className="px-4 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={15} className="text-blue-600" />
              References
              <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {allCitations.length}
              </span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {allCitations.map(c => (
              <CitationCard
                key={c.id}
                citation={c}
                isHighlighted={highlightedCitation === c.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}