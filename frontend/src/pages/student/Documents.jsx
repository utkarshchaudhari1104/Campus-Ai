import { useState, useEffect } from "react";
import { docsAPI } from "../../api";
import { FileText, CheckCircle, Clock, BookOpen, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner";

const CATEGORY_COLORS = {
  general: "gray", academic: "blue", exam: "red", fees: "green",
  hostel: "purple", library: "yellow", placement: "orange"
};

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const openDocument = async (document) => {
    const previewWindow = window.open("about:blank", "_blank");
    if (!previewWindow) {
      toast.error("Allow pop-ups to open university documents");
      return;
    }
    previewWindow.document.title = "Loading document...";
    try {
      const response = await docsAPI.open(document.id);
      const url = URL.createObjectURL(response.data);
      previewWindow.location.href = url;
      window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      previewWindow.close();
      toast.error(error.response?.data?.detail || "Could not open this document");
    }
  };

  useEffect(() => {
    docsAPI.list().then((r) => setDocs(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">University Documents</h1>
      </div>
      <p className="text-gray-500 text-sm mb-6">These documents form the knowledge base for the AI assistant.</p>

      {docs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map((doc) => (
            <div key={doc.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.original_name}</p>
                  {doc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{doc.description}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{doc.category}</span>
                    {doc.is_processed ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {doc.total_pages}p • {doc.total_chunks} chunks
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Processing...
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocument(doc)}
                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-900"
                >
                  <ExternalLink className="h-4 w-4" /> Open PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
