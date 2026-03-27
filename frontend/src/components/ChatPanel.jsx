import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import { sendChat } from '../api';

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'agent', text: "Hi! I'm ServerMind. Ask me anything about your server or pipelines." },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const { reply } = await sendChat(msg);
      setMessages(prev => [...prev, { role: 'agent', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: 'Failed to get a response.' }]);
    }
    setLoading(false);
  };

  const suggestions = [
    "What's the current system load?",
    "Which pipelines failed recently?",
    "Give me a status summary",
  ];

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-colors z-50">
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#1a1b23] rounded-xl border border-[#2e303a] shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e303a]">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-indigo-400" />
          <span className="text-white font-medium text-sm">ServerMind Chat</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'agent' && <Bot size={16} className="text-indigo-400 mt-1 shrink-0" />}
            <div className={`text-sm px-3 py-2 rounded-lg max-w-[80%] ${
              m.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#22232e] text-gray-300'
            }`}>
              {m.text}
            </div>
            {m.role === 'user' && <User size={16} className="text-gray-400 mt-1 shrink-0" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot size={16} className="text-indigo-400 mt-1" />
            <div className="text-sm px-3 py-2 rounded-lg bg-[#22232e] text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1">
          {suggestions.map(s => (
            <button key={s} onClick={() => { setInput(s); }}
              className="text-xs px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="p-3 border-t border-[#2e303a] flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask ServerMind..."
          className="flex-1 bg-[#22232e] text-white text-sm px-3 py-2 rounded-lg border border-[#2e303a] focus:outline-none focus:border-indigo-500"
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-30 transition-colors">
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
