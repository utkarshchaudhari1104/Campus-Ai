import { useState, useEffect, useRef } from "react";
import { docsAPI } from "../../api";
import toast from "react-hot-toast";
import { Upload, Trash2, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Spinner from "../../components/Spinner";

const CATEGORIES = ["general", "academic", "exam", "fees", "hostel", "library", "placement", "rules"];

export default function AdminDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ category: "general", description: "" });
  const fileRef = useRef();

  useEffect(() => {
    docsAPI.list().then((r) => setDocs(r.data)).finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) return toast.error("Select a PDF file");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", form.category);
    fd.append("description", form.description);

    setUploading(true);
    try {
      const res = await docsAPI.upload(fd);
      setDocs((d) => [res.data.document, ...d]);
      toast.success("Document uploaded and processed!");
      fileRef.current.value = "";
      setForm({ category: "general", description: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This will remove it from the AI knowledge base.")) return;
    await docsAPI.delete(id);
    setDocs((d) => d.filter((x) => x.id !== id));
    toast.success("Document deleted");
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Document Management</h1>

      {/* Upload form */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-600" /> Upload University Document
        </h2>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input className="input-field" placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={uploading} className="btn-primary flex items-center gap-2">
            {uploading ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Processing PDF..." : "Upload & Process"}
          </button>
          {uploading && <p className="text-sm text-blue-600">Extracting text, running OCR if needed, and indexing the document...</p>}
        </form>
      </div>

      {/* Documents list */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Uploaded Documents ({docs.length})</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : docs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No documents uploaded yet</p>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50">
                <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
                  <FileText className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.original_name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full capitalize">{doc.category}</span>
                    {doc.is_processed ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> {doc.total_pages} pages • {doc.total_chunks} chunks indexed
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Processing...
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                >
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
