import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard, FileText, Bell, HelpCircle,
  Users, LogOut, GraduationCap, Shield, UserRoundCog
} from "lucide-react";

const links = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/documents", icon: FileText, label: "Documents" },
  { to: "/admin/notices", icon: Bell, label: "Notices" },
  { to: "/admin/faqs", icon: HelpCircle, label: "FAQs" },
  { to: "/admin/users", icon: Users, label: "Students" },
  { to: "/admin/accounts", icon: UserRoundCog, label: "Accounts" },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col min-h-screen">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-orange-500 p-2 rounded-lg">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">CampusAI</h1>
            <p className="text-gray-400 text-xs">Admin Portal</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-800">
        <p className="text-sm font-medium">{user?.name}</p>
        <p className="text-gray-400 text-xs">Administrator</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-orange-600 text-white font-medium"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
