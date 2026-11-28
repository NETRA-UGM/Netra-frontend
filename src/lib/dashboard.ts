export type Vpc = { id: string; name: string; cidr: string };
export type Subnet = {
  id: string;
  vpc_id: string;
  name: string;
  cidr: string;
  type: string;
  gateway_ip: string;
};
export type Workload = {
  id: string;
  name: string;
  subnet_id: string | null;
  ip: string | null;
  netns_name: string;
  status: string;
};
export type Gateway = { id: string; vpc_id: string; status: string };
export type RouteTable = { id: string; vpc_id: string; subnet_id: string };
export type NetworkAcl = { id: string; subnet_id: string; name: string };
export type Incident = {
  id: string;
  category: string;
  status: string;
  detected_at: string;
  resolved_at: string | null;
};
export type Remediation = {
  id: string;
  incident_id: string;
  status: string;
  finished_at: string | null;
};
export type DashboardData = {
  vpcs: Vpc[] | null;
  subnets: Subnet[] | null;
  workloads: Workload[] | null;
  "internet-gateways": Gateway[] | null;
  "route-tables": RouteTable[] | null;
  nacls: NetworkAcl[] | null;
  incidents: Incident[] | null;
  remediations: Remediation[] | null;
};
export const resources = [
  "vpcs",
  "subnets",
  "workloads",
  "internet-gateways",
  "route-tables",
  "nacls",
  "incidents",
  "remediations",
] as const;
export type Resource = (typeof resources)[number];
export const networkMenu = [
  { panel: "vpcs", label: "Your VPCs" },
  { panel: "subnets", label: "Subnet" },
  { panel: "route-tables", label: "Route Tables" },
  { panel: "nat-gateways", label: "Nat Gateways" },
  { panel: "security-groups", label: "Security Groups" },
  { panel: "nacls", label: "Network ACLs" },
] as const;
export type NetworkInventoryPanel = (typeof networkMenu)[number]["panel"];
export function recoverySeconds(incident: Incident) {
  if (!incident.resolved_at) return null;
  const value =
    (Date.parse(incident.resolved_at) - Date.parse(incident.detected_at)) /
    1000;
  return Number.isFinite(value) && value >= 0 ? value : null;
}
