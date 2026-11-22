import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): State {
    let readable = error.message;
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string; path?: string };
      if (parsed.error) {
        readable = `${parsed.error}${parsed.path ? ` (${parsed.operationType} pada ${parsed.path})` : ''}`;
      }
    } catch {
      // keep raw message
    }
    return { hasError: true, message: readable };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAF9]">
          <div className="max-w-lg w-full bg-white border border-slate-900/10 rounded-xl p-6 space-y-4">
            <h1 className="text-lg font-semibold text-[#111815]">Terjadi Kendala Sistem</h1>
            <p className="text-sm text-[#4B5751] leading-relaxed">
              Aplikasi mengalami kesalahan saat memproses permintaan. Silakan muat ulang halaman atau periksa hak akses akun Anda.
            </p>
            <div className="p-3 bg-[#F1F5F3] rounded-lg text-xs font-mono-num text-[#111815] break-words">
              {this.state.message}
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0F5132] hover:bg-[#0B3D26] rounded-lg transition-colors"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
