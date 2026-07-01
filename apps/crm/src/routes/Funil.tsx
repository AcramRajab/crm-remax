import { useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Clock, Phone, LayoutGrid, List as ListIcon } from "lucide-react";
import { phaseLabel } from "../lib/mock";
import { timeAgo, scoreColor } from "../lib/format";

const brl = (v?: number | null) =>
  v == null ? null : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
import { useSession } from "../lib/session";
import { useStore } from "../lib/store";
import { Avatar } from "../components/Avatar";
import type { Lead } from "../lib/types";

type View = "kanban" | "lista";

export default function Funil() {
  const { user, canSeeAll } = useSession();
  const { leads: all, moveStage } = useStore();
  const leads = (canSeeAll ? all : all.filter((l) => l.owner_id === user.id)).filter((l) => l.status === "active");
  const [dragId, setDragId] = useState<string | null>(null);
  const [view, setView] = useState<View>("kanban");

  const move = moveStage;
  function drop(stageId: string) {
    if (!dragId) return;
    move(dragId, stageId);
    setDragId(null);
  }

  const phases: Array<"topo" | "meio" | "fundo"> = ["topo", "meio", "fundo"];

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Funil de vendas</h1>
          <p className="text-sm text-ink-soft">{leads.length} leads ativos · NOW Residence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4 text-xs">
            {phases.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-ink-soft">
                <span className={`w-2.5 h-2.5 rounded-sm ${p === "topo" ? "bg-sky-400" : p === "meio" ? "bg-amber-400" : "bg-emerald-500"}`} />
                {phaseLabel[p]}
              </span>
            ))}
          </div>
          {/* Seletor de visão */}
          <div className="flex items-center bg-surface-sunken rounded-lg p-0.5">
            <ViewBtn active={view === "kanban"} onClick={() => setView("kanban")} icon={LayoutGrid} label="Kanban" />
            <ViewBtn active={view === "lista"} onClick={() => setView("lista")} icon={ListIcon} label="Lista" />
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanView leads={leads} onDragStart={setDragId} onDrop={drop} />
      ) : (
        <ListaView leads={leads} onMove={move} />
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-surface text-ink shadow-card" : "text-ink-soft hover:text-ink"
      }`}
    >
      <Icon size={15} /> {label}
    </button>
  );
}

/* ---------------- KANBAN ---------------- */
function KanbanView({ leads, onDragStart, onDrop }: { leads: Lead[]; onDragStart: (id: string) => void; onDrop: (stageId: string) => void }) {
  const { stages } = useStore();
  const firstId = stages[0]?.id;
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => {
        const items = leads.filter((l) => (l.stage_id || firstId) === stage.id);
        const total = items.reduce((s, l) => s + (l.valor || 0), 0);
        return (
          <div key={stage.id} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(stage.id)} className="w-[300px] shrink-0">
            <div className="flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${stage.phase === "topo" ? "bg-sky-400" : stage.phase === "meio" ? "bg-amber-400" : "bg-emerald-500"}`} />
                <h3 className="text-sm font-semibold text-ink">{stage.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                {total > 0 && <span className="text-[11px] font-semibold text-emerald-600">{brl(total)}</span>}
                <span className="text-xs font-semibold text-ink-faint bg-surface-sunken rounded-full px-2 py-0.5">{items.length}</span>
              </div>
            </div>
            <div className="space-y-2.5 min-h-[120px]">
              {items.map((l) => <LeadCard key={l.id} lead={l} onDragStart={onDragStart} />)}
              {items.length === 0 && (
                <div className="text-center text-xs text-ink-faint border border-dashed border-line rounded-lg py-8">Solte um lead aqui</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadCard({ lead: l, onDragStart }: { lead: Lead; onDragStart: (id: string) => void }) {
  const { getMember } = useStore();
  const owner = getMember(l.owner_id);
  return (
    <Link
      to={`/leads/${l.id}`}
      draggable
      onDragStart={() => onDragStart(l.id)}
      className="card block p-3.5 hover:shadow-pop transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-ink text-[15px] leading-tight">{l.first_name} {l.last_name}</div>
        <span className={`chip ${scoreColor(l.score)}`}><Flame size={12} /> {l.score}</span>
      </div>
      <div className="text-xs text-brand font-medium mt-1">{l.persona}</div>
      {l.valor != null && <div className="text-sm font-bold text-emerald-600 mt-1">{brl(l.valor)}</div>}
      <div className="text-xs text-ink-faint mt-2 truncate">{l.lt_source}</div>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line">
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Avatar name={owner?.name || ""} size={20} />
          <span className="hidden xl:inline">{owner?.name.split(" ")[0]}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] text-ink-faint">
          <span className="flex items-center gap-1"><Phone size={12} /> {l.followup_count}/12</span>
          <span className="flex items-center gap-1"><Clock size={12} /> {timeAgo(l.last_activity)}</span>
        </div>
      </div>
    </Link>
  );
}

/* ---------------- LISTA (agrupada por etapa) ---------------- */
function ListaView({ leads, onMove }: { leads: Lead[]; onMove: (leadId: string, stageId: string) => void }) {
  const { stages, getMember } = useStore();
  const firstId = stages[0]?.id;
  return (
    <div className="space-y-5">
      {stages.map((stage) => {
        const items = leads.filter((l) => (l.stage_id || firstId) === stage.id);
        if (items.length === 0) return null;
        return (
          <div key={stage.id} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-muted/70 border-b border-line">
              <span className={`w-2 h-2 rounded-full ${stage.phase === "topo" ? "bg-sky-400" : stage.phase === "meio" ? "bg-amber-400" : "bg-emerald-500"}`} />
              <h3 className="text-sm font-semibold text-ink">{stage.name}</h3>
              <span className="text-xs text-ink-faint">· {phaseLabel[stage.phase]}</span>
              <span className="ml-auto text-xs font-semibold text-ink-faint bg-surface-sunken rounded-full px-2 py-0.5">{items.length}</span>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {items.map((l) => {
                  const owner = getMember(l.owner_id);
                  return (
                    <tr key={l.id} className="border-b border-line last:border-0 hover:bg-surface-muted/50">
                      <td className="px-4 py-2.5">
                        <Link to={`/leads/${l.id}`} className="font-semibold text-ink hover:text-brand">{l.first_name} {l.last_name}</Link>
                        <div className="text-xs text-brand">{l.persona}</div>
                      </td>
                      <td className="px-4 py-2.5 text-ink-soft hidden md:table-cell">{l.lt_source}</td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <span className="flex items-center gap-1.5 text-ink-soft text-xs">
                          <Avatar name={owner?.name || ""} size={20} />
                          {owner?.name.split(" ")[0]}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center"><span className={`chip ${scoreColor(l.score)}`}><Flame size={12} /> {l.score}</span></td>
                      <td className="px-4 py-2.5 text-xs text-ink-faint hidden lg:table-cell">{l.followup_count}/12 · {timeAgo(l.last_activity)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <select
                          value={l.stage_id || firstId}
                          onChange={(e) => onMove(l.id, e.target.value)}
                          className="appearance-none bg-surface-muted border border-line rounded-lg px-2 py-1 text-xs font-medium text-ink-soft cursor-pointer focus:outline-none focus:border-brand"
                          title="Mover de etapa"
                        >
                          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
