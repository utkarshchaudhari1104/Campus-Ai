import { useState, useEffect } from "react";
import { adminAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Users, FileText, MessageSquare, Bell, HelpCircle, Database, AlertCircle } from "lucide-react";
import Spinner from "../../components/Spinner";

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600",
  };
  return (
    <div className="card">
      <div className={`inline-flex p-3 rounded-xl ${colors[color]} mb-3`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    adminAPI.getDashboard()
      .then((response) => {
        if (!cancelled) setData(response.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [retryCount]);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  if (error || !data) {
    return (
      <div className="p-6">
        <div role="alert" className="card max-w-xl">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard data unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">The university dashboard could not load its latest data.</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  const { stats, unanswered_questions } = data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{user?.university_name || "Admin"} Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={stats.total_students} icon={Users} color="blue" />
        <StatCard label="Documents" value={stats.total_documents} icon={FileText} color="green" />
        <StatCard label="Questions Asked" value={stats.total_questions} icon={MessageSquare} color="purple" />
        <StatCard label="Unanswered" value={stats.unanswered_questions} icon={AlertCircle} color="red" />
        <StatCard label="Active Notices" value={stats.total_notices} icon={Bell} color="orange" />
        <StatCard label="FAQs" value={stats.total_faqs} icon={HelpCircle} color="gray" />
        <StatCard label="Chunks Indexed" value={stats.total_chunks_indexed} icon={Database} color="blue" />
      </div>

      {unanswered_questions.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Unanswered Questions
          </h2>
          <div className="space-y-2">
            {unanswered_questions.map((q) => (
              <div key={q.id} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <MessageSquare className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-800">{q.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(q.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
