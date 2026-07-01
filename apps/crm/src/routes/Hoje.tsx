import { Link } from "react-router-dom";
import { CheckSquare, Square, Clock, AlertTriangle, CalendarDays, Phone } from "lucide-react";
import { useStore } from "../lib/store";
import { useSession } from "../lib/session";
import { Avatar } from "../components/Avatar";
import { dateLabel } from "../lib/format";

export default function Hoje() {
  const { tasks, toggleTask, getLead, getMember } = useStore();
  const { user, canSeeAll } = useSession();

  // tarefas dos leads visíveis ao papel atual
  const mine = tasks.filter((t) => {
    const lead = getLead(t.lead_id);
    if (!lead) return false;
    return canSeeAll || lead.owner_id === user.id;
  });

  const now = Date.now();
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const pending = mine.filter((t) => !t.done);

  const overdue = pending.filter((t) => new Date(t.due_at).getTime() < now);
  const today = pending.filter((t) => {
    const d = new Date(t.due_at).getTime();
    return d >= now && d <= endOfToday.getTime();
  });
  const upcoming = pending.filter((t) => new Date(t.due_at).getTime() > endOfToday.getTime());
  const done = mine.filter((t) => t.done);

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Hoje</h1>
        <p className="text-sm text-ink-soft">
          Seu próximo contato com cada lead. {pending.length} follow-ups pendentes
          {overdue.length > 0 && <span className="text-rose-500 font-medium"> · {overdue.length} atrasados</span>}.
        </p>
      </div>

      <Group title="Atrasadas" icon={AlertTriangle} tone="rose" tasks={overdue} toggle={toggleTask} getLead={getLead} />
      <Group title="Para hoje" icon={CalendarDays} tone="brand" tasks={today} toggle={toggleTask} getLead={getLead} />
      <Group title="Próximas" icon={Clock} tone="muted" tasks={upcoming} toggle={toggleTask} getLead={getLead} />

      {pending.length === 0 && (
        <div className="card p-10 text-center text-ink-soft">
          <CheckSquare className="mx-auto text-emerald-500 mb-2" /> Tudo em dia! Nenhum follow-up pendente.
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint mb-2">Concluídas</h2>
          {done.map((t) => {
            const lead = getLead(t.lead_id);
            return (
              <div key={t.id} className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-faint">
                <CheckSquare size={18} className="text-emerald-500 cursor-pointer" onClick={() => toggleTask(t.id)} />
                <span className="line-through">{t.title}</span>
                <span className="ml-auto">{lead?.first_name} {lead?.last_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Group({ title, icon: Icon, tone, tasks, toggle, getLead }: any) {
  const { getMember } = useStore();
  if (tasks.length === 0) return null;
  const toneClass = tone === "rose" ? "text-rose-500" : tone === "brand" ? "text-brand" : "text-ink-faint";
  return (
    <div className="mb-5">
      <h2 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide mb-2 ${toneClass}`}>
        <Icon size={14} /> {title} <span className="text-ink-faint">· {tasks.length}</span>
      </h2>
      <div className="card divide-y divide-line">
        {tasks.map((t: any) => {
          const lead = getLead(t.lead_id);
          const owner = lead && getMember(lead.owner_id);
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
              <button onClick={() => toggle(t.id)} className="text-ink-faint hover:text-brand">
                <Square size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink">{t.title}</div>
                {lead && (
                  <Link to={`/leads/${lead.id}`} className="text-xs text-brand hover:underline flex items-center gap-1">
                    {lead.first_name} {lead.last_name} · {lead.persona}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {lead && (
                  <span className="text-[11px] text-ink-faint flex items-center gap-1"><Phone size={11} /> {lead.followup_count}/12</span>
                )}
                <span className={`text-xs font-medium ${tone === "rose" ? "text-rose-500" : "text-ink-soft"}`}>{dateLabel(t.due_at)}</span>
                {owner && <Avatar name={owner.name} color={owner.avatar_color} size={22} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
