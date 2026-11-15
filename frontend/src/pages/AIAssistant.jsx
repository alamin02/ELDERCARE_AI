import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import {
  Bot,
  Send,
  User,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pill,
  Trash2,
  Mic,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AIAssistant() {
  const { elderlyId } = useAuth();
  const { language, setLanguage } = useAccessibility();
  const isBn = language === 'bn';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick prompt chips specified in prompt requirements
  const promptChips = isBn ? [
    { label: "আমার পরবর্তী ওষুধ কোনটি?", query: "আমার পরবর্তী ওষুধ কোনটি?" },
    { label: "আমি কি সকালের ওষুধ মিস করেছি?", query: "আমি কি সকালের ওষুধ মিস করেছি?" },
    { label: "আজকের ওষুধের তালিকা কি?", query: "আজকের ওষুধের তালিকা কি?" },
    { label: "আমি ওষুধ খেতে ভুলে গেছি।", query: "আমি ওষুধ খেতে ভুলে গেছি।" },
    { label: "আমার কেয়ারগিভারকে জানান।", query: "আমার কেয়ারগিভারকে জানান।" },
    { label: "আমার ওষুধের ইতিহাস দেখান।", query: "আমার ওষুধের ইতিহাস দেখান।" },
  ] : [
    { label: "Which medicine should I take next?", query: "Which medicine should I take next?" },
    { label: "Did I miss my morning medicine?", query: "Did I miss my morning medicine?" },
    { label: "What medicines are scheduled today?", query: "What medicines are scheduled today?" },
    { label: "I forgot to take my medicine.", query: "I forgot to take my medicine." },
    { label: "Please notify my caregiver.", query: "Please notify my caregiver." },
    { label: "Show my medication history.", query: "Show my medication history." },
  ];

  const fetchHistory = async () => {
    try {
      const history = await api.getChatHistory(elderlyId, 'default-session');
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial greeting
        setMessages([{
          id: 'init-greeting',
          role: 'assistant',
          message: isBn
            ? "নমস্কার! আমি আপনার এল্ডারকেয়ার সহকারী। আপনি আপনার পরবর্তী ওষুধ, মিস হওয়া ডোজ, বা যেকোনো ওষুধের সময়সূচী সম্পর্কে জিজ্ঞাসা করতে পারেন।"
            : "Hello! I am your ElderCare AI Assistant. Feel free to ask which medicine to take next, if you missed a morning dose, or request an in-app caregiver notification.",
          structured_data: {
            intent: "general_query",
            recommended_action: isBn ? "নিচের যেকোনো প্রশ্নে ট্যাপ করতে পারেন।" : "Tap any quick question below to get started.",
            ai_provider: "ElderCare Guardian Engine"
          }
        }]);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [elderlyId, isBn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (messageText) => {
    const query = (messageText || input).trim();
    if (!query) return;

    setInput('');
    const userMsg = {
      id: Date.now(),
      role: 'user',
      message: query
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.chatAssistant({
        message: query,
        elderly_id: elderlyId,
        session_id: 'default-session',
        language: isBn ? 'bn' : 'en'
      });

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        message: res.response,
        structured_data: {
          intent: res.intent,
          relevant_medications: res.relevant_medications,
          recommended_action: res.recommended_action,
          requires_caregiver: res.requires_caregiver,
          safety_warning: res.safety_warning,
          ai_provider: res.ai_provider
        }
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          message: isBn ? "দুঃখিত, সংযোগে ত্রুটি দেখা দিয়েছে।" : "Sorry, an error occurred while connecting to the assistant.",
          structured_data: { intent: "error", safety_warning: err.message }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm(isBn ? 'কথোপকথনের ইতিহাস মুছে ফেলতে চান?' : 'Clear conversation history?')) return;
    try {
      await api.clearChatHistory(elderlyId, 'default-session');
      setMessages([]);
    } catch (err) {
      alert("Failed to clear history");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in flex flex-col h-[calc(100vh-7rem)]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-borderMuted pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-md">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {isBn ? 'এল্ডারকেয়ার এআই সহকারী' : 'ElderCare AI Assistant'}
              </h1>
              <span className="text-[10px] uppercase font-black bg-blue-100 text-primary px-2 py-0.5 rounded-full">
                Context-Aware
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {isBn ? 'বাংলা ও ইংরেজিতে নিরাপদ চিকিৎসা গাইডলাইন' : 'Strict medical safety guardrails • Bengali & English'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(isBn ? 'en' : 'bn')}
            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            {isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
          </button>
          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-danger rounded-xl hover:bg-red-50 transition"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          const structured = msg.structured_data || {};

          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-sm ${
                  isUser ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Box */}
              <div
                className={`max-w-2xl rounded-3xl p-5 shadow-sm text-sm sm:text-base ${
                  isUser
                    ? 'bg-primary text-white rounded-tr-sm font-semibold'
                    : 'bg-white border border-borderMuted text-slate-800 rounded-tl-sm space-y-3'
                }`}
              >
                {/* Text Content */}
                <p className="whitespace-pre-line leading-relaxed font-medium">
                  {msg.message}
                </p>

                {/* Structured Visual Cards for AI */}
                {!isUser && structured && (
                  <div className="space-y-2.5 pt-1">
                    
                    {/* Relevant Medications */}
                    {structured.relevant_medications?.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        {structured.relevant_medications.map((m, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-2.5">
                            <Pill className="w-5 h-5 text-primary shrink-0" />
                            <div>
                              <span className="font-extrabold text-sm text-slate-900 block">{m.name}</span>
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                <span>{m.dosage}</span>
                                {m.scheduled_time && <span>• {m.scheduled_time}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommended Action */}
                    {structured.recommended_action && (
                      <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-bold flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-black text-secondary tracking-wider block">Recommended Action</span>
                          <span>{structured.recommended_action}</span>
                        </div>
                      </div>
                    )}

                    {/* Safety Warning */}
                    {structured.safety_warning && (
                      <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-danger text-xs sm:text-sm font-bold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] uppercase font-black text-danger tracking-wider block">Safety Guardrail Warning</span>
                          <span>{structured.safety_warning}</span>
                        </div>
                      </div>
                    )}

                    {/* Provider Badge */}
                    {structured.ai_provider && (
                      <div className="text-[10px] font-bold text-slate-400 text-right pt-1">
                        Engine: {structured.ai_provider}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center text-white shrink-0">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div className="bg-white border border-borderMuted rounded-3xl p-4 text-slate-500 font-semibold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>{isBn ? 'সহকারী বিশ্লেষণ করছে...' : 'Assistant is reviewing your patient context...'}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip.query)}
            disabled={loading}
            className="px-3.5 py-2 rounded-2xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-primary text-xs sm:text-sm font-bold text-slate-700 whitespace-nowrap shadow-sm transition active:scale-95"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="shrink-0 flex items-center gap-2 bg-white rounded-3xl p-2 border-2 border-borderMuted focus-within:border-primary shadow-md transition"
      >
        <input
          type="text"
          placeholder={isBn ? 'আপনার প্রশ্ন লিখুন (যেমন: আমার পরবর্তী ওষুধ কোনটি?)...' : 'Ask your medication question (e.g. Which medicine next?)...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-transparent focus:outline-none text-sm sm:text-base font-medium"
        />

        <button
          type="button"
          onClick={() => alert(isBn ? 'মাইক্রোফোন সক্রিয় করা হয়েছে (ভয়েস ইনপুট প্রস্তুত)' : 'Voice input simulated: Audio speech recognition ready.')}
          title="Speech input"
          className="p-3 rounded-2xl text-slate-400 hover:text-primary hover:bg-slate-50 transition"
        >
          <Mic className="w-5 h-5" />
        </button>

        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-3 rounded-2xl bg-primary hover:bg-primary-700 text-white font-extrabold shadow-md transition disabled:opacity-40"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

    </div>
  );
}
