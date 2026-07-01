import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft, Sparkles, Flame, Mail, Phone, MapPin, Send,
  MessageCircle, StickyNote, CheckSquare, Square, RefreshCw, ChevronDown,
  UserCheck, Trash2, RotateCcw, Leaf, Pencil, Plus, Tag, X,
} from "lucide-react";
import TrackingPanel from "../components/TrackingPanel";
import {
  dossies, messages as msgMap, activities as actMap,
} from "../lib/mock";

// Anotação real (crm_notas).
interface DbNote { id: string; body: string; created_at: string }
// Valor em R$ (pt-BR), sem centavos.
const brl = (v?: number | null) =>
  v == null ? null : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
import { useStore } from "../lib/store";
import { timeAgo, timeLabel, dateLabel, scoreColor } from "../lib/format";
import { Avatar } from "../components/Avatar";
import type { Message } from "../lib/types";

export default function LeadDetail() {
  const { id = "" } = useParams();
  const { getLead, getEmp, getMember, stages, members, reassign, moveStage, setStatus, updateLead, tasks: allTasks, toggleTask, addTask } = useStore();
  const lead = getLead(id);

  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [draft, setDraft] = useState("");
  const [msgs, setMsgs] = useState<Message[]>(msgMap[id] || []);
  const [discardReason, setDiscardReason] = useState("");
  const [showDiscard, setShowDiscard] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [notes, setNotes] = useState<DbNote[]>([]);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Carrega as anotações REAIS do lead (crm_notas, isolado por RLS).
  useEffect(() => {
    let on = true;
    supabase.from("crm_notas").select("id, body, created_at")
      .eq("lead_id", id).order("created_at", { ascending: false })
      .then(({ data }) => { if (on) setNotes((data as DbNote[]) || []); });
    return () => { on = false; };
  }, [id]);

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
  const acts = actMap[id] || [];
  const channelMsgs = msgs.filter((m) => m.channel === channel);

  function send() {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { id: "new" + m.length, channel, direction: "outbound", body: draft, at: new Date().toISOString(), status: "sent" }]);
    setDraft("");
  }

  async function saveNote() {
    const body = noteDraft.trim();
    if (!body || !lead) return;
    setSavingNote(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("crm_notas")
      .insert({ account_id: lead.account_id, lead_id: id, body, author_id: auth?.user?.id || null })
      .select("id, body, created_at").single();
    setSavingNote(false);
    if (error) { alert("Não consegui salvar a anotação: " + error.message); return; }
    if (data) { setNotes((n) => [data as DbNote, ...n]); setNoteDraft(""); }
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <Link to="/funil" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink mb-4">
        <ArrowLeft size={16} /> Voltar ao funil
      </Link>

      {lead.status !== "active" && (
        <div className="flex items-center justify-between gap-3 mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Leaf size={16} />
            <span><strong>Lead descartado</strong>{lead.discard_reason && ` · ${lead.discard_reason}`} — entrou em <strong>nutrição leve</strong> (automação no n8n). Se der sinal de vida, volta para o corretor.</span>
          </div>
          <button className="btn-outline !py-1.5 text-xs shrink-0" onClick={() => setStatus(id, "active")}>
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
            <div className="relative">
              <select value={lead.stage_id || stages[0]?.id || ""} onChange={(e) => moveStage(id, e.target.value)}
                className="appearance-none bg-brand-soft text-brand font-semibold rounded-lg pl-3 pr-8 py-1.5 text-sm cursor-pointer focus:outline-none">
                {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
            </div>
          </div>
        </div>

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
            <select value={lead.owner_id || ""} onChange={(e) => reassign(id, e.target.value)}
              className="appearance-none bg-transparent text-sm font-semibold text-ink cursor-pointer focus:outline-none pr-1">
              <option value="">— Não atribuído —</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <span className="text-[11px] text-ink-faint">atribuição manual · troque o responsável acima</span>
          <div className="flex-1" />
          {lead.status === "active" && (
            <button className="btn-ghost text-xs text-rose-500 hover:bg-rose-50" onClick={() => setShowDiscard(true)}>
              <Trash2 size={14} /> Descartar lead
            </button>
          )}
        </div>
      </div>

      {/* MODAL descartar */}
      {showDiscard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={() => setShowDiscard(false)}>
          <div className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-ink mb-1">Descartar lead</h3>
            <p className="text-xs text-ink-soft mb-3">O lead entra em nutrição leve. Escolha o motivo:</p>
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
                onClick={() => { setStatus(id, "discarded", discardReason); setShowDiscard(false); }}>
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

          {/* HUB OMNICHANNEL */}
          <section className="card overflow-hidden">
            <div className="flex border-b border-line">
              {(["whatsapp", "email"] as const).map((c) => (
                <button key={c} onClick={() => setChannel(c)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${channel === c ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
                  {c === "whatsapp" ? <MessageCircle size={15} /> : <Mail size={15} />}
                  {c === "whatsapp" ? "WhatsApp" : "E-mail"}
                </button>
              ))}
              <div className="flex-1" />
              <span className="self-center pr-4 text-[11px] text-ink-faint">Hub omnichannel · sem sair do CRM</span>
            </div>
            <div className="p-4 space-y-3 max-h-80 overflow-auto bg-surface-muted/40">
              {channelMsgs.length === 0 && <div className="text-center text-sm text-ink-faint py-8">Nenhuma mensagem neste canal ainda.</div>}
              {channelMsgs.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${m.direction === "outbound" ? "bg-brand text-brand-fg rounded-br-sm" : "bg-surface border border-line rounded-bl-sm"}`}>
                    <p>{m.body}</p>
                    <div className={`text-[10px] mt-1 ${m.direction === "outbound" ? "text-brand-fg/70" : "text-ink-faint"}`}>{timeLabel(m.at)}{m.status ? ` · ${m.status}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-line flex items-center gap-2">
              <input className="input" placeholder={channel === "whatsapp" ? "Mensagem de WhatsApp…" : "Escrever e-mail…"}
                value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} />
              <button className="btn-brand !px-3" onClick={send}><Send size={16} /></button>
            </div>
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

          {/* Notas */}
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink mb-3"><StickyNote size={16} className="text-brand" /> Anotações</h2>
            <div className="space-y-3">
              {notes.map((n) => (
                <div key={n.id} className="text-sm">
                  <p className="text-ink whitespace-pre-wrap">{n.body}</p>
                  <div className="text-[11px] text-ink-faint mt-1">{timeAgo(n.created_at)}</div>
                </div>
              ))}
              {notes.length === 0 && <p className="text-sm text-ink-faint">Sem anotações.</p>}
            </div>
            <textarea className="input mt-3 resize-none" rows={2} placeholder="Escrever anotação…"
              value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveNote(); }} />
            <button className="btn-brand w-full mt-2 !py-1.5 text-xs disabled:opacity-60"
              disabled={!noteDraft.trim() || savingNote} onClick={saveNote}>
              {savingNote ? "Salvando…" : "Salvar anotação"}
            </button>
          </section>

          {/* Atividades */}
          <section className="card p-5">
            <h2 className="font-semibold text-ink mb-3 text-sm uppercase tracking-wide text-ink-faint">Atividades</h2>
            <ol className="space-y-2.5">
              {acts.map((a) => (
                <li key={a.id} className="flex gap-2.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div><span className="text-ink">{a.text}</span><span className="text-[11px] text-ink-faint block">{timeAgo(a.at)}</span></div>
                </li>
              ))}
              {acts.length === 0 && <p className="text-sm text-ink-faint">Sem atividades ainda.</p>}
            </ol>
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
