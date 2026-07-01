import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Sparkles, Flame, Mail, Phone, MapPin, Send,
  MessageCircle, StickyNote, CheckSquare, Square, RefreshCw, Trophy,
  UserCheck, Trash2, RotateCcw, Leaf, Pencil, Plus, Tag, X,
} from "lucide-react";
import TrackingPanel from "../components/TrackingPanel";
import { dossies } from "../lib/mock";

// Composer (abas tipo Pipedrive) + timeline (crm_atividades + crm_notas).
type CTab = "nota" | "atividade" | "chamada" | "whatsapp" | "email";
interface HistItem { id: string; type: "atividade" | "nota"; kind?: string; detail?: any; body?: string; at: string }
// Valor em R$ (pt-BR), sem centavos.
const brl = (v?: number | null) =>
  v == null ? null : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function histLabel(h: HistItem, getStage: (id: string) => any, getMember: (id: string) => any): string {
  if (h.type === "nota") return "📝 " + (h.body || "");
  const d = h.detail || {};
  switch (h.kind) {
    case "stage_change": return `➡️ Movido para "${getStage(d.to)?.name || "etapa"}"`;
    case "status":
      return d.status === "won" ? "🏆 Marcado como Ganho"
        : d.status === "active" ? "↩️ Reaberto"
        : "🍂 Marcado como Perdido" + (d.reason ? ` · ${d.reason}` : "");
    case "assign": return `👤 Responsável: ${getMember(d.owner_id)?.name || "definido"}`;
    case "chamada": return "📞 Ligação" + (d.nota ? ` · ${d.nota}` : "");
    case "whatsapp": return "💬 WhatsApp aberto";
    case "tarefa": return "✅ Tarefa: " + (d.title || "");
    default: return h.kind || "Evento";
  }
}
import { useStore } from "../lib/store";
import { timeAgo, dateLabel, scoreColor } from "../lib/format";
import { Avatar } from "../components/Avatar";

export default function LeadDetail() {
  const { id = "" } = useParams();
  const { getLead, getEmp, getMember, getStage, stages, members, reassign, moveStage, setStatus, updateLead, logActivity, tasks: allTasks, toggleTask, addTask } = useStore();
  const lead = getLead(id);

  const [emailSubj, setEmailSubj] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [discardReason, setDiscardReason] = useState("");
  const [showDiscard, setShowDiscard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [cTab, setCTab] = useState<CTab>("nota");
  const [hist, setHist] = useState<HistItem[]>([]);
  const [callNote, setCallNote] = useState("");

  // Timeline REAL: crm_atividades + crm_notas (isolados por RLS).
  const loadHist = useCallback(async () => {
    const [atv, nts] = await Promise.all([
      supabase.from("crm_atividades").select("id, kind, detail, created_at").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("crm_notas").select("id, body, created_at").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    const items: HistItem[] = [
      ...(((atv.data as any[]) || []).map((a) => ({ id: "a_" + a.id, type: "atividade" as const, kind: a.kind, detail: a.detail, at: a.created_at }))),
      ...(((nts.data as any[]) || []).map((n) => ({ id: "n_" + n.id, type: "nota" as const, body: n.body, at: n.created_at }))),
    ].sort((x, y) => (x.at < y.at ? 1 : -1));
    setHist(items);
  }, [id]);
  useEffect(() => { loadHist(); }, [loadHist]);

  if (!lead) {
    return (
      <div className="p-10 text-center text-ink-soft">
        Lead não encontrado. <Link className="text-brand" to="/funil">Voltar ao funil</Link>
      </div>
    );
  }

  const owner = getMember(lead.owner_id);
  const emp = getEmp(lead.empreendimento_id);
  const dossie = dossies[id];
  const tasks = allTasks.filter((t) => t.lead_id === id);
  const waHref = `https://wa.me/${(lead.phone || "").replace(/\D/g, "")}`;

  async function saveNote() {
    const body = noteDraft.trim();
    if (!body || !lead) return;
    setSavingNote(true);
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from("crm_notas")
      .insert({ account_id: lead.account_id, lead_id: id, body, author_id: auth?.user?.id || null });
    setSavingNote(false);
    if (error) { alert("Não consegui salvar a anotação: " + error.message); return; }
    setNoteDraft(""); loadHist();
  }

  // Registra ligação na timeline (sem telefonia integrada: log do resultado).
  async function registrarChamada() {
    const nota = callNote.trim();
    await logActivity(id, "chamada", { nota: nota || null });
    setCallNote(""); setCTab("nota"); loadHist();
  }

  // Registra que o WhatsApp foi aberto (abre o wa.me em nova aba).
  function abrirWhatsApp() {
    logActivity(id, "whatsapp", {}).then(loadHist);
    window.open(waHref, "_blank");
  }

  // Ações que também registram na timeline.
  const doStage = (sid: string) => { moveStage(id, sid); logActivity(id, "stage_change", { to: sid }).then(loadHist); };
  const doWon = () => { setStatus(id, "won"); logActivity(id, "status", { status: "won" }).then(loadHist); };
  const doReactivate = () => { setStatus(id, "active"); logActivity(id, "status", { status: "active" }).then(loadHist); };
  const doReassign = (v: string) => { reassign(id, v); logActivity(id, "assign", { owner_id: v }).then(loadHist); };
  const doLost = (reason: string) => { setStatus(id, "discarded", reason); logActivity(id, "status", { status: "discarded", reason }).then(loadHist); };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link to="/funil" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={16} /> Voltar ao funil
      </Link>

      {lead.status === "won" && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-emerald-800">
            <Trophy size={16} />
            <span><strong>Negócio ganho</strong> 🎉{lead.valor != null && ` · ${brl(lead.valor)}`}</span>
          </div>
          <button className="btn-outline !py-1.5 text-xs shrink-0" onClick={doReactivate}>
            <RotateCcw size={14} /> Reabrir
          </button>
        </div>
      )}

      {(lead.status === "lost" || lead.status === "discarded") && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Leaf size={16} />
            <span><strong>Lead perdido</strong>{lead.discard_reason && ` · ${lead.discard_reason}`} — entrou em <strong>nutrição leve</strong> (sequência automática). Se der sinal de vida, volta para o corretor.</span>
          </div>
          <button className="btn-outline !py-1.5 text-xs shrink-0" onClick={doReactivate}>
            <RotateCcw size={14} /> Reativar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="card p-5 mb-5">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="flex items-center gap-3">
            <Avatar name={`${lead.first_name} ${lead.last_name}`} size={48} />
            <div>
              <h1 className="font-display text-xl font-extrabold text-ink leading-tight flex items-center gap-2">
                {lead.first_name} {lead.last_name}
                <button onClick={() => setShowEdit(true)} className="text-ink-faint hover:text-brand"><Pencil size={14} /></button>
              </h1>
              <div className="flex items-center gap-2 flex-wrap text-sm text-ink-soft mt-0.5">
                <span className="text-brand font-medium">{lead.persona}</span>
                <span className="text-line">·</span>
                <span>{emp?.name}</span>
                {lead.channel && (
                  <span className={`chip ${lead.channel === "whatsapp" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"}`}>
                    {lead.channel === "whatsapp" ? <><MessageCircle size={11} /> via WhatsApp</> : <><MapPin size={11} /> via Formulário</>}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`chip ${scoreColor(lead.score)} !text-sm !px-3 !py-1`}><Flame size={14} /> Score {lead.score}</span>
            <button onClick={() => setShowEdit(true)} title="Editar valor do negócio"
              className="chip bg-emerald-100 text-emerald-700 hover:bg-emerald-200 !text-sm !px-3 !py-1">
              {lead.valor != null ? brl(lead.valor) : "+ Valor"}
            </button>
            {lead.status === "active" && (
              <div className="flex items-center gap-2">
                <button onClick={doWon}
                  className="btn !py-1.5 !px-3.5 text-sm bg-emerald-600 text-white hover:bg-emerald-700"><Trophy size={15} /> Ganho</button>
                <button onClick={() => setShowDiscard(true)}
                  className="btn !py-1.5 !px-3.5 text-sm bg-rose-500 text-white hover:bg-rose-600">Perdido</button>
              </div>
            )}
          </div>
        </div>

        {/* Barra de etapas (Pipedrive-like) */}
        {stages.length > 0 && (
          <div className="flex items-stretch gap-1 mt-4">
            {stages.map((s, i) => {
              const curIdx = stages.findIndex((x) => x.id === (lead.stage_id || stages[0]?.id));
              const filled = i <= curIdx && lead.status === "active";
              const disabled = lead.status !== "active";
              return (
                <button key={s.id} disabled={disabled} onClick={() => doStage(s.id)} title={s.name}
                  className={`flex-1 min-w-0 truncate text-[11px] font-semibold py-2 px-1 rounded transition-colors ${filled ? "bg-brand text-brand-fg" : "bg-surface-sunken text-ink-soft hover:bg-surface-muted"} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}>
                  {s.name}
                </button>
              );
            })}
          </div>
        )}

        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {lead.tags.map((t) => <span key={t} className="chip bg-surface-sunken text-ink-soft"><Tag size={11} /> {t}</span>)}
          </div>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-1.5 mt-4 pt-4 border-t border-line text-sm text-ink-soft">
          <span className="flex items-center gap-1.5"><Phone size={14} /> {lead.phone}</span>
          <span className="flex items-center gap-1.5"><Mail size={14} /> {lead.email || "—"}</span>
          <span className="flex items-center gap-1.5"><MapPin size={14} /> Origem: {lead.ft_source}</span>
          <span className="flex items-center gap-1.5"><Phone size={14} /> {lead.followup_count}/12 follow-ups</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <div className="flex items-center gap-2 rounded-lg border border-line pl-2.5 pr-1.5 py-1">
            <UserCheck size={14} className="text-ink-faint" />
            <span className="text-xs text-ink-faint">Responsável</span>
            <select value={lead.owner_id || ""} onChange={(e) => doReassign(e.target.value)}
              className="appearance-none bg-transparent text-sm font-semibold text-ink cursor-pointer focus:outline-none pr-1">
              <option value="">— Não atribuído —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <span className="text-[11px] text-ink-faint">atribuição manual · troque o responsável acima</span>
        </div>
      </div>

      {/* MODAL descartar */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setShowDiscard(false)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink mb-1">Marcar como perdido</h3>
            <p className="text-xs text-ink-soft mb-3">O lead entra em nutrição leve (sequência automática). Escolha o motivo:</p>
            <div className="space-y-1.5 mb-4">
              {["Sem resposta após follow-ups", "Sem perfil / fora do ICP", "Comprou com concorrente", "Sem orçamento", "Contato inválido"].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-ink cursor-pointer p-1.5 rounded hover:bg-surface-muted">
                  <input type="radio" name="reason" className="accent-brand" onChange={() => setDiscardReason(r)} /> {r}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setShowDiscard(false)}>Cancelar</button>
              <button className="btn flex-1 bg-rose-500 text-white hover:bg-rose-600" disabled={!discardReason}
                onClick={() => { doLost(discardReason); setShowDiscard(false); }}>
                <Trash2 size={15} /> Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL editar */}
      {showEdit && <EditModal lead={lead} onClose={() => setShowEdit(false)} onSave={(patch) => { updateLead(id, patch); setShowEdit(false); }} />}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* DOSSIÊ IA */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-brand-soft text-brand"><Sparkles size={15} /></span>
                Dossiê do lead <span className="text-xs font-normal text-ink-faint">· gerado por IA</span>
              </h2>
              <button className="btn-ghost !px-2 text-xs"><RefreshCw size={13} /> Atualizar</button>
            </div>
            {dossie ? (
              <div className="space-y-3">
                <p className="text-sm text-ink leading-relaxed">{dossie.summary}</p>
                <div className="rounded-lg bg-brand-soft/60 border border-brand/15 p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-brand mb-1">Ângulo de abordagem</div>
                  <p className="text-sm text-ink leading-relaxed">{dossie.angle}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {dossie.signals.map((s, i) => <span key={i} className="chip bg-surface-sunken text-ink-soft">{s}</span>)}
                </div>
                <div className="text-[11px] text-ink-faint">{dossie.model} · {timeAgo(dossie.generated_at)}</div>
              </div>
            ) : (
              <div className="text-sm text-ink-soft bg-surface-muted rounded-lg p-4 text-center">
                Dossiê em geração… <span className="text-ink-faint">(roda na entrada do lead, via n8n + OpenRouter)</span>
              </div>
            )}
          </section>

          {/* COMPORTAMENTO & TRACKING */}
          <TrackingPanel leadId={id} />

          {/* COMPOSER (abas tipo Pipedrive) */}
          <section className="card overflow-hidden">
            <div className="flex border-b border-line overflow-x-auto">
              {([
                ["nota", "Anotação", StickyNote],
                ["atividade", "Atividade", CheckSquare],
                ["chamada", "Chamada", Phone],
                ["whatsapp", "WhatsApp", MessageCircle],
                ["email", "E-mail", Mail],
              ] as const).map(([tid, label, Icon]) => (
                <button key={tid} onClick={() => setCTab(tid)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${cTab === tid ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <div className="p-4">
              {cTab === "nota" && (
                <>
                  <textarea className="input resize-none" rows={3} placeholder="Escrever anotação…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
                  <button className="btn-brand mt-2 !py-1.5 text-xs disabled:opacity-60" disabled={!noteDraft.trim() || savingNote} onClick={saveNote}>{savingNote ? "Salvando…" : "Salvar anotação"}</button>
                </>
              )}
              {cTab === "atividade" && (
                <AddTask onAdd={(title, due) => { addTask(id, title, due); logActivity(id, "tarefa", { title }).then(loadHist); setCTab("nota"); }} onCancel={() => setCTab("nota")} />
              )}
              {cTab === "chamada" && (
                <div className="space-y-2">
                  <a href={`tel:${(lead.phone || "").replace(/[^\d+]/g, "")}`} className="btn-outline w-full justify-center"><Phone size={15} /> Ligar para {lead.phone || "—"}</a>
                  <textarea className="input resize-none" rows={2} placeholder="Resultado da ligação…" value={callNote} onChange={(e) => setCallNote(e.target.value)} />
                  <button className="btn-brand !py-1.5 text-xs" onClick={registrarChamada}>Registrar ligação</button>
                </div>
              )}
              {cTab === "whatsapp" && (
                <div className="space-y-2">
                  <p className="text-sm text-ink-soft">Abre a conversa no WhatsApp com <strong>{lead.phone || "—"}</strong> e registra na timeline.</p>
                  <button className="btn w-full justify-center text-white" style={{ background: "#25D366" }} onClick={abrirWhatsApp}><MessageCircle size={15} /> Abrir WhatsApp</button>
                </div>
              )}
              {cTab === "email" && (
                <div className="space-y-2">
                  <input className="input" placeholder="Assunto" value={emailSubj} onChange={(e) => setEmailSubj(e.target.value)} />
                  <textarea className="input resize-none" rows={4} placeholder="Escrever e-mail…" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <button className="btn-brand !py-1.5 text-xs opacity-60 cursor-not-allowed" disabled title="Fase 4">Enviar (em breve)</button>
                    <span className="text-[11px] text-ink-faint">Envio via Resend chega na Fase 4.</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* HISTÓRICO (timeline real) */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink mb-3 text-sm uppercase tracking-wide text-ink-faint">Histórico</h2>
            {hist.length === 0 ? (
              <p className="text-sm text-ink-faint">Sem histórico ainda. Anotações, ligações e mudanças aparecem aqui.</p>
            ) : (
              <ol className="space-y-3">
                {hist.map((h) => (
                  <li key={h.id} className="flex gap-2.5 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-ink whitespace-pre-wrap">{histLabel(h, getStage, getMember)}</div>
                      <div className="text-[11px] text-ink-faint">{timeAgo(h.at)}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          {/* Tarefas */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink mb-3"><CheckSquare size={16} className="text-brand" /> Próximos contatos</h2>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2.5 text-sm group">
                  <button onClick={() => toggleTask(t.id)}>
                    {t.done ? <CheckSquare size={18} className="text-brand mt-0.5" /> : <Square size={18} className="text-ink-faint mt-0.5 group-hover:text-brand" />}
                  </button>
                  <div className="flex-1">
                    <span className={t.done ? "line-through text-ink-faint" : "text-ink"}>{t.title}</span>
                    <span className="block text-[11px] text-ink-faint">{dateLabel(t.due_at)}</span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-ink-faint">Sem tarefas. Agende o próximo follow-up.</p>}
            </div>
            {showAddTask ? (
              <AddTask onAdd={(title, due) => { addTask(id, title, due); setShowAddTask(false); }} onCancel={() => setShowAddTask(false)} />
            ) : (
              <button className="btn-outline w-full mt-3 !py-1.5 text-xs" onClick={() => setShowAddTask(true)}><Plus size={13} /> Agendar follow-up</button>
            )}
          </section>

          {/* Indicação (corretor externo que trouxe o lead) */}
          {lead.indicador && (lead.indicador.nome || lead.indicador.imobiliaria) && (
            <section className="card p-5 border-brand/30">
              <h2 className="flex items-center gap-2 font-semibold text-ink mb-3 text-sm uppercase tracking-wide text-brand">
                <UserCheck size={15} /> Indicado por
              </h2>
              <div className="space-y-2 text-sm">
                {lead.indicador.nome && <Row k="Corretor" v={lead.indicador.nome} />}
                {lead.indicador.imobiliaria && <Row k="Imobiliária" v={lead.indicador.imobiliaria} />}
                {lead.indicador.telefone && <Row k="Telefone" v={lead.indicador.telefone} cap={false} />}
                {lead.corretor_ref && <Row k="Código" v={lead.corretor_ref} cap={false} />}
              </div>
            </section>
          )}

          {/* Atribuição */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink mb-3 text-sm uppercase tracking-wide text-ink-faint">Atribuição</h2>
            <div className="space-y-2 text-sm">
              <Row k="First-touch" v={lead.ft_source} />
              <Row k="Last-touch" v={lead.lt_source} />
              <Row k="Origem" v={lead.origin} />
              {lead.channel && <Row k="Canal" v={lead.channel} />}
              <Row k="Responsável" v={owner?.name || "—"} />
              <Row k="Criado" v={timeAgo(lead.created_at)} />
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

function AddTask({ onAdd, onCancel }: { onAdd: (title: string, dueIso: string) => void; onCancel: () => void }) {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(tomorrow);
  return (
    <div className="mt-3 space-y-2">
      <input className="input" placeholder="Ex.: 5º contato — ligar" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
      <div className="flex gap-2">
        <button className="btn-outline flex-1 !py-1.5 text-xs" onClick={onCancel}>Cancelar</button>
        <button className="btn-brand flex-1 !py-1.5 text-xs" disabled={!title.trim()}
          onClick={() => onAdd(title, new Date(due + "T12:00:00").toISOString())}>Adicionar</button>
      </div>
    </div>
  );
}

function EditModal({ lead, onClose, onSave }: { lead: any; onClose: () => void; onSave: (patch: any) => void }) {
  const [f, setF] = useState({
    first_name: lead.first_name, last_name: lead.last_name, email: lead.email, phone: lead.phone,
    valor: lead.valor != null ? String(lead.valor) : "",
    tags: (lead.tags || []).join(", "),
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink">Editar lead</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-semibold text-ink-soft mb-1">Nome</label><input className="input" value={f.first_name} onChange={(e) => set("first_name", e.target.value)} /></div>
            <div><label className="block text-xs font-semibold text-ink-soft mb-1">Sobrenome</label><input className="input" value={f.last_name} onChange={(e) => set("last_name", e.target.value)} /></div>
          </div>
          <div><label className="block text-xs font-semibold text-ink-soft mb-1">E-mail</label><input className="input" value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-ink-soft mb-1">WhatsApp</label><input className="input" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          <div><label className="block text-xs font-semibold text-ink-soft mb-1">Valor do negócio (R$)</label><input className="input" type="number" min="0" step="1000" value={f.valor} onChange={(e) => set("valor", e.target.value)} placeholder="Ex.: 450000" /></div>
          <div><label className="block text-xs font-semibold text-ink-soft mb-1">Tags (separadas por vírgula)</label><input className="input" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="quente, investidor, 2 dorm" /></div>
          <div className="flex gap-2 pt-1">
            <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
            <button className="btn-brand flex-1" onClick={() => onSave({
              first_name: f.first_name, last_name: f.last_name, email: f.email, phone: f.phone,
              valor: f.valor === "" ? null : Number(f.valor),
              tags: f.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
            })}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, cap = true }: { k: string; v: string; cap?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-faint shrink-0">{k}</span>
      <span className={`text-ink font-medium text-right ${cap ? "capitalize" : ""}`}>{v}</span>
    </div>
  );
}
