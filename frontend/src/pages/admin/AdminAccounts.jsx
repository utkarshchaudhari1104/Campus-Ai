import { useEffect, useState } from "react";
import { Search, Trash2, UserRoundCog } from "lucide-react";
import toast from "react-hot-toast";
import { adminAPI } from "../../api";
import Spinner from "../../components/Spinner";
import { useAuth } from "../../context/AuthContext";

export default function AdminAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    adminAPI.getAccounts()
      .then((response) => setAccounts(response.data))
      .catch((error) => toast.error(error.response?.data?.detail || "Could not load accounts"))
      .finally(() => setLoading(false));
  }, []);

  const filteredAccounts = accounts.filter((account) =>
    [account.name, account.email, account.role, account.university_name || ""]
      .some((value) => value.toLowerCase().includes(search.toLowerCase()))
  );

  const deleteAccount = async (account) => {
    if (!window.confirm(`Permanently delete ${account.name} (${account.email})? Their chat history will also be deleted.`)) return;

    setDeletingId(account.id);
    try {
      await adminAPI.deleteAccount(account.id);
      setAccounts((current) => current.filter((item) => item.id !== account.id));
      toast.success("Account deleted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not delete account");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <UserRoundCog className="h-6 w-6 text-blue-600" /> Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage registered student and administrator accounts. Passwords are never shown.</p>
        </div>
        <span className="text-sm text-gray-500">{accounts.length} total</span>
      </div>

      <label className="relative mb-5 block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input-field pl-9"
          placeholder="Search name, email, role, or university"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b bg-gray-50 text-gray-600">
              <tr>
                {["Name", "Email", "Role", "University", "Status", "Registered", ""].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{account.name}</td>
                  <td className="px-4 py-3 text-gray-600">{account.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-600">{account.role.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-600">{account.university_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${account.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                      {account.is_active ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(account.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => deleteAccount(account)}
                      disabled={deletingId === account.id || account.id === user?.id}
                      title={account.id === user?.id ? "You cannot delete your own account" : "Delete account"}
                      aria-label={`Delete ${account.name}'s account`}
                      className="rounded p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccounts.length === 0 && (
            <p className="py-12 text-center text-sm text-gray-500">
              {accounts.length ? "No accounts match your search." : "No accounts are registered."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}