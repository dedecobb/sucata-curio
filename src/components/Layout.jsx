import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  List,
  LogOut,
  Recycle,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    to: "/nova-compra",
    label: "Nova Compra",
    icon: ShoppingCart,
    roles: ["ADMIN", "OPERADOR"],
  },
  {
    to: "/compras",
    label: "Historico",
    icon: List,
    roles: ["ADMIN", "OPERADOR"],
  },
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: TrendingUp,
    roles: ["ADMIN"],
  },
  {
    to: "/relatorios",
    label: "Relatorios",
    icon: BarChart3,
    roles: ["ADMIN"],
  },
  {
    to: "/materiais",
    label: "Materiais",
    icon: Settings,
    roles: ["ADMIN", "OPERADOR"],
  },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(profile?.role),
  );

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-gray-200 min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Recycle className="w-6 h-6 text-indigo-600" />
            <span className="font-bold text-gray-900 text-lg">
              Sucata Curio
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {profile?.nome || profile?.email}
          </p>
          <p className="text-xs text-gray-400">{profile?.role}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Recycle className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-gray-900">Sucata Curio</span>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                isActive ? "text-indigo-600" : "text-gray-500"
              }`
            }
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span className="truncate w-full text-center px-0.5">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
