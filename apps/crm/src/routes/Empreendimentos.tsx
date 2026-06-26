import { Building2, ExternalLink, Users } from "lucide-react";
import { useStore } from "../lib/store";

// Empreendimentos REAIS da conta (core_empreendimentos, isolados por RLS).
// Lê do store — fonte única. Nada de dado de demonstração (era de onde vinha o
// "Quadramar" fantasma).
export default function Empreendimentos() {
  const { leads, emps, loading } = useStore();

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
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-soft text-brand">
                    <Building2 size={20} />
                  </span>
                  <span className={`chip ${e.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {e.status === "active" ? "Ativo" : "Pausado"}
                  </span>
                </div>
                <h3 className="font-display font-extrabold text-lg text-ink mt-3">{e.name}</h3>
                <p className="text-sm text-ink-soft">
                  {[e.construtora, unitsLabel].filter(Boolean).join(" · ") || "—"}
                </p>
                <code className="text-[11px] text-ink-faint">slug: {e.slug}</code>

                {personas.length > 0 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint mb-1.5">Personas / ICP</div>
                    <div className="flex flex-wrap gap-1.5">
                      {personas.map((p) => (
                        <span key={p} className="chip bg-surface-sunken text-ink-soft">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-line">
                  <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <Users size={15} /> {count} {count === 1 ? "lead" : "leads"}
                  </span>
                  <a className="text-sm text-brand font-medium flex items-center gap-1 hover:underline" href={lpUrl} target="_blank" rel="noreferrer">
                    Ver LP <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })}

          {/* card de criar */}
          <button className="card p-5 border-dashed flex flex-col items-center justify-center text-ink-faint hover:text-brand hover:border-brand transition-colors min-h-[200px]">
            <Building2 size={24} />
            <span className="text-sm font-semibold mt-2">Novo empreendimento</span>
            <span className="text-xs">clona o template (slug, personas, funil, LP)</span>
          </button>
        </div>
      )}
    </div>
  );
}
