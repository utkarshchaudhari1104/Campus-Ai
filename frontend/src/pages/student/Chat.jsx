import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { chatAPI } from "../../api";
import toast from "react-hot-toast";
import { Send, Bot, User, FileText, Plus, Trash2, Lightbulb } from "lucide-react";
import Spinner from "../../components/Spinner";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? "bg-blue-600" : "bg-gray-700"}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
        }`}>
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {msg.sources.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                <FileText className="h-3 w-3" />
                {s.document} • p.{s.page}
              </span>
            ))}
          </div>
        )}
        <span className="text-xs text-gray-400">
          {new Date(msg.created_at || Date.now()).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default function Chat() {
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    chatAPI.getSessions().then((r) => setSessions(r.data));
    chatAPI.getSuggestedQuestions().then((r) => setSuggested(r.data.questions));
  }, []);

  // Load session if navigated from History page
  useEffect(() => {
    const sid = location.state?.sessionId;
    if (sid) loadSession(sid);
  }, [location.state]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadSession = async (id) => {
    setLoadingSession(true);
    try {
      const res = await chatAPI.getSession(id);
      setActiveSession(id);
      setMessages(res.data.messages);
    } finally {
      setLoadingSession(false);
    }
  };

  const newChat = () => {
    setActiveSession(null);
    setMessages([]);
  };

  const deleteSession = async (id, e) => {
    e.stopPropagation();
    await chatAPI.deleteSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
    if (activeSession === id) newChat();
    toast.success("Chat deleted");
  };

  const sendMessage = async (text = input) => {
    if (!text.trim() || sending) return;
    const userMsg = { role: "user", content: text, created_at: new Date().toISOString(), sources: [] };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await chatAPI.sendMessage(text, activeSession);
      const { session_id, answer, sources } = res.data;

      if (!activeSession) {
        setActiveSession(session_id);
        chatAPI.getSessions().then((r) => setSessions(r.data));
      }

      setMessages((m) => [...m, {
        role: "assistant",
        content: answer,
        sources,
        created_at: new Date().toISOString(),
      }]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to get response. Check your API key.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sessions sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b">
          <button onClick={newChat} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus className="h-4 w-4" /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => loadSession(s.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer group text-sm ${
                activeSession === s.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              <span className="truncate flex-1">{s.title}</span>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-1 flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-50 min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">CampusAI Assistant</h2>
            <p className="text-xs text-gray-500">Answers from university documents only</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingSession && <div className="flex justify-center"><Spinner /></div>}

          {messages.length === 0 && !loadingSession && (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Ask me anything!</h3>
              <p className="text-gray-400 text-sm mb-6">I'll answer from your university's official documents.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {suggested.slice(0, 6).map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-start gap-2"
                  >
                    <Lightbulb className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => <Message key={i} msg={msg} />)}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t p-4 flex-shrink-0">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              className="input-field flex-1"
              placeholder="Ask about attendance, exams, fees, hostel, placements..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="btn-primary px-4 flex items-center gap-2"
            >
              {sending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">Answers are based on university documents only</p>
        </div>
      </div>
    </div>
  );
}
