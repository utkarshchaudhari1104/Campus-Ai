import { useState, useEffect } from "react";
import { adminAPI } from "../../api";
import { Users, GraduationCap } from "lucide-react";
import toast from "react-hot-toast";
import { Info, Ban, CircleCheck, X } from "lucide-react";
import Spinner from "../../components/Spinner";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStudentId, setUpdatingStudentId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminAPI.getUsers()
      .then((r) => setUsers(r.data))
      .catch(() => toast.error("Could not load students"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.enrollment_no || "").toLowerCase().includes(search.toLowerCase())
  );

  const showStudentInfo = async (studentId) => {
    setDetailLoading(true);
    try {
      const response = await adminAPI.getStudent(studentId);
      setSelectedStudent(response.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not load student details");
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleStudentStatus = async (student) => {
    const nextActive = !student.is_active;
    if (!nextActive && !window.confirm(`Block ${student.name} from signing in?`)) return;

    setUpdatingStudentId(student.id);
    try {
      const response = await adminAPI.setStudentActive(student.id, nextActive);
      setUsers((current) => current.map((user) => user.id === student.id ? response.data : user));
      setSelectedStudent((current) => current?.id === student.id ? response.data : current);
      toast.success(nextActive ? "Student unblocked" : "Student blocked");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not update student status");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-blue-600" /> Registered Students
        </h1>
        <span className="text-sm text-gray-500">{users.length} total</span>
      </div>

      <input
        className="input-field max-w-sm mb-6"
        placeholder="Search by name, email, enrollment..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                { ["Name", "Email", "Enrollment No.", "Department", "Semester", "Status", "Joined", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-600 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      {u.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{u.enrollment_no || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{u.department || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{u.semester ? `Sem ${u.semester}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {u.is_active ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => showStudentInfo(u.id)} className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900" aria-label={`View ${u.name} information`}>
                        <Info className="h-4 w-4" /> Info
                      </button>
                      <button type="button" onClick={() => toggleStudentStatus(u)} disabled={updatingStudentId === u.id} className={`inline-flex items-center gap-1 disabled:opacity-50 ${u.is_active ? "text-red-700 hover:text-red-900" : "text-green-700 hover:text-green-900"}`} aria-label={`${u.is_active ? "Block" : "Unblock"} ${u.name}`}>
                        {u.is_active ? <Ban className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
                        {u.is_active ? "Block" : "Unblock"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <GraduationCap className="h-10 w-10 mx-auto mb-2" />
              No students found
            </div>
          )}
        </div>
      )}

      {(selectedStudent || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="student-info-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="student-info-title" className="text-xl font-semibold text-gray-900">Student information</h2>
                {selectedStudent && <p className="mt-1 text-sm text-gray-500">{selectedStudent.name}</p>}
              </div>
              <button type="button" onClick={() => setSelectedStudent(null)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label="Close student information">
                <X className="h-5 w-5" />
              </button>
            </div>
            {detailLoading ? <div className="flex justify-center py-8"><Spinner /></div> : selectedStudent && (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {[
                  ["Full name", selectedStudent.name],
                  ["Email", selectedStudent.email],
                  ["University", selectedStudent.university_name || "—"],
                  ["Age", selectedStudent.age ?? "—"],
                  ["Year of study", selectedStudent.academic_year ? `Year ${selectedStudent.academic_year}` : "—"],
                  ["Department or program", selectedStudent.department || "—"],
                  ["Enrollment number", selectedStudent.enrollment_no || "—"],
                  ["Semester", selectedStudent.semester ? `Semester ${selectedStudent.semester}` : "—"],
                  ["Account status", selectedStudent.is_active ? "Active" : "Blocked"],
                  ["Registered", new Date(selectedStudent.created_at).toLocaleString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase text-gray-500">{label}</dt>
                    <dd className="mt-1 break-words text-sm text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
