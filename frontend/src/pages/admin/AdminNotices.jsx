import { useState, useEffect } from "react";
import { noticesAPI } from "../../api";
import toast from "react-hot-toast";
import { Bell, Plus, Trash2 } from "lucide-react";
import Spinner from "../../components/Spinner";

const CATEGORIES = ["general", "exam", "academic", "placement", "library", "hostel", "fees"];

export default function AdminNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", content: "", category: "general" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    noticesAPI.list().then((r) => setNotices(r.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await noticesAPI.create(form);
      setNotices((n) => [res.data, ...n]);
      setForm({ title: "", content: "", category: "general" });
      toast.success("Notice published!");
    } catch {
      toast.error("Failed to create notice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await noticesAPI.delete(id);
    setNotices((n) => n.filter((x) => x.id !== id));
    toast.success("Notice deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage Notices</h1>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" /> Create Notice
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="input-field" placeholder="Notice title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea className="input-field h-24 resize-none" placeholder="Notice content..." value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required />
          <div className="flex gap-3">
            <select className="input-field flex-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              {saving ? <Spinner size="sm" /> : <Bell className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">All Notices ({notices.length})</h2>
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-3">
            {notices.map((n) => (
              <div key={n.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{n.content}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full capitalize">{n.category}</span>
                    <span className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(n.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
