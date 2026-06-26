import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  KanbanSquare, Users, BarChart3, Building2, Settings, CalendarCheck,
  Search, Bell, ChevronDown, Plus, UserCog, Plug, Menu, X, LogOut,
  MessageCircle, UserPlus, CheckSquare,
} from "lucide-react";
import { account } from "../lib/tenant";
import { empreendimentos, users } from "../lib/mock";
import { useSession, roleLabel } from "../lib/session";
import { useAuth } from "../lib/auth";
import { Avatar } from "./Avatar";
import NovoLeadModal from "./NovoLeadModal";

const nav = [
  { to: "/hoje", label: "Hoje", icon: CalendarCheck },
  { to: "/funil", label: "Funil", icon: KanbanSquare },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/empreendimentos", label: "Empreendimentos", icon: Building2 },
];

const notifications = [
  { icon: UserPlus, text: "Novo lead: Camila Reis (Universitário)", at: "há 20 min", color: "#0E4DA4" },
  { icon: MessageCircle, text: "Marina Albuquerque respondeu no WhatsApp", at: "há 12 min", color: "#25D366" },
  { icon: CheckSquare, text: "Follow-up atrasado: Eduardo Lima", at: "há 6 h", color: "#E11D48" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [empId, setEmpId] = useState(empreendimentos[0].id);
  const emp = empreendimentos.find((e) => e.id === empId)!;
  const { user, setUserId } = useSession();
  const { logout } = useAuth();
  const nav2 = useNavigate();

  const [drawer, setDrawer] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    nav2(`/leads?q=${encodeURIComponent(q)}`);
    setDrawer(false);
  }

  return (
    <div className="h-full flex">
      {/* Overlay mobile */}
      {drawer && <div className="fixed inset-0 bg-ink/40 z-30 lg:hidden" onClick={() => setDrawer(false)} />}

      {/* Sidebar */}
      <aside className={`w-64 shrink-0 border-r border-line bg-surface flex flex-col z-40 fixed lg:static inset-y-0 left-0 transition-transform ${drawer ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
          <span className="grid place-items-center w-9 h-9 rounded-lg bg-brand text-brand-fg font-display font-extrabold text-sm">
            {account.brand_name[0]}
          </span>
          <div className="leading-tight flex-1">
            <div className="font-display font-extrabold text-ink text-[15px]">{account.brand_name}</div>
            <div className="text-[11px] text-ink-faint">CRM · Marketing + Vendas</div>
          </div>
          <button className="lg:hidden text-ink-faint" onClick={() => setDrawer(false)}><X size={18} /></button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Vendas</div>
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} onClick={() => setDrawer(false)}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
              <n.icon size={18} /> {n.label}
            </NavLink>
          ))}
          <div className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Conta</div>
          <NavLink to="/integracoes" onClick={() => setDrawer(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Plug size={18} /> Integrações
          </NavLink>
          <NavLink to="/config" onClick={() => setDrawer(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <Settings size={18} /> Configurações
          </NavLink>
        </nav>

        <div className="p-3 border-t border-line">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <Avatar name={user.name} color={user.avatar_color} size={32} />
            <div className="leading-tight flex-1 min-w-0">
              <div className="text-sm font-semibold text-ink truncate">{user.name}</div>
              <div className="text-[11px] text-ink-faint">{roleLabel[user.role]}</div>
            </div>
            <button title="Sair" onClick={logout} className="text-ink-faint hover:text-rose-500"><LogOut size={16} /></button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 border-b border-line bg-surface flex items-center gap-3 px-4 md:px-6">
          <button className="lg:hidden text-ink-soft" onClick={() => setDrawer(true)}><Menu size={20} /></button>

          <div className="relative">
            <select value={empId} onChange={(e) => setEmpId(e.target.value)}
              className="appearance-none bg-surface-muted border border-line rounded-lg pl-3 pr-9 py-2 text-sm font-semibold text-ink cursor-pointer focus:outline-none focus:border-brand">
              {empreendimentos.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
          </div>
          <span className="text-xs text-ink-faint hidden xl:block">{emp.units_label}</span>

          <form onSubmit={search} className="relative hidden sm:block ml-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input !pl-9 w-56 xl:w-64" placeholder="Buscar lead, telefone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>

          <div className="flex items-center gap-2 sm:ml-2">
            <div className="relative hidden md:block" title="Ver como (papel) — demonstra a visibilidade por RLS">
              <select value={user.id} onChange={(e) => setUserId(e.target.value)}
                className="appearance-none bg-surface border border-line rounded-lg pl-8 pr-7 py-2 text-xs font-semibold text-ink-soft cursor-pointer focus:outline-none focus:border-brand">
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} · {roleLabel[u.role]}</option>)}
              </select>
              <UserCog size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
            </div>

            {/* Notificações */}
            <div className="relative">
              <button className="btn-ghost !px-2 relative" onClick={() => setShowNotif((s) => !s)}>
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand" />
              </button>
              {showNotif && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                  <div className="absolute right-0 mt-2 w-80 card shadow-pop z-40 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-line text-sm font-semibold text-ink">Notificações</div>
                    {notifications.map((n, i) => (
                      <div key={i} className="flex items-start gap-2.5 px-4 py-3 hover:bg-surface-muted border-b border-line last:border-0">
                        <span className="grid place-items-center w-7 h-7 rounded-lg text-white shrink-0" style={{ background: n.color }}><n.icon size={14} /></span>
                        <div className="text-sm text-ink">{n.text}<div className="text-[11px] text-ink-faint">{n.at}</div></div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="btn-brand" onClick={() => setShowNew(true)}><Plus size={16} /> <span className="hidden sm:inline">Novo lead</span></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {showNew && <NovoLeadModal onClose={() => setShowNew(false)} />}
    </div>
  );
}
