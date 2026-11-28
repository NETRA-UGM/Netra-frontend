import { FiPlus } from "react-icons/fi";
import type { DashboardData, NetworkInventoryPanel } from "@/lib/dashboard";

type Inventory = {
  columns: string[];
  rows: { id: string; cells: (string | undefined)[] }[] | null;
};

function getInventory(
  panel: NetworkInventoryPanel,
  data: DashboardData,
): Inventory | null {
  const vpcs = new Map(data.vpcs?.map((vpc) => [vpc.id, vpc.name]));
  const subnets = new Map(
    data.subnets?.map((subnet) => [subnet.id, subnet.name]),
  );
  switch (panel) {
    case "vpcs":
      return {
        columns: ["Name", "CIDR", "VPC ID"],
        rows:
          data.vpcs?.map((vpc) => ({
            id: vpc.id,
            cells: [vpc.name, vpc.cidr, vpc.id],
          })) ?? null,
      };
    case "subnets":
      return {
        columns: ["Name", "VPC", "CIDR", "Type", "Gateway IP"],
        rows:
          data.subnets?.map((subnet) => ({
            id: subnet.id,
            cells: [
              subnet.name,
              vpcs.get(subnet.vpc_id) ?? subnet.vpc_id,
              subnet.cidr,
              subnet.type,
              subnet.gateway_ip,
            ],
          })) ?? null,
      };
    case "route-tables":
      return {
        columns: ["Route Table ID", "VPC", "Subnet"],
        rows:
          data["route-tables"]?.map((table) => ({
            id: table.id,
            cells: [
              table.id,
              vpcs.get(table.vpc_id) ?? table.vpc_id,
              subnets.get(table.subnet_id) ?? table.subnet_id,
            ],
          })) ?? null,
      };
    case "nacls":
      return {
        columns: ["Name", "Subnet", "Network ACL ID"],
        rows:
          data.nacls?.map((acl) => ({
            id: acl.id,
            cells: [
              acl.name,
              subnets.get(acl.subnet_id) ?? acl.subnet_id,
              acl.id,
            ],
          })) ?? null,
      };
    default:
      return null;
  }
}

export default function NetworkInventory({
  panel,
  data,
  loading,
  onCreateVpc,
}: {
  panel: NetworkInventoryPanel;
  data: DashboardData;
  loading: boolean;
  onCreateVpc: () => void;
}) {
  const inventory = getInventory(panel, data);
  if (!inventory) {
    return <p className="console-empty">Data untuk menu ini belum tersedia.</p>;
  }

  const { columns, rows } = inventory;
  return (
    <>
      {panel === "vpcs" && (
        <div className="dialog-toolbar">
          <p>{rows?.length ?? "—"} VPC</p>
          <button
            type="button"
            className="console-button primary"
            onClick={onCreateVpc}
          >
            <FiPlus aria-hidden="true" />
            Create VPC
          </button>
        </div>
      )}
      {rows?.length ? (
        <div className="table-scroll">
          <table className="workload-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column, index) => (
                    <td key={column}>{row.cells[index] ?? "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="console-empty" role="status">
          {rows
            ? "Belum ada resource."
            : loading
              ? "Memuat data…"
              : "Data tidak dapat dimuat."}
        </p>
      )}
    </>
  );
}
