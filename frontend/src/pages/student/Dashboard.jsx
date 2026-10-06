import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { noticesAPI, faqsAPI, docsAPI } from "../../api";
import { MessageSquare, BookOpen, Bell, HelpCircle, ArrowRight, GraduationCap } from "lucide-react";
import Spinner from "../../components/Spinner";

export default function Dashboard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([noticesAPI.list(), faqsAPI.list(), docsAPI.list()])
      .then(([n, f, d]) => {
        if (cancelled) return;
        setNotices(n.data);
        setFaqs(f.data);
        setDocs(d.data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [retryCount]);

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  if (error) {
    return (
      <div className="p-6">
        <div role="alert" className="card max-w-xl">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard data unavailable</h1>
          <p className="mt-2 text-sm text-gray-600">Your university documents, notices, and FAQs could not be loaded.</p>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="btn-primary mt-4">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(" ")[0]}!</h1>
            {user?.university_name && <p className="text-blue-100 mt-1">{user.university_name}</p>}
            <p className="text-blue-100 mt-1">
              {user?.department && `${user.department}`}
              {user?.semester && ` • Semester ${user.semester}`}
              {user?.enrollment_no && ` • ${user.enrollment_no}`}
            </p>
          </div>
        </div>
        <Link
          to="/chat"
          className="mt-4 inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          Ask AI Assistant
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Documents", value: docs.length, icon: BookOpen, color: "blue", to: "/documents" },
          { label: "Notices", value: notices.length, icon: Bell, color: "orange", to: "/notices" },
          { label: "FAQs", value: faqs.length, icon: HelpCircle, color: "green", to: "/faqs" },
          { label: "AI Chat", value: "24/7", icon: MessageSquare, color: "purple", to: "/chat" },
        ].map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="card hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2 rounded-lg bg-${color}-100 mb-3`}>
              <Icon className={`h-5 w-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Notices */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" /> Latest Notices
            </h2>
            <Link to="/notices" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {notices.length === 0 ? (
            <p className="text-gray-400 text-sm">No notices yet</p>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 3).map((n) => (
                <div key={n.id} className="border-l-4 border-orange-400 pl-3">
                  <p className="font-medium text-sm text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.content}</p>
                  <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full mt-1 inline-block">{n.category}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular FAQs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-green-500" /> Popular FAQs
            </h2>
            <Link to="/faqs" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {faqs.length === 0 ? (
            <p className="text-gray-400 text-sm">No FAQs yet</p>
          ) : (
            <div className="space-y-2">
              {faqs.slice(0, 4).map((f) => (
                <div key={f.id} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-800">{f.question}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{f.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
