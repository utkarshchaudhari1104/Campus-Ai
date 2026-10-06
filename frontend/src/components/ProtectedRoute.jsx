import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const allowedRoles = role ? (Array.isArray(role) ? role : [role]) : [];
  if (allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "student" ? "/dashboard" : "/admin/dashboard"} replace />;
  }

  // children is the Layout component (StudentLayout / AdminLayout)
  // which renders <Outlet /> for nested routes
  return children;
}
