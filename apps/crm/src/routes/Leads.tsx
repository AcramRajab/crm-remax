import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Flame, Search, Leaf, Download, X } from "lucide-react";
import { timeAgo, scoreColor } from "../lib/format";
import { useSession } from "../lib/session";
import { useStore } from "../lib/store";
import { Avatar } from "../components/Avatar";

type Filter = "ativos" | "descartados" | "todos";

export default function Leads() {
  const { user, canSeeAll } = useSession();
  const { leads: all, getMember, getStage, stages, members, emps, getEmp } = useStore();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [filter, setFilter] = useState<Filter>("ativos");
  const [fOwner, setFOwner] = useState("");
  const [fStage, setFStage] = useState("");
  const [fEmp, setFEmp] = useState("");

  const base = canSeeAll ? all : all.filter((l) => l.owner_id === user.id);

  let leads = base;
  if (filter === "ativos") leads = leads.filter((l) => l.status === "active");
  else if (filter === "descartados") leads = leads.filter((l) => l.status === "discarded" || l.status === "lost");
  if (fOwner) leads = leads.filter((l) => l.owner_id === fOwner);
  if (fStage) leads = leads.filter((l) => (l.stage_id || stages[0]?.id) === fStage);
  if (fEmp) leads = leads.filter((l) => l.empreendimento_id === fEmp);
  if (q.trim()) {
    const t = q.toLowerCase();
    leads = leads.filter((l) =>
      `${l.first_name} ${l.last_name}`.toLowerCase().includes(t) ||
      l.phone.includes(t) || l.email.toLowerCase().includes(t) || l.persona.toLowerCase().includes(t)
    );
  }

  const counts = {
    ativos: base.filter((l) => l.status === "active").length,
    descartados: base.filter((l) => l.status !== "active").length,
  };
  const hasExtraFilters = !!(fOwner || fStage || fEmp);
  function clearFilters() { setFOwner(""); setFStage(""); setFEmp(""); }

  function baixarCsv() {
    const esc = (v: any) => {
      const s = v == null ? "" : String(v);
      return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const headers = ["Nome", "E-mail", "Telefone", "Persona", "Etapa", "Origem", "Responsável", "Empreendimento", "Valor", "Score", "Status", "Criado"];
    const lines = [headers.join(",")];
    for (const l of leads) {
      lines.push([
        `${l.first_name} ${l.last_name}`.trim(),
        l.email, l.phone, l.persona,
        getStage(l.stage_id)?.name || stages[0]?.name || "",
        l.lt_source,
        getMember(l.owner_id)?.name || "",
        getEmp(l.empreendimento_id)?.name || "",
        l.valor ?? "", l.score, l.status, l.created_at,
      ].map(esc).join(","));
    }
    const csv = "﻿" + lines.join("\n"); // BOM p/ acentos no Excel
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Leads</h1>
          <p className="text-sm text-ink-soft">{leads.length} resultado(s){!canSeeAll && " · só os seus (corretor)"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input className="input !pl-9 w-56" placeholder="Buscar…" value={q}
              onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} />
          </div>
          <button className="btn-outline" onClick={baixarCsv} disabled={leads.length === 0} title="Exportar os leads filtrados">
            <Download size={15} /> Baixar CSV
          </button>
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-1 mb-3">
        <FilterBtn active={filter === "ativos"} onClick={() => setFilter("ativos")} label={`Ativos · ${counts.ativos}`} />
        <FilterBtn active={filter === "descartados"} onClick={() => setFilter("descartados")} label={`Descartados / nutrição · ${counts.descartados}`} />
        <FilterBtn active={filter === "todos"} onClick={() => setFilter("todos")} label="Todos" />
      </div>

      {/* Filtros avançados */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select className="input !py-1.5 text-sm w-auto" value={fOwner} onChange={(e) => setFOwner(e.target.value)}>
          <option value="">Responsável: todos</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="input !py-1.5 text-sm w-auto" value={fStage} onChange={(e) => setFStage(e.target.value)}>
          <option value="">Etapa: todas</option>
          {stages.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input !py-1.5 text-sm w-auto" value={fEmp} onChange={(e) => setFEmp(e.target.value)}>
          <option value="">Empreendimento: todos</option>
          {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        {hasExtraFilters && (
          <button className="btn-ghost !py-1.5 text-xs text-ink-soft" onClick={clearFilters}><X size={13} /> Limpar filtros</button>
        )}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-faint border-b border-line bg-surface-muted/60">
              <Th>Lead</Th><Th>Persona</Th><Th>Etapa</Th><Th>Origem</Th>
              <Th>Responsável</Th><Th className="text-center">Score</Th><Th className="text-right">Atividade</Th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => {
              const owner = getMember(l.owner_id);
              const stage = getStage(l.stage_id) || stages[0];
              const discarded = l.status !== "active";
              return (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-surface-muted/50">
                  <td className="px-4 py-3">
                    <Link to={`/leads/${l.id}`} className="font-semibold text-ink hover:text-brand">{l.first_name} {l.last_name}</Link>
                    <div className="text-xs text-ink-faint">{l.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-brand font-medium">{l.persona}</td>
                  <td className="px-4 py-3">
                    {discarded
                      ? <span className="chip bg-amber-100 text-amber-700"><Leaf size={11} /> nutrição</span>
                      : <span className="chip bg-surface-sunken text-ink-soft">{stage?.name}</span>}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{l.lt_source}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-ink-soft">
                      <Avatar name={owner?.name || ""} size={22} />
                      {owner?.name.split(" ")[0]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center"><span className={`chip ${scoreColor(l.score)}`}><Flame size={12} /> {l.score}</span></td>
                  <td className="px-4 py-3 text-right text-ink-faint text-xs">{timeAgo(l.last_activity)}</td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-faint">Nenhum lead encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-surface-sunken"}`}>
      {label}
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide ${className}`}>{children}</th>;
}
