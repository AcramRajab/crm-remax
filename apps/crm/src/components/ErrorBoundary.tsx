import { Component, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

// Rede de segurança: se qualquer tela quebrar ao renderizar, mostra uma
// mensagem em vez de deixar o app inteiro em branco. `resetKey` (ex.: a rota)
// limpa o erro quando o usuário navega pra outro lugar.
interface Props { children: ReactNode; resetKey?: string }
interface State { err: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error) {
    // Fica no console pra diagnóstico; não derruba a tela.
    console.error("[ErrorBoundary] tela quebrou:", err);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.err) {
      this.setState({ err: null });
    }
  }

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-[60vh] grid place-items-center p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto grid place-items-center w-12 h-12 rounded-xl bg-amber-50 text-amber-600 mb-4">
              <AlertTriangle size={22} />
            </div>
            <h2 className="font-display font-extrabold text-ink text-lg">Algo quebrou ao abrir esta tela</h2>
            <p className="text-sm text-ink-soft mt-1 mb-5">
              Tente voltar e abrir de novo. Se continuar, recarregue a página.
            </p>
            <button onClick={() => { this.setState({ err: null }); history.back(); }} className="btn-brand">
              Voltar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
