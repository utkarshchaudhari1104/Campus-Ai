import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { chatAPI } from "../../api";
import { MessageSquare, Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner";

export default function History() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    chatAPI.getSessions().then((r) => setSessions(r.data)).finally(() => setLoading(false));
  }, []);

  const deleteSession = async (id) => {
    await chatAPI.deleteSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
    toast.success("Chat deleted");
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Chat History</h1>
      {sessions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No chat history yet. Start a conversation!</p>
          <button onClick={() => navigate("/chat")} className="btn-primary mt-4">Start Chatting</button>
        </div>
      ) : (
        <div className="grid gap-3">
          {sessions.map((s) => (
            <div key={s.id} className="card flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/chat", { state: { sessionId: s.id } })}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{s.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />
                    {new Date(s.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
