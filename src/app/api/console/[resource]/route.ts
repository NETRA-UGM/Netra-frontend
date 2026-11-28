import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { backendEndpoint, sessionCookie } from "@/lib/backend";
import type { DashboardData, Resource } from "@/lib/dashboard";

const fields = {
  vpcs: ["id", "name", "cidr"],
  subnets: ["id", "vpc_id", "name", "cidr", "type", "gateway_ip"],
  workloads: ["id", "name", "subnet_id", "ip", "netns_name", "status"],
  "internet-gateways": ["id", "vpc_id", "status"],
  "route-tables": ["id", "vpc_id", "subnet_id"],
  nacls: ["id", "subnet_id", "name"],
  incidents: ["id", "category", "status", "detected_at", "resolved_at"],
  remediations: ["id", "incident_id", "status", "finished_at"],
} satisfies {
  [Key in Resource]: (keyof NonNullable<DashboardData[Key]>[number])[];
};

function selectFields(value: unknown, keys: readonly string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Data resource tidak valid.");
  }
  const row = value as Record<string, unknown>;
  return Object.fromEntries(
    keys.map((key) => {
      const field = row[key];
      const nullable =
        key === "subnet_id" ||
        key === "ip" ||
        key === "resolved_at" ||
        key === "finished_at";
      if (typeof field !== "string" && !(nullable && field === null)) {
        throw new Error("Data resource tidak valid.");
      }
      return [key, field];
    }),
  );
}

function reply(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

async function proxy(
  request: Request,
  context: { params: Promise<{ resource: string }> },
) {
  const { resource } = await context.params;
  if (!Object.hasOwn(fields, resource)) {
    return reply({ error: "Resource tidak ditemukan." }, 404);
  }

  const creating = request.method === "POST";
  if (creating && resource !== "vpcs" && resource !== "workloads") {
    return reply({ error: "Aksi tidak didukung." }, 405);
  }
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) {
    return reply({ error: "Silakan login kembali." }, 401);
  }

  let body: string | undefined;
  if (creating) {
    if (request.headers.get("origin") !== new URL(request.url).origin) {
      return reply({ error: "Permintaan tidak diizinkan." }, 403);
    }
    try {
      const payload = await request.json();
      if (
        typeof payload?.name !== "string" ||
        !payload.name.trim() ||
        (resource === "vpcs" && typeof payload.cidr !== "string")
      ) {
        return reply({ error: "Data resource tidak valid." }, 400);
      }
      body = JSON.stringify(
        resource === "vpcs"
          ? { name: payload.name.trim(), cidr: payload.cidr }
          : { name: payload.name.trim() },
      );
    } catch {
      return reply({ error: "Data tidak valid." }, 400);
    }
  }

  try {
    const upstream = await fetch(backendEndpoint(resource), {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!upstream.ok) {
      const status = [401, 403, 404, 409, 422].includes(upstream.status)
        ? upstream.status
        : 502;
      return reply(
        {
          error: "Permintaan tidak dapat diproses. Periksa data dan coba lagi.",
        },
        status,
      );
    }
    const data: unknown = await upstream.json();
    if (creating) return reply(selectFields(data, ["name"]));
    if (!Array.isArray(data)) throw new Error("Data resource tidak valid.");
    return reply(
      data.map((item) => selectFields(item, fields[resource as Resource])),
    );
  } catch {
    return reply({ error: "Layanan NETRA belum dapat dihubungi." }, 503);
  }
}
export { proxy as GET, proxy as POST };
