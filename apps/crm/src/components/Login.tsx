import { useState } from "react";
import { LogIn, Lock, Mail, UserPlus } from "lucide-react";
import { account } from "../lib/tenant";
import { useAuth } from "../lib/auth";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setInfo(""); setBusy(true);
    const fn = mode === "in" ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) { setErr(error); return; }
    if (mode === "up") setInfo("Conta criada! Se não entrar direto, faça login abaixo.");
  }

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      {/* Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-brand text-brand-fg font-display font-extrabold">{account.brand_name[0]}</span>
            <div>
              <div className="font-display font-extrabold text-ink text-lg leading-none">{account.brand_name}</div>
              <div className="text-[11px] text-ink-faint">CRM · Marketing + Vendas</div>
            </div>
          </div>

          <h1 className="font-display text-2xl font-extrabold text-ink">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
          <p className="text-sm text-ink-soft mb-6">Acesse o painel da sua conta.</p>

          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="input !pl-9" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@empresa.com" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input className="input !pl-9" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mínimo 6 caracteres" />
              </div>
            </div>

            {err && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
            {info && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{info}</p>}

            <button type="submit" disabled={busy} className="btn-brand w-full mt-2 disabled:opacity-60">
              {mode === "in" ? <><LogIn size={16} /> {busy ? "Entrando…" : "Entrar"}</> : <><UserPlus size={16} /> {busy ? "Criando…" : "Criar conta"}</>}
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }}
            className="text-xs text-ink-faint mt-4 text-center w-full hover:text-brand">
            {mode === "in" ? "Primeira vez? Criar uma conta" : "Já tenho conta — entrar"}
          </button>
        </div>
      </div>

      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden" style={{ background: "rgb(var(--brand))" }}>
        <div className="font-display font-extrabold text-2xl">{account.brand_name}</div>
        <div>
          <div className="font-display font-extrabold text-4xl leading-tight mb-3">
            Marketing e vendas<br />no mesmo lugar.
          </div>
          <p className="text-white/80 max-w-md">
            O lead chega com o dossiê completo de navegação. O corretor trabalha o funil e conversa por WhatsApp e e-mail sem sair da plataforma.
          </p>
        </div>
        <div className="text-white/60 text-xs">© {account.name}</div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute right-10 top-10 w-40 h-40 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
