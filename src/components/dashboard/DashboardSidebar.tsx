import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { FiBell, FiChevronDown, FiSettings } from "react-icons/fi";
import { LuLayoutGrid } from "react-icons/lu";
import { RiMenuFoldLine, RiMenuUnfoldLine } from "react-icons/ri";
import { networkMenu, type NetworkInventoryPanel } from "@/lib/dashboard";

type ResourceSection = "network" | "workloads";
type SidebarPanel =
  ResourceSection | NetworkInventoryPanel | "incidents" | "settings";

const compactQuery = "(max-width: 1199px)";

function subscribeToScreen(onChange: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const resourceSections = [
  {
    section: "network",
    label: "VPC-Lite",
    icon: "/dashboard/vpc-lite.png",
    width: 20,
    height: 24,
    items: networkMenu,
  },
  {
    section: "workloads",
    label: "EC2-Lite",
    icon: "/dashboard/ec2-lite.png",
    width: 18,
    height: 22,
    items: [{ panel: "workloads", label: "Workloads" }],
  },
] as const;

export default function DashboardSidebar({
  onDashboard,
  onOpen,
  currentPanel,
}: {
  onDashboard: () => void;
  onOpen: (panel: SidebarPanel) => void;
  currentPanel: SidebarPanel | "services" | null;
}) {
  const compactScreen = useSyncExternalStore(
    subscribeToScreen,
    () => window.matchMedia(compactQuery).matches,
    () => false,
  );
  const [preference, setPreference] = useState<boolean>();
  const [openSection, setOpenSection] = useState<ResourceSection | null>(null);
  const expanded = preference ?? !compactScreen;

  return (
    <div
      className="sidebar-frame"
      data-expanded={expanded}
      data-animate={preference !== undefined}
    >
      <aside className="console-sidebar">
        <a
          className="console-brand"
          href="/dashboard"
          aria-label="NETRA dashboard"
        >
          <span className="console-mark">
            <Image
              src="/dashboard/logo-left.svg"
              alt=""
              width={29.02}
              height={21.765}
            />
            <Image
              src="/dashboard/logo-right.svg"
              alt=""
              width={29.02}
              height={21.765}
            />
          </span>
          <strong className="sidebar-wordmark">NETRA</strong>
        </a>
        <nav
          className="sidebar-nav"
          id="dashboard-sidebar-nav"
          aria-label="Navigasi utama"
        >
          <div
            className="sidebar-divider sidebar-divider-first"
            aria-hidden="true"
          />
          <button
            type="button"
            className="side-button sidebar-dashboard"
            onClick={onDashboard}
            title="Dashboard"
            aria-label="Dashboard"
            aria-current={currentPanel === null ? "page" : undefined}
            data-current={currentPanel === null}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              <LuLayoutGrid />
            </span>
            <span className="sidebar-label">Dashboard</span>
          </button>
          <div className="sidebar-divider" aria-hidden="true" />
          {resourceSections.map(
            ({ section, label, icon, width, height, items }) => {
              const sectionOpen = openSection === section;
              const submenuOpen = expanded && sectionOpen;
              const sectionCurrent =
                currentPanel === section ||
                items.some((item) => item.panel === currentPanel);
              return (
                <div
                  className={`sidebar-resource sidebar-${section}`}
                  key={section}
                >
                  <button
                    type="button"
                    className="side-button"
                    aria-label={label}
                    title={label}
                    data-current={sectionCurrent}
                    aria-current={
                      !expanded && sectionCurrent ? true : undefined
                    }
                    aria-expanded={expanded ? submenuOpen : undefined}
                    aria-controls={
                      expanded ? `sidebar-menu-${section}` : undefined
                    }
                    onClick={() => {
                      if (!expanded) {
                        onOpen(section);
                        return;
                      }
                      setOpenSection(openSection === section ? null : section);
                    }}
                  >
                    <span className="sidebar-item-icon" aria-hidden="true">
                      <Image
                        className="sidebar-resource-icon"
                        src={icon}
                        alt=""
                        width={width}
                        height={height}
                        unoptimized
                      />
                    </span>
                    <span className="sidebar-label">{label}</span>
                    <FiChevronDown
                      className="sidebar-chevron"
                      aria-hidden="true"
                    />
                  </button>
                  <div
                    className="sidebar-submenu"
                    id={`sidebar-menu-${section}`}
                    data-open={sectionOpen}
                    inert={!submenuOpen}
                  >
                    <div className="sidebar-submenu-items">
                      {items.map((item) => (
                        <button
                          type="button"
                          key={item.panel}
                          aria-current={
                            currentPanel === item.panel || undefined
                          }
                          onClick={() => onOpen(item.panel)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            },
          )}
          <div className="sidebar-divider" aria-hidden="true" />
          <button
            type="button"
            className="side-button sidebar-notifications"
            onClick={() => onOpen("incidents")}
            title="Notifications"
            aria-label="Notifications"
            data-current={currentPanel === "incidents"}
            aria-current={currentPanel === "incidents" || undefined}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              <FiBell />
            </span>
            <span className="sidebar-label">Notifications</span>
          </button>
          <button
            type="button"
            className="side-button"
            onClick={() => onOpen("settings")}
            title="Settings"
            aria-label="Settings"
            data-current={currentPanel === "settings"}
            aria-current={currentPanel === "settings" || undefined}
          >
            <span className="sidebar-item-icon" aria-hidden="true">
              <FiSettings />
            </span>
            <span className="sidebar-label">Settings</span>
          </button>
        </nav>
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={expanded}
          aria-controls="dashboard-sidebar-nav"
          aria-label={expanded ? "Ringkas sidebar" : "Perluas sidebar"}
          title={expanded ? "Ringkas sidebar" : "Perluas sidebar"}
          onClick={() => setPreference(!expanded)}
        >
          <span className="sidebar-toggle-icons" aria-hidden="true">
            <RiMenuFoldLine className="sidebar-toggle-fold" />
            <RiMenuUnfoldLine className="sidebar-toggle-unfold" />
          </span>
        </button>
      </aside>
    </div>
  );
}
