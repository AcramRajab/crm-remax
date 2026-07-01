import { useState, useEffect, useCallback } from "react";
import {
  Mail, Plus, Check, Info, Trash2, X, Loader2, Power, Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase";

// Sequência de e-mail (nutrição / follow-up). Motor: cron no Worker + Resend.
interface Seq {
  id: string;
  account_id: string;
  empreendimento_id: string | null;
  nome: string;
  gatilho: string;
  ativo: boolean;
}
interface Passo {
  id?: string;
  posicao: number;
  delay_horas: number;
  assunto: string;
  corpo: string;
}

const GATILHOS: Record<string, string> = {
  lead_entrou: "Quando o lead entra",
  lead_descartado: "Quando o lead é descartado",
};

export default function Automacoes() {
  return (
    <div className="p-6 max-w-[980px] mx-auto">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Automações de e-mail</h1>
        <p className="text-sm text-ink-soft">Sequências de nutrição e follow-up. Rodam sozinhas quando o lead entra ou é descartado.</p>
      </div>
      <EmailConfig />
      <Sequencias />
    </div>
  );
}

/* ---------------- Config de e-mail (remetente + ativar) ---------------- */
function EmailConfig() {
  const [accId, setAccId] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [nome, setNome] = useState("");
  const [ativo, setAtivo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from("core_contas").select("id, email_remetente, email_remetente_nome, email_ativo").limit(1).single()
      .then(({ data }) => {
        if (data) {
          setAccId(data.id);
          setFrom(data.email_remetente || "");
          setNome(data.email_remetente_nome || "");
          setAtivo(!!data.email_ativo);
        }
        setLoading(false);
      });
  }, []);

  async function save() {
    if (!accId) return;
    await supabase.from("core_contas").update({
      email_remetente: from.trim() || null,
      email_remetente_nome: nome.trim() || null,
      email_ativo: ativo,
    }).eq("id", accId);
    setSaved(true); setTimeout(() => setSaved(false), 1500);
  }

  if (loading) return <div className="card p-5 mb-5 text-sm text-ink-faint">Carregando configuração…</div>;

  return (
    <div className="card p-5 mb-5">
      <h2 className="flex items-center gap-2 font-semibold text-ink"><Mail size={16} className="text-brand" /> Configuração de e-mail</h2>
      <p className="text-xs text-ink-soft mb-4 mt-0.5">O remetente é o e-mail da sua conta. O envio usa o Resend (infra da plataforma).</p>

      <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-4">
        <Info size={15} className="shrink-0 mt-0.5" />
        Para enviar de verdade: (1) domínio do remetente verificado no Resend e (2) a chave <strong>RESEND_API_KEY</strong> no Worker. Sem isso, as sequências ficam prontas mas seguram os envios.
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">E-mail de envio</label>
          <input className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="contato@nowresidence.com.br" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1">Nome do remetente</label>
          <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="NOW Residence · RE/MAX" />
        </div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-sm text-ink cursor-pointer">
        <input type="checkbox" className="accent-brand w-4 h-4" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Envio de e-mail ativo para esta conta
      </label>
      <button className="btn-brand mt-4" onClick={save}>{saved ? <><Check size={16} /> Salvo</> : <><Check size={16} /> Salvar configuração</>}</button>
    </div>
  );
}

/* ---------------- Sequências ---------------- */
function Sequencias() {
  const [seqs, setSeqs] = useState<Seq[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Seq | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("crm_sequencias").select("*").order("created_at", { ascending: true });
    setSeqs((data as Seq[]) || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function novaSeq() {
    const { data: conta } = await supabase.from("core_contas").select("id").limit(1).single();
    if (!conta) return;
    const { data, error } = await supabase.from("crm_sequencias")
      .insert({ account_id: conta.id, nome: "Nova sequência", gatilho: "lead_entrou", ativo: false })
      .select("*").single();
    if (!error && data) { await load(); setEditing(data as Seq); }
  }

  async function toggleAtivo(s: Seq) {
    await supabase.from("crm_sequencias").update({ ativo: !s.ativo, updated_at: new Date().toISOString() }).eq("id", s.id);
    load();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-ink">Sequências</h2>
          <p className="text-xs text-ink-soft">Cada sequência é uma série de e-mails com atrasos. Ative para começar a rodar.</p>
        </div>
        <button className="btn-brand !py-1.5 text-xs" onClick={novaSeq}><Plus size={14} /> Nova sequência</button>
      </div>

      {loading ? (
        <p className="text-sm text-ink-faint">Carregando…</p>
      ) : seqs.length === 0 ? (
        <p className="text-sm text-ink-faint">Nenhuma sequência ainda. Crie a primeira.</p>
      ) : (
        <div className="space-y-2">
          {seqs.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-line">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ink truncate">{s.nome}</div>
                <div className="text-xs text-ink-faint">{GATILHOS[s.gatilho] || s.gatilho}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleAtivo(s)}
                  className={`chip ${s.ativo ? "bg-emerald-100 text-emerald-700" : "bg-surface-sunken text-ink-faint"}`}>
                  <Power size={12} /> {s.ativo ? "Ativa" : "Inativa"}
                </button>
                <button className="btn-outline !py-1.5 !px-3 text-xs" onClick={() => setEditing(s)}>Editar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <SeqEditor seq={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

/* ---------------- Editor de uma sequência (passos) ---------------- */
function SeqEditor({ seq, onClose, onSaved }: { seq: Seq; onClose: () => void; onSaved: () => void }) {
  const [nome, setNome] = useState(seq.nome);
  const [gatilho, setGatilho] = useState(seq.gatilho);
  const [ativo, setAtivo] = useState(seq.ativo);
  const [passos, setPassos] = useState<Passo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("crm_sequencia_passos").select("id, posicao, delay_horas, assunto, corpo")
      .eq("sequencia_id", seq.id).order("posicao", { ascending: true })
      .then(({ data }) => { setPassos((data as Passo[]) || []); setLoading(false); });
  }, [seq.id]);

  function setPasso(i: number, patch: Partial<Passo>) {
    setPassos((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPasso() {
    setPassos((ps) => [...ps, { posicao: ps.length, delay_horas: ps.length === 0 ? 0 : 48, assunto: "", corpo: "" }]);
  }
  function removePasso(i: number) {
    setPassos((ps) => ps.filter((_, idx) => idx !== i));
  }

  async function salvar() {
    setBusy(true);
    await supabase.from("crm_sequencias").update({ nome, gatilho, ativo, updated_at: new Date().toISOString() }).eq("id", seq.id);
    // Regrava os passos: apaga todos e reinsere na ordem atual (posicao = índice).
    await supabase.from("crm_sequencia_passos").delete().eq("sequencia_id", seq.id);
    const rows = passos.map((p, idx) => ({
      account_id: seq.account_id, sequencia_id: seq.id, posicao: idx,
      delay_horas: Number(p.delay_horas) || 0, assunto: p.assunto || "(sem assunto)", corpo: p.corpo || "",
    }));
    if (rows.length) await supabase.from("crm_sequencia_passos").insert(rows);
    setBusy(false);
    onSaved();
  }

  async function excluir() {
    if (!confirm("Excluir esta sequência e todos os e-mails dela?")) return;
    await supabase.from("crm_sequencias").delete().eq("id", seq.id);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface z-10">
          <h3 className="font-semibold text-ink">Editar sequência</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Nome da sequência</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Gatilho</label>
              <select className="input" value={gatilho} onChange={(e) => setGatilho(e.target.value)}>
                {Object.entries(GATILHOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox" className="accent-brand w-4 h-4" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Sequência ativa
          </label>

          <div className="border-t border-line pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-ink">E-mails da sequência</h4>
              <button className="btn-outline !py-1 !px-2.5 text-xs" onClick={addPasso}><Plus size={13} /> Adicionar e-mail</button>
            </div>
            <p className="text-[11px] text-ink-faint mb-3">Use <code>{"{{primeiro_nome}}"}</code> e <code>{"{{nome}}"}</code> no assunto/corpo. O atraso conta a partir do e-mail anterior.</p>

            {loading ? <p className="text-sm text-ink-faint">Carregando e-mails…</p> : passos.length === 0 ? (
              <p className="text-sm text-ink-faint">Nenhum e-mail. Adicione o primeiro.</p>
            ) : (
              <div className="space-y-3">
                {passos.map((p, i) => (
                  <div key={i} className="rounded-lg border border-line p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-ink-soft">E-mail {i + 1}</span>
                      <button className="text-rose-500 hover:text-rose-600" onClick={() => removePasso(i)} title="Remover"><Trash2 size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-ink-faint" />
                      <span className="text-xs text-ink-soft">Enviar</span>
                      <input type="number" min="0" className="input !py-1 !px-2 w-20 text-sm" value={p.delay_horas}
                        onChange={(e) => setPasso(i, { delay_horas: Number(e.target.value) })} />
                      <span className="text-xs text-ink-soft">horas após o anterior {i === 0 && "(0 = imediato)"}</span>
                    </div>
                    <input className="input mb-2" placeholder="Assunto" value={p.assunto} onChange={(e) => setPasso(i, { assunto: e.target.value })} />
                    <textarea className="input resize-none" rows={4} placeholder="Corpo do e-mail…" value={p.corpo} onChange={(e) => setPasso(i, { corpo: e.target.value })} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-line sticky bottom-0 bg-surface">
          <button className="btn-ghost text-rose-500 hover:bg-rose-50 text-sm" onClick={excluir}><Trash2 size={15} /> Excluir</button>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn-brand disabled:opacity-60" disabled={busy} onClick={salvar}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Check size={16} /> Salvar sequência</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
