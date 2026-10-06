import { useState, useEffect } from "react";
import { noticesAPI } from "../../api";
import { Bell, Tag } from "lucide-react";
import Spinner from "../../components/Spinner";

const CATEGORY_BADGE = {
  exam: "bg-red-100 text-red-700",
  academic: "bg-blue-100 text-blue-700",
  placement: "bg-green-100 text-green-700",
  library: "bg-yellow-100 text-yellow-700",
  hostel: "bg-purple-100 text-purple-700",
  general: "bg-gray-100 text-gray-700",
};

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    noticesAPI.list().then((r) => setNotices(r.data)).finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(notices.map((n) => n.category))];
  const filtered = filter === "all" ? notices : notices.filter((n) => n.category === filter);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="h-6 w-6 text-orange-500" />
        <h1 className="text-2xl font-bold text-gray-900">Notices</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No notices available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => (
            <div key={n.id} className="card border-l-4 border-orange-400">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{n.title}</h3>
                  <p className="text-gray-600 text-sm mt-2 leading-relaxed">{n.content}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${CATEGORY_BADGE[n.category] || CATEGORY_BADGE.general}`}>
                      {n.category}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
