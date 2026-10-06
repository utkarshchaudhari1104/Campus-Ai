import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../api";
import toast from "react-hot-toast";
import { User, Mail, BookOpen, Hash, GraduationCap, Save } from "lucide-react";
import Spinner from "../../components/Spinner";

const DEPARTMENTS = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Chemical", "MBA", "MCA"];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    department: user?.department || "",
    semester: user?.semester || "",
    enrollment_no: user?.enrollment_no || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ ...form, semester: form.semester ? parseInt(form.semester) : null });
      updateUser(res.data);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Avatar card */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-xl font-semibold text-gray-900">{user?.name}</p>
          <p className="text-gray-500 text-sm">{user?.email}</p>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block capitalize">{user?.role}</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <h2 className="font-semibold text-gray-800 mb-2">Edit Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <User className="h-4 w-4" /> Full Name
          </label>
          <input className="input-field" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Mail className="h-4 w-4" /> Email (cannot change)
          </label>
          <input className="input-field bg-gray-50" value={user?.email} disabled />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Hash className="h-4 w-4" /> Enrollment No.
            </label>
            <input className="input-field" value={form.enrollment_no} onChange={(e) => set("enrollment_no", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <GraduationCap className="h-4 w-4" /> Semester
            </label>
            <select className="input-field" value={form.semester} onChange={(e) => set("semester", e.target.value)}>
              <option value="">Select</option>
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <BookOpen className="h-4 w-4" /> Department
          </label>
          <select className="input-field" value={form.department} onChange={(e) => set("department", e.target.value)}>
            <option value="">Select Department</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
