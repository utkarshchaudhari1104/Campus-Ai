import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, MessageSquare, History, BookOpen,
  Bell, HelpCircle, User, LogOut, GraduationCap
} from "lucide-react";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/chat", icon: MessageSquare, label: "AI Assistant" },
  { to: "/history", icon: History, label: "Chat History" },
  { to: "/documents", icon: BookOpen, label: "Documents" },
  { to: "/notices", icon: Bell, label: "Notices" },
  { to: "/faqs", icon: HelpCircle, label: "FAQs" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function StudentSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CampusAI</h1>
            <p className="text-blue-300 text-xs">University Assistant</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-blue-800">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-blue-300 text-xs truncate">{user?.department || "Student"}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-blue-700 text-white font-medium"
                  : "text-blue-200 hover:bg-blue-800 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-blue-200 hover:bg-blue-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
