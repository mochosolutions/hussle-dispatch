import { useState, useCallback, useRef, useEffect } from "react";

// ─── Data ───────────────────────────────────────────────────────────
let _id = 0;
const uid = () => `stop-${++_id}`;

const newStop = (type = "pickup") => ({
  id: uid(),
  type,
  facility: "",
  address: "",
  city: "",
  state: "",
  date: "",
  time: "",
  commodity: "",
  weight: "",
  pieces: "",
  hazmat: false,
  tarpRequired: false,
  refNumber: "",
  notes: "",
});

// Fake geocoding for demo — maps state abbreviations to coords
const STATE_COORDS = {
  NJ: { lat: 40.73, lng: -74.17 },
  NY: { lat: 40.71, lng: -74.0 },
  PA: { lat: 40.0, lng: -75.13 },
  NC: { lat: 35.23, lng: -80.84 },
  VA: { lat: 37.54, lng: -77.44 },
  GA: { lat: 33.75, lng: -84.39 },
  TN: { lat: 36.16, lng: -86.78 },
  SC: { lat: 34.0, lng: -81.03 },
  FL: { lat: 28.54, lng: -81.38 },
  MD: { lat: 39.29, lng: -76.61 },
};

function getCoords(state) {
  return STATE_COORDS[state] || null;
}

// Approx distance between two coords in miles
function haversine(a, b) {
  const R = 3959;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ─── Icons ──────────────────────────────────────────────────────────
const ChevronIcon = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 200ms ease" }}>
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GripIcon = () => (
  <svg width="14" height="16" viewBox="0 0 16 16" fill="none" opacity="0.4">
    <circle cx="6" cy="3" r="1.2" fill="currentColor" /><circle cx="10" cy="3" r="1.2" fill="currentColor" />
    <circle cx="6" cy="8" r="1.2" fill="currentColor" /><circle cx="10" cy="8" r="1.2" fill="currentColor" />
    <circle cx="6" cy="13" r="1.2" fill="currentColor" /><circle cx="10" cy="13" r="1.2" fill="currentColor" />
  </svg>
);

const PlusIcon = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <path d="M7 1V13M1 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
    <path d="M1.75 3.5H12.25M5.25 6.125V10.375M8.75 6.125V10.375M2.625 3.5L3.5 11.8125C3.5 12.2269 3.83437 12.5625 4.25 12.5625H9.75C10.1656 12.5625 10.5 12.2269 10.5 11.8125L11.375 3.5M5.25 3.5V1.75C5.25 1.33562 5.58437 1 6 1H8C8.41563 1 8.75 1.33562 8.75 1.75V3.5"
      stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MapPinIcon = ({ color = "currentColor" }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="2" />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
  </svg>
);

const BoxIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Route Map (SVG-based) ──────────────────────────────────────────
function RouteMap({ stops, totalMiles }) {
  const stopsWithCoords = stops
    .map((s) => ({ ...s, coords: getCoords(s.state) }))
    .filter((s) => s.coords);

  if (stopsWithCoords.length === 0) {
    return (
      <div style={{
        height: 220, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0",
        color: "#94a3b8", fontSize: 13,
      }}>
        <MapIcon />
        <span style={{ marginTop: 8 }}>Enter stop addresses to see route</span>
      </div>
    );
  }

  // Calculate bounds
  const lats = stopsWithCoords.map((s) => s.coords.lat);
  const lngs = stopsWithCoords.map((s) => s.coords.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = Math.max((maxLat - minLat) * 0.25, 0.5);
  const padLng = Math.max((maxLng - minLng) * 0.25, 0.5);

  const W = 600, H = 220;
  const toX = (lng) => ((lng - (minLng - padLng)) / (maxLng - minLng + 2 * padLng)) * W;
  const toY = (lat) => H - ((lat - (minLat - padLat)) / (maxLat - minLat + 2 * padLat)) * H;

  const points = stopsWithCoords.map((s) => ({
    x: toX(s.coords.lng),
    y: toY(s.coords.lat),
    type: s.type,
    label: s.city || s.state,
    state: s.state,
  }));

  // Build path
  let pathD = "";
  points.forEach((p, i) => {
    pathD += i === 0 ? `M${p.x},${p.y}` : ` L${p.x},${p.y}`;
  });

  return (
    <div style={{
      background: "#f0f4f8", borderRadius: 8, border: "1px solid #e2e8f0",
      overflow: "hidden", position: "relative",
    }}>
      {/* Subtle grid pattern */}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#d9e2ec" strokeWidth="0.4" />
          </pattern>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
          </marker>
        </defs>
        <rect width={W} height={H} fill="url(#grid)" />

        {/* Route line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5"
            strokeDasharray="8,4" strokeLinecap="round" opacity="0.6" />
        )}

        {/* Leg distances */}
        {points.length > 1 && points.slice(1).map((p, i) => {
          const prev = points[i];
          const mx = (prev.x + p.x) / 2;
          const my = (prev.y + p.y) / 2;
          const prevStop = stopsWithCoords[i];
          const currStop = stopsWithCoords[i + 1];
          const dist = prevStop.coords && currStop.coords
            ? Math.round(haversine(prevStop.coords, currStop.coords))
            : null;
          if (!dist) return null;
          return (
            <g key={`leg-${i}`}>
              <rect x={mx - 22} y={my - 8} width={44} height={16} rx={4} fill="#fff" stroke="#e2e8f0" strokeWidth="0.5" />
              <text x={mx} y={my + 4} textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b" fontFamily="Inter, sans-serif">
                {dist} mi
              </text>
            </g>
          );
        })}

        {/* Stop markers */}
        {points.map((p, i) => {
          const isPickup = p.type === "pickup";
          const fill = isPickup ? "#2563eb" : "#059669";
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={14} fill="#fff" stroke={fill} strokeWidth="2" />
              <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="10" fontWeight="700" fill={fill} fontFamily="Inter, sans-serif">
                {isPickup ? "P" : "D"}{i + 1 > 2 ? i + 1 : ""}
              </text>
              {p.label && (
                <text x={p.x} y={p.y + 24} textAnchor="middle"
                  fontSize="10" fontWeight="500" fill="#475569" fontFamily="Inter, sans-serif">
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Miles overlay */}
      <div style={{
        position: "absolute", top: 10, right: 10,
        background: "#fff", borderRadius: 6,
        padding: "6px 12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        display: "flex", alignItems: "baseline", gap: 4,
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
          {totalMiles > 0 ? totalMiles.toLocaleString() : "—"}
        </span>
        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>total mi</span>
      </div>
    </div>
  );
}

// ─── Stop Card ──────────────────────────────────────────────────────
function StopCard({ stop, index, total, onChange, onRemove, onInsertAfter }) {
  const [cargoOpen, setCargoOpen] = useState(stop.type === "pickup");
  const [showInsert, setShowInsert] = useState(false);
  const isPickup = stop.type === "pickup";
  const accent = isPickup ? "#2563eb" : "#059669";
  const accentBg = isPickup ? "#eff6ff" : "#ecfdf5";
  const letter = isPickup ? "P" : "D";

  const update = (field, value) => onChange({ ...stop, [field]: value });

  const toggleType = () => {
    update("type", isPickup ? "delivery" : "pickup");
  };

  return (
    <div>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderLeft: `3px solid ${accent}`,
        borderRadius: 8,
        overflow: "hidden",
        transition: "border-color 200ms ease",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px",
          background: accentBg,
          borderBottom: "1px solid #f1f5f9",
        }}>
          <div style={{ cursor: "grab", color: "#9ca3af", display: "flex" }}><GripIcon /></div>

          <span style={{
            fontSize: 11, fontWeight: 700, color: "#94a3b8",
            minWidth: 14, textAlign: "center",
          }}>
            {index + 1}
          </span>

          {/* Type toggle button */}
          <button onClick={toggleType} style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#fff", border: `1px solid ${accent}`,
            borderRadius: 5, padding: "3px 10px 3px 6px",
            cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: accent, transition: "all 150ms ease",
          }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4,
              background: accent, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 800,
            }}>
              {letter}
            </span>
            {isPickup ? "Pickup" : "Delivery"}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
              <path d="M3 2L7 5L3 8" stroke={accent} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>

          {stop.facility && (
            <span style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
              {stop.facility}
            </span>
          )}
          {stop.city && stop.state && (
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {stop.city}, {stop.state}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {total > 2 && (
            <button onClick={onRemove} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#cbd5e1", padding: 4, borderRadius: 4, display: "flex",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
              onMouseLeave={e => e.currentTarget.style.color = "#cbd5e1"}>
              <TrashIcon />
            </button>
          )}
        </div>

        {/* Fields */}
        <div style={{ padding: "14px 14px 0 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr", gap: 10 }}>
            <Field label="Facility" value={stop.facility} onChange={v => update("facility", v)}
              placeholder={isPickup ? "Walmart DC #7102" : "Target DC"} />
            <Field label="Address" value={stop.address} onChange={v => update("address", v)}
              placeholder="1200 Distribution Blvd" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
            <Field label="City" value={stop.city} onChange={v => update("city", v)} placeholder="Edison" />
            <Field label="State" value={stop.state} onChange={v => update("state", v)} placeholder="NJ" />
            <Field label="Date" type="date" value={stop.date} onChange={v => update("date", v)} />
            <Field label="Time" type="time" value={stop.time} onChange={v => update("time", v)} />
            <Field label="Ref #" value={stop.refNumber} onChange={v => update("refNumber", v)} placeholder="Optional" />
          </div>
        </div>

        {/* Cargo toggle */}
        <div style={{ padding: "10px 14px 14px 14px" }}>
          <button
            onClick={() => setCargoOpen(!cargoOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", cursor: "pointer",
              color: "#64748b", fontSize: 11, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.05em",
              padding: "4px 0",
            }}>
            <BoxIcon />
            <span>Cargo{stop.commodity ? `: ${stop.commodity}` : ""}</span>
            {stop.weight && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· {stop.weight}</span>}
            <ChevronIcon open={cargoOpen} />
          </button>

          {cargoOpen && (
            <div style={{ marginTop: 8, animation: "fadeIn 150ms ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                <Field label="Commodity" value={stop.commodity} onChange={v => update("commodity", v)} placeholder="Electronics" />
                <Field label="Weight" value={stop.weight} onChange={v => update("weight", v)} placeholder="42,000 lbs" />
                <Field label="Pieces" value={stop.pieces} onChange={v => update("pieces", v)} placeholder="24 pallets" />
              </div>
              {isPickup && (
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  <Toggle label="Hazmat" checked={stop.hazmat} onChange={v => update("hazmat", v)} />
                  <Toggle label="Tarp Required" checked={stop.tarpRequired} onChange={v => update("tarpRequired", v)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insert-between zone */}
      {index < total - 1 && (
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: showInsert ? 36 : 16,
            transition: "height 150ms ease",
            position: "relative",
          }}
          onMouseEnter={() => setShowInsert(true)}
          onMouseLeave={() => setShowInsert(false)}
        >
          {/* connector line */}
          <div style={{
            position: "absolute", left: 22, top: 0, bottom: 0,
            width: 1, background: "#e2e8f0",
          }} />

          {showInsert && (
            <div style={{
              display: "flex", gap: 4, animation: "fadeIn 100ms ease",
              zIndex: 1,
            }}>
              <button onClick={() => onInsertAfter("pickup")} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 5,
                border: "1px solid #dbeafe", background: "#eff6ff",
                cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#2563eb",
              }}>
                <PlusIcon /> Pickup
              </button>
              <button onClick={() => onInsertAfter("delivery")} style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 5,
                border: "1px solid #d1fae5", background: "#ecfdf5",
                cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#059669",
              }}>
                <PlusIcon /> Delivery
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared components ──────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text" }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 600,
        color: "#94a3b8", textTransform: "uppercase",
        letterSpacing: "0.05em", marginBottom: 3,
      }}>{label}</label>
      <input type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%", padding: "7px 9px",
          border: `1px solid ${focused ? "#2563eb" : "#e2e8f0"}`,
          borderRadius: 5, fontSize: 13, color: "#1e293b",
          background: "#fff", outline: "none",
          transition: "border-color 150ms ease",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#475569" }}>
      <div onClick={() => onChange(!checked)} style={{
        width: 32, height: 18, borderRadius: 9,
        background: checked ? "#2563eb" : "#cbd5e1",
        position: "relative", transition: "background 150ms ease", cursor: "pointer",
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 2, left: checked ? 16 : 2,
          transition: "left 150ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
        }} />
      </div>
      {label}
    </label>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────
function Sidebar({ stops, totalMiles }) {
  const totalWeight = stops.reduce((sum, s) => {
    const w = parseInt(String(s.weight).replace(/[^0-9]/g, "")) || 0;
    return sum + w;
  }, 0);
  const cargos = stops.filter(s => s.commodity);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 16 }}>
      {/* Rate Intelligence */}
      <SidebarCard title="⊕ Rate Intelligence">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>Your Rate</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>$2,800</span>
        </div>
        {[
          ["Rate/Mile", "$4.52"],
          ["Market Avg (NJ→NC)", "$3.8/mi"],
          ["Min Book (#133718)", "$900"],
        ].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{v}</span>
          </div>
        ))}
        <div style={{
          background: "#ecfdf5", border: "1px solid #bbf7d0", borderRadius: 5,
          padding: "6px 8px", fontSize: 11, color: "#15803d", fontWeight: 500, marginTop: 8,
        }}>
          ✅ $1,900 above min book · Above market avg
        </div>
      </SidebarCard>

      {/* Route summary */}
      <SidebarCard title="⊕ Route Summary">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Total Miles</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>{totalMiles > 0 ? totalMiles.toLocaleString() : "—"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Stops</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{stops.length}</span>
        </div>
        {cargos.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cargo</span>
            {cargos.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "#475569", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3, fontSize: 8, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: s.type === "pickup" ? "#2563eb" : "#059669", color: "#fff",
                }}>
                  {s.type === "pickup" ? "P" : "D"}
                </span>
                {s.commodity}{s.weight ? ` · ${s.weight}` : ""}
              </div>
            ))}
          </div>
        )}
        {totalWeight > 0 && (
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
            Total weight: {totalWeight.toLocaleString()} lbs
          </div>
        )}
      </SidebarCard>

      {/* Profit breakdown */}
      <SidebarCard title="⊕ Profit Breakdown">
        {[
          ["Revenue (rate + access.)", "$2,875", "#1e293b"],
          ["Est. Fuel (620mi × $0.55)", "−$341", "#dc2626"],
          ["Est. Tolls (I-95 corridor)", "−$45", "#dc2626"],
          ["Deadhead cost (35mi)", "−$19", "#dc2626"],
        ].map(([l, v, c], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#64748b" }}>
            <span style={{ fontSize: 11 }}>{l}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: c }}>{v}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
          <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>Net Profit</span>
          <span style={{ fontWeight: 700, color: "#059669", fontSize: 15 }}>$2,395</span>
        </div>
      </SidebarCard>
    </div>
  );
}

function SidebarCard({ title, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
      <div style={{
        padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
        fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em",
      }}>{title}</div>
      <div style={{ padding: 14 }}>{children}</div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────
export default function CreateLoad() {
  const [stops, setStops] = useState([
    { ...newStop("pickup"), id: uid(), facility: "Walmart DC #7102", address: "1200 Distribution Blvd", city: "Edison", state: "NJ", date: "2026-03-01", time: "08:00", commodity: "Electronics", weight: "42,000 lbs", pieces: "24 pallets" },
    { ...newStop("delivery"), id: uid(), facility: "Target DC", address: "4400 Distribution Way", city: "Charlotte", state: "NC", date: "2026-03-02", time: "14:00" },
  ]);

  const [showMap, setShowMap] = useState(true);
  const [broker, setBroker] = useState("ABC Logistics");
  const [brokerRef, setBrokerRef] = useState("BRK-44521");
  const [equipment, setEquipment] = useState("Dry Van");
  const [carrier, setCarrier] = useState("Hustle Transportation (Company Asset)");
  const [driver, setDriver] = useState("Marcus Johnson");
  const [rate, setRate] = useState("2,800");

  // Calculate total miles
  const totalMiles = (() => {
    let total = 0;
    for (let i = 1; i < stops.length; i++) {
      const a = getCoords(stops[i - 1].state);
      const b = getCoords(stops[i].state);
      if (a && b) total += haversine(a, b);
    }
    return Math.round(total);
  })();

  const updateStop = useCallback((id, updated) => {
    setStops(prev => prev.map(s => s.id === id ? { ...updated, id } : s));
  }, []);

  const removeStop = useCallback((id) => {
    setStops(prev => prev.length <= 2 ? prev : prev.filter(s => s.id !== id));
  }, []);

  const insertAfter = useCallback((afterIndex, type) => {
    setStops(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, { ...newStop(type), id: uid() });
      return next;
    });
  }, []);

  const addToEnd = useCallback((type) => {
    setStops(prev => [...prev, { ...newStop(type), id: uid() }]);
  }, []);

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: "#f1f5f9", minHeight: "100vh",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #b0b8c4; }
        select { cursor: pointer; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* Top bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        padding: "10px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: "#1e293b" }}>Create New Load</h1>
          <span style={{
            background: "#eff6ff", color: "#2563eb", fontSize: 10, fontWeight: 600,
            padding: "2px 8px", borderRadius: 4,
          }}>From Intelligence: NJ → NC</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            padding: "7px 14px", borderRadius: 6, border: "1px solid #e2e8f0",
            background: "#fff", fontSize: 12, fontWeight: 500, color: "#475569", cursor: "pointer",
          }}>Save Draft</button>
          <button style={{
            padding: "7px 18px", borderRadius: 6, border: "none",
            background: "#2563eb", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer",
          }}>Create as Booked</button>
        </div>
      </div>

      {/* Main layout */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 300px",
        gap: 20, padding: 20, maxWidth: 1280, margin: "0 auto",
      }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Broker row */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <SelectField label="Broker" value={broker} onChange={setBroker} options={["ABC Logistics", "XYZ Transport"]} />
              <Field label="Broker Ref #" value={brokerRef} onChange={setBrokerRef} />
              <SelectField label="Equipment" value={equipment} onChange={setEquipment} options={["Dry Van", "Flatbed", "Reefer", "Step Deck"]} />
            </div>
          </div>

          {/* Map (optional) */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MapIcon />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>Route Map</span>
              </div>
              <button onClick={() => setShowMap(!showMap)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 11, color: "#64748b", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {showMap ? "Hide" : "Show"} <ChevronIcon open={showMap} />
              </button>
            </div>
            {showMap && <RouteMap stops={stops} totalMiles={totalMiles} />}
          </div>

          {/* Stops — unified ordered list */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Stops</span>
              <span style={{
                fontSize: 11, color: "#64748b", fontWeight: 500,
                background: "#f1f5f9", padding: "1px 7px", borderRadius: 4,
              }}>{stops.length}</span>
              {totalMiles > 0 && (
                <span style={{ fontSize: 11, color: "#94a3b8" }}>
                  · {totalMiles.toLocaleString()} total miles
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {stops.map((stop, idx) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={idx}
                  total={stops.length}
                  onChange={updated => updateStop(stop.id, updated)}
                  onRemove={() => removeStop(stop.id)}
                  onInsertAfter={(type) => insertAfter(idx, type)}
                />
              ))}
            </div>

            {/* Add to end */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => addToEnd("pickup")} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "9px 14px", border: "1.5px dashed #bfdbfe", borderRadius: 7,
                background: "transparent", cursor: "pointer", color: "#2563eb",
                fontSize: 12, fontWeight: 600, transition: "all 150ms ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#eff6ff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <PlusIcon /> Add Pickup
              </button>
              <button onClick={() => addToEnd("delivery")} style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                padding: "9px 14px", border: "1.5px dashed #a7f3d0", borderRadius: 7,
                background: "transparent", cursor: "pointer", color: "#059669",
                fontSize: 12, fontWeight: 600, transition: "all 150ms ease",
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "#ecfdf5"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                <PlusIcon /> Add Delivery
              </button>
            </div>
          </div>

          {/* Assignment */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
            <h3 style={{
              fontSize: 11, fontWeight: 700, color: "#475569",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12,
            }}>Assignment & Rate</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <SelectField label="Carrier" value={carrier} onChange={setCarrier}
                options={["Hustle Transportation (Company Asset)", "JR Express LLC", "Summit Freight LLC"]} />
              <SelectField label="Driver" value={driver} onChange={setDriver}
                options={["Marcus Johnson", "Devon Williams", "James Davis"]} />
            </div>

            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {[
                { text: "✓ Preferred Lane (NJ→NC)", bg: "#ecfdf5", color: "#15803d", border: "#bbf7d0" },
                { text: "~1 day from home", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
                { text: "62 hrs avail", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
                { text: "📍 Newark, NJ", bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" },
              ].map((c, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 4,
                  background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                }}>{c.text}</span>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <label style={{
                  display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
                }}>Customer Rate</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", fontSize: 13 }}>$</span>
                  <input value={rate} onChange={e => setRate(e.target.value)} style={{
                    width: "100%", padding: "7px 9px 7px 20px", border: "1px solid #e2e8f0",
                    borderRadius: 5, fontSize: 13, color: "#1e293b", background: "#fff",
                    boxSizing: "border-box", outline: "none",
                  }} />
                </div>
              </div>
              <SelectField label="Vehicle" value="#133718 — 2022 Freightliner Cascadia"
                onChange={() => {}} options={["#133718 — 2022 Freightliner Cascadia"]} />
              <div>
                <label style={{
                  display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
                }}>Accessorials</label>
                <button style={{
                  width: "100%", padding: "7px 9px", border: "1px dashed #cbd5e1", borderRadius: 5,
                  fontSize: 12, color: "#64748b", background: "#f8fafc", cursor: "pointer", textAlign: "left",
                }}>+ Add accessorial</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <Sidebar stops={stops} totalMiles={totalMiles} />
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 10, fontWeight: 600, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3,
      }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        width: "100%", padding: "7px 9px", border: "1px solid #e2e8f0",
        borderRadius: 5, fontSize: 13, color: "#1e293b", background: "#fff",
      }}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
