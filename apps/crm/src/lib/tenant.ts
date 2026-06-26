// White-label: a marca vem da CONTA, nunca hardcodada no produto (CLAUDE.md).
// Em produção o tenant é resolvido pelo domínio na entrada; aqui é mock.
import type { Account } from "./types";

export const account: Account = {
  id: "acc_remax",
  slug: "remax-itajai",
  name: "REMAX Itajaí",
  brand_name: "REMAX",
  logo_text: "RE/MAX",
  primary_color: "#0E4DA4", // azul REMAX — trocável por conta
  custom_domain: "crm.remax-itajai.com.br",
};

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16
  );
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

// Aplica a cor da conta nas CSS vars (--brand). Chamado no boot do app.
export function applyBrand(acc: Account = account) {
  const root = document.documentElement;
  root.style.setProperty("--brand", hexToRgbTriplet(acc.primary_color));
  // Texto sobre a marca: branco por padrão (cores escuras). Ajuste simples.
  root.style.setProperty("--brand-fg", "255 255 255");
}
