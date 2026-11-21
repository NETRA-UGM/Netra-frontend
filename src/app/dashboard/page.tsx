import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendUrl, sessionCookie, type NetraUser } from "@/lib/backend";

const modules = [
  { id: "01", title: "VPC-lite", description: "VPC, subnet, routing, NAT, Security Group, dan NACL.", icon: "⬡" },
  { id: "02", title: "Workload", description: "Network namespace yang terhubung ke subnet virtual.", icon: "▤" },
  { id: "03", title: "AI Troubleshooter", description: "Diagnosis enam jenis gangguan dan pemulihan dengan persetujuan.", icon: "✳" },
];

export default async function DashboardPage() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) redirect("/login");

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Backend NETRA tidak dapat dihubungi. Periksa layanan FastAPI.");
  }
  if (response.status === 401) redirect("/login");
  if (!response.ok) throw new Error("Gagal memuat sesi NETRA.");
  const user = (await response.json()) as NetraUser;

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand"><span className="sidebar-logo">◈</span><div><strong>NETRA</strong><small>CONTROL PLANE</small></div></div>
        <div className="sidebar-section">WORKSPACE</div>
        <div className="sidebar-link active"><span>▦</span> Overview</div>
        <div className="sidebar-section">INFRASTRUCTURE</div>
        <div className="sidebar-link muted"><span>⬡</span> VPC-lite <small>Segera</small></div>
        <div className="sidebar-link muted"><span>▤</span> Workload <small>Segera</small></div>
        <div className="sidebar-link muted"><span>✳</span> AI Troubleshooter <small>Segera</small></div>
        <div className="sidebar-bottom"><span className="status-dot" /> Console aktif</div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header"><div><span className="breadcrumb">WORKSPACE / OVERVIEW</span><h1>Overview</h1></div><div className="dashboard-user"><span className="avatar">{user.full_name.charAt(0).toUpperCase()}</span><div><strong>{user.full_name}</strong><small>{user.role}</small></div><form action="/api/auth/logout" method="post"><button type="submit" className="logout-button">Keluar</button></form></div></header>
        <div className="dashboard-body">
          <div className="welcome-banner"><div><span className="eyebrow">NETRA / CONTROL PLANE</span><h2>Selamat datang, {user.full_name.split(" ")[0]}.</h2><p>Console siap digunakan. Mulai dari VPC-lite, lalu hubungkan workload dan aktifkan pemantauan jaringan.</p></div><span className="welcome-mark" aria-hidden="true">◈</span></div>
          <div className="section-heading"><div><span className="eyebrow">PLATFORM MODULES</span><h2>Ruang kerja NETRA</h2></div><span className="section-count">03 MODUL INTI</span></div>
          <div className="module-grid">{modules.map((module) => <article className="module-card" key={module.id}><div className="module-card-top"><span className="module-icon">{module.icon}</span><span className="module-id">{module.id}</span></div><h3>{module.title}</h3><p>{module.description}</p><span className="module-state"><span className="state-dot" /> Dalam pengembangan</span></article>)}</div>
          <p className="dashboard-note">Tahap ini menyiapkan autentikasi dan kerangka console. Data resource serta aksi jaringan akan ditambahkan pada modul berikutnya.</p>
        </div>
      </div>
    </main>
  );
}
