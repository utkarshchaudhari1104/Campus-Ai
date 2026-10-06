import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentLayout from "./components/StudentLayout";
import AdminLayout from "./components/AdminLayout";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/student/Dashboard";
import Chat from "./pages/student/Chat";
import History from "./pages/student/History";
import Documents from "./pages/student/Documents";
import Notices from "./pages/student/Notices";
import FAQs from "./pages/student/FAQs";
import Profile from "./pages/student/Profile";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminFAQs from "./pages/admin/AdminFAQs";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAccounts from "./pages/admin/AdminAccounts";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Student routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute role="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="history" element={<History />} />
            <Route path="documents" element={<Documents />} />
            <Route path="notices" element={<Notices />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role={["admin", "university_admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="documents" element={<AdminDocuments />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="faqs" element={<AdminFAQs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="accounts" element={<AdminAccounts />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
