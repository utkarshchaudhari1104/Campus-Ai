import { useState, useEffect } from "react";
import { faqsAPI } from "../../api";
import toast from "react-hot-toast";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import Spinner from "../../components/Spinner";

const CATEGORIES = ["general", "academics", "exam", "fees", "hostel", "library", "placement"];

export default function AdminFAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ question: "", answer: "", category: "general" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    faqsAPI.list().then((r) => setFaqs(r.data)).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await faqsAPI.create(form);
      setFaqs((f) => [res.data, ...f]);
      setForm({ question: "", answer: "", category: "general" });
      toast.success("FAQ added!");
    } catch {
      toast.error("Failed to add FAQ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await faqsAPI.delete(id);
    setFaqs((f) => f.filter((x) => x.id !== id));
    toast.success("FAQ deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Manage FAQs</h1>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-blue-600" /> Add FAQ
        </h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <input className="input-field" placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
          <textarea className="input-field h-24 resize-none" placeholder="Answer..." value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required />
          <div className="flex gap-3">
            <select className="input-field flex-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 whitespace-nowrap">
              {saving ? <Spinner size="sm" /> : <HelpCircle className="h-4 w-4" />}
              Add FAQ
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">All FAQs ({faqs.length})</h2>
        {loading ? <div className="flex justify-center py-8"><Spinner /></div> : (
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.id} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{f.question}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-3">{f.answer}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full capitalize">{f.category}</span>
                    <span className="text-xs text-gray-400">Views: {f.view_count}</span>
                  </div>
                </div>
                <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
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
