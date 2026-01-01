"use client";

export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center text-sm text-slate-300">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
      <div>
        <p className="text-base font-medium text-white">Cargando dashboard…</p>
        <p className="text-xs text-slate-400">Consultando la base de datos y preparando gráficas.</p>
      </div>
    </div>
  );
}
