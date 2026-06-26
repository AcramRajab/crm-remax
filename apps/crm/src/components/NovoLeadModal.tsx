import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, UserPlus } from "lucide-react";
import { useStore } from "../lib/store";
import { users } from "../lib/mock";

const PERSONAS = [
  "Investidor pré-lançamento", "Saúde & Medicina", "Universitário",
  "Terceira idade", "Casal novo", "Comércio exterior / portos",
];
const SOURCES = ["Indicação", "Meta Ads", "Google Ads", "Instagram", "WhatsApp", "Outbound", "Site / LP"];

export default function NovoLeadModal({ onClose }: { onClose: () => void }) {
  const { addLead, emps } = useStore();
  const nav = useNavigate();
  const brokers = users.filter((u) => u.role === "broker");
  const [f, setF] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    persona: PERSONAS[0], empreendimento_id: emps[0]?.id ?? "",
    owner_id: brokers[0].id, lt_source: SOURCES[0],
  });
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const lead = addLead({
      ...f,
      origin: f.lt_source === "Indicação" ? "indicacao" : f.lt_source === "Outbound" ? "outbound" : "inbound",
    });
    onClose();
    nav(`/leads/${lead.id}`);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-semibold text-ink flex items-center gap-2"><UserPlus size={18} className="text-brand" /> Novo lead</h3>
          <button onClick={onClose} className="text-ink-faint hover:text-ink"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <F label="Nome"><input className="input" required value={f.first_name} onChange={(e) => set("first_name", e.target.value)} /></F>
            <F label="Sobrenome"><input className="input" value={f.last_name} onChange={(e) => set("last_name", e.target.value)} /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="E-mail"><input className="input" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></F>
            <F label="WhatsApp"><input className="input" required value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(47) 9____-____" /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Empreendimento">
              <select className="input" value={f.empreendimento_id} onChange={(e) => set("empreendimento_id", e.target.value)}>
                {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </F>
            <F label="Persona estimada">
              <select className="input" value={f.persona} onChange={(e) => set("persona", e.target.value)}>
                {PERSONAS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Origem">
              <select className="input" value={f.lt_source} onChange={(e) => set("lt_source", e.target.value)}>
                {SOURCES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </F>
            <F label="Responsável">
              <select className="input" value={f.owner_id} onChange={(e) => set("owner_id", e.target.value)}>
                {brokers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </F>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-outline flex-1" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-brand flex-1"><UserPlus size={16} /> Criar e abrir</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1">{label}</label>
      {children}
    </div>
  );
}
