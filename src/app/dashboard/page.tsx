import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { backendEndpoint, sessionCookie } from "@/lib/backend";
import Dashboard from "@/components/dashboard/Dashboard";
import "./dashboard.css";
import "./sidebar.css";

export default async function DashboardPage() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) redirect("/login");
  let response: Response;
  try {
    response = await fetch(backendEndpoint("auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error("Layanan NETRA tidak dapat dihubungi.");
  }
  if (response.status === 401) redirect("/login");
  if (!response.ok) throw new Error("Gagal memuat sesi NETRA.");
  const { username } = (await response.json()) as { username?: unknown };
  if (typeof username !== "string") throw new Error("Gagal memuat sesi NETRA.");
  return <Dashboard username={username} />;
}
