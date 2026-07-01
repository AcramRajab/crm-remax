import { useState, useEffect, useCallback } from "react";
import {
  Mail, Plus, Check, Info, Trash2, X, Loader2, Power, Zap, ArrowDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";

/* ---- Catálogo de gatilhos e ações (igual ActiveCampaign) ---- */
// exec:false = aparece no builder mas ainda não dispara (falta infra).
const GATILHOS: { id: string; label: string; exec: boolean }[] = [
  { id: "lead_criado", label: "Lead criado", exec: true },
  { id: "tag_adicionada", label: "Tag adicionada", exec: true },
  { id: "tag_removida", label: "Tag removida", exec: true },
  { id: "score_limite", label: "Score atingiu limite", exec: true },
  { id: "status_alterado", label: "Status alterado", exec: true },
  { id: "email_aberto", label: "Email aberto", exec: false },
  { id: "link_clicado", label: "Link clicado", exec: false },
  { id: "evento_customizado", label: "Evento customizado", exec: false },
  { id: "agendado", label: "Agendado", exec: false },
];
const ACOES: { id: string; label: string; exec: boolean }[] = [
  { id: "enviar_email", label: "Enviar email", exec: true },
  { id: "adicionar_tag", label: "Adicionar tag", exec: true },
  { id: "remover_tag", label: "Remover tag", exec: true },
  { id: "atualizar_campo", label: "Atualizar campo", exec: true },
  { id: "alterar_score", label: "Alterar score", exec: true },
  { id: "aguardar", label: "Aguardar", exec: true },
  { id: "webhook", label: "Webhook", exec: true },
  { id: "notificar", label: "Notificar", exec: true },
  { id: "add_segmento", label: "Adicionar ao segmento", exec: false },
  { id: "remove_segmento", label: "Remover do segmento", exec: false },
];
const gLabel = (id: string) => GATILHOS.find((g) => g.id === id)?.label || id;

interface Auto { id: string; account_id: string; nome: string; gatilho: string; gatilho_config: any; ativo: boolean }
interface Acao { id?: string; tipo: string; config: any }

export default function Automacoes() {
  return (
    <div className="p-6 max-w-[980px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Automações</h1>
        <p className="text-sm text-ink-soft">Gatilho → ações. Rodam sozinhas quando o evento acontece.</p>
      </div>
      <EmailConfig />
      <Lista />
    </div>
  );
}

/* ---------------- Config de e-mail ---------------- */
function EmailConfig() {
  const [accId, setAccId] = useState<string | null>(null);
  const [from, setFrom] = useState(""); const [nome, setNome] = useState(""); const [ativo, setAtivo] = useState(false);
  const [loading, setLoading] = useState(true); const [saved, setSaved] = useState(false);
  useEffect(() => {
    supabase.from("core_contas").select("id, email_remetente, email_remetente_nome, email_ativo").limit(1).single()
      .then(({ data }) => { if (data) { setAccId(data.id); setFrom(data.email_remetente || ""); setNome(data.email_remetente_nome || ""); setAtivo(!!data.email_ativo); } setLoading(false); });
  }, []);
  async function save() {
    if (!accId) return;
    // Limpa barra/espaços sobrando (ex.: "contato@dominio.com/").
    const cleanFrom = from.trim().replace(/[\s/]+$/g, "").replace(/^\s+/, "");
    if (cleanFrom && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanFrom)) {
      alert("O e-mail de envio parece inválido: " + cleanFrom);
      return;
    }
    setFrom(cleanFrom);
    await supabase.from("core_contas").update({ email_remetente: cleanFrom || null, email_remetente_nome: nome.trim() || null, email_ativo: ativo }).eq("id", accId);
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }
  if (loading) return <div className="card p-5 mb-5 text-sm text-ink-faint">Carregando…</div>;
  return (
    <div className="card p-5 mb-5">
      <h2 className="flex items-center gap-2 font-semibold text-ink"><Mail size={16} className="text-brand" /> Configuração de e-mail</h2>
      <p className="text-xs text-ink-soft mb-4 mt-0.5">Remetente da conta (envio via Resend). Necessário para a ação "Enviar email".</p>
      <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
        <Info size={15} className="shrink-0 mt-0.5" /> Envio real precisa do domínio verificado no Resend + <strong>RESEND_API_KEY</strong> no Worker.
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label className="block text-xs font-semibold text-ink-soft mb-1">E-mail de envio</label><input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="contato@nowresidence.com.br" /></div>
        <div><label className="block text-xs font-semibold text-ink-soft mb-1">Nome do remetente</label><input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="NOW Residence · RE/MAX" /></div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-ink cursor-pointer">
        <input type="checkbox" className="accent-brand w-4 h-4" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Envio de e-mail ativo
      </label>
      <button className="btn-brand mt-4" onClick={save}>{saved ? <><Check size={16} /> Salvo</> : <><Check size={16} /> Salvar configuração</>}</button>
    </div>
  );
}

/* ---------------- Lista de automações ---------------- */
function Lista() {
  const [autos, setAutos] = useState<Auto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Auto | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("crm_automacoes").select("*").order("created_at", { ascending: true });
    setAutos((data as Auto[]) || []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function nova() {
    const { data: conta } = await supabase.from("core_contas").select("id").limit(1).single();
    if (!conta) return;
    const { data } = await supabase.from("crm_automacoes").insert({ account_id: conta.id, nome: "Nova automação", gatilho: "lead_criado", gatilho_config: {}, ativo: false }).select("*").single();
    if (data) { await load(); setEditing(data as Auto); }
  }
  async function toggle(a: Auto) {
    await supabase.from("crm_automacoes").update({ ativo: !a.ativo, updated_at: new Date().toISOString() }).eq("id", a.id); load();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div><h2 className="font-semibold text-ink">Automações</h2><p className="text-xs text-ink-soft">Cada automação: um gatilho e uma sequência de ações.</p></div>
        <button className="btn-brand !py-1.5 text-xs" onClick={nova}><Plus size={14} /> Nova automação</button>
      </div>
      {loading ? <p className="text-sm text-ink-faint">Carregando…</p> : autos.length === 0 ? (
        <p className="text-sm text-ink-faint">Nenhuma automação ainda. Crie a primeira.</p>
      ) : (
        <div className="space-y-2">
          {autos.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-line">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{a.nome}</div>
                <div className="text-xs text-ink-faint flex items-center gap-1"><Zap size={11} /> {gLabel(a.gatilho)}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggle(a)} className={`chip ${a.ativo ? "bg-emerald-100 text-emerald-700" : "bg-surface-sunken text-ink-faint"}`}><Power size={12} /> {a.ativo ? "Ativa" : "Inativa"}</button>
                <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setEditing(a)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {editing && <Builder auto={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

/* ---------------- Builder (gatilho + ações) ---------------- */
function Builder({ auto, onClose, onSaved }: { auto: Auto; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(auto.nome);
  const [gatilho, setGatilho] = useState(auto.gatilho);
  const [gConfig, setGConfig] = useState<any>(auto.gatilho_config || {});
  const [ativo, setAtivo] = useState(auto.ativo);
  const [acoes, setAcoes] = useState<Acao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("crm_automacao_acoes").select("id, tipo, config").eq("automacao_id", auto.id).order("posicao", { ascending: true })
      .then(({ data }) => { setAcoes((data as Acao[]) || []); setLoading(false); });
  }, [auto.id]);

  const gExec = GATILHOS.find((g) => g.id === gatilho)?.exec;
  const setAcao = (i: number, patch: Partial<Acao>) => setAcoes((a) => a.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const setAcaoCfg = (i: number, cfg: any) => setAcao(i, { config: { ...acoes[i].config, ...cfg } });

  async function salvar() {
    setBusy(true);
    await supabase.from("crm_automacoes").update({ nome, gatilho, gatilho_config: gConfig, ativo, updated_at: new Date().toISOString() }).eq("id", auto.id);
    await supabase.from("crm_automacao_acoes").delete().eq("automacao_id", auto.id);
    const rows = acoes.map((a, idx) => ({ account_id: auto.account_id, automacao_id: auto.id, posicao: idx, tipo: a.tipo, config: a.config || {} }));
    if (rows.length) await supabase.from("crm_automacao_acoes").insert(rows);
    setBusy(false); onSaved();
  }
  async function excluir() {
    if (!confirm("Excluir esta automação?")) return;
    await supabase.from("crm_automacoes").delete().eq("id", auto.id); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <h3 className="font-semibold text-ink">Automação</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          {/* GATILHO */}
          <div className="card p-4 bg-surface-muted/40">
            <h4 className="font-semibold text-ink mb-1">Gatilho</h4>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Quando executar</label>
            <select className="input" value={gatilho} onChange={(e) => { setGatilho(e.target.value); setGConfig({}); }}>
              {GATILHOS.map((g) => <option key={g.id} value={g.id}>{g.label}{g.exec ? "" : " (requer integração)"}</option>)}
            </select>
            <GatilhoConfig gatilho={gatilho} config={gConfig} onChange={setGConfig} />
            {!gExec && <p className="text-[11px] text-amber-700 mt-2">Esse gatilho ainda não dispara sozinho (depende de integração). Fica salvo para quando ligarmos.</p>}
          </div>

          {/* AÇÕES */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-ink">Ações</h4>
            </div>
            {loading ? <p className="text-sm text-ink-faint">Carregando…</p> : (
              <div className="space-y-2">
                {acoes.map((a, i) => (
                  <div key={i}>
                    {i > 0 && <div className="flex justify-center text-ink-faint"><ArrowDown size={14} /></div>}
                    <div className="card p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <select className="input !py-1.5 text-sm flex-1" value={a.tipo} onChange={(e) => setAcao(i, { tipo: e.target.value, config: {} })}>
                          {ACOES.map((o) => <option key={o.id} value={o.id}>{o.label}{o.exec ? "" : " (em breve)"}</option>)}
                        </select>
                        <button className="text-rose-500 hover:text-rose-600" onClick={() => setAcoes((x) => x.filter((_, idx) => idx !== i))}><Trash2 size={14} /></button>
                      </div>
                      <AcaoConfig acao={a} onChange={(cfg) => setAcaoCfg(i, cfg)} />
                    </div>
                  </div>
                ))}
                <button className="btn-outline w-full !py-1.5 text-xs" onClick={() => setAcoes((a) => [...a, { tipo: "enviar_email", config: {} }])}><Plus size={13} /> Adicionar ação</button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" className="accent-brand w-4 h-4" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Automação ativa
          </label>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-line sticky bottom-0 bg-surface">
          <button className="btn-ghost text-rose-500 hover:bg-rose-50 text-sm" onClick={excluir}><Trash2 size={15} /> Excluir</button>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn-brand disabled:opacity-60" disabled={busy} onClick={salvar}>{busy ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Check size={16} /> Salvar automação</>}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GatilhoConfig({ gatilho, config, onChange }: { gatilho: string; config: any; onChange: (c: any) => void }) {
  if (gatilho === "score_limite") return (
    <div className="mt-2"><label className="block text-xs font-semibold text-ink-soft mb-1">Limite de score</label>
      <input className="input" type="number" value={config.limite ?? ""} onChange={(e) => onChange({ ...config, limite: Number(e.target.value) })} placeholder="Ex.: 70" /></div>
  );
  if (gatilho === "tag_adicionada") return (
    <div className="mt-2"><label className="block text-xs font-semibold text-ink-soft mb-1">Tag (opcional — vazio = qualquer)</label>
      <input className="input" value={config.tag ?? ""} onChange={(e) => onChange({ ...config, tag: e.target.value })} placeholder="Ex.: cliente-vip" /></div>
  );
  if (gatilho === "status_alterado") return (
    <div className="mt-2"><label className="block text-xs font-semibold text-ink-soft mb-1">Status (opcional)</label>
      <select className="input" value={config.status ?? ""} onChange={(e) => onChange({ ...config, status: e.target.value })}>
        <option value="">Qualquer mudança</option><option value="active">Ativo</option><option value="won">Ganho</option><option value="discarded">Perdido</option>
      </select></div>
  );
  return null;
}

function AcaoConfig({ acao, onChange }: { acao: Acao; onChange: (c: any) => void }) {
  const c = acao.config || {};
  const f = (label: string, node: React.ReactNode) => <div><label className="block text-xs font-semibold text-ink-soft mb-1">{label}</label>{node}</div>;
  switch (acao.tipo) {
    case "enviar_email":
      return <div className="space-y-2">
        {f("Assunto", <input className="input" value={c.assunto ?? ""} onChange={(e) => onChange({ assunto: e.target.value })} placeholder="Use {{primeiro_nome}}" />)}
        {f("Corpo", <textarea className="input resize-none" rows={3} value={c.corpo ?? ""} onChange={(e) => onChange({ corpo: e.target.value })} placeholder="Olá {{primeiro_nome}}, …" />)}
      </div>;
    case "adicionar_tag":
    case "remover_tag":
      return f("Nome da tag", <input className="input" value={c.tag ?? ""} onChange={(e) => onChange({ tag: e.target.value })} placeholder="Ex.: cliente-vip" />);
    case "atualizar_campo":
      return <div className="grid grid-cols-2 gap-2">
        {f("Campo", <input className="input" value={c.campo ?? ""} onChange={(e) => onChange({ ...c, campo: e.target.value })} placeholder="id do campo / persona" />)}
        {f("Valor", <input className="input" value={c.valor ?? ""} onChange={(e) => onChange({ ...c, valor: e.target.value })} />)}
      </div>;
    case "alterar_score":
      return <div className="grid grid-cols-2 gap-2">
        {f("Modo", <select className="input" value={c.modo ?? "add"} onChange={(e) => onChange({ ...c, modo: e.target.value })}><option value="add">Somar</option><option value="set">Definir</option></select>)}
        {f("Valor", <input className="input" type="number" value={c.valor ?? ""} onChange={(e) => onChange({ ...c, valor: Number(e.target.value) })} />)}
      </div>;
    case "aguardar":
      return f("Aguardar (horas)", <input className="input" type="number" value={c.horas ?? ""} onChange={(e) => onChange({ horas: Number(e.target.value) })} placeholder="Ex.: 48" />);
    case "webhook":
      return f("URL do webhook", <input className="input" value={c.url ?? ""} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://…" />);
    case "notificar":
      return f("Mensagem", <input className="input" value={c.mensagem ?? ""} onChange={(e) => onChange({ mensagem: e.target.value })} placeholder="Ex.: Lead quente!" />);
    case "add_segmento":
    case "remove_segmento":
      return f("Segmento", <input className="input" value={c.segmento ?? ""} onChange={(e) => onChange({ segmento: e.target.value })} placeholder="(em breve)" />);
    default:
      return null;
  }
}
