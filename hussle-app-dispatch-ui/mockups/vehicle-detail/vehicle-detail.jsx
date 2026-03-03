import { useState } from "react";

// ─── Expense Data ───────────────────────────────────────────────────
const DEFAULT_EXPENSES = {
  fixed: [
    { key: "truck_payment", label: "Truck Payment", amount: 1800, tooltip: "Monthly loan/lease payment" },
    { key: "insurance", label: "Insurance", amount: 1200, tooltip: "Liability + cargo + physical damage" },
    { key: "permits", label: "Permits & Licenses", amount: 250, tooltip: "IFTA, IRP, UCR, NMFTA" },
    { key: "parking", label: "Parking", amount: 200, tooltip: "Yard parking / overnight" },
  ],
  variable: [
    { key: "fuel", label: "Fuel (estimated)", amount: 2400, tooltip: "~6.5 MPG × $3.70/gal × 10K mi" },
    { key: "tires", label: "Tires", amount: 300, tooltip: "Replacement + rotation reserve" },
    { key: "maintenance", label: "Maintenance", amount: 500, tooltip: "Preventive + reserve for repairs" },
    { key: "tolls", label: "Tolls", amount: 350, tooltip: "I-95 corridor, NJ Turnpike avg" },
  ],
  service: [
    { key: "driver_pay", label: "Driver Pay", amount: 1200, tooltip: "Base weekly pay equivalent" },
    { key: "benefits", label: "Benefits", amount: 300, tooltip: "Health + workers comp reserve" },
  ],
};

const WEEKLY_GROSS = [
  { week: "Jan 20", amount: 4200, color: "#f59e0b" },
  { week: "Jan 27", amount: 5100, color: "#16a34a" },
  { week: "Feb 3", amount: 3800, color: "#f59e0b" },
  { week: "Feb 10", amount: 5400, color: "#16a34a" },
  { week: "Feb 17", amount: 4700, color: "#f59e0b" },
  { week: "Feb 24", amount: 3900, color: "#f59e0b" },
];

// ─── Nav config ─────────────────────────────────────────────────────
const NAV = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "board", label: "Dispatch Board" },
  { icon: "intelligence", label: "Load Intelligence" },
  { icon: "fleet", label: "Fleet", expandable: true, active: true, children: [
    { label: "Carriers" }, { label: "Drivers" }, { label: "Vehicles", active: true },
  ]},
  { icon: "contacts", label: "Contacts" },
  { icon: "invoices", label: "Invoices" },
  { icon: "settings", label: "Settings" },
];

// ─── Icons ──────────────────────────────────────────────────────────
function Icon({ name, size = 18, sw = 1.8 }) {
  const d = {
    dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    board: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    intelligence: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><path d="M11 8v6l4 2" /></>,
    fleet: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    contacts: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
    invoices: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    chevron: <polyline points="6 9 12 15 18 9" />,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
    more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
    info: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>,
    save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>,
    truck: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
    mappin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d[name]}
    </svg>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar() {
  const [fleetOpen, setFleetOpen] = useState(true);
  return (
    <div style={{
      width: 220, background: "#1a2332", color: "#fff",
      display: "flex", flexDirection: "column", height: "100vh",
      position: "fixed", left: 0, top: 0, zIndex: 50,
    }}>
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
        <span style={{ fontSize: 15, fontWeight: 700 }}>FleetCommand</span>
      </div>
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => item.expandable && setFleetOpen(!fleetOpen)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 6, border: "none",
                background: item.active && !item.expandable ? "#2563eb" : "transparent",
                color: item.active ? "#fff" : "rgba(255,255,255,0.6)",
                cursor: "pointer", fontSize: 13, fontWeight: item.active ? 600 : 400,
                textAlign: "left",
              }}
              onMouseEnter={e => { if (!item.active || item.expandable) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!item.active || item.expandable) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon name={item.icon} size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.expandable && (
                <span style={{ transform: fleetOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms", display: "flex" }}>
                  <Icon name="chevron" size={14} />
                </span>
              )}
            </button>
            {item.expandable && fleetOpen && (
              <div style={{ marginLeft: 20, borderLeft: "1px solid rgba(255,255,255,0.08)", marginTop: 2 }}>
                {item.children.map(c => (
                  <button key={c.label} style={{
                    width: "100%", display: "flex", padding: "7px 12px 7px 16px",
                    borderRadius: 4, border: "none",
                    background: c.active ? "rgba(37,99,235,0.15)" : "transparent",
                    color: c.active ? "#60a5fa" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 13, fontWeight: c.active ? 600 : 400, textAlign: "left",
                  }}
                    onMouseEnter={e => { if (!c.active) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={e => { if (!c.active) e.currentTarget.style.background = c.active ? "rgba(37,99,235,0.15)" : "transparent"; }}
                  >{c.label}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
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

// ─── Expense Row ────────────────────────────────────────────────────
function ExpenseRow({ item, value, onChange, even }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 160px",
      alignItems: "center", padding: "8px 14px",
      background: even ? "#f8fafc" : "#fff",
      borderBottom: "1px solid #f1f5f9",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{item.label}</span>
        <span title={item.tooltip} style={{ cursor: "help", display: "flex", color: "#cbd5e1" }}>
          <Icon name="info" size={13} sw={1.5} />
        </span>
      </div>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 13, color: "#94a3b8", fontWeight: 500,
        }}>$</span>
        <input
          type="text"
          value={value.toLocaleString()}
          onChange={e => {
            const num = parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0;
            onChange(num);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%", padding: "6px 10px 6px 22px",
            border: `1px solid ${focused ? "#2563eb" : "#e2e8f0"}`,
            borderRadius: 5, fontSize: 13, color: "#1e293b",
            fontWeight: 600, textAlign: "right", outline: "none",
            background: "#fff", boxSizing: "border-box",
            transition: "border-color 150ms",
          }}
        />
      </div>
    </div>
  );
}

// ─── Weekly Bar Chart ───────────────────────────────────────────────
function WeeklyChart({ data, target }) {
  const max = Math.max(...data.map(d => d.amount), target) * 1.15;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100, padding: "0 4px" }}>
      {data.map((d, i) => {
        const h = (d.amount / max) * 100;
        const targetH = (target / max) * 100;
        const meetsTarget = d.amount >= target;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
            {/* Target line */}
            {i === 0 && (
              <div style={{
                position: "absolute", left: -4, right: -4, bottom: `${targetH}%`,
                borderTop: "1.5px dashed #dc2626", zIndex: 1,
              }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 600, color: meetsTarget ? "#16a34a" : "#f59e0b" }}>
              ${(d.amount / 1000).toFixed(1)}K
            </span>
            <div style={{
              width: "100%", height: `${h}%`, borderRadius: "4px 4px 0 0",
              background: meetsTarget
                ? "linear-gradient(180deg, #16a34a, #22c55e)"
                : "linear-gradient(180deg, #f59e0b, #fbbf24)",
              transition: "height 300ms ease",
              minHeight: 4,
            }} />
            <span style={{ fontSize: 9, color: "#94a3b8", whiteSpace: "nowrap" }}>{d.week}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────
export default function VehicleDetail() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expenses, setExpenses] = useState(() => {
    const flat = {};
    Object.values(DEFAULT_EXPENSES).flat().forEach(e => { flat[e.key] = e.amount; });
    return flat;
  });
  const [targetMiles, setTargetMiles] = useState(10000);
  const [workingDays, setWorkingDays] = useState(22);
  const [saved, setSaved] = useState(false);

  const updateExpense = (key, val) => {
    setExpenses(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const totalFixed = DEFAULT_EXPENSES.fixed.reduce((s, e) => s + (expenses[e.key] || 0), 0);
  const totalVariable = DEFAULT_EXPENSES.variable.reduce((s, e) => s + (expenses[e.key] || 0), 0);
  const totalService = DEFAULT_EXPENSES.service.reduce((s, e) => s + (expenses[e.key] || 0), 0);
  const monthlyTotal = totalFixed + totalVariable + totalService;
  const cpm = targetMiles > 0 ? monthlyTotal / targetMiles : 0;
  const dailyMin = workingDays > 0 ? monthlyTotal / workingDays : 0;
  const weeklyMin = dailyMin * (workingDays > 0 ? Math.min(workingDays / 4.33, 7) : 5);
  const minBookRate = Math.round(cpm * 1000 * 1.15); // CPM × 1000mi × 15% margin

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "loadHistory", label: "Load History", count: 42 },
    { key: "documents", label: "Documents", count: 3 },
  ];

  return (
    <div style={{
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      background: "#f8fafc", minHeight: "100vh", display: "flex",
    }}>
      <Sidebar />

      <div style={{ marginLeft: 220, flex: 1, minHeight: "100vh" }}>
        {/* Header */}
        <div style={{
          padding: "16px 28px", background: "#fff", borderBottom: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#64748b", fontSize: 13, fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                ← Vehicles
              </button>
              <div style={{ width: 1, height: 20, background: "#e2e8f0" }} />
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: "#eff6ff", border: "1px solid #dbeafe",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#2563eb",
              }}>
                <Icon name="truck" size={18} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", margin: 0 }}>#133718</h1>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: "#eff6ff", color: "#2563eb",
                  }}>Hustle Transport</span>
                  <span style={{
                    padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: "#f5f3ff", color: "#7c3aed",
                  }}>Company Asset</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  2022 Freightliner Cascadia · VIN: 3AKJGLDR8NSLA4927
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                padding: "8px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
                background: "#fff", fontSize: 13, fontWeight: 500, color: "#475569",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <Icon name="edit" size={14} /> Edit
              </button>
              <button style={{
                padding: "8px 10px", borderRadius: 6, border: "1px solid #e2e8f0",
                background: "#fff", color: "#475569", cursor: "pointer", display: "flex",
              }}>
                <Icon name="more" size={16} />
              </button>
            </div>
          </div>

          {/* Summary bar */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
            background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}>
            {[
              { label: "TYPE", value: "2022 Freightliner Cascadia", small: true },
              { label: "EQUIPMENT", value: "Dry Van" },
              { label: "OWNERSHIP", value: "Owned", badge: true, badgeColor: "#16a34a", badgeBg: "#f0fdf4" },
              { label: "DRIVER", value: "Marcus Johnson", link: true },
              { label: "CPM", value: `$${cpm.toFixed(2)}/mi`, highlight: true },
              { label: "MONTHLY COST", value: `$${monthlyTotal.toLocaleString()}`, highlight: true },
            ].map((col, i) => (
              <div key={i} style={{
                padding: "12px 16px",
                borderRight: i < 5 ? "1px solid #e2e8f0" : "none",
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                  {col.label}
                </div>
                {col.badge ? (
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "2px 8px", borderRadius: 999,
                    background: col.badgeBg, fontSize: 13, fontWeight: 600, color: col.badgeColor,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: col.badgeColor }} />
                    {col.value}
                  </span>
                ) : (
                  <div style={{
                    fontSize: col.small ? 12 : 14,
                    fontWeight: col.highlight ? 700 : 600,
                    color: col.highlight ? "#1e293b" : col.link ? "#2563eb" : "#1e293b",
                    cursor: col.link ? "pointer" : "default",
                  }}>
                    {col.value}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 16 }}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding: "8px 16px 10px", border: "none",
                  borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                  background: "transparent", cursor: "pointer",
                  color: isActive ? "#2563eb" : "#64748b",
                  fontSize: 13, fontWeight: isActive ? 600 : 500,
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: -1,
                }}>
                  {tab.label}
                  {tab.count != null && (
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                      background: isActive ? "#dbeafe" : "#f1f5f9",
                      color: isActive ? "#2563eb" : "#94a3b8",
                    }}>{tab.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: "24px 28px",
          display: "grid", gridTemplateColumns: "1fr 340px", gap: 24,
          alignItems: "start",
        }}>
          {/* Left — main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Vehicle Information */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                padding: "14px 18px", borderBottom: "1px solid #e2e8f0",
                fontSize: 15, fontWeight: 700, color: "#1e293b",
              }}>Vehicle Information</div>
              <div style={{ padding: "18px 18px 14px" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px 24px",
                }}>
                  {[
                    { label: "Unit #", value: "#133718" },
                    { label: "VIN", value: "3AKJGLDR8NSLA4927" },
                    { label: "License Plate", value: "NJ · XB-4821T" },
                    { label: "Year / Make / Model", value: "2022 Freightliner Cascadia" },
                    { label: "Ownership", value: "Owned" },
                    { label: "Equipment Type", value: "Dry Van (53')" },
                  ].map((f, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{f.value}</div>
                    </div>
                  ))}
                </div>

                {/* Emergency contact */}
                <div style={{
                  marginTop: 18, padding: "12px 14px", borderRadius: 6,
                  background: "#fffbeb", border: "1px solid #fde68a",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>📞</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>Emergency / Roadside</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f" }}>NTP Warranty: 1-877-950-3200</div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Warranty / Notes</div>
                  <div style={{
                    fontSize: 12, color: "#475569", lineHeight: 1.6,
                    padding: "8px 12px", background: "#f8fafc", borderRadius: 6,
                    border: "1px solid #f1f5f9",
                  }}>
                    NTP 5-year / 500K mile extended warranty — covers engine, transmission, aftertreatment. Expires Dec 2027 or 500K mi (currently ~185K). Warranty claim contact: warranty@ntpwarranty.com. Last PM service: Feb 15, 2026 at 184,200 mi (Petro, Bordentown NJ).
                  </div>
                </div>
              </div>
            </div>

            {/* CPM Expense Editor */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                padding: "14px 18px", borderBottom: "1px solid #e2e8f0",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>CPM Expense Editor</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 4,
                    background: "#eff6ff", color: "#2563eb",
                  }}>KEY FEATURE</span>
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>
                  Drives Load Intelligence min book rates
                </div>
              </div>

              <div>
                {/* FIXED COSTS */}
                <div style={{
                  padding: "10px 14px 6px", fontSize: 11, fontWeight: 700, color: "#64748b",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>Fixed Costs (monthly)</span>
                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                    ${totalFixed.toLocaleString()}
                  </span>
                </div>
                {DEFAULT_EXPENSES.fixed.map((item, i) => (
                  <ExpenseRow key={item.key} item={item} value={expenses[item.key]} onChange={v => updateExpense(item.key, v)} even={i % 2 === 0} />
                ))}

                {/* VARIABLE COSTS */}
                <div style={{
                  padding: "10px 14px 6px", fontSize: 11, fontWeight: 700, color: "#64748b",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>Variable Costs (monthly)</span>
                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                    ${totalVariable.toLocaleString()}
                  </span>
                </div>
                {DEFAULT_EXPENSES.variable.map((item, i) => (
                  <ExpenseRow key={item.key} item={item} value={expenses[item.key]} onChange={v => updateExpense(item.key, v)} even={i % 2 === 0} />
                ))}

                {/* SERVICE / WAGE */}
                <div style={{
                  padding: "10px 14px 6px", fontSize: 11, fontWeight: 700, color: "#64748b",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                  background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span>Service / Wage</span>
                  <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>
                    ${totalService.toLocaleString()}
                  </span>
                </div>
                {DEFAULT_EXPENSES.service.map((item, i) => (
                  <ExpenseRow key={item.key} item={item} value={expenses[item.key]} onChange={v => updateExpense(item.key, v)} even={i % 2 === 0} />
                ))}

                {/* MONTHLY TOTAL */}
                <div style={{
                  padding: "12px 14px", borderTop: "2px solid #1e293b",
                  display: "grid", gridTemplateColumns: "1fr 160px", alignItems: "center",
                  background: "#f8fafc",
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>Monthly Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", textAlign: "right", paddingRight: 10 }}>
                    ${monthlyTotal.toLocaleString()}
                  </span>
                </div>

                {/* Target inputs */}
                <div style={{
                  padding: "14px 14px", borderTop: "1px solid #e2e8f0",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Target Miles / Month
                    </label>
                    <input
                      type="text"
                      value={targetMiles.toLocaleString()}
                      onChange={e => setTargetMiles(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                      style={{
                        width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                        borderRadius: 5, fontSize: 13, fontWeight: 600, color: "#1e293b",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 4 }}>
                      Working Days / Month
                    </label>
                    <input
                      type="text"
                      value={workingDays}
                      onChange={e => setWorkingDays(parseInt(e.target.value.replace(/[^0-9]/g, "")) || 0)}
                      style={{
                        width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                        borderRadius: 5, fontSize: 13, fontWeight: 600, color: "#1e293b",
                        outline: "none", boxSizing: "border-box",
                      }}
                      onFocus={e => e.target.style.borderColor = "#2563eb"}
                      onBlur={e => e.target.style.borderColor = "#e2e8f0"}
                    />
                  </div>
                </div>

                {/* Calculated results */}
                <div style={{
                  margin: "0 14px 14px", padding: "16px 18px",
                  background: "linear-gradient(135deg, #eff6ff, #f0f7ff)",
                  border: "1px solid #bfdbfe", borderRadius: 8,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                    ⊕ Calculated — Auto-computed
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 2 }}>Cost Per Mile</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>${cpm.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 2 }}>Daily Min Revenue</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>${dailyMin.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, marginBottom: 2 }}>Weekly Min Revenue</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#1e293b" }}>${weeklyMin.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div style={{ padding: "0 14px 16px", display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={handleSave} style={{
                    padding: "9px 20px", borderRadius: 6, border: "none",
                    background: saved ? "#16a34a" : "#2563eb",
                    fontSize: 13, fontWeight: 600, color: "#fff",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                    transition: "background 200ms",
                  }}>
                    {saved ? "✓ Saved" : <><Icon name="save" size={14} /> Save Expenses</>}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>

            {/* Revenue Performance */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid #e2e8f0",
                fontSize: 13, fontWeight: 700, color: "#1e293b",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span>Revenue Performance</span>
                <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Last 6 weeks</span>
              </div>
              <div style={{ padding: "16px 12px" }}>
                <WeeklyChart data={WEEKLY_GROSS} target={5000} />
                <div style={{
                  marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                  fontSize: 10, color: "#94a3b8",
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 3, background: "#16a34a", borderRadius: 1 }} /> At target
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 3, background: "#f59e0b", borderRadius: 1 }} /> Below target
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 8, height: 0, borderTop: "1.5px dashed #dc2626" }} /> $5K target
                  </span>
                </div>
                <div style={{
                  marginTop: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 6,
                  display: "flex", justifyContent: "space-between", fontSize: 12,
                }}>
                  <span style={{ color: "#64748b" }}>6-week avg:</span>
                  <span style={{ fontWeight: 700, color: "#f59e0b" }}>$4,517</span>
                </div>
              </div>
            </div>

            {/* Current Assignment */}
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid #e2e8f0",
                fontSize: 13, fontWeight: 700, color: "#1e293b",
              }}>Current Assignment</div>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: "#eff6ff",
                    border: "2px solid #2563eb",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#2563eb",
                  }}>MJ</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>Marcus Johnson</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>CDL-A #133718</div>
                  </div>
                </div>
                {[
                  { icon: "🟢", label: "Status", value: "Available", color: "#16a34a" },
                  { icon: "📍", label: "Location", value: "Newark, NJ (home base)" },
                  { icon: "⏱️", label: "Hours Available", value: "62h of 70" },
                  { icon: "📅", label: "Days Out", value: "0 (home now)" },
                  { icon: "🚛", label: "Last Delivered", value: "Feb 26, 4:30 PM" },
                ].map((r, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 0", borderTop: i > 0 ? "1px solid #f1f5f9" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12 }}>{r.icon}</span> {r.label}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: r.color || "#1e293b" }}>{r.value}</span>
                  </div>
                ))}
                <button style={{
                  width: "100%", marginTop: 12, padding: "8px 14px", borderRadius: 6,
                  border: "1px solid #e2e8f0", background: "#fff",
                  fontSize: 12, fontWeight: 600, color: "#2563eb", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  🔍 Find Matching Loads
                </button>
              </div>
            </div>

            {/* Min Book Rate */}
            <div style={{
              background: "linear-gradient(135deg, #f0f7ff, #eff6ff)",
              border: "1px solid #bfdbfe", borderRadius: 8, overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid #bfdbfe",
                fontSize: 13, fontWeight: 700, color: "#1e293b",
              }}>Min Book Rate</div>
              <div style={{ padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 800, color: "#1e293b", marginBottom: 4 }}>
                  ${minBookRate.toLocaleString()}
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  Based on ${cpm.toFixed(2)} CPM + 15% margin
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 12px", borderRadius: 6,
                  background: "#fff", border: "1px solid #dbeafe",
                  fontSize: 11, color: "#2563eb", fontWeight: 500,
                }}>
                  Used in Load Intelligence scoring to filter out unprofitable loads
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API reference */}
        <div style={{
          margin: "0 28px 24px", padding: "14px 18px",
          background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8,
          fontSize: 12, color: "#92400e", lineHeight: 1.7,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>📡 API Endpoints</div>
          <div><span style={{ fontWeight: 600 }}>GET /api/v1/vehicles/:id</span> — Vehicle info + expenses + current driver assignment</div>
          <div><span style={{ fontWeight: 600 }}>PATCH /api/v1/vehicles/:id/expenses</span> — Save expense changes (recalculates CPM, updates min book rate)</div>
          <div><span style={{ fontWeight: 600 }}>GET /api/v1/dashboard/weekly-gross?vehicleId=133718</span> — Weekly gross history for performance chart</div>
          <div><span style={{ fontWeight: 600 }}>GET /api/v1/vehicles/:id/loads</span> — Load history tab (paginated, sorted by pickup date desc)</div>
          <div style={{ marginTop: 6, color: "#b45309", fontStyle: "italic" }}>
            CPM changes cascade: updating expenses triggers recalc of min book rate → which updates Load Intelligence scoring thresholds for this truck.
            DISPATCHER role can view but not edit expenses. Partner split not shown on this page.
          </div>
        </div>
      </div>
    </div>
  );
}
