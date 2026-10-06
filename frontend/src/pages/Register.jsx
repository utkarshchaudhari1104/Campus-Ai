import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api";
import toast from "react-hot-toast";
import { ArrowLeft, Building2, GraduationCap } from "lucide-react";
import Spinner from "../components/Spinner";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  university_id: "",
  age: "",
  academic_year: "",
  enrollment_no: "",
  department: "",
  semester: "",
  location: "",
  address: "",
  official_email: "",
  phone: "",
  website: "",
  contact_name: "",
};

export default function Register() {
  const [accountType, setAccountType] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [universities, setUniversities] = useState([]);
  const [loadingUniversities, setLoadingUniversities] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, registerUniversity } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (accountType !== "student") return undefined;
    let cancelled = false;
    setLoadingUniversities(true);
    authAPI.getUniversities()
      .then((response) => {
        if (!cancelled) setUniversities(response.data);
      })
      .catch(() => {
        if (!cancelled) toast.error("Could not load registered universities");
      })
      .finally(() => {
        if (!cancelled) setLoadingUniversities(false);
      });
    return () => { cancelled = true; };
  }, [accountType]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleStudentSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        university_id: Number(form.university_id),
        age: Number(form.age),
        academic_year: Number(form.academic_year),
        enrollment_no: form.enrollment_no || null,
        department: form.department,
        semester: form.semester ? Number(form.semester) : null,
      });
      toast.success("Student account created");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleUniversitySubmit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await registerUniversity({
        name: form.name,
        location: form.location,
        address: form.address,
        official_email: form.official_email,
        phone: form.phone,
        website: form.website || null,
        contact_name: form.contact_name,
        password: form.password,
      });
      toast.success("University registered");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
        {accountType && (
          <button type="button" onClick={() => setAccountType(null)} className="mb-5 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-700">
            <ArrowLeft className="h-4 w-4" /> Choose account type
          </button>
        )}

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center bg-blue-100 p-3 rounded-full mb-3">
            {accountType === "university" ? <Building2 className="h-8 w-8 text-blue-600" /> : <GraduationCap className="h-8 w-8 text-blue-600" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {!accountType ? "Create an account" : accountType === "student" ? "Student registration" : "University registration"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {!accountType ? "Choose how you’ll use CampusAI" : accountType === "student" ? "Join your registered university" : "Create a university workspace"}
          </p>
        </div>

        {!accountType ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button type="button" onClick={() => setAccountType("student")} className="border border-gray-200 rounded-lg p-5 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <GraduationCap className="h-6 w-6 text-blue-700 mb-3" />
              <span className="block font-semibold text-gray-900">Register as a student</span>
              <span className="block text-sm text-gray-500 mt-1">Join a university already on CampusAI</span>
            </button>
            <button type="button" onClick={() => setAccountType("university")} className="border border-gray-200 rounded-lg p-5 text-left hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Building2 className="h-6 w-6 text-blue-700 mb-3" />
              <span className="block font-semibold text-gray-900">Register a university</span>
              <span className="block text-sm text-gray-500 mt-1">Set up your institution’s workspace</span>
            </button>
          </div>
        ) : accountType === "student" ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">University or college</label>
              <select className="input-field" value={form.university_id} onChange={(event) => updateField("university_id", event.target.value)} required disabled={loadingUniversities || universities.length === 0}>
                <option value="">{loadingUniversities ? "Loading universities..." : "Choose a registered institution"}</option>
                {universities.map((university) => <option key={university.id} value={university.id}>{university.name} · {university.location}</option>)}
              </select>
              {!loadingUniversities && universities.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">No universities are registered yet. <button type="button" className="text-blue-700 font-medium hover:underline" onClick={() => setAccountType("university")}>Register your university</button></p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input className="input-field" autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" className="input-field" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input type="number" className="input-field" min="13" max="100" value={form.age} onChange={(event) => updateField("age", event.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year of study</label>
                <select className="input-field" value={form.academic_year} onChange={(event) => updateField("academic_year", event.target.value)} required>
                  <option value="">Choose year</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => <option key={year} value={year}>Year {year}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department or program</label>
                <input className="input-field" value={form.department} onChange={(event) => updateField("department", event.target.value)} required minLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Enrollment number (optional)</label>
                <input className="input-field" value={form.enrollment_no} onChange={(event) => updateField("enrollment_no", event.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester (optional)</label>
                <select className="input-field" value={form.semester} onChange={(event) => updateField("semester", event.target.value)}>
                  <option value="">Choose semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} />
              </div>
            </div>
            <button type="submit" disabled={loading || loadingUniversities || universities.length === 0} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading ? <Spinner size="sm" /> : null}{loading ? "Creating account..." : "Create student account"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUniversitySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">University name</label>
                <input className="input-field" value={form.name} onChange={(event) => updateField("name", event.target.value)} required minLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City and region</label>
                <input className="input-field" value={form.location} onChange={(event) => updateField("location", event.target.value)} required minLength={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution address</label>
                <textarea className="input-field min-h-20 resize-y" value={form.address} onChange={(event) => updateField("address", event.target.value)} required minLength={5} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Official email and login</label>
                <input type="email" className="input-field" autoComplete="email" value={form.official_email} onChange={(event) => updateField("official_email", event.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input type="tel" className="input-field" autoComplete="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} required minLength={7} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (optional)</label>
                <input type="url" className="input-field" placeholder="https://" value={form.website} onChange={(event) => updateField("website", event.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Administrator name</label>
                <input className="input-field" autoComplete="name" value={form.contact_name} onChange={(event) => updateField("contact_name", event.target.value)} required minLength={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" className="input-field" autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input type="password" className="input-field" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => updateField("confirmPassword", event.target.value)} required minLength={8} />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {loading ? <Spinner size="sm" /> : null}{loading ? "Registering university..." : "Register university"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
