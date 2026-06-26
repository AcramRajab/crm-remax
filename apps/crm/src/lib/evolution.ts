// ============================================================================
// Cliente WhatsApp — Evolution API (não-oficial, conexão por QR).
// ----------------------------------------------------------------------------
// IMPORTANTE (arquitetura · CLAUDE.md):
//   O BROWSER NUNCA chama a Evolution direto. A apikey é credencial da
//   PLATAFORMA e o CORS/segurança não permitem. Todas as chamadas passam por um
//   PROXY no backend (Cloudflare Workers ou n8n), que injeta a apikey e fala com
//   a Evolution. Aqui definimos só o CONTRATO + um mock; quando o backend
//   existir, troca-se `getEvolutionClient()` pelo cliente HTTP real.
//
// Mapeamento para os endpoints reais da Evolution (referência):
//   createInstance -> POST {base}/instance/create        { instanceName, qrcode:true }
//   getQr          -> GET  {base}/instance/connect/:name  -> { base64, code, pairingCode }
//   getState       -> GET  {base}/instance/connectionState/:name -> { state }
//   logout         -> DELETE {base}/instance/logout/:name
//   (entra/sai de mensagem: webhook da Evolution -> n8n -> tabela messages)
// ============================================================================

export type ConnState = "close" | "connecting" | "open";

export interface QrResponse {
  base64?: string; // data URI da imagem do QR (quando a Evolution real responder)
  code?: string; // string do QR (fallback)
  pairingCode?: string; // código de pareamento por número (alternativa ao QR)
}

export interface EvolutionClient {
  createInstance(instanceName: string): Promise<void>;
  getQr(instanceName: string): Promise<QrResponse>;
  getState(instanceName: string): Promise<ConnState>;
  logout(instanceName: string): Promise<void>;
}

// Config da plataforma (a apikey fica SÓ no servidor; aqui vai a URL do proxy).
export const evolutionConfig = {
  // Em produção: URL do proxy no backend, ex.: "/api/evolution".
  proxyBaseUrl: "REPLACE_BACKEND_PROXY_URL",
};

// Nome de instância determinístico por corretor (uma instância hospeda vários).
export const instanceFor = (userId: string) => `remax-${userId}`;

// ---------------------------------------------------------------------------
// MOCK — simula o ciclo real (connecting -> open) para a UI já funcionar.
// Substituir por httpClient(evolutionConfig.proxyBaseUrl) quando o backend subir.
// ---------------------------------------------------------------------------
const created: Record<string, number> = {}; // instanceName -> timestamp de criação
const CONNECT_AFTER_MS = 6000; // simula o tempo até o telefone escanear

const mockClient: EvolutionClient = {
  async createInstance(name) {
    created[name] = Date.now();
  },
  async getQr() {
    // Sem backend não há QR real; a UI cai no QR placeholder.
    return { code: "evolution://mock" };
  },
  async getState(name) {
    const t = created[name];
    if (!t) return "close";
    return Date.now() - t > CONNECT_AFTER_MS ? "open" : "connecting";
  },
  async logout(name) {
    delete created[name];
  },
};

// Quando o backend existir, retornar o cliente HTTP que bate no proxy:
//   return httpClient(evolutionConfig.proxyBaseUrl);
export function getEvolutionClient(): EvolutionClient {
  return mockClient;
}
