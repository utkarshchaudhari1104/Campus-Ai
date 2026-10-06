import { useState, useEffect } from "react";
import { faqsAPI } from "../../api";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import Spinner from "../../components/Spinner";

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="font-medium text-gray-800">{faq.question}</p>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
      </div>
      {open && (
        <div className="mt-3 ml-8 text-sm text-gray-600 leading-relaxed border-t pt-3">
          {faq.answer}
        </div>
      )}
      <div className="mt-2 ml-8">
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">{faq.category}</span>
      </div>
    </div>
  );
}

export default function FAQs() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    faqsAPI.list().then((r) => setFaqs(r.data)).finally(() => setLoading(false));
  }, []);

  const categories = ["all", ...new Set(faqs.map((f) => f.category))];
  const filtered = faqs
    .filter((f) => filter === "all" || f.category === filter)
    .filter((f) => !search || f.question.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <HelpCircle className="h-6 w-6 text-green-500" />
        <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
      </div>

      <input
        className="input-field mb-4 max-w-md"
        placeholder="Search FAQs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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
          <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No FAQs found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => <FAQItem key={f.id} faq={f} />)}
        </div>
      )}
    </div>
  );
}
