"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="dashboard-error">
      <span className="eyebrow">NETRA / CONNECTION ERROR</span>
      <h1>Console belum dapat dimuat.</h1>
      <p>Dashboard belum dapat diakses. Tunggu sebentar, lalu coba lagi.</p>
      <button type="button" onClick={reset}>Coba lagi ↗</button>
    </main>
  );
}
