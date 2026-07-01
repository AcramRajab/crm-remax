import { useState } from "react";
import { Building2, ExternalLink, Users, X, Loader2, Check } from "lucide-react";
import { useStore } from "../lib/store";
import { supabase } from "../lib/supabase";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Empreendimentos REAIS da conta (core_empreendimentos, isolados por RLS).
export default function Empreendimentos() {
  const { leads, emps, loading, reload } = useStore();
  const [novo, setNovo] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-extrabold text-ink">Empreendimentos</h1>
        <p className="text-sm text-ink-soft">Vários por conta · cada um com sua LP, personas e funil</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-faint">Carregando…</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {emps.map((e) => {
            const count = leads.filter((l) => l.empreendimento_id === e.id).length;
            const personas = Array.isArray(e.personas) ? e.personas : [];
            const unitsLabel = e.details?.units_label as string | undefined;
            const lpUrl = e.landing_page_url || `/${e.slug}`;
            return (
              <div key={e.id} className="card p-5">
                <div className="flex items-start justify-between">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-soft text-brand"><Building2 size={20} /></span>
                  <span className={`chip ${e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {e.status === "active" ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-lg text-ink mt-3">{e.name}</h3>
                <p className="text-sm text-ink-soft">{[e.construtora, unitsLabel].filter(Boolean).join(" · ") || "—"}</p>
                <code className="text-[11px] text-ink-faint">slug: {e.slug}</code>
                {personas.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Personas / ICP</div>
                    <div className="flex flex-wrap gap-1.5">
                      {personas.map((p) => <span key={p} className="chip bg-surface-sunken text-ink-soft">{p}</span>)}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <span className="flex items-center gap-1.5 text-sm text-ink-soft"><Users size={15} /> {count} {count === 1 ? "lead" : "leads"}</span>
                  <a className="text-sm text-brand font-medium flex items-center gap-1 hover:underline" href={lpUrl} target="_blank" rel="noreferrer">
                    Ver LP <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}

          <button onClick={() => setNovo(true)} className="card p-5 border-dashed flex flex-col items-center justify-center text-ink-faint hover:text-brand hover:border-brand transition-colors min-h-[200px]">
            <Building2 size={24} />
            <span className="text-sm font-semibold mt-2">Novo empreendimento</span>
            <span className="text-xs">nome, slug, construtora e personas</span>
          </button>
        </div>
      )}

      {novo && <NovoEmpModal onClose={() => setNovo(false)} onDone={() => { setNovo(false); reload(); }} />}
    </div>
  );
}

function NovoEmpModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [construtora, setConstrutora] = useState("");
  const [personas, setPersonas] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const effSlug = slugTouched ? slug : slugify(nome);

  async function salvar() {
    setErr("");
    if (nome.trim().length < 2) { setErr("Informe o nome do empreendimento."); return; }
    if (!effSlug) { setErr("Slug inválido."); return; }
    setBusy(true);
    const { data: conta } = await supabase.from("core_contas").select("id").limit(1).single();
    if (!conta) { setErr("Conta não encontrada."); setBusy(false); return; }
    const { error } = await supabase.from("core_empreendimentos").insert({
      account_id: conta.id,
      name: nome.trim(),
      slug: effSlug,
      construtora: construtora.trim() || null,
      status: "active",
      personas: personas.split(",").map((p) => p.trim()).filter(Boolean),
      details: {},
    });
    setBusy(false);
    if (error) {
      setErr(/duplicate|unique/i.test(error.message) ? "Já existe um empreendimento com esse slug." : error.message);
      return;
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink flex items-center gap-2"><Building2 size={18} className="text-brand" /> Novo empreendimento</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: NOW Residence" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Slug (URL da LP)</label>
            <input className="input font-mono" value={effSlug} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} placeholder="now-residence" />
            <p className="text-[11px] text-ink-faint mt-1">A LP fica em <code>/{effSlug || "slug"}</code>. Crie a pasta <code>landing-pages/{effSlug || "slug"}/</code> depois.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Construtora</label>
            <input className="input" value={construtora} onChange={(e) => setConstrutora(e.target.value)} placeholder="Ex.: Grupo R.Gubert" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Personas (separadas por vírgula)</label>
            <input className="input" value={personas} onChange={(e) => setPersonas(e.target.value)} placeholder="Investidor, Universitário, Casal novo" />
          </div>
          {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
            <button className="btn-brand flex-1 disabled:opacity-60" disabled={busy} onClick={salvar}>
              {busy ? <><Loader2 size={16} className="animate-spin" /> Criando…</> : <><Check size={16} /> Criar</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
