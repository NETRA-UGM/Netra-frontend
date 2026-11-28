import "server-only";

export const sessionCookie = "netra_session";

export function backendEndpoint(path: string) {
  const base = process.env.BACKEND_URL?.trim();
  if (!base) throw new Error("Konfigurasi layanan belum tersedia.");
  return `${base.replace(/\/+$/, "")}/api/v1/${path}`;
}
