import { useState } from "react";

// ─── Data ───────────────────────────────────────────────────────────
const CARRIERS = [
  { id: 1, name: "Hustle Transportation", mc: "MC-0981234", dot: "DOT-3456789", type: "COMPANY_ASSET", contact: "Jr Rodriguez", phone: "(555) 100-2000", email: "jr@hustletransport.com", status: "ACTIVE", drivers: 3, vehicles: 3, revenue: 84200, activeLoads: 4 },
  { id: 2, name: "JR Express LLC", mc: "MC-1234567", dot: "DOT-9876543", type: "EXTERNAL", contact: "Jr Rodriguez", phone: "(555) 123-4567", email: "jr@jrexpress.com", status: "ACTIVE", drivers: 2, vehicles: 2, revenue: 12800, activeLoads: 1 },
  { id: 3, name: "Summit Freight LLC", mc: "MC-2345678", dot: "DOT-8765432", type: "EXTERNAL", contact: "Andre Hill", phone: "(555) 234-5678", email: "andre@summitfreight.com", status: "ACTIVE", drivers: 2, vehicles: 2, revenue: 8400, activeLoads: 2 },
  { id: 4, name: "Apex Carriers Inc", mc: "MC-3456789", dot: "DOT-7654321", type: "EXTERNAL", contact: "Luis Garcia", phone: "(555) 345-6789", email: "luis@apexcarriers.com", status: "ACTIVE", drivers: 2, vehicles: 2, revenue: 6200, activeLoads: 1 },
  { id: 5, name: "Metro Haulers LLC", mc: "MC-4567890", dot: "DOT-6543210", type: "EXTERNAL", contact: "Dwayne Carter", phone: "(555) 456-7890", email: "dwayne@metrohaulers.com", status: "PENDING", drivers: 0, vehicles: 0, revenue: 0, activeLoads: 0 },
  { id: 6, name: "Liberty Transport Co", mc: "MC-5678901", dot: "DOT-5432109", type: "EXTERNAL", contact: "Maria Santos", phone: "(555) 567-8901", email: "maria@libertytransport.com", status: "PENDING", drivers: 1, vehicles: 1, revenue: 0, activeLoads: 0 },
  { id: 7, name: "Eagle Logistics LLC", mc: "MC-6789012", dot: "DOT-4321098", type: "EXTERNAL", contact: "Kevin Brown", phone: "(555) 678-9012", email: "kevin@eaglelogistics.com", status: "ONBOARDING", drivers: 0, vehicles: 0, revenue: 0, activeLoads: 0 },
  { id: 8, name: "Swift Line Hauling", mc: "MC-1122334", dot: "DOT-9988776", type: "EXTERNAL", contact: "Chris Martin", phone: "(555) 112-2334", email: "chris@swiftline.com", status: "INACTIVE", drivers: 1, vehicles: 1, revenue: 3100, activeLoads: 0 },
];

const TABS = [
  { key: "all", label: "All", count: 8 },
  { key: "company", label: "Company Asset", count: 1 },
  { key: "external", label: "External Carrier", count: 7 },
];

const STATUS_CONFIG = {
  ACTIVE: { label: "Active", color: "#16a34a", bg: "#f0fdf4", dot: "#16a34a" },
  PENDING: { label: "Pending", color: "#f59e0b", bg: "#fffbeb", dot: "#f59e0b" },
  ONBOARDING: { label: "Onboarding", color: "#2563eb", bg: "#eff6ff", dot: "#2563eb" },
  INACTIVE: { label: "Inactive", color: "#94a3b8", bg: "#f1f5f9", dot: "#94a3b8" },
};

const TYPE_CONFIG = {
  COMPANY_ASSET: { label: "Company Asset", color: "#7c3aed", bg: "#f5f3ff" },
  EXTERNAL: { label: "External", color: "#0891b2", bg: "#ecfeff" },
};

// ─── Sidebar Nav Items ──────────────────────────────────────────────
const NAV = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "board", label: "Dispatch Board" },
  { icon: "intelligence", label: "Load Intelligence" },
  { icon: "fleet", label: "Fleet", active: true, children: [
    { label: "Carriers", active: true },
    { label: "Drivers" },
    { label: "Vehicles" },
  ]},
  { icon: "contacts", label: "Contacts" },
  { icon: "invoices", label: "Invoices" },
  { icon: "settings", label: "Settings" },
];

// ─── SVG Icon paths ─────────────────────────────────────────────────
function NavIcon({ name, size = 20 }) {
  const paths = {
    dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    board: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    intelligence: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><path d="M11 8v6l4 2" /></>,
    fleet: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    contacts: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
    invoices: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    chevron: <polyline points="6 9 12 15 18 9" />,
    search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

// ─── Components ─────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status];
  if (!c) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px 3px 8px", borderRadius: 999,
      background: c.bg, fontSize: 12, fontWeight: 500, color: c.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const c = TYPE_CONFIG[type];
  if (!c) return null;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 10px", borderRadius: 999,
      background: c.bg, fontSize: 11, fontWeight: 600, color: c.color,
      letterSpacing: "0.01em",
    }}>
      {c.label}
    </span>
  );
}

function Sidebar() {
  const [fleetOpen, setFleetOpen] = useState(true);

  return (
    <div style={{
      width: 220, background: "#1a2332", color: "#fff",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{
        padding: "20px 16px 16px", display: "flex", alignItems: "center", gap: 10,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: "#fff",
        }}>FC</div>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>FleetCommand</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => item.children && setFleetOpen(!fleetOpen)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 6, border: "none",
                background: item.active && !item.children ? "#2563eb" : "transparent",
                color: item.active ? "#fff" : "rgba(255,255,255,0.6)",
                cursor: "pointer", fontSize: 13, fontWeight: item.active ? 600 : 400,
                transition: "all 150ms ease", textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!item.active || item.children) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!item.active || item.children) e.currentTarget.style.background = "transparent";
              }}
            >
              <NavIcon name={item.icon} size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.children && (
                <span style={{
                  transform: fleetOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 200ms ease", display: "flex",
                }}>
                  <NavIcon name="chevron" size={14} />
                </span>
              )}
            </button>

            {/* Children */}
            {item.children && fleetOpen && (
              <div style={{ marginLeft: 20, borderLeft: "1px solid rgba(255,255,255,0.08)", marginTop: 2 }}>
                {item.children.map((child) => (
                  <button key={child.label} style={{
                    width: "100%", display: "flex", alignItems: "center",
                    padding: "7px 12px 7px 16px", borderRadius: 4, border: "none",
                    background: child.active ? "rgba(37,99,235,0.15)" : "transparent",
                    color: child.active ? "#60a5fa" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 13, fontWeight: child.active ? 600 : 400,
                    textAlign: "left",
                  }}
                    onMouseEnter={(e) => { if (!child.active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { if (!child.active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {child.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{
        padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#94a3b8",
        }}>JR</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Jr — Admin</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Hustle Transportation</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function CarriersList() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [hoveredRow, setHoveredRow] = useState(null);

  const filtered = CARRIERS.filter((c) => {
    if (activeTab === "company" && c.type !== "COMPANY_ASSET") return false;
    if (activeTab === "external" && c.type !== "EXTERNAL") return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.mc.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalRevenue = CARRIERS.reduce((s, c) => s + c.revenue, 0);
  const activeCount = CARRIERS.filter((c) => c.status === "ACTIVE").length;
  const totalDrivers = CARRIERS.reduce((s, c) => s + c.drivers, 0);
  const totalVehicles = CARRIERS.reduce((s, c) => s + c.vehicles, 0);

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f8fafc", minHeight: "100vh", display: "flex",
    }}>
      <Sidebar />

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>

        {/* Header bar */}
        <div style={{
          padding: "16px 28px", background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>
            Carriers
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{
              padding: "8px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
              background: "#fff", fontSize: 13, fontWeight: 500, color: "#475569",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              Export
            </button>
            <button style={{
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: "#2563eb", fontSize: 13, fontWeight: 600, color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <NavIcon name="plus" size={14} />
              Add Carrier
            </button>
          </div>
        </div>

        <div style={{ padding: "20px 28px" }}>

          {/* KPI Row */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
            marginBottom: 24,
          }}>
            {[
              { emoji: "🚛", label: "Total Carriers", value: CARRIERS.length, sub: `${activeCount} active` },
              { emoji: "👥", label: "Total Drivers", value: totalDrivers, sub: "Across all carriers" },
              { emoji: "🚚", label: "Total Vehicles", value: totalVehicles, sub: "DV, Flatbed, Reefer" },
              { emoji: "💰", label: "Lifetime Revenue", value: `$${(totalRevenue / 1000).toFixed(1)}K`, sub: "All carriers combined" },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
                padding: "16px 18px",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{kpi.emoji}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, marginBottom: 2 }}>{kpi.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b" }}>{kpi.value}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Filters bar */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8,
            overflow: "hidden",
          }}>
            {/* Tabs + Search row */}
            <div style={{
              padding: "12px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid #e2e8f0",
            }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {TABS.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                    padding: "6px 14px", borderRadius: 6, border: "none",
                    background: activeTab === tab.key ? "#eff6ff" : "transparent",
                    color: activeTab === tab.key ? "#2563eb" : "#64748b",
                    fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 500,
                    cursor: "pointer", transition: "all 150ms ease",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {tab.label}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                      background: activeTab === tab.key ? "#dbeafe" : "#f1f5f9",
                      color: activeTab === tab.key ? "#2563eb" : "#94a3b8",
                    }}>{tab.count}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  color: "#94a3b8", display: "flex",
                }}>
                  <NavIcon name="search" size={15} />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search carriers, contacts, MC#..."
                  style={{
                    padding: "7px 12px 7px 32px", width: 280,
                    border: "1px solid #e2e8f0", borderRadius: 6,
                    fontSize: 13, color: "#1e293b", outline: "none",
                    transition: "border-color 150ms",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2563eb")}
                  onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                />
              </div>
            </div>

            {/* Table */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                  {["CARRIER", "TYPE", "CONTACT", "STATUS", "DRIVERS", "VEHICLES", "REVENUE", "ACTIVE LOADS", ""].map((h, i) => (
                    <th key={i} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, color: "#64748b",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      ...(["DRIVERS", "VEHICLES", "ACTIVE LOADS"].includes(h) ? { textAlign: "center" } : {}),
                      ...(h === "REVENUE" ? { textAlign: "right" } : {}),
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setHoveredRow(c.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: hoveredRow === c.id ? "#f8fafc" : "#fff",
                      transition: "background 100ms ease",
                      cursor: "pointer",
                    }}
                  >
                    {/* Carrier */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: c.type === "COMPANY_ASSET" ? "#eff6ff" : "#f0fdf4",
                          border: `1px solid ${c.type === "COMPANY_ASSET" ? "#dbeafe" : "#dcfce7"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 700,
                          color: c.type === "COMPANY_ASSET" ? "#2563eb" : "#16a34a",
                          flexShrink: 0,
                        }}>
                          {c.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.mc} · {c.dot}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "12px 16px" }}>
                      <TypeBadge type={c.type} />
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{c.contact}</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.phone}</div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={c.status} />
                    </td>

                    {/* Drivers */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: c.drivers > 0 ? "#1e293b" : "#cbd5e1",
                      }}>
                        {c.drivers}
                      </span>
                    </td>

                    {/* Vehicles */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: c.vehicles > 0 ? "#1e293b" : "#cbd5e1",
                      }}>
                        {c.vehicles}
                      </span>
                    </td>

                    {/* Revenue */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: c.revenue > 0 ? "#1e293b" : "#cbd5e1",
                      }}>
                        {c.revenue > 0 ? `$${c.revenue.toLocaleString()}` : "$0"}
                      </span>
                      {c.revenue > 0 && (
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>
                          {c.type === "COMPANY_ASSET" ? "gross" : `${Math.round(c.revenue * 0.1).toLocaleString()} fees`}
                        </div>
                      )}
                    </td>

                    {/* Active Loads */}
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      {c.activeLoads > 0 ? (
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 24, height: 24, borderRadius: 6,
                          background: "#eff6ff", fontSize: 12, fontWeight: 700, color: "#2563eb",
                        }}>
                          {c.activeLoads}
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: "#cbd5e1" }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button style={{
                        padding: "5px 12px", borderRadius: 5,
                        border: "1px solid #e2e8f0", background: "#fff",
                        fontSize: 12, fontWeight: 500, color: "#475569",
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5,
                        transition: "all 150ms ease",
                        ...(hoveredRow === c.id ? { borderColor: "#2563eb", color: "#2563eb" } : {}),
                      }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>
                        No carriers found
                      </div>
                      <div style={{ fontSize: 13, color: "#94a3b8" }}>
                        Try adjusting your search or filter criteria
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{
              padding: "12px 18px",
              borderTop: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                Showing <span style={{ fontWeight: 600, color: "#475569" }}>{filtered.length}</span> of{" "}
                <span style={{ fontWeight: 600, color: "#475569" }}>{CARRIERS.length}</span> carriers
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button disabled style={{
                  padding: "5px 10px", borderRadius: 5, border: "1px solid #e2e8f0",
                  background: "#fff", fontSize: 12, color: "#cbd5e1", cursor: "not-allowed",
                }}>Previous</button>
                <span style={{
                  padding: "5px 10px", borderRadius: 5, background: "#2563eb",
                  fontSize: 12, fontWeight: 600, color: "#fff",
                }}>1</span>
                <button disabled style={{
                  padding: "5px 10px", borderRadius: 5, border: "1px solid #e2e8f0",
                  background: "#fff", fontSize: 12, color: "#cbd5e1", cursor: "not-allowed",
                }}>Next</button>
              </div>
            </div>
          </div>

          {/* API reference */}
          <div style={{
            marginTop: 24, padding: "14px 18px",
            background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
            fontSize: 12, color: "#92400e", lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>📡 API Endpoints</div>
            <div><span style={{ fontWeight: 600 }}>GET /api/carriers</span> — List with filters (?type=COMPANY_ASSET|EXTERNAL, ?status=ACTIVE, ?search=)</div>
            <div><span style={{ fontWeight: 600 }}>GET /api/carriers/:id</span> — Detail view (includes drivers[], vehicles[], loadHistory[])</div>
            <div><span style={{ fontWeight: 600 }}>GET /api/carriers/stats</span> — KPI aggregates (totalRevenue, driverCount, vehicleCount)</div>
            <div><span style={{ fontWeight: 600 }}>POST /api/carriers</span> — Create new carrier (triggers onboarding pipeline)</div>
            <div style={{ marginTop: 4, color: "#b45309", fontStyle: "italic" }}>
              Note: Revenue field shows gross for COMPANY_ASSET, dispatch fees earned for EXTERNAL. Partner split amounts hidden for DISPATCHER role.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
