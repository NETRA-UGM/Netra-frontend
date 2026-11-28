"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  FiServer,
  FiBox,
  FiBell,
  FiLogOut,
  FiSearch,
  FiChevronDown,
  FiPlus,
  FiMoreVertical,
  FiArrowRight,
  FiZap,
  FiPlay,
  FiPauseCircle,
  FiLink,
  FiGlobe,
  FiShuffle,
  FiShare2,
  FiRefreshCw,
  FiX,
  FiCheckCircle,
} from "react-icons/fi";
import DashboardSidebar from "./DashboardSidebar";
import NetworkInventory from "./NetworkInventory";
import { LuGripVertical, LuMoveUpRight } from "react-icons/lu";
import {
  resources,
  recoverySeconds,
  networkMenu,
  type DashboardData,
  type NetworkInventoryPanel,
  type Resource,
} from "@/lib/dashboard";

const empty: DashboardData = {
  vpcs: null,
  subnets: null,
  workloads: null,
  "internet-gateways": null,
  "route-tables": null,
  nacls: null,
  incidents: null,
  remediations: null,
};
const panelTitles = {
  services: "All services",
  workloads: "Workloads",
  network: "Network resource map",
  incidents: "AI Troubleshooter · Incidents",
  settings: "Pengaturan akun",
};
type Panel = keyof typeof panelTitles | NetworkInventoryPanel | null;
function Widget({
  title,
  info,
  subtitle,
  footer,
  onFooter,
  children,
  className = "",
  onRefresh,
}: {
  title: string;
  info?: string;
  subtitle?: string;
  footer?: string;
  onFooter?: () => void;
  children: ReactNode;
  className?: string;
  onRefresh: () => void;
}) {
  return (
    <section className={`console-widget ${className}`}>
      <header className="widget-header">
        <LuGripVertical className="widget-grip" />
        <div>
          <h2>
            {title}
            {info && (
              <span className="widget-info" tabIndex={0} title={info}>
                Info
              </span>
            )}
          </h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button widget-menu"
          aria-label={`Refresh ${title}`}
          title="Refresh data"
          onClick={onRefresh}
        >
          <FiMoreVertical />
        </button>
      </header>
      <div className="widget-body">{children}</div>
      <footer className="widget-footer">
        {footer && <button onClick={onFooter}>{footer}</button>}
        <LuMoveUpRight aria-hidden="true" />
      </footer>
    </section>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return <div className="console-empty">{children}</div>;
}

export default function Dashboard({ username }: { username: string }) {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(empty);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [updated, setUpdated] = useState("");
  const [updatedAt, setUpdatedAt] = useState(0);
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const inventory = networkMenu.find((item) => item.panel === panel);
  const [create, setCreate] = useState<"vpcs" | "workloads" | null>(null);
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedVpc, setSelectedVpc] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const busy = useRef(false);
  const load = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    const results = await Promise.all(
      resources.map(async (resource) => {
        try {
          const response = await fetch(`/api/console/${resource}`, {
            cache: "no-store",
          });
          if (response.status === 401) {
            router.replace("/login");
            throw new Error();
          }
          if (!response.ok) throw new Error();
          const value: unknown = await response.json();
          if (!Array.isArray(value)) throw new Error();
          return [resource, value] as const;
        } catch {
          return [resource, null] as const;
        }
      }),
    );
    setData(Object.fromEntries(results) as DashboardData);
    setHasLoadError(results.some(([, value]) => value === null));
    setUpdated(new Date().toLocaleTimeString("id-ID"));
    setUpdatedAt(Date.now());
    setLoading(false);
    busy.current = false;
  }, [router]);
  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);
  useEffect(() => {
    if (panel || create) dialog.current?.showModal();
    else dialog.current?.close();
  }, [panel, create]);
  function close() {
    if (pending) return;
    setPanel(null);
    setCreate(null);
    setFormError("");
  }
  function openCreate(resource: "vpcs" | "workloads") {
    setPanel(null);
    setCreate(resource);
    setFormError("");
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!create) return;
    const values = new FormData(event.currentTarget);
    setPending(true);
    setFormError("");
    try {
      const response = await fetch(`/api/console/${create}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          ...(create === "vpcs" ? { cidr: values.get("cidr") } : {}),
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok)
        throw new Error(result.error ?? "Gagal membuat resource.");
      setNotice(
        `${create === "vpcs" ? "VPC" : "Workload"} ${result.name} berhasil dibuat.`,
      );
      setCreate(null);
      void load();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Gagal membuat resource.",
      );
    } finally {
      setPending(false);
    }
  }
  const count = (key: Resource) => data[key]?.length ?? "—";
  const running = data.workloads?.filter(
    (w) => w.status.toLowerCase() === "running",
  ).length;
  const detached = data.workloads?.filter(
    (w) => w.status.toLowerCase() === "detached",
  ).length;
  const stopped = data.workloads?.filter(
    (w) => w.status.toLowerCase() === "stopped",
  ).length;
  const openIssues = data.incidents?.filter(
    (i) =>
      !i.resolved_at &&
      !["resolved", "closed"].includes(i.status.toLowerCase()),
  );
  const sevenDaysAgo = updatedAt - 7 * 86_400_000;
  const recentRemediations = data.remediations?.filter(
    (r) => r.finished_at && Date.parse(r.finished_at) >= sevenDaysAgo,
  );
  const durations = (data.incidents ?? [])
    .map(recoverySeconds)
    .filter((n): n is number => n !== null);
  const avg = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : null;
  const vpc = data.vpcs?.find((v) => v.id === selectedVpc) ?? data.vpcs?.[0];
  const subnets = data.subnets?.filter((s) => s.vpc_id === vpc?.id) ?? [];
  const categories = [
    "Routing",
    "IP forwarding",
    "NAT",
    "Security Group",
    "NACL",
    "DNS",
  ];
  const chart = categories.map((category) => {
    const matches = (data.incidents ?? [])
      .filter(
        (i) =>
          i.category.toLowerCase().replace(/[_-]/g, " ") ===
          category.toLowerCase(),
      )
      .map(recoverySeconds)
      .filter((n): n is number => n !== null);
    return {
      category,
      seconds: matches.length
        ? matches.reduce((a, b) => a + b, 0) / matches.length
        : null,
    };
  });
  const chartMax = Math.max(120, ...chart.map((c) => c.seconds ?? 0));
  const matches = (name: string) =>
    name.toLowerCase().includes(query.toLowerCase());
  const workloads = data.workloads?.filter((w) => matches(w.name)) ?? [];
  const refresh = () => void load();
  function workloadTable(all: boolean) {
    return (
      <div className="table-scroll">
        <table className="workload-table">
          <thead>
            <tr>
              {[
                "Name",
                "VPC",
                "Subnet",
                "IP address",
                "Status",
                "Namespace",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(all ? workloads : workloads.slice(0, 3)).map((w) => {
              const s = data.subnets?.find((s) => s.id === w.subnet_id);
              const v = data.vpcs?.find((v) => v.id === s?.vpc_id);
              return (
                <tr key={w.id}>
                  <td>
                    <FiServer />
                    <button
                      className="text-link"
                      onClick={() => setPanel("workloads")}
                    >
                      {w.name}
                    </button>
                  </td>
                  <td>{v?.name ?? "—"}</td>
                  <td>{s?.name ?? "—"}</td>
                  <td>{w.ip ?? "—"}</td>
                  <td>
                    <span
                      className={`resource-badge ${w.status.toLowerCase() === "running" ? "healthy" : ""}`}
                    >
                      <i />
                      {w.status}
                    </span>
                  </td>
                  <td>{w.netns_name}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!workloads.length && (
          <Empty>
            {data.workloads === null
              ? loading
                ? "Memuat workload…"
                : "Data workload tidak tersedia."
              : query
                ? "Tidak ada workload yang cocok."
                : "Belum ada workload. Buat workload untuk memulai."}
          </Empty>
        )}
      </div>
    );
  }
  function networkMap() {
    return !vpc ? (
      <Empty>
        {data.vpcs === null
          ? "Data jaringan belum tersedia."
          : "Buat VPC untuk melihat resource map."}
      </Empty>
    ) : (
      <div className="network-map">
        <div className="map-column">
          <h3>VPC</h3>
          <div className="map-node vpc-node">
            <FiShare2 />
            <strong>{vpc.name}</strong>
            <small>{vpc.cidr}</small>
          </div>
        </div>
        <div className="map-column">
          <h3>Subnets</h3>
          {subnets.length ? (
            subnets.map((s) => (
              <div
                className={`map-node ${s.type === "public" ? "selected" : ""}`}
                key={s.id}
              >
                <FiBox />
                <span>
                  {s.name}
                  <small>{s.cidr}</small>
                </span>
              </div>
            ))
          ) : (
            <p className="map-none">Belum ada subnet</p>
          )}
        </div>
        <div className="map-column">
          <h3>Route tables</h3>
          {(data["route-tables"] ?? [])
            .filter((r) => r.vpc_id === vpc.id)
            .map((r) => (
              <div className="map-node" key={r.id}>
                <FiShuffle />
                <span>
                  {r.id.slice(0, 8)}
                  <small>
                    {subnets.find((s) => s.id === r.subnet_id)?.name ?? "—"}
                  </small>
                </span>
              </div>
            ))}
          {!data["route-tables"]?.some((r) => r.vpc_id === vpc.id) && (
            <p className="map-none">Belum tersedia</p>
          )}
        </div>
        <div className="map-column">
          <h3>Connections</h3>
          {(data["internet-gateways"] ?? [])
            .filter((g) => g.vpc_id === vpc.id)
            .map((g) => (
              <div className="map-node" key={g.id}>
                <FiGlobe />
                <span>
                  {g.id.slice(0, 8)}
                  <small>{g.status}</small>
                </span>
              </div>
            ))}
          {!data["internet-gateways"]?.some((g) => g.vpc_id === vpc.id) && (
            <p className="map-none">Belum ada gateway</p>
          )}
        </div>
      </div>
    );
  }
  const statCards = [
    {
      label: "Workloads",
      icon: FiServer,
      value: count("workloads"),
      active: true,
      panel: "workloads",
    },
    { label: "Detached", icon: FiLink, value: detached, panel: "workloads" },
    {
      label: "Stopped",
      icon: FiPauseCircle,
      value: stopped,
      panel: "workloads",
    },
    { label: "Running", icon: FiPlay, value: running, panel: "workloads" },
    {
      label: "Subnets",
      icon: FiBox,
      value: count("subnets"),
      panel: "network",
    },
    { label: "NAT Gateways", icon: FiShuffle, value: "—", panel: "services" },
    {
      label: "Internet Gateways",
      icon: FiGlobe,
      value: count("internet-gateways"),
      panel: "network",
    },
    { label: "VPCs", icon: FiShare2, value: count("vpcs"), panel: "network" },
  ];
  return (
    <div className="netra-console">
      <DashboardSidebar
        currentPanel={panel}
        onDashboard={() => {
          close();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpen={setPanel}
      />
      <main className="console-main">
        <header className="console-topbar">
          <label className="console-search">
            <input
              aria-label="Cari workload"
              placeholder="Search here"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <FiSearch />
          </label>
          <div className="console-account">
            <button
              className="icon-button notification-button"
              title="Notifikasi"
              aria-label="Buka notifikasi"
              onClick={() => setPanel("incidents")}
            >
              <FiBell />
              {!!openIssues?.length && <i />}
            </button>
            <button
              className="account-button"
              onClick={() => setPanel("settings")}
            >
              <span className="console-avatar">
                {username.slice(0, 1).toUpperCase()}
              </span>
              <span>{username}</span>
              <FiChevronDown />
            </button>
          </div>
        </header>
        <div className="console-content">
          <div className="console-title-row">
            <h1>
              Dashboard{" "}
              <span
                className="widget-info"
                title="Ringkasan resource dan kondisi jaringan NETRA."
              >
                Info
              </span>
            </h1>
            <div className="title-actions">
              <button
                className="icon-button"
                disabled={loading}
                title="Refresh dashboard"
                aria-label="Refresh dashboard"
                onClick={refresh}
              >
                <FiRefreshCw className={loading ? "spinning" : ""} />
              </button>
              <button
                className="console-button primary"
                onClick={() => openCreate("workloads")}
              >
                <FiPlus />
                Create Workload
              </button>
              <button
                className="console-button"
                onClick={() => openCreate("vpcs")}
              >
                Create VPC
              </button>
            </div>
          </div>
          {hasLoadError && (
            <div className="console-alert" role="alert">
              Sebagian data belum dapat dimuat.{" "}
              <button onClick={refresh}>Coba lagi</button>
            </div>
          )}
          {notice && (
            <div className="console-success" role="status">
              <FiCheckCircle />
              {notice}
              <button
                className="icon-button"
                aria-label="Tutup pesan"
                onClick={() => setNotice("")}
              >
                <FiX />
              </button>
            </div>
          )}
          <div className="dashboard-row row-one">
            <Widget
              title="Recently visited"
              info="Jumlah resource yang tersedia saat ini."
              footer="View all services"
              onFooter={() => setPanel("services")}
              onRefresh={refresh}
            >
              <div className="resource-cards">
                {statCards.map(
                  ({ label, icon: Icon, value, active, panel: target }) => (
                    <button
                      key={label}
                      className={`resource-card ${active ? "active" : ""}`}
                      onClick={() => setPanel(target as Panel)}
                    >
                      <Icon />
                      <span>{label}</span>
                      <strong>{value ?? "—"}</strong>
                    </button>
                  ),
                )}
              </div>
            </Widget>
            <Widget
              title="Network health"
              info="Skor dan hasil pemeriksaan kesehatan jaringan belum tersedia."
              subtitle={`Region: Local Region${vpc ? ` (${vpc.name})` : ""}`}
              footer="Go to AI Troubleshooter"
              onFooter={() => setPanel("incidents")}
              onRefresh={refresh}
            >
              <div className="score-label">
                <span>Health score</span>
                <button onClick={() => setPanel("incidents")}>Details</button>
              </div>
              <div className="health-score">
                —<small>Skor belum tersedia</small>
              </div>
              <div className="health-kv">
                <span>Failed checks</span>
                <strong>—</strong>
              </div>
              <button
                className="health-kv"
                onClick={() => setPanel("incidents")}
              >
                <span>Open issues</span>
                <strong>{openIssues?.length ?? "—"}</strong>
              </button>
              <div className="health-kv">
                <span>AI remediations (7d)</span>
                <strong>{recentRemediations?.length ?? "—"}</strong>
              </div>
              <div className="health-scope">
                Scope: {vpc?.name ?? "Semua resource"} ({count("vpcs")} VPC)
                <br />
                Last updated: {updated || "Memuat…"}
              </div>
            </Widget>
            <Widget title="Welcome to NETRA" onRefresh={refresh}>
              <div className="welcome-links">
                {[
                  {
                    icon: FiZap,
                    title: "Jelajahi jaringan",
                    text: "Lihat VPC dan koneksinya di peta jaringan.",
                    panel: "network",
                  },
                  {
                    icon: FiServer,
                    title: "Kelola workload",
                    text: "Lihat daftar workload dan statusnya.",
                    panel: "workloads",
                  },
                  {
                    icon: FiBell,
                    title: "Pantau insiden",
                    text: "Lihat status insiden dan riwayat pemulihan.",
                    panel: "incidents",
                  },
                ].map(({ icon: Icon, title, text, panel: target }) => (
                  <button
                    type="button"
                    onClick={() => setPanel(target as Panel)}
                    key={title}
                  >
                    <span className="welcome-icon">
                      <Icon />
                    </span>
                    <span>
                      <strong>
                        {title} <FiArrowRight aria-hidden="true" />
                      </strong>
                      <span className="welcome-description">{text}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Widget>
          </div>
          <div className="dashboard-row row-two">
            <Widget
              title="Recovery and usage"
              info="Waktu pemulihan dihitung dari saat insiden terdeteksi hingga selesai."
              onRefresh={refresh}
            >
              <div className="recovery-layout">
                <div className="usage-metrics">
                  <div>
                    Running workloads
                    <strong>
                      {running ?? "—"} / {count("workloads")}
                    </strong>
                    <small>{detached ?? "—"} workload berstatus detached</small>
                  </div>
                  <div>
                    Rata-rata waktu pemulihan
                    <strong>{avg === null ? "—" : `${avg} dtk`}</strong>
                    <small>Target: di bawah 120 dtk (2 menit)</small>
                  </div>
                  <button
                    className="console-button"
                    onClick={() => setPanel("incidents")}
                  >
                    Buka AI Troubleshooter
                  </button>
                </div>
                <div className="recovery-chart">
                  <div className="chart-heading">
                    <strong>Waktu pemulihan per skenario (detik)</strong>
                    <span>
                      <i />
                      Total pemulihan
                    </span>
                  </div>
                  <div className="chart-target">Target maksimum: 120 dtk</div>
                  <div className="chart-plot">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <div
                        className="chart-gridline"
                        style={{ bottom: `${n * 25}%` }}
                        key={n}
                      >
                        <span>{Math.round((chartMax * n) / 4)}</span>
                      </div>
                    ))}
                    <div
                      className="chart-target-line"
                      style={{ bottom: `${(120 / chartMax) * 100}%` }}
                    />
                    <div className="chart-bars">
                      {chart.map((c) => (
                        <div className="chart-bar-column" key={c.category}>
                          <div
                            className="chart-bar"
                            title={
                              c.seconds === null
                                ? "Belum ada insiden terselesaikan"
                                : `${c.seconds.toFixed(1)} detik`
                            }
                            style={{
                              height: `${((c.seconds ?? 0) / chartMax) * 100}%`,
                            }}
                          />
                          <span>{c.category}</span>
                        </div>
                      ))}
                    </div>
                    {!durations.length && (
                      <span className="chart-no-data">
                        Belum ada data pemulihan
                      </span>
                    )}
                  </div>
                  <div className="chart-caption">
                    Skenario gangguan jaringan
                  </div>
                </div>
              </div>
            </Widget>
            <Widget
              title="Service health"
              info="Insiden aktif saat ini dan remediasi yang selesai dalam 7 hari terakhir."
              onRefresh={refresh}
            >
              {[
                {
                  title: "Open issues",
                  value: openIssues?.length,
                  period: "Saat ini",
                },
                {
                  title: "AI remediations",
                  value: recentRemediations?.length,
                  period: "Past 7 days",
                  blue: true,
                },
                {
                  title: "Other notifications",
                  value: "—",
                  period: "Belum tersedia",
                },
              ].map((m) => (
                <div className="service-metric" key={m.title}>
                  <span>{m.title}</span>
                  <div>
                    <strong className={m.blue ? "blue" : ""}>
                      {m.value ?? "—"}
                    </strong>
                    <small>{m.period}</small>
                  </div>
                </div>
              ))}
            </Widget>
          </div>
          <div className="dashboard-row row-three">
            <Widget
              title="Recent workloads"
              info="Daftar workload terbaru dan statusnya."
              footer="View all workloads"
              onFooter={() => setPanel("workloads")}
              onRefresh={refresh}
            >
              {workloadTable(false)}
            </Widget>
            <Widget
              title="Network overview"
              info="Relasi VPC, subnet, route table, dan internet gateway."
              subtitle={vpc ? `${vpc.name}  ·  ${vpc.cidr}` : "Belum ada VPC"}
              footer="Buka resource map"
              onFooter={() => setPanel("network")}
              onRefresh={refresh}
            >
              {networkMap()}
            </Widget>
          </div>
          <p className="console-update">
            NETRA Control Plane ·{" "}
            {loading
              ? "Memperbarui data…"
              : `Diperbarui ${updated} · Refresh otomatis setiap 30 detik`}
          </p>
        </div>
      </main>
      <dialog
        ref={dialog}
        className="console-dialog"
        aria-labelledby="console-dialog-title"
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="dialog-heading">
          <h2 id="console-dialog-title">
            {create
              ? `Create ${create === "vpcs" ? "VPC" : "Workload"}`
              : (inventory?.label ??
                panelTitles[(panel ?? "services") as keyof typeof panelTitles])}
          </h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Tutup dialog"
            disabled={pending}
          >
            <FiX />
          </button>
        </div>
        {create ? (
          <form onSubmit={submit} className="create-form">
            <p>
              {create === "vpcs"
                ? "Buat jaringan virtual untuk menghubungkan subnet dan workload."
                : "Workload baru akan dibuat dengan status detached."}
            </p>
            <label>
              Nama
              <input
                name="name"
                required
                autoFocus
                maxLength={100}
                pattern="[A-Za-z0-9 _.-]+"
                placeholder={create === "vpcs" ? "vpc-lab" : "web-01"}
              />
            </label>
            {create === "vpcs" && (
              <label>
                IPv4 CIDR
                <input name="cidr" required placeholder="10.0.0.0/16" />
                <small>Gunakan format CIDR, misalnya 10.0.0.0/16.</small>
              </label>
            )}
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="console-button"
                onClick={close}
                disabled={pending}
              >
                Batal
              </button>
              <button
                className="console-button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Membuat…" : "Create"}
              </button>
            </div>
          </form>
        ) : (
          <div className="dialog-body">
            {inventory && (
              <NetworkInventory
                panel={inventory.panel}
                data={data}
                loading={loading}
                onCreateVpc={() => openCreate("vpcs")}
              />
            )}
            {panel === "workloads" && (
              <>
                <div className="dialog-toolbar">
                  <p>{count("workloads")} workload</p>
                  <button
                    className="console-button primary"
                    onClick={() => openCreate("workloads")}
                  >
                    <FiPlus />
                    Create Workload
                  </button>
                </div>
                {workloadTable(true)}
              </>
            )}
            {panel === "network" && (
              <>
                <div className="dialog-toolbar">
                  <select
                    aria-label="Pilih VPC"
                    value={vpc?.id ?? ""}
                    onChange={(e) => setSelectedVpc(e.target.value)}
                  >
                    {data.vpcs?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} · {v.cidr}
                      </option>
                    ))}
                  </select>
                  <button
                    className="console-button"
                    onClick={() => openCreate("vpcs")}
                  >
                    Create VPC
                  </button>
                </div>
                {networkMap()}
              </>
            )}
            {panel === "services" && (
              <div className="service-list">
                {resources.map((r) => (
                  <div key={r}>
                    <span>{r}</span>
                    <strong>{count(r)}</strong>
                  </div>
                ))}
                <p className="muted-text">
                  Data NAT Gateway dan skor kesehatan belum tersedia.
                </p>
              </div>
            )}
            {panel === "incidents" && (
              <>
                <p className="muted-text">
                  Status insiden dan riwayat pemulihan jaringan NETRA.
                </p>
                {data.incidents?.length ? (
                  data.incidents.map((i) => (
                    <article className="incident-card" key={i.id}>
                      <div>
                        <strong>{i.category}</strong>
                        <span className="resource-badge">{i.status}</span>
                      </div>
                      <small>
                        {new Date(i.detected_at).toLocaleString("id-ID")}
                      </small>
                      {data.remediations
                        ?.filter((r) => r.incident_id === i.id)
                        .map((r) => (
                          <p key={r.id}>
                            <strong>{r.status}</strong>
                          </p>
                        ))}
                    </article>
                  ))
                ) : (
                  <Empty>
                    {data.incidents === null
                      ? "Data insiden tidak tersedia."
                      : "Belum ada insiden jaringan."}
                  </Empty>
                )}
              </>
            )}
            {panel === "settings" && (
              <div className="account-settings">
                <span className="console-avatar">
                  {username.slice(0, 1).toUpperCase()}
                </span>
                <h3>{username}</h3>
                <p>NETRA Control Plane</p>
                <form action="/api/auth/logout" method="post">
                  <button className="console-button" type="submit">
                    <FiLogOut />
                    Keluar
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
