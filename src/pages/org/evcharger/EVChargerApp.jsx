import { useState, useEffect, useRef } from "react";
import "./evcharger.css";

/* ─── DESIGN TOKENS ──────────────────────────────────────────── */
const C = {
  bg: "#F8F9FB", surface: "#FFFFFF", card: "#FFFFFF", sidebar: "#FFFFFF",
  border: "#E8ECF0", borderMed: "#D1D9E0",
  accent: "#1D6FEB", accentLight: "#EBF2FF", accentMid: "#3B82F6",
  green: "#16A34A", greenLight: "#DCFCE7",
  amber: "#D97706", amberLight: "#FEF3C7",
  red: "#DC2626", redLight: "#FEE2E2",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  cyan: "#0891B2", cyanLight: "#CFFAFE",
  teal: "#0D9488", tealLight: "#CCFBF1",
  text: "#0F172A", textMed: "#334155", textMuted: "#64748B", textLight: "#94A3B8",
  white: "#FFFFFF",
  shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 16px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.10)",
};

const fmt = (s) => { const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sc=s%60; return h>0?`${h}h ${m}m`:`${m}m ${sc}s`; };
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));

function ChargeArc({ pct, size=180, thick=14 }) {
  const r=(size-thick)/2, circ=2*Math.PI*r, p=clamp(pct,0,100);
  const color = p>65?C.green:p>30?C.amber:C.red;
  const offset = circ*(1-p/100);
  return (
    <svg width={size} height={size} style={{display:"block"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={thick}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thick} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1),stroke 0.5s",filter:`drop-shadow(0 0 6px ${color}55)`}}/>
      <text x={size/2} y={size/2-10} textAnchor="middle" fill={color} fontSize={38} fontWeight="800" fontFamily="'DM Sans',sans-serif">{Math.round(p)}</text>
      <text x={size/2} y={size/2+10} textAnchor="middle" fill={C.textMuted} fontSize={12} fontFamily="'DM Sans',sans-serif">%</text>
      <text x={size/2} y={size/2+28} textAnchor="middle" fill={C.textMuted} fontSize={9} letterSpacing="1.5" fontFamily="'DM Sans',sans-serif">STATE OF CHARGE</text>
    </svg>
  );
}

function Spark({ data, color=C.accent, w=100, h=32, fill=false }) {
  if (!data?.length) return null;
  const max=Math.max(...data), min=Math.min(...data), rng=max-min||1;
  const pts=data.map((v,i)=>[(i/(data.length-1))*w, h-4-((v-min)/rng)*(h-8)]);
  const path=pts.map(([x,y],i)=>`${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:"block",overflow:"visible"}}>
      {fill && <path d={`${path} L${w},${h} L0,${h} Z`} fill={color+"18"}/>}
      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r={3} fill={color}/>
    </svg>
  );
}

function Pill({ label, color, bg, small }) {
  return <span style={{background:bg||color+"15",color,border:`1px solid ${color}30`,borderRadius:99,padding:small?"2px 8px":"3px 10px",fontSize:small?10:11,fontWeight:700,fontFamily:"'DM Sans',sans-serif",letterSpacing:0.3,whiteSpace:"nowrap"}}>{label}</span>;
}

function AlertDot({ type }) {
  const map = { fault:C.red, demand:C.amber, ai:C.accent, success:C.green, info:C.cyan };
  const labels = { fault:"FAULT", demand:"DEMAND", ai:"AI", success:"OK", info:"INFO" };
  const c = map[type]||C.textMuted;
  return <span style={{background:c+"18",color:c,border:`1px solid ${c}40`,borderRadius:99,padding:"1px 7px",fontSize:9,fontWeight:700,letterSpacing:0.5,fontFamily:"'DM Sans',sans-serif"}}>{labels[type]||type.toUpperCase()}</span>;
}

function Card({ children, style:s={}, accent, onClick, hover }) {
  const [hov,setHov]=useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.card,border:`1px solid ${accent?accent+"30":C.border}`,borderRadius:16,padding:"18px",overflow:s.overflow||"visible",boxShadow:hov&&hover?C.shadowMd:C.shadow,cursor:onClick?"pointer":"default",transition:"box-shadow 0.2s,transform 0.15s",transform:hov&&hover?"translateY(-1px)":"none",...s}}>{children}</div>
  );
}

const SL = ({ children, right, tour, tourMode }) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
    <span style={{color:C.textMuted,fontSize:10,fontWeight:700,letterSpacing:1.5,fontFamily:"'DM Sans',sans-serif",textTransform:"uppercase",display:"flex",alignItems:"center"}}>
      <span>{children}</span>
      {tour && <TourHelper tourMode={tourMode} {...tour} />}
    </span>
    {right && <span style={{color:C.accent,fontSize:11,fontWeight:600,cursor:"pointer"}}>{right}</span>}
  </div>
);

function Toggle({ on, onToggle }) {
  return (
    <div onClick={onToggle} style={{width:38,height:21,borderRadius:99,background:on?C.accent:C.borderMed,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
      <div style={{position:"absolute",top:2.5,left:on?19:2.5,width:16,height:16,borderRadius:"50%",background:C.white,transition:"left 0.2s",boxShadow:"0 1px 4px rgba(0,0,0,0.15)"}}/>
    </div>
  );
}

function Bar({ value, max=100, color=C.accent, height=6 }) {
  return (
    <div style={{background:C.border,borderRadius:99,height,overflow:"hidden"}}>
      <div style={{width:`${(value/max)*100}%`,height:"100%",background:color,borderRadius:99,transition:"width 0.8s cubic-bezier(.4,0,.2,1)"}}/>
    </div>
  );
}

function TourHelper({ tourMode, title, concept, value, tip }) {
  if (!tourMode) return null;
  const [show, setShow] = useState(false);
  return (
    <div className="position-relative d-inline-block ms-1" style={{ zIndex: 10 }}>
      <span 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => { e.stopPropagation(); setShow(!show); }}
        className="badge badge-circle badge-light-primary text-primary cursor-pointer d-inline-flex align-items-center justify-content-center"
        style={{ 
          width: "16px", 
          height: "16px", 
          fontSize: "10px", 
          fontWeight: "bold", 
          border: "1px solid rgba(59, 130, 246, 0.4)", 
          animation: "pulse 2s infinite",
          verticalAlign: "middle"
        }}
      >
        ?
      </span>
      {show && (
        <div 
          className="position-absolute p-4 rounded shadow-lg text-start"
          style={{ 
            width: "280px", 
            left: "22px", 
            top: "-15px", 
            zIndex: 10000, 
            fontSize: "11px", 
            lineHeight: "1.4",
            background: "rgba(20, 26, 38, 0.98)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            animation: "slideIn 0.15s ease-out"
          }}
        >
          <div className="fw-bold mb-2 text-primary d-flex align-items-center gap-1" style={{ fontSize: "12px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "4px", color: "#3b82f6" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFC700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> {title || "Feature Info"}
          </div>
          <div className="mb-2">
            <span className="fw-semibold" style={{ color: "#94a3b8" }}>Concept:</span> <span style={{ color: "#f1f5f9" }}>{concept}</span>
          </div>
          <div className="mb-2">
            <span className="fw-semibold" style={{ color: "#4ade80" }}>Business Value:</span> <span style={{ color: "#f1f5f9" }}>{value}</span>
          </div>
          {tip && (
            <div className="p-2 rounded mt-2" style={{ background: "rgba(59, 130, 246, 0.12)", borderLeft: "3px solid #3b82f6", color: "#93c5fd" }}>
              <span className="fw-bold">Demo Tip:</span> {tip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, color, delta, sub, tour, tourMode }) {
  return (
    <Card style={{padding:"16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{width:36,height:36,borderRadius:10,background:color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{icon}</div>
        {delta && <span style={{fontSize:11,fontWeight:600,color:delta.startsWith("+")?C.green:C.red}}>{delta}</span>}
      </div>
      <div style={{fontSize:22,fontWeight:800,color:C.text,marginTop:10}}>{value}</div>
      <div style={{fontSize:11,color:C.textMuted,marginTop:2,display:"flex",alignItems:"center"}}>
        <span>{label}</span>
        {tour && <TourHelper tourMode={tourMode} {...tour} />}
      </div>
      {sub && <div style={{fontSize:10,color:C.textLight,marginTop:2}}>{sub}</div>}
    </Card>
  );
}

function IdleFeeBanner({ seconds }) {
  const mins = Math.floor(seconds/60), secs = seconds%60;
  const urgent = seconds < 120;
  return (
    <div style={{background:urgent?C.redLight:C.amberLight,border:`1px solid ${urgent?C.red:C.amber}40`,borderRadius:12,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:urgent?C.red:C.amber}}>⚠ Idle fee starts in {mins}:{String(secs).padStart(2,"0")}</div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>$0.10/min after grace period — please move your vehicle</div>
      </div>
      <div style={{fontSize:18,fontWeight:800,color:urgent?C.red:C.amber}}>🚗</div>
    </div>
  );
}

function EnergySourceBar({ solar=0, bess=0, grid=100 }) {
  return (
    <div style={{marginTop:6}}>
      <div style={{display:"flex",height:6,borderRadius:99,overflow:"hidden"}}>
        {solar>0 && <div style={{width:`${solar}%`,background:C.amber}}/>}
        {bess>0  && <div style={{width:`${bess}%`,background:C.green}}/>}
        {grid>0  && <div style={{width:`${grid}%`,background:C.accent}}/>}
      </div>
      <div style={{display:"flex",gap:10,marginTop:4}}>
        {solar>0 && <span style={{fontSize:9,color:C.amber}}>☀ {solar}% solar</span>}
        {bess>0  && <span style={{fontSize:9,color:C.green}}>🔋 {bess}% battery</span>}
        {grid>0  && <span style={{fontSize:9,color:C.accent}}>⚡ {grid}% grid</span>}
      </div>
    </div>
  );
}

function AiLogEntry({ time, action, reason, type }) {
  const typeColor = {schedule:C.accent, savings:C.green, grid:C.amber, fault:C.red, export:C.purple}[type]||C.cyan;
  const typeIcon  = {schedule:"🕐",savings:"💡",grid:"⚡",fault:"⚠️",export:"♻️"}[type]||"🤖";
  return (
    <div style={{display:"flex",gap:12,padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
      <div style={{width:32,height:32,borderRadius:9,background:typeColor+"15",border:`1px solid ${typeColor}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{typeIcon}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{action}</div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
            <AlertDot type={type==="fault"?"fault":type==="grid"?"demand":"ai"}/>
            <span style={{fontSize:10,color:C.textMuted,whiteSpace:"nowrap"}}>{time}</span>
          </div>
        </div>
        <div style={{fontSize:11,color:C.textMuted,marginTop:3,lineHeight:1.5}}>💬 {reason}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════════ */
const powerCurve   = [12,28,68,118,164,182,190,186,174,158,139,121,106,91,78,67,58];
const socHistory   = [22,28,35,44,53,62,69,74,78];
const weekEnergy   = [34,51,18,66,41,58,44];
const weekLabels   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const monthCost    = [42,38,55,61,49,58,44,52,66,47,53,60];
const gridPriceData= [8,9,11,14,13,10,8,7,9,12,18,22,24,20,17,14,16,21,25,23,18,14,11,9];
const v2gEarnings  = [0,0,1.2,2.4,1.8,0.9,2.1,3.4,2.7,1.5,0,0];

const sessions = [
  { date:"Today, 9:14am", name:"Tesla SC · Downtown",     addr:"123 Main St",    dur:"47m",    kwh:42.3, cost:9.82,  icon:"⚡", type:"DC Fast 250kW", rating:5, network:"Tesla",      solar:22, bess:18, grid:60 },
  { date:"Yesterday",     name:"ChargePoint · Westfield", addr:"Mall of America",dur:"1h 11m", kwh:31.0, cost:7.44,  icon:"🏢", type:"Level 2 50kW",  rating:4, network:"ChargePoint", solar:0,  bess:0,  grid:100 },
  { date:"Jun 28",        name:"Home Charger",            addr:"My Home",        dur:"6h 08m", kwh:58.9, cost:5.20,  icon:"🏠", type:"Level 2 11kW",  rating:5, network:"Home",        solar:41, bess:31, grid:28 },
  { date:"Jun 26",        name:"Electrify America · I-95",addr:"Hwy 1 Stop",    dur:"22m",    kwh:38.5, cost:11.23, icon:"🛣", type:"DC Fast 350kW", rating:3, network:"EA",          solar:8,  bess:0,  grid:92 },
  { date:"Jun 24",        name:"EVgo · City Center",      addr:"456 Oak Ave",   dur:"35m",    kwh:28.1, cost:8.91,  icon:"🌆", type:"DC Fast 100kW", rating:4, network:"EVgo",        solar:0,  bess:12, grid:88 },
];

const nearby = [
  { name:"Tesla Supercharger", addr:"123 Main St",        dist:0.4, available:8, total:12, kw:250, status:"open", network:"Tesla",      connector:"NACS",  wait:0,  rating:4.8, price:"$0.25/kWh", amenities:["☕","🛍","🍔"], plugAndCharge:true,  checkins:142, recentNote:"\"Fast charge, clean stalls — 9/10\"" },
  { name:"ChargePoint Hub",    addr:"Mall of America",    dist:0.8, available:3, total:6,  kw:50,  status:"open", network:"ChargePoint",connector:"J1772", wait:0,  rating:4.5, price:"$0.22/kWh", amenities:["🛍","🅿"],     plugAndCharge:false, checkins:87,  recentNote:"\"Slow but reliable, good parking\"" },
  { name:"EVgo Station",       addr:"456 Oak Ave",        dist:1.2, available:0, total:4,  kw:150, status:"full", network:"EVgo",       connector:"CCS",   wait:12, rating:4.1, price:"$0.28/kWh", amenities:["🅿"],          plugAndCharge:true,  checkins:63,  recentNote:"\"Stall 3 out of order as of today\"" },
  { name:"Blink Level 2",      addr:"City Parking Garage",dist:1.5, available:5, total:8,  kw:7,   status:"open", network:"Blink",      connector:"J1772", wait:0,  rating:3.9, price:"$0.18/kWh", amenities:["🅿"],          plugAndCharge:false, checkins:41,  recentNote:"\"Very slow but free overnight\"" },
  { name:"Electrify America",  addr:"Hwy 1 Stop",         dist:2.1, available:2, total:8,  kw:350, status:"open", network:"EA",         connector:"CCS",   wait:0,  rating:3.7, price:"$0.30/kWh", amenities:["🛣","🍔","🚿"], plugAndCharge:true,  checkins:29,  recentNote:"\"2 stalls reported offline — check before driving\"" },
];

const badges = [
  { icon:"🌱", label:"Eco Warrior",    sub:"500kg CO₂ saved",      earned:true,  color:C.green  },
  { icon:"⚡", label:"Speed Charger",  sub:"10 DC fast sessions",   earned:true,  color:C.amber  },
  { icon:"🌙", label:"Night Owl",      sub:"20 off-peak charges",   earned:true,  color:C.purple },
  { icon:"🗺", label:"Road Tripper",   sub:"500+ miles planned",    earned:false, color:C.accent },
  { icon:"🔋", label:"Battery Guru",   sub:"Maintain 80% SoH",     earned:false, color:C.cyan   },
  { icon:"💎", label:"Diamond Driver", sub:"1000 sessions total",   earned:false, color:C.cyan   },
];

const notifications = [
  { icon:"✅", text:"Charging complete — 90% reached",            time:"2m ago",  color:C.green,  type:"success", read:false },
  { icon:"💡", text:"Off-peak window starts in 30min — charging?",time:"18m ago", color:C.amber,  type:"demand",  read:false },
  { icon:"⚠️", text:"Tesla SC Downtown: stall #4 hardware fault",  time:"1h ago",  color:C.red,    type:"fault",   read:true  },
  { icon:"🤖", text:"AI shifted schedule — grid demand spike 6pm", time:"3h ago",  color:C.accent, type:"ai",      read:true  },
  { icon:"💰", text:"V2G earnings: $3.40 credited last night",     time:"8h ago",  color:C.purple, type:"ai",      read:true  },
];

const aiLog = [
  { time:"09:41",   action:"Shifted charge start to 11:00 PM",        reason:"Current rate $0.24/kWh vs $0.08/kWh off-peak. Delaying saves $1.42 tonight.",    type:"savings"  },
  { time:"08:17",   action:"Activated demand response signal",         reason:"Grid operator requested 10% load reduction 6–8 PM. Pausing charge earns $0.18 credit.", type:"grid"     },
  { time:"07:52",   action:"Switched to solar input priority",         reason:"Solar generation (7.2 kW) exceeds home load. Routing surplus directly to vehicle.",  type:"schedule" },
  { time:"06:30",   action:"Pre-conditioned battery to 21°C",         reason:"Forecast: 10°C at departure. Pre-heating adds ~12% charging efficiency at station.",  type:"schedule" },
  { time:"Yesterday 23:04", action:"V2G export: 2.1 kWh @ $0.32/kWh",reason:"Spot price spike detected. Battery at 88% — exported above reserve floor (30%). Earned $0.67.", type:"export" },
  { time:"Yesterday 17:22", action:"Fault alert: Charger Temp 58°C",  reason:"Charger temperature exceeded warning threshold. Session rate reduced to 60 kW to protect hardware.", type:"fault" },
  { time:"Yesterday 14:10", action:"Recommended off-peak schedule",    reason:"Pattern analysis: you typically charge Wed evening. Off-peak window 11 PM–6 AM saves avg $1.20/session.", type:"savings" },
];

const energyTariffs = [
  { hour:"12am–6am", rate:"$0.08", label:"Super Off-Peak", color:C.green  },
  { hour:"6am–9am",  rate:"$0.14", label:"Off-Peak",       color:C.accent },
  { hour:"9am–5pm",  rate:"$0.18", label:"Mid-Peak",       color:C.amber  },
  { hour:"5pm–9pm",  rate:"$0.28", label:"Peak",           color:C.red    },
  { hour:"9pm–12am", rate:"$0.14", label:"Off-Peak",       color:C.accent },
];

const fleetVehicles = [
  { id:"V-001", name:"Tesla Model 3 LR",     plate:"EV·3201", soc:78, status:"charging", location:"Depot A",   driver:"Alex J."  },
  { id:"V-002", name:"Chevy Bolt EUV",       plate:"EV·5512", soc:45, status:"driving",  location:"En route",  driver:"Maria S." },
  { id:"V-003", name:"Ford F-150 Lightning", plate:"EV·7723", soc:91, status:"ready",    location:"Depot B",   driver:"James K." },
  { id:"V-004", name:"Rivian R1T",           plate:"EV·4490", soc:22, status:"idle",     location:"Site 3",    driver:"Sarah M." },
];

const operatorBays = [
  { id:"Bay 1", vehicle:"Tesla Model 3",     soc:78, power:98,  status:"charging", source:"solar",  alert:null },
  { id:"Bay 2", vehicle:"BMW iX",            soc:44, power:50,  status:"charging", source:"grid",   alert:null },
  { id:"Bay 3", vehicle:"Hyundai IONIQ 6",   soc:91, power:0,   status:"complete", source:null,     alert:"idle fee in 4m" },
  { id:"Bay 4", vehicle:"—",                soc:0,  power:0,   status:"fault",    source:null,     alert:"hardware fault — cable" },
];

const NAV = [
  { id:"live",    icon:"⚡",  label:"Live Session"  },
  { id:"find",    icon:"🗺",  label:"Find Charger"  },
  { id:"trip",    icon:"🧭",  label:"Trip Planner"  },
  { id:"stats",   icon:"📊",  label:"Analytics"     },
  { id:"energy",  icon:"🔋",  label:"Energy Hub"    },
  { id:"v2g",     icon:"♻️",  label:"V2G / Export"  },
  { id:"ailog",   icon:"🤖",  label:"AI Log"        },
  { id:"fleet",   icon:"🚐",  label:"Fleet"         },
  { id:"profile", icon:"◉",  label:"My Profile"    },
];

const DEVICE_TYPES = [
  { key: 'ac', emoji: '❄️', label: 'AC', defW: 1500, tip: 'AC is usually your biggest single load — schedule it around solar hours when possible.' },
  { key: 'fridge', emoji: '🧊', label: 'Fridge', defW: 150, tip: 'Fridges run 24/7 — best classified as Critical. Clean coils for efficiency.' },
  { key: 'washer', emoji: '👕', label: 'Washer', defW: 1000, tip: 'Run washers off-peak (after 10 PM) or during the solar window for cheapest cycles.' },
  { key: 'geyser', emoji: '🚿', label: 'Geyser', defW: 2000, tip: 'Water heaters draw heavily — a 1hr morning slot near solar start saves the most.' },
  { key: 'oven', emoji: '🍳', label: 'Oven', defW: 1500, tip: 'Ovens pair well with midday solar peak — essentially free cooking energy.' },
  { key: 'ev', emoji: '🔌', label: 'EV', defW: 3300, tip: 'EV charging at 2–5 AM off-peak typically saves ~35% vs daytime charging.' },
  { key: 'lights', emoji: '💡', label: 'Lights', defW: 60, tip: 'Low draw individually, but adds up across many rooms — good candidate for automation.' },
  { key: 'fan', emoji: '🌀', label: 'Fan', defW: 75, tip: 'Cheap to run — rarely worth scheduling, but fine to mark Flexible.' },
  { key: 'tv', emoji: '📺', label: 'TV', defW: 120, tip: 'Watch for standby/phantom draw even when "off" — consider a smart plug.' },
  { key: 'pump', emoji: '🚰', label: 'Pump', defW: 750, tip: 'Water pumps are often time-critical (tank fill) — consider Critical unless flexible scheduling works for your setup.' },
  { key: 'pc', emoji: '🖥️', label: 'PC', defW: 300, tip: 'Workstations/servers may need to stay Critical if always-on.' },
  { key: 'other', emoji: '🔧', label: 'Other', defW: 500, tip: 'Set wattage based on the nameplate rating of the device.' },
];


/* ═══════════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════════ */
export default function App({ initialTab = "ev-live" }) {
  const [tab,           setTab]           = useState(initialTab);

  // Keep the visible page in sync with the EMS sidebar / URL, without
  // resetting the rest of the live session state when switching pages.
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);
  const [tourMode,      setTourMode]      = useState(false);
  const [charging,      setCharging]      = useState(true);
  const [soc,           setSoc]           = useState(78.0);
  const [powerKw]                         = useState(98);
  const [elapsed,       setElapsed]       = useState(2820);
  const [sessionKwh,    setSessionKwh]    = useState(42.3);
  const [chargeLimit,   setChargeLimit]   = useState(90);
  const [smartSched,    setSmartSched]    = useState(true);
  const [demandResp,    setDemandResp]    = useState(true);
  const [precond,       setPrecond]       = useState(false);
  const [v2gEnabled,    setV2gEnabled]    = useState(true);
  const [solarSync,     setSolarSync]     = useState(true);
  const [filterIdx,     setFilterIdx]     = useState(0);
  const [expandStation, setExpandStation] = useState(null);
  const [statPeriod,    setStatPeriod]    = useState("week");
  const [tripFrom,      setTripFrom]      = useState("New York, NY");
  const [tripTo,        setTripTo]        = useState("Boston, MA");
  const [showTrip,      setShowTrip]      = useState(false);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifList,     setNotifList]     = useState(notifications);
  const [activeAlert,   setActiveAlert]   = useState(null);
  const [reserveStation,setReserveStation]= useState(null);
  const [reserveCountdown,setReserveCountdown]=useState(null);
  const [schedHour,     setSchedHour]     = useState(23);
  const [schedPct,      setSchedPct]      = useState(80);
  const [deptTime,      setDeptTime]      = useState("07:30");
  const [deptTarget,    setDeptTarget]    = useState(80);
  const [v2gLimit,      setV2gLimit]      = useState(30);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [driverMode,    setDriverMode]    = useState(true);
  const [aiGoal,        setAiGoal]        = useState("cost");
  const [idleCountdown, setIdleCountdown] = useState(null);
  const [aiLogFilter,   setAiLogFilter]   = useState("all");

  // --- Impersonation & User Management State ---
  const [usersList, setUsersList] = useState(() => {
    const saved = localStorage.getItem("elsaxev_users");
    return saved ? JSON.parse(saved) : [
      { id: 1, org: 'CF Smart Technology', name: 'Huzaifa Ahmed', email: 'huzaifa@cf.com', phone: '+92-300-1234567', role: 'Admin', status: 'Active', createdAt: '2024-01-20' },
      { id: 2, org: 'FICO', name: 'Ali Raza', email: 'ali@fico.com', phone: '+92-301-2345678', role: 'Customer', status: 'Active', createdAt: '2024-02-15' },
      { id: 3, org: 'C Power', name: 'Sara Khan', email: 'sara@cpower.com', phone: '+92-302-3456789', role: 'Customer', status: 'Active', createdAt: '2024-03-10' },
      { id: 4, org: 'NUST', name: 'Ahmed Malik', email: 'ahmed@nust.edu', phone: '+92-303-4567890', role: 'Customer', status: 'Active', createdAt: '2024-03-25' },
      { id: 5, org: 'Guest Org', name: 'Guest User', email: 'guest@guest.com', phone: '+92-304-5678901', role: 'Customer', status: 'Inactive', createdAt: '2024-04-05' },
      { id: 6, org: 'Supra Steel', name: 'Bilal Hussain', email: 'bilal@supra.com', phone: '+92-305-6789012', role: 'Customer', status: 'Active', createdAt: '2024-04-20' },
      { id: 7, org: 'Delicia Warehouse', name: 'Miss Maryam', email: 'maryam@delicia.com', phone: '+92-306-7890123', role: 'Customer', status: 'Active', createdAt: '2024-06-05' },
      { id: 8, org: 'Japan Electronics', name: 'Taro Yamamoto', email: 'taro@japaelec.com', phone: '+92-307-8901234', role: 'Customer', status: 'Active', createdAt: '2024-05-05' },
      { id: 9, org: 'Bakery', name: 'Fatima Zahra', email: 'fatima@bakery.com', phone: '+92-308-9012345', role: 'Customer', status: 'Active', createdAt: '2024-05-15' },
      { id: 10, org: 'Red Chilli', name: 'Usman Ghani', email: 'usman@redchilli.com', phone: '+92-309-0123456', role: 'Customer', status: 'Active', createdAt: '2024-05-25' }
    ];
  });

  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem("elsaxev_active_role") || "admin";
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("elsaxev_current_user");
    return saved ? JSON.parse(saved) : { name: "App Admin", email: "appadmin@yopmail.com", role: "Admin", org: "CF Smart Technology" };
  });

  // Keep localStorage in sync
  useEffect(() => {
    localStorage.setItem("elsaxev_users", JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem("elsaxev_active_role", activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem("elsaxev_current_user", JSON.stringify(currentUser));
  }, [currentUser]);

  // Handle Tab boundary synchronization based on active impersonation session
  useEffect(() => {
    const customerTabs = [
      "customer-dashboard",
      "customer-subscription",
      "customer-products",
      "customer-schedule",
      "customer-slabs",
      "customer-intervals",
      "customer-alarm-templates",
      "customer-notifications",
      "customer-ai-analytics",
      "customer-voltage-imbalance",
      "customer-current-imbalance",
      "customer-power-factor",
      "customer-energy-consumption",
      "customer-anomalies",
      "customer-power-forecast",
      "customer-appliances"
    ];
    if (activeRole === "customer" && !customerTabs.includes(tab)) {
      setTab("customer-dashboard");
    } else if (activeRole === "admin" && customerTabs.includes(tab)) {
      setTab("users");
    }
  }, [activeRole, tab]);

  // --- User Management UI / Modal States ---
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userPageSize, setUserPageSize] = useState(10);
  const [userModalType, setUserModalType] = useState(null); // 'add' | 'edit' | 'view' | 'delete'
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    org: "",
    name: "",
    email: "",
    phone: "",
    role: "Customer",
    status: "Active"
  });

  // --- Customer View Interactive States ---
  const [customerAlarmData, setCustomerAlarmData] = useState([
    { id:1, name:'Overvoltage',  variable:'Voltage Phase A', condition:'>', threshold:'235V', method:'Email',    status:'Active'   },
    { id:2, name:'High Current', variable:'Current Phase A', condition:'>', threshold:'25A',  method:'SMS',      status:'Active'   },
    { id:3, name:'Low PF',       variable:'Power Factor',    condition:'<', threshold:'0.85', method:'WhatsApp', status:'Inactive' },
  ]);
  const [customerAlarmViewing, setCustomerAlarmViewing] = useState(null);
  const [customerAlarmEditing, setCustomerAlarmEditing] = useState(null);
  const [customerAlarmForm, setCustomerAlarmForm] = useState({});
  
  const [customerScheduleViewing, setCustomerScheduleViewing] = useState(null);
  const [customerSlabViewing, setCustomerSlabViewing] = useState(null);
  const [customerAnomalyViewing, setCustomerAnomalyViewing] = useState(null);
  const [appSearch, setAppSearch] = useState("");
  const [appSort,   setAppSort]   = useState("consumption");

  const [anomalyDevice, setAnomalyDevice] = useState("Delicia Warehouse");
  const [anomalyRecs, setAnomalyRecs] = useState([
    { id: "rec1", title: "Turn off AC — Living Room", body: "2h+ with no occupancy detected. Unnecessary cooling.", saving: "Saves ~1.8 kWh · PKR 29/hr", status: "pending" },
    { id: "rec2", title: "Charge EV at 2 AM tonight", body: "Off-peak window 12 AM–5 AM reduces charging cost by ~35%.", saving: "Saves ~PKR 120 per full charge", status: "pending" },
    { id: "rec3", title: "Run washing machine after 10 PM", body: "Off-peak rate applies. Solar battery will supplement.", saving: "Saves ~PKR 18 per cycle", status: "pending" },
    { id: "rec4", title: "Use oven 12–2 PM", body: "Solar output peaks then — essentially free electricity for cooking.", saving: "Saves ~1.2 kWh vs evening run", status: "pending" },
  ]);

  const [appliancesList, setAppliancesList] = useState([
    { id: "ac", name: "Air Conditioner", room: "Living Room", kw: 1.8, on: true, type: "flexible", sched: "10PM–6AM", cost: 29, emoji: "❄️", kwh: 13.0 },
    { id: "fridge", name: "Refrigerator", room: "Kitchen", kw: 0.15, on: true, type: "critical", sched: "Always", cost: 3, emoji: "🧊", kwh: 2.5 },
    { id: "geyser", name: "Water Heater", room: "Bathroom", kw: 2.0, on: false, type: "flexible", sched: "06:00–07:00", cost: 19, emoji: "🚿", kwh: 6.2 },
    { id: "washer", name: "Washing Machine", room: "Utility", kw: 1.2, on: false, type: "flexible", sched: "Manual", cost: 8, emoji: "👕", kwh: 5.0 },
    { id: "oven", name: "Electric Oven", room: "Kitchen", kw: 1.5, on: false, type: "flexible", sched: "Manual", cost: 21, emoji: "🍳", kwh: 4.5 },
    { id: "ev", name: "EV Charger", room: "Garage", kw: 3.3, on: false, type: "flexible", sched: "02:00–05:00", cost: 32, emoji: "🔌", kwh: 2.8 },
  ]);

  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [dmodMode, setDmodMode] = useState("add"); // "add" | "edit"
  const [dmodEditId, setDmodEditId] = useState(null);
  const [dmodSelectedType, setDmodSelectedType] = useState(DEVICE_TYPES[0]);
  const [dmodName, setDmodName] = useState("");
  const [dmodRoom, setDmodRoom] = useState("");
  const [dmodWatt, setDmodWatt] = useState(1500);
  const [dmodClassification, setDmodClassification] = useState("flexible");

  const openAddDeviceModal = () => {
    setDmodMode("add");
    setDmodEditId(null);
    const defType = DEVICE_TYPES[0];
    setDmodSelectedType(defType);
    setDmodName("");
    setDmodRoom("");
    setDmodWatt(defType.defW);
    setDmodClassification("flexible");
    setShowApplianceModal(true);
  };

  const openEditDeviceModal = (app) => {
    setDmodMode("edit");
    setDmodEditId(app.id);
    const matchedType = DEVICE_TYPES.find(dt => dt.key === app.id) || DEVICE_TYPES.find(dt => dt.label.toLowerCase() === app.name.toLowerCase()) || DEVICE_TYPES.find(dt => dt.emoji === app.emoji) || DEVICE_TYPES[DEVICE_TYPES.length - 1];
    setDmodSelectedType(matchedType);
    setDmodName(app.name);
    setDmodRoom(app.room || "");
    setDmodWatt(Math.round(app.kw * 1000));
    setDmodClassification(app.type);
    setShowApplianceModal(true);
  };

  const deleteDevice = (id) => {
    const ap = appliancesList.find(a => a.id === id);
    if (!ap) return;
    if (window.confirm(`Delete "${ap.name}"? This cannot be undone.`)) {
      setAppliancesList(prev => prev.filter(a => a.id !== id));
      setScheduledRuns(prev => prev.filter(r => r.appName !== ap.name));
    }
  };

  const saveDeviceFromModal = () => {
    const name = dmodName.trim() || dmodSelectedType.label;
    const room = dmodRoom.trim() || "—";
    const watts = parseFloat(dmodWatt) || 500;
    const kw = parseFloat((watts / 1000).toFixed(2));
    const type = dmodClassification;
    const cost = Math.round(kw * 16);
    
    if (dmodMode === "add") {
      const id = "dev_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Math.random().toString(36).slice(2, 6);
      const newApp = {
        id,
        name,
        room,
        kw,
        on: false,
        type,
        sched: type === "critical" ? "Always" : "Manual",
        cost,
        emoji: dmodSelectedType.emoji,
        kwh: parseFloat((kw * 3).toFixed(1))
      };
      setAppliancesList(prev => [...prev, newApp]);
    } else if (dmodMode === "edit" && dmodEditId) {
      setAppliancesList(prev => prev.map(a => {
        if (a.id === dmodEditId) {
          return {
            ...a,
            name,
            room,
            kw,
            type,
            emoji: dmodSelectedType.emoji,
            sched: type === "critical" ? "Always" : a.sched === "Always" ? "Manual" : a.sched,
            cost
          };
        }
        return a;
      }));
    }
    setShowApplianceModal(false);
  };


  const [applianceMode, setApplianceMode] = useState("hybrid"); // hybrid | ai | manual

  const [loadShiftTimeline, setLoadShiftTimeline] = useState([
    { id: "washer", name: "Washing Machine", startH: 19, durationH: 1, color: "#94a3b8" },
    { id: "ev", name: "EV Charger", startH: 20, durationH: 3, color: "#60a5fa" },
    { id: "geyser", name: "Water Heater", startH: 7, durationH: 1, color: "#a78bfa" },
  ]);

  const [scheduledRuns, setScheduledRuns] = useState([]);

  
  const [customerDashboardPeriod, setCustomerDashboardPeriod] = useState("Today");
  const [customerIntervalVar, setCustomerIntervalVar] = useState("Active Power (kW)");
  const [customerIntervalVal, setCustomerIntervalVal] = useState("1 hour");
  const [customerIntervalFrom, setCustomerIntervalFrom] = useState("2026-06-10");
  const [customerIntervalTo, setCustomerIntervalTo] = useState("2026-06-10");

  const [customerChatMessages, setCustomerChatMessages] = useState([
    { role:'assistant', text:"Hello! I'm your AI energy assistant. Ask me anything about your energy consumption, anomalies, or optimization tips." }
  ]);
  const [customerChatInput, setCustomerChatInput] = useState("");
  const [customerChatLoading, setCustomerChatLoading] = useState(false);
  const [customerChatResponseIdx, setCustomerChatResponseIdx] = useState(0);

  // --- EMS Control System State ---
  const [emsControlMode, setEmsControlMode] = useState("hybrid");
  const [emsChargeRate, setEmsChargeRate] = useState(80);
  const [emsChargeCurrent, setEmsChargeCurrent] = useState(80);
  const [emsSourcePriority, setEmsSourcePriority] = useState("solar");
  const [emsScheduleStart, setEmsScheduleStart] = useState(23);
  const [emsTargetSoc, setEmsTargetSoc] = useState(85);
  const [emsAiGoalControl, setEmsAiGoalControl] = useState("cost");
  const [emsV2gOverride, setEmsV2gOverride] = useState(true);
  const [emsAiLog, setEmsAiLog] = useState([
    { time: "09:41", action: "Shifted charge window → 11 PM", reason: "Saved $1.42 by avoiding peak rate ($0.28/kWh).", type: "savings" },
    { time: "08:17", action: "Activated demand response", reason: "Grid operator signal received. Earns $0.18 credit.", type: "grid" },
    { time: "07:52", action: "Switched to solar priority", reason: "Solar surplus (7.2 kW) routed directly to vehicles.", type: "schedule" },
  ]);

  // --- BEMS Control System State ---
  const [bemsControlMode, setBemsControlMode] = useState("hybrid");
  const [bemsHvacSetpoint, setBemsHvacSetpoint] = useState(22);
  const [bemsLightingLevel, setBemsLightingLevel] = useState(75);
  const [bemsPeakCap, setBemsPeakCap] = useState(220);
  const [bemsSourcePriority, setBemsSourcePriority] = useState("solar");
  const [bemsAiGoalControl, setBemsAiGoalControl] = useState("cost");
  const [bemsOccupancyResp, setBemsOccupancyResp] = useState(true);
  const [bemsDemandResp, setBemsDemandResp] = useState(true);
  const [bemsAiLog, setBemsAiLog] = useState([
    { time: "09:12", action: "Dimmed lobby lights → 50%", reason: "Daylight harvesting sensor detected 85% ambient brightness.", type: "savings" },
    { time: "08:00", action: "Reduced garage ventilation", reason: "Low occupancy detected (0 vehicles). Fan cut to Speed 1.", type: "schedule" },
    { time: "07:30", action: "Pre-cooled offices to 20°C", reason: "Outdoor temp forecast 36°C by noon. Pre-cooling off-peak saves $4.20.", type: "savings" },
  ]);

  // --- BEMS State ---
  const [lobbyTemp, setLobbyTemp] = useState(22);
  const [officesTemp, setOfficesTemp] = useState(21);
  const [confRoomTemp, setConfRoomTemp] = useState(23);
  const [garageTemp, setGarageTemp] = useState(18);
  const [hvacMode, setHvacMode] = useState("cool");
  const [hvacAuto, setHvacAuto] = useState(true);
  const [chillerLoad, setChillerLoad] = useState(68);
  const [fanSpeed, setFanSpeed] = useState(2);

  const [lobbyLight, setLobbyLight] = useState(true);
  const [officesLight, setOfficesLight] = useState(true);
  const [confLight, setConfLight] = useState(false);
  const [garageLight, setGarageLight] = useState(true);

  const [lobbyDim, setLobbyDim] = useState(70);
  const [officesDim, setOfficesDim] = useState(80);
  const [confDim, setConfDim] = useState(0);
  const [garageDim, setGarageDim] = useState(30);

  const [lobbyOcc, setLobbyOcc] = useState(true);
  const [officesOcc, setOfficesOcc] = useState(true);
  const [confOcc, setConfOcc] = useState(false);
  const [garageOcc, setGarageOcc] = useState(false);

  const [daylightHarvesting, setDaylightHarvesting] = useState(true);

  const [electricityMeter, setElectricityMeter] = useState(142.8);
  const [waterMeter, setWaterMeter] = useState(34.5);
  const [gasMeter, setGasMeter] = useState(18.2);

  const [sheddingActive, setSheddingActive] = useState(false);
  const [peakThreshold, setPeakThreshold] = useState(220);
  const [coOptMode, setCoOptMode] = useState("auto"); // auto, manual, off
  const [shedActionsLog, setShedActionsLog] = useState([
    { time: "09:12", action: "Dimmed Lobby lights to 50%", trigger: "Daylight harvesting active" },
    { time: "08:00", action: "Reduced garage ventilation fan", trigger: "Low occupancy detected" }
  ]);

  // --- CFSmartEMS Devices State ---
  const [selectedOrg, setSelectedOrg] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [devicesData, setDevicesData] = useState([
    { id: 1, status: "Offline", name: "Imran's House", org: "CF Smart Technology", gateway: "IMRAN's HOUSE", template: "IMRAN's HOUSE", enabled: false },
    { id: 2, status: "Online", name: "Fico", org: "CF Smart Technology", gateway: "Fico Furnace", template: "Fico Furnace", enabled: false },
    { id: 3, status: "Offline", name: "C Power", org: "C Power", gateway: "C-Power", template: "C Power", enabled: false },
    { id: 4, status: "Online", name: "EMS PANEL", org: "CF Smart Technology", gateway: "EMS PANEL 1", template: "EMS PANEL", enabled: false },
    { id: 5, status: "Offline", name: "CF BAG", org: "CF Smart Technology", gateway: "EMS PANEL", template: "CFBAG", enabled: false },
    { id: 6, status: "Online", name: "CF SMART TECHNOLOGIES", org: "CF Smart Technology", gateway: "CF SMART TECHNOLOGIES", template: "CF SMART TECHNOLOGIES MONITORING SYSTEM", enabled: false },
    { id: 7, status: "Offline", name: "PV GENSET SYNC", org: "CF Smart Technology", gateway: "PV GENSET SYNC", template: "PV GENSET SYNC", enabled: false }
  ]);
  const [orgList, setOrgList] = useState([
    { name: "Bakery", desc: "", time: "2026-03-12 11:43:42", status: "Active" },
    { name: "C Power", desc: "", time: "2025-07-22 03:01:20", status: "Active" },
    { name: "CF Smart Technology", desc: "EMS main company", time: "2025-02-08 07:59:56", status: "Active" },
    { name: "Delicia Warehouse", desc: "", time: "2026-04-02 09:25:04", status: "Active" },
    { name: "FICO", desc: "", time: "2025-02-08 08:00:01", status: "Active" },
    { name: "Guest Org", desc: "", time: "2026-02-04 03:03:23", status: "Active" },
    { name: "Japan Electronics", desc: "", time: "2026-03-01 11:59:21", status: "Active" },
    { name: "NUST", desc: "", time: "2026-01-15 04:37:23", status: "Active" },
    { name: "Red Chilli", desc: "", time: "2026-03-18 05:46:15", status: "Active" }
  ]);
  const [orgSearchQuery, setOrgSearchQuery] = useState("");

  const toggleDeviceSwitch = (id) => {
    setDevicesData(prev => prev.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d));
  };
  const handleDeleteDevice = (id) => {
    if(window.confirm("Are you sure you want to delete this device?")) {
      setDevicesData(prev => prev.filter(d => d.id !== id));
    }
  };

  const filteredDevices = devicesData.filter(d => {
    if (selectedOrg !== "All" && d.org !== selectedOrg) return false;
    if (statusFilter !== "All" && d.status !== statusFilter) return false;
    if (searchQuery && !d.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const Badge = ({label, type}) => {
    const c = type === "Online" ? C.green : C.red;
    return <span style={{background: c+"18", color: c, padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700"}}>{label}</span>;
  };
  // ---------------------------------


  const unread = notifList.filter(n=>!n.read).length;

  useEffect(()=>{
    if (!charging) return;
    const t=setInterval(()=>{
      setSoc(s=>Math.min(chargeLimit,+(s+0.018).toFixed(3)));
      setElapsed(e=>e+1);
      setSessionKwh(k=>+(k+0.003).toFixed(3));
    },1000);
    return ()=>clearInterval(t);
  },[charging,chargeLimit]);

  useEffect(()=>{
    if (soc>=chargeLimit && charging) {
      setCharging(false);
      setActiveAlert({msg:`🎉 Reached ${chargeLimit}% charge limit!`,color:C.green});
      setTimeout(()=>setActiveAlert(null),4000);
      setIdleCountdown(600);
    }
  },[soc,chargeLimit,charging]);

  useEffect(()=>{
    if (idleCountdown===null||idleCountdown<=0) return;
    const t=setInterval(()=>setIdleCountdown(c=>c-1),1000);
    return ()=>clearInterval(t);
  },[idleCountdown]);

  useEffect(()=>{
    if (reserveCountdown===null||reserveCountdown<=0) {
      if (reserveCountdown===0) { setReserveStation(null); setReserveCountdown(null); }
      return;
    }
    const t=setInterval(()=>setReserveCountdown(c=>c-1),1000);
    return ()=>clearInterval(t);
  },[reserveCountdown]);

  // BEMS Live Telemetry Simulation Loops
  useEffect(() => {
    const t = setInterval(() => {
      setElectricityMeter(m => +(m + (Math.random() - 0.5) * 1.8).toFixed(1));
      setWaterMeter(m => +(m + Math.max(0, (Math.random() - 0.4) * 0.15)).toFixed(1));
      setGasMeter(m => +(m + Math.max(0, (Math.random() - 0.4) * 0.08)).toFixed(1));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (coOptMode === "off") {
      setSheddingActive(false);
      return;
    }
    const totalLoad = 98.4 + electricityMeter;
    if (totalLoad > peakThreshold) {
      if (!sheddingActive) {
        setSheddingActive(true);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        setShedActionsLog(prev => [
          { time: timeStr, action: "Reduced AC chillers by 15%, dimmed hallways", trigger: `Combined load (${totalLoad.toFixed(1)} kW) exceeded limit (${peakThreshold} kW)` },
          ...prev
        ]);
        setChillerLoad(42);
      }
    } else {
      if (sheddingActive && coOptMode === "auto") {
        setSheddingActive(false);
        setChillerLoad(68);
      }
    }
  }, [electricityMeter, peakThreshold, coOptMode, sheddingActive]);

  const socPct     = Math.round(soc);
  const estMins    = charging?Math.max(0,Math.ceil((chargeLimit-soc)/0.018/60)):0;
  const costNow    = (sessionKwh*0.232).toFixed(2);
  const co2Saved   = (sessionKwh*0.386).toFixed(1);
  const milesAdded = Math.round(sessionKwh*3.8);
  const statColor  = v=>v>=65?C.green:v>=30?C.amber:C.red;

  const filters = ["All","DC Fast","Level 2","Available","< 1 mi","Plug&Charge"];
  const filteredStations = nearby.filter(s=>{
    if (filterIdx===0) return true;
    if (filterIdx===1) return s.kw>=50;
    if (filterIdx===2) return s.kw<50;
    if (filterIdx===3) return s.status==="open";
    if (filterIdx===4) return s.dist<1;
    if (filterIdx===5) return s.plugAndCharge;
    return true;
  });

  const aiLogFiltered = aiLog.filter(e=>aiLogFilter==="all"||e.type===aiLogFilter);
  const sideW = sideCollapsed?72:220;

  const scheduleReason = () => {
    if (schedHour>=22||schedHour<=5) return `💡 Charging at ${schedHour}:00 saves $1.42 vs now — super off-peak rate ($0.08/kWh) active until 6am.`;
    if (schedHour<=9) return `💡 Charging at ${schedHour}:00 saves $0.62 vs now — off-peak rate ($0.14/kWh).`;
    return `⚠ Charging at ${schedHour}:00 uses peak-adjacent rate ($0.18/kWh). Consider shifting to 11pm for $1.20 savings.`;
  };

  const goalDesc = { cost:"Minimise electricity cost — AI prioritises off-peak windows and V2G earnings.", green:"Maximise renewable energy — AI prioritises solar availability and BESS over grid.", battery:"Protect battery lifespan — AI limits peak charge to 80%, avoids fast-charge heat." };

  const filteredOrgs = orgList.filter(o => {
    if (orgSearchQuery && !o.name.toLowerCase().includes(orgSearchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{color:C.text,fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');
        /* removed global reset */
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#D1D9E0;border-radius:99px}
        input::placeholder{color:${C.textLight}}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${C.border};outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:${C.accent};cursor:pointer;box-shadow:0 0 0 3px ${C.accentLight}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>

      {activeAlert&&<div style={{background:activeAlert.color+"15",borderBottom:`1px solid ${activeAlert.color}30`,padding:"10px 24px",fontSize:13,fontWeight:600,color:activeAlert.color,marginBottom:"20px",borderRadius:"8px"}}>{activeAlert.msg}</div>}

                    {/* ════ MANAGE DEVICES ════ */}
          {tab==="devices" && (
            <div className="card card-flush h-lg-100" style={{ backgroundColor: '#ffffff', borderRadius: '12px', minHeight: 'calc(100vh - 150px)', boxShadow: '0px 0px 20px 0px rgba(76, 87, 125, 0.02)', border: '1px solid #F1F1F4' }}>
              {/* Card Header */}
              <div className="card-header pt-7 px-8 pb-5 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #F1F1F4' }}>
                <div>
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-900 fs-3 d-flex align-items-center"><span>Manage Devices</span><TourHelper tourMode={tourMode} title="Device Fleet Management" concept="A central directory of all EV charging stations, building meters, and network gateways connected to the system." value="Enables remote monitoring, instant troubleshooting, and automated software updates across all your physical assets." tip="Click 'Add Device' to simulate adding a new charging bay or smart meter to your network." /></span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-7 d-block">Manage Devices - List</span>
                  </h3>
                </div>
                <div className="card-toolbar d-flex gap-3 align-items-center">{tourMode && <TourHelper tourMode={tourMode} title="Bulk Operations" concept="Administrative controls to provision new hardware, delete deprecated devices, or export data reports." value="Accelerates deployment of new charger installations and exports device records for compliance audits." tip="Point out the batch delete safety option, preventing manual one-by-one deletions." />}
                  <button style={{ backgroundColor: "#3E97FF", border: "none", padding: "8px 17px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}>+ Add Device</button>
                  <button style={{ backgroundColor: "#F1416C", border: "none", padding: "8px 17px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}>Batch Delete</button>
                  <button style={{ backgroundColor: "#FFFFFF", border: "1px solid #E1E3EA", padding: "8px 17px", borderRadius: "5px", color: "#252F4A", fontWeight: "600", cursor: "pointer" }}>Export</button>
                </div>
              </div>
              {/* Card Body */}
              <div className="card-body py-6 px-8 d-flex flex-column flex-md-row gap-8">
                {/* Left Column: Organizations list */}
                <div className="responsive-sidebar-col" style={{ width: "220px", paddingRight: "20px", flexShrink: 0 }}>
                  <div style={{ color: "#252F4A", fontSize: "14px", fontWeight: "600", marginBottom: "16px", paddingLeft: "8px", display: "flex", alignItems: "center" }}><span>Organizations</span><TourHelper tourMode={tourMode} title="Organizational Segments" concept="Groups devices and users by business division, location, or customer account." value="Maintains data privacy and access control, ensuring operators only see and configure assets they own." tip="Select different organizations like 'All', 'Bakery' or 'NUST' to filter the device list instantly." /></div>
                  {["All", ...orgList.map(o=>o.name)].map(org => (
                    <div key={org} onClick={() => setSelectedOrg(org)} style={{ padding: "10px 12px", borderRadius: "6px", cursor: "pointer", backgroundColor: selectedOrg === org ? "#EEF6FF" : "transparent", color: selectedOrg === org ? "#3E97FF" : "#78829D", fontWeight: selectedOrg === org ? "600" : "500", fontSize: "13px", marginBottom: "4px", transition: "all 0.2s" }}>{org}</div>
                  ))}
                </div>
                {/* Right Column: Table and Filters */}
                <div style={{ flex: 1 }}>
                  {/* Filters Row */}
                  <div style={{ paddingBottom: "16px", borderBottom: "1px solid #F1F1F4", display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                    {tourMode && <TourHelper tourMode={tourMode} title="Asset Filtering" concept="Quick filters to find devices based on status (Online/Offline), template type, or owner." value="Minimizes time spent searching through large fleets, making it easy to isolate and diagnose offline equipment." tip="Change the status dropdown to 'Offline' and click 'Query' to see devices needing immediate attention." />}
                    <div style={{ position: "relative" }}>
                      <select style={{ padding: "8px 30px 8px 12px", border: "1px solid #F1F1F4", borderRadius: "5px", outline: "none", color: "#252F4A", fontSize: "13px", minWidth: "140px", backgroundColor: "#F9F9F9", appearance: "none" }}><option>All</option></select>
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#99A1B7", pointerEvents: "none", fontSize: "10px" }}>▼</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <select value={userFilter} onChange={(e)=>setUserFilter(e.target.value)} style={{ padding: "8px 30px 8px 12px", border: "1px solid #F1F1F4", borderRadius: "5px", outline: "none", color: "#252F4A", fontSize: "13px", minWidth: "140px", backgroundColor: "#F9F9F9", appearance: "none" }}><option value="All">All Users</option></select>
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#99A1B7", pointerEvents: "none", fontSize: "10px" }}>▼</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)} style={{ padding: "8px 30px 8px 12px", border: "1px solid #F1F1F4", borderRadius: "5px", outline: "none", color: "#252F4A", fontSize: "13px", minWidth: "140px", backgroundColor: "#F9F9F9", appearance: "none" }}><option value="All">All status</option><option value="Online">Online</option><option value="Offline">Offline</option></select>
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#99A1B7", pointerEvents: "none", fontSize: "10px" }}>▼</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid #F1F1F4", borderRadius: "5px", padding: "0 12px", flex: 1, minWidth: "200px", backgroundColor: "#F9F9F9" }}>
                      <input value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} placeholder="Please input device name" style={{ border: "none", padding: "8px 0", outline: "none", width: "100%", fontSize: "13px", background:"transparent", color: "#252F4A" }}/>
                    </div>
                    <button style={{ backgroundColor: "#3E97FF", border: "none", padding: "8px 24px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }}>Query</button>
                  </div>

                  {/* Show entries and Search row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #F1F1F4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                      Show 
                      <select value="10" readOnly style={{ padding: '4px 8px', border: '1px solid #F1F1F4', borderRadius: '4px', background: '#F9F9F9', outline: 'none', color: '#252F4A' }}>
                        <option value="10">10</option>
                      </select>
                      entries
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                      Search:
                      <input placeholder="" style={{ padding: '6px 12px', border: '1px solid #F1F1F4', borderRadius: '4px', outline: 'none', color: '#252F4A', width: '150px' }} />
                    </div>
                  </div>

                  {/* Devices Table */}
                  <div style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px dashed #F1F1F4" }}>
                          <th style={{ padding: "14px 16px", width: "30px" }}><input type="checkbox" readOnly /></th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Device Status</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Device Name</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Organization</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Gateway</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Device Template</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Switch</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600", textAlign: "right" }}><span style={{ display: "inline-flex", alignItems: "center" }}><span>Operation</span><TourHelper tourMode={tourMode} title="Individual Device Controls" concept="Quick-action shortcuts to inspect live telemetry (eye), edit parameters (pen), or decommission (trash) a specific device." value="Reduces administrative overhead by putting common control tasks just one click away." tip="Click the yellow eye icon next to a device to view its detailed diagnostics log." /></span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDevices.map(d => (
                          <tr key={d.id} style={{ borderBottom: "1px dashed #F1F1F4" }}>
                            <td style={{ padding: "14px 16px" }}><input type="checkbox" readOnly /></td>
                            <td style={{ padding: "14px 16px" }}>
                              {d.status === 'Online' ? 
                                <span style={{ backgroundColor: "#50CD89", color: "#FFFFFF", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>Online</span> : 
                                <span style={{ backgroundColor: "#DBDFE9", color: "#4B5675", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>Offline</span>
                              }
                            </td>
                            <td style={{ padding: "14px 16px", color: "#071437", fontSize: "13px", fontWeight: "600" }}>{d.name}</td>
                            <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{d.org}</td>
                            <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{d.gateway}</td>
                            <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{d.template}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ color: d.enabled ? '#3E97FF' : '#78829D', fontWeight: '600', fontSize: '13px' }}>{d.enabled ? 'ON' : 'OFF'}</span>
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                              <button onClick={() => alert("Details for " + d.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFF8DD', border: 'none', cursor: 'pointer', color: '#FFC700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFC700" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                              <button onClick={() => alert("Edit " + d.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EEF6FF', border: 'none', cursor: 'pointer', color: '#3E97FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3E97FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                              <button onClick={() => handleDeleteDevice(d.id)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFEEF3', border: 'none', cursor: 'pointer', color: '#F1416C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F1416C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ════ MANAGE ORGANIZATIONS ════ */}
          {tab==="organizations" && (
            <div className="card card-flush h-lg-100" style={{ backgroundColor: '#ffffff', borderRadius: '12px', minHeight: 'calc(100vh - 150px)', boxShadow: '0px 0px 20px 0px rgba(76, 87, 125, 0.02)', border: '1px solid #F1F1F4' }}>
              {/* Card Header */}
              <div className="card-header pt-7 px-8 pb-5 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #F1F1F4' }}>
                <div>
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-900 fs-3 d-flex align-items-center"><span>Manage Organizations</span><TourHelper tourMode={tourMode} title="Tenancy & Account Hierarchy" concept="Manages company accounts, branches, or customer divisions within the multi-tenant system." value="Allows utility providers and building operators to run a single software instance while isolating client datasets safely." tip="Point out how different business locations can be designated as individual organizations." /></span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-7 d-block">Manage Organizations - List</span>
                  </h3>
                </div>
                <div className="card-toolbar d-flex align-items-center gap-2">{tourMode && <TourHelper tourMode={tourMode} title="Creating Customer Portals" concept="Provisioning a new client or subsidiary with its own isolated workspace and assets." value="Enables instant scaling as new businesses join your smart energy ecosystem." tip="Use this button during client setup to configure custom tenant names and permissions." />}
                  <button style={{ backgroundColor: "#3E97FF", border: "none", padding: "8px 17px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}>Add Organization</button>
                </div>
              </div>
              {/* Card Body */}
              <div className="card-body py-6 px-8">
                {/* Table Header Utilities */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #F1F1F4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                    Show 
                    <select value="10" readOnly style={{ padding: '4px 8px', border: '1px solid #F1F1F4', borderRadius: '4px', background: '#F9F9F9', outline: 'none', color: '#252F4A' }}>
                      <option value="10">10</option>
                    </select>
                    entries
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                    Search:
                    <input value={orgSearchQuery} onChange={(e) => setOrgSearchQuery(e.target.value)} placeholder="" style={{ padding: '6px 12px', border: '1px solid #F1F1F4', borderRadius: '4px', outline: 'none', color: '#252F4A', width: '150px' }} />
                  </div>
                </div>

                {/* Organizations Table */}
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px dashed #F1F1F4" }}>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Organization Name</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Organization Description</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Creation Time</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Status</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600", textAlign: "right" }}><span style={{ display: "inline-flex", alignItems: "center" }}><span>Operation</span><TourHelper tourMode={tourMode} title="Tenant Life-cycle Actions" concept="Modify tenant profile settings or revoke access entirely when subscription status changes." value="Gives operators absolute control over access credentials and subscription states." tip="Explain that deleting an organization cleanly unlinks all member devices." /></span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrgs.map(o => (
                        <tr key={o.name} style={{ borderBottom: "1px dashed #F1F1F4" }}>
                          <td style={{ padding: "14px 16px", color: "#071437", fontSize: "13px", fontWeight: "600" }}>{o.name}</td>
                          <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{o.desc || "—"}</td>
                          <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{o.time}</td>
                          <td style={{ padding: "14px 16px" }}><span style={{ backgroundColor: "#E8FFF3", color: "#50CD89", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>{o.status}</span></td>
                          <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <button onClick={() => alert("Edit " + o.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EEF6FF', border: 'none', cursor: 'pointer', color: '#3E97FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3E97FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            <button onClick={() => setOrgList(prev => prev.filter(x => x.name !== o.name))} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFEEF3', border: 'none', cursor: 'pointer', color: '#F1416C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F1416C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ MANAGE USERS ════ */}
          {tab==="users" && (() => {
            // Apply search query filter
            const filteredUsers = usersList.filter(u => {
              const query = userSearchQuery.toLowerCase();
              return (
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query) ||
                u.org.toLowerCase().includes(query) ||
                u.role.toLowerCase().includes(query) ||
                u.status.toLowerCase().includes(query)
              );
            });

            // Pagination calculation
            const paginatedUsers = filteredUsers.slice(0, userPageSize);

            const handleAddUser = (e) => {
              e.preventDefault();
              const newId = usersList.length > 0 ? Math.max(...usersList.map(u => u.id)) + 1 : 1;
              const today = new Date().toISOString().split('T')[0];
              const newUser = { id: newId, ...userForm, createdAt: today };
              setUsersList([...usersList, newUser]);
              setUserModalType(null);
              setUserForm({ org: "", name: "", email: "", phone: "", role: "Customer", status: "Active" });
            };

            const handleEditUser = (e) => {
              e.preventDefault();
              setUsersList(usersList.map(u => u.id === selectedUser.id ? { ...u, ...userForm } : u));
              setUserModalType(null);
              setSelectedUser(null);
              setUserForm({ org: "", name: "", email: "", phone: "", role: "Customer", status: "Active" });
            };

            const handleDeleteUser = () => {
              setUsersList(usersList.filter(u => u.id !== selectedUser.id));
              setUserModalType(null);
              setSelectedUser(null);
            };

            const handleImpersonate = (u) => {
              setActiveRole("customer");
              setCurrentUser({ name: u.name, email: u.email, role: u.role, org: u.org });
              setTab("customer-dashboard");
            };

            return (
              <div className="card card-flush h-lg-100" style={{ backgroundColor: '#ffffff', borderRadius: '12px', minHeight: 'calc(100vh - 150px)', boxShadow: '0px 0px 20px 0px rgba(76, 87, 125, 0.02)', border: '1px solid #F1F1F4', position: 'relative' }}>
                {/* Card Header */}
                <div className="card-header pt-7 px-8 pb-5 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #F1F1F4' }}>
                  <div>
                    <h3 className="card-title align-items-start flex-column">
                      <span className="card-label fw-bold text-gray-900 fs-3 d-flex align-items-center">
                        <span>Manage Users</span>
                        <TourHelper tourMode={tourMode} title="Identity & Access Control" concept="Directory of all administrative staff, building managers, drivers, and external auditors." value="Secures your grid controls by verifying who is authorized to modify setpoints and limits." tip="Show how roles distinguish access between deep settings overrides and view-only diagnostics." />
                      </span>
                      <span className="text-gray-500 mt-1 fw-semibold fs-7 d-block">Manage Users - List</span>
                    </h3>
                  </div>
                  <div className="card-toolbar d-flex gap-3 align-items-center">
                    {tourMode && <TourHelper tourMode={tourMode} title="Access Provisioning" concept="Invite team members and define their roles, or export user lists for compliance reviews." value="Simplifies onboarding for new personnel and supports security access reviews." tip="Explain that exporting user lists helps during security audits to verify access privileges." />}
                    <button 
                      onClick={() => {
                        setUserForm({ org: "", name: "", email: "", phone: "", role: "Customer", status: "Active" });
                        setUserModalType("add");
                      }}
                      style={{ backgroundColor: "#3E97FF", border: "none", padding: "8px 17px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}
                    >
                      + Add User
                    </button>
                    <button 
                      onClick={() => {
                        const headers = ["ID", "Organization", "Name", "Email", "Phone", "Role", "Status", "Created At"];
                        const rows = usersList.map(u => [u.id, u.org, u.name, u.email, u.phone, u.role, u.status, u.createdAt]);
                        const csvContent = "data:text/csv;charset=utf-8," 
                          + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", "user_directory.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      style={{ backgroundColor: "#FFFFFF", border: "1px solid #E1E3EA", padding: "8px 17px", borderRadius: "5px", color: "#252F4A", fontWeight: "600", cursor: "pointer" }}
                    >
                      Export
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="card-body py-6 px-8">
                  {/* Table Header Utilities */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #F1F1F4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                      Show 
                      <select 
                        value={userPageSize} 
                        onChange={(e) => setUserPageSize(Number(e.target.value))}
                        style={{ padding: '4px 8px', border: '1px solid #E1E3EA', borderRadius: '4px', background: '#F9F9F9', outline: 'none', color: '#252F4A' }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
                      entries
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                      Search:
                      <input 
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        placeholder="Search users..." 
                        style={{ padding: '6px 12px', border: '1px solid #E1E3EA', borderRadius: '4px', outline: 'none', color: '#252F4A', width: '200px' }} 
                      />
                    </div>
                  </div>

                  {/* Users Table */}
                  <div style={{ width: "100%", overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px dashed #F1F1F4" }}>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>User Name</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Email</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Organization</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                              <span>Role</span>
                              <TourHelper tourMode={tourMode} title="Role-Based Access (RBAC)" concept="Determines what permissions (Admin, User, Viewer) a user has on the dashboard." value="Prevents accidental or unauthorized modifications to sensitive grid limits." tip="Show the color-coded roles: blue for Admin, yellow for User, and purple for Viewer." />
                            </span>
                          </th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Status</th>
                          <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600", textAlign: "right" }}>
                            <span style={{ display: "inline-flex", alignItems: "center" }}>
                              <span>Operation</span>
                              <TourHelper tourMode={tourMode} title="User Management Actions" concept="Update profiles, reset passwords, or suspend users who leave the company." value="Ensures immediate revocation of access for security and administrative changes." tip="Point out how you can edit user roles directly in the list." />
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedUsers.map((u) => (
                          <tr key={u.id} style={{ borderBottom: "1px dashed #F1F1F4" }}>
                            <td style={{ padding: "14px 16px", color: "#071437", fontSize: "13px", fontWeight: "600" }}>{u.name}</td>
                            <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{u.email}</td>
                            <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{u.org}</td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ backgroundColor: u.role === "Admin" ? "#EEF6FF" : u.role === "Customer" ? "#FFF8DD" : "#F8F5FF", color: u.role === "Admin" ? "#3E97FF" : u.role === "Customer" ? "#FFC700" : "#7239EA", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>{u.role}</span>
                            </td>
                            <td style={{ padding: "14px 16px" }}>
                              <span style={{ backgroundColor: u.status === "Active" ? "#E8FFF3" : "#FFF5F8", color: u.status === "Active" ? "#50CD89" : "#F1416C", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>{u.status}</span>
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                              {u.role === "Customer" && (
                                <button 
                                  onClick={() => handleImpersonate(u)} 
                                  style={{ backgroundColor: "#F8F5FF", color: "#7239EA", border: "none", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", fontWeight: "600", cursor: "pointer", marginRight: "8px" }}
                                >
                                  🔑 Login
                                </button>
                              )}
                              <button 
                                onClick={() => { setSelectedUser(u); setUserModalType("view"); }} 
                                style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#F9F9F9', border: 'none', cursor: 'pointer', color: '#78829D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              <button 
                                onClick={() => { setSelectedUser(u); setUserForm({ ...u }); setUserModalType("edit"); }} 
                                style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EEF6FF', border: 'none', cursor: 'pointer', color: '#3E97FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button 
                                onClick={() => { setSelectedUser(u); setUserModalType("delete"); }} 
                                style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFEEF3', border: 'none', cursor: 'pointer', color: '#F1416C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MODALS WINDOWS (Add, Edit, View, Delete) */}
                {userModalType && (
                  <div style={{
                    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                    zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center"
                  }}>
                    <div style={{
                      backgroundColor: "#FFFFFF", borderRadius: "12px", width: "480px", maxWidth: "90%",
                      padding: "28px", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #E1E3EA",
                      animation: "slideIn 0.2s ease-out"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #F1F1F4", paddingBottom: "14px" }}>
                        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#071437" }}>
                          {userModalType === "add" && "Add New User"}
                          {userModalType === "edit" && "Edit User Details"}
                          {userModalType === "view" && "User Profile details"}
                          {userModalType === "delete" && "Confirm Deletion"}
                        </h3>
                        <button 
                          onClick={() => { setUserModalType(null); setSelectedUser(null); }}
                          style={{ border: "none", backgroundColor: "transparent", fontSize: "20px", color: "#A1A5B7", cursor: "pointer" }}
                        >
                          &times;
                        </button>
                      </div>

                      {userModalType === "delete" ? (
                        <div>
                          <p style={{ fontSize: "14px", color: "#252F4A", marginBottom: "24px" }}>
                            Are you sure you want to permanently delete user <strong>{selectedUser?.name}</strong>? This action is irreversible.
                          </p>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button 
                              onClick={() => { setUserModalType(null); setSelectedUser(null); }}
                              style={{ padding: "8px 16px", borderRadius: "5px", border: "1px solid #E1E3EA", backgroundColor: "#FFFFFF", color: "#78829D", fontWeight: "600", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={handleDeleteUser}
                              style={{ padding: "8px 16px", borderRadius: "5px", border: "none", backgroundColor: "#F1416C", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}
                            >
                              Yes, Delete
                            </button>
                          </div>
                        </div>
                      ) : userModalType === "view" ? (
                        <div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", color: "#252F4A" }}>
                            <tbody>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600", width: "130px" }}>Name:</td><td style={{ padding: "10px 0" }}>{selectedUser?.name}</td></tr>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600" }}>Email:</td><td style={{ padding: "10px 0" }}>{selectedUser?.email}</td></tr>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600" }}>Organization:</td><td style={{ padding: "10px 0" }}>{selectedUser?.org}</td></tr>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600" }}>Phone:</td><td style={{ padding: "10px 0" }}>{selectedUser?.phone || "N/A"}</td></tr>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600" }}>Role:</td><td style={{ padding: "10px 0" }}><span style={{ backgroundColor: selectedUser?.role === "Admin" ? "#EEF6FF" : "#FFF8DD", color: selectedUser?.role === "Admin" ? "#3E97FF" : "#FFC700", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{selectedUser?.role}</span></td></tr>
                              <tr style={{ borderBottom: "1px dashed #F1F1F4" }}><td style={{ padding: "10px 0", fontWeight: "600" }}>Status:</td><td style={{ padding: "10px 0" }}><span style={{ backgroundColor: selectedUser?.status === "Active" ? "#E8FFF3" : "#FFF5F8", color: selectedUser?.status === "Active" ? "#50CD89" : "#F1416C", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>{selectedUser?.status}</span></td></tr>
                              <tr><td style={{ padding: "10px 0", fontWeight: "600" }}>Created At:</td><td style={{ padding: "10px 0" }}>{selectedUser?.createdAt}</td></tr>
                            </tbody>
                          </table>
                          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                            <button 
                              onClick={() => { setUserModalType(null); setSelectedUser(null); }}
                              style={{ padding: "8px 20px", borderRadius: "5px", border: "1px solid #E1E3EA", backgroundColor: "#FFFFFF", color: "#252F4A", fontWeight: "600", cursor: "pointer" }}
                            >
                              Close Details
                            </button>
                          </div>
                        </div>
                      ) : (
                        <form onSubmit={userModalType === "add" ? handleAddUser : handleEditUser}>
                          <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Full Name</label>
                            <input 
                              type="text" 
                              required
                              value={userForm.name} 
                              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                              style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A" }} 
                            />
                          </div>
                          <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={userForm.email} 
                              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                              style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A" }} 
                            />
                          </div>
                          <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Organization</label>
                            <input 
                              type="text" 
                              required
                              value={userForm.org} 
                              onChange={(e) => setUserForm({ ...userForm, org: e.target.value })}
                              style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A" }} 
                            />
                          </div>
                          <div style={{ marginBottom: "14px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Phone Number</label>
                            <input 
                              type="text" 
                              value={userForm.phone} 
                              onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                              style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A" }} 
                            />
                          </div>
                          <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Role</label>
                              <select 
                                value={userForm.role}
                                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A", background: "#FFFFFF" }}
                              >
                                <option value="Customer">Customer</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#252F4A", marginBottom: "6px" }}>Status</label>
                              <select 
                                value={userForm.status}
                                onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E1E3EA", borderRadius: "5px", outline: "none", color: "#252F4A", background: "#FFFFFF" }}
                              >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                              </select>
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #F1F1F4", paddingTop: "14px" }}>
                            <button 
                              type="button"
                              onClick={() => { setUserModalType(null); setSelectedUser(null); }}
                              style={{ padding: "8px 16px", borderRadius: "5px", border: "1px solid #E1E3EA", backgroundColor: "#FFFFFF", color: "#78829D", fontWeight: "600", cursor: "pointer" }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              style={{ padding: "8px 16px", borderRadius: "5px", border: "none", backgroundColor: "#3E97FF", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}
                            >
                              Save Settings
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ════ MANAGE GATEWAYS ════ */}
          {tab==="gateways" && (
            <div className="card card-flush h-lg-100" style={{ backgroundColor: '#ffffff', borderRadius: '12px', minHeight: 'calc(100vh - 150px)', boxShadow: '0px 0px 20px 0px rgba(76, 87, 125, 0.02)', border: '1px solid #F1F1F4' }}>
              {/* Card Header */}
              <div className="card-header pt-7 px-8 pb-5 d-flex justify-content-between align-items-center" style={{ borderBottom: '1px solid #F1F1F4' }}>
                <div>
                  <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-900 fs-3 d-flex align-items-center"><span>Manage Gateway</span><TourHelper tourMode={tourMode} title="Grid Communication Hubs" concept="Hardware bridges that connect local sensors, chargers, and building meters to the cloud software." value="Ensures continuous data feeds from physical devices, even during local internet disruptions." tip="Check the online status of your gateways to verify active telemetry streams." /></span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-7 d-block">Manage Gateway - List</span>
                  </h3>
                </div>
                <div className="card-toolbar d-flex gap-3 align-items-center">{tourMode && <TourHelper tourMode={tourMode} title="Hub Expansion Controls" concept="Registers new gateway hubs or exports serial number tables for tracking." value="Simplifies installation setups when adding new building wings or depot chargers." tip="Use this button to register a newly installed gateway serial number in seconds." />}
                  <button style={{ backgroundColor: "#3E97FF", border: "none", padding: "8px 17px", borderRadius: "5px", color: "#FFFFFF", fontWeight: "600", cursor: "pointer" }}>+ Add Gateway</button>
                  <button style={{ backgroundColor: "#FFFFFF", border: "1px solid #E1E3EA", padding: "8px 17px", borderRadius: "5px", color: "#252F4A", fontWeight: "600", cursor: "pointer" }}>Export</button>
                </div>
              </div>
              {/* Card Body */}
              <div className="card-body py-6 px-8">
                {/* Table Header Utilities */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #F1F1F4' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                    Show 
                    <select value="10" readOnly style={{ padding: '4px 8px', border: '1px solid #F1F1F4', borderRadius: '4px', background: '#F9F9F9', outline: 'none', color: '#252F4A' }}>
                      <option value="10">10</option>
                    </select>
                    entries
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78829D', fontSize: '13px' }}>
                    Search:
                    <input placeholder="" style={{ padding: '6px 12px', border: '1px solid #F1F1F4', borderRadius: '4px', outline: 'none', color: '#252F4A', width: '150px' }} />
                  </div>
                </div>

                {/* Gateways Table */}
                <div style={{ width: "100%", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px dashed #F1F1F4" }}>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Gateway Status</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Gateway Name</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Organization</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}>Serial Number</th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600" }}><span style={{ display: "inline-flex", alignItems: "center" }}><span>IP Address</span><TourHelper tourMode={tourMode} title="Local Network Address" concept="The local network address used to communicate directly with local hardware units." value="Enables remote network testing and local configuration directly on-site." tip="Confirm the IP address matches your local substation router configuration." /></span></th>
                        <th style={{ padding: "14px 16px", color: "#252F4A", fontSize: "13px", fontWeight: "600", textAlign: "right" }}><span style={{ display: "inline-flex", alignItems: "center" }}><span>Operation</span><TourHelper tourMode={tourMode} title="Hub Control Actions" concept="View gateway settings, reboot the bridge, or delete decommissioned hub records." value="Allows quick network resets from anywhere without visiting the hardware." tip="Click the view eye icon to perform remote network connectivity tests." /></span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { status: "Online", name: "IMRAN's HOUSE", org: "CF Smart Technology", serial: "GW-001-CF", ip: "192.168.1.100" },
                        { status: "Online", name: "Fico Furnace", org: "CF Smart Technology", serial: "GW-002-CF", ip: "192.168.1.101" },
                        { status: "Offline", name: "C-Power", org: "C Power", serial: "GW-003-CP", ip: "192.168.2.50" },
                        { status: "Online", name: "EMS PANEL 1", org: "CF Smart Technology", serial: "GW-004-CF", ip: "192.168.1.102" },
                        { status: "Offline", name: "PV GENSET SYNC", org: "CF Smart Technology", serial: "GW-005-CF", ip: "192.168.1.103" },
                        { status: "Online", name: "CF SMART TECHNOLOGIES", org: "CF Smart Technology", serial: "GW-006-CF", ip: "10.0.0.15" }
                      ].map((g, i) => (
                        <tr key={i} style={{ borderBottom: "1px dashed #F1F1F4" }}>
                          <td style={{ padding: "14px 16px" }}>
                            {g.status === 'Online' ? 
                              <span style={{ backgroundColor: "#50CD89", color: "#FFFFFF", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>Online</span> : 
                              <span style={{ backgroundColor: "#DBDFE9", color: "#4B5675", padding: "4px 8px", borderRadius: "5px", fontSize: "11px", fontWeight: "600" }}>Offline</span>
                            }
                          </td>
                          <td style={{ padding: "14px 16px", color: "#071437", fontSize: "13px", fontWeight: "600" }}>{g.name}</td>
                          <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{g.org}</td>
                          <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{g.serial}</td>
                          <td style={{ padding: "14px 16px", color: "#78829D", fontSize: "13px", fontWeight: "500" }}>{g.ip}</td>
                          <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <button onClick={() => alert("View " + g.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFF8DD', border: 'none', cursor: 'pointer', color: '#FFC700', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFC700" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
                            <button onClick={() => alert("Edit " + g.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EEF6FF', border: 'none', cursor: 'pointer', color: '#3E97FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3E97FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                            <button onClick={() => alert("Delete " + g.name)} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#FFEEF3', border: 'none', cursor: 'pointer', color: '#F1416C', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F1416C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════ LIVE SESSION ════ */}         {tab==="ev-live" && (
            driverMode ? (
              <div className="responsive-grid-3" style={{gap:16}}>
                <Card style={{gridColumn:"1/2",gridRow:"1/3",padding:24}} accent={charging?C.green:null}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                    <div>
                      <Pill label={charging?`● CHARGING ${powerKw}kW`:"● IDLE"} color={charging?C.green:C.textMuted}/>
                      <div style={{fontSize:16,fontWeight:700,marginTop:8,display:"flex",alignItems:"center"}}>
                        <span>Tesla SC · Downtown Plaza</span>
                        <TourHelper tourMode={tourMode} title="Active Charging Session" concept="Live EV session tracking battery state of charge (SoC), charging speed, cost, and climate prep." value="Gives drivers real-time transparency and lets operators throttle rates dynamically to save on power limits." tip="Observe the circular charging ring updating. Click 'Stop Charging' below to see the idle fee grace timer start."/>
                      </div>
                      <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Stall #7 · NACS · 250kW Max</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:11,color:C.textMuted}}>Est. done</div>
                      <div style={{fontSize:22,fontWeight:800,color:C.green}}>{charging?`${estMins}m`:"—"}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                    <ChargeArc pct={soc} size={180} thick={14}/>
                  </div>
                  <div className="responsive-grid-1-1" style={{gap:8,marginBottom:16}}>
                    {[
                      {label:"Power Now",   val:`${powerKw} kW`, color:C.accent},
                      {label:"Elapsed",     val:fmt(elapsed),    color:C.text},
                      {label:"Energy",      val:`${sessionKwh.toFixed(1)} kWh`,color:C.text},
                      {label:"Cost So Far", val:`$${costNow}`,   color:C.amber},
                      {label:"Miles Added", val:`+${milesAdded} mi`,color:C.green},
                      {label:"CO₂ Saved",   val:`${co2Saved} kg`,color:C.teal},
                    ].map(r=>(
                      <div key={r.label} style={{padding:"8px 10px",background:C.bg,borderRadius:10,border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:11,color:C.textMuted}}>{r.label}</div>
                        <div style={{fontSize:14,fontWeight:700,color:r.color,marginTop:2}}>{r.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:"12px",background:C.bg,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:12,color:C.textMed,fontWeight:600,display:"flex",alignItems:"center"}}>
                        <span>🎯 Charge Limit</span>
                        <TourHelper tourMode={tourMode} title="Target Charge Limit" concept="Capping target battery level (e.g., at 80% or 90%) to extend battery health." value="Limits DC fast-charging thermal degradation and frees up public chargers faster." tip="Drag the slider to adjust the charge target; note the estimated remaining minutes shift accordingly."/>
                      </span>
                      <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{chargeLimit}%</span>
                    </div>
                    <input type="range" min={50} max={100} value={chargeLimit} onChange={e=>setChargeLimit(+e.target.value)} style={{width:"100%"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                      <span style={{fontSize:10,color:C.textMuted}}>50% daily</span>
                      <span style={{fontSize:10,color:C.textMuted}}>100% road trip</span>
                    </div>
                  </div>
                  {!charging && idleCountdown!==null && idleCountdown>0 && <IdleFeeBanner seconds={idleCountdown}/>}
                  <button onClick={()=>{setCharging(c=>!c);if(!charging)setIdleCountdown(null);}} style={{width:"100%",padding:"12px",background:charging?C.redLight:C.greenLight,border:`1px solid ${charging?C.red+"40":C.green+"40"}`,borderRadius:12,color:charging?C.red:C.green,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:14}}>
                    {charging?"⏹ Stop Charging":"▶ Resume Charging"}
                  </button>
                </Card>

                <Card style={{gridColumn:"2/4"}}>
                  <SL tourMode={tourMode} tour={{ title: "Power Curve Monitor", concept: "Graphs active charging rate over time, illustrating power throttling as the battery fills up.", value: "Visualizes grid load and chargers auto-balancing speeds during high demand peaks.", tip: "Point out the curve: charging speed decreases as battery percentage approaches 80% to protect the cells." }}>Power Delivery Curve (kW)</SL>
                  <Spark data={powerCurve} color={C.accent} w={580} h={72} fill/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:10,color:C.textMuted}}>Session start</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.accent}}>Peak: 190 kW</span>
                    <span style={{fontSize:10,color:C.textMuted}}>Now</span>
                  </div>
                </Card>

                <Card style={{gridColumn:"2/3"}}>
                  <SL tourMode={tourMode} tour={{ title: "Smart Charging Controls", concept: "Automated toggles to optimize cost, battery health, and solar utilization.", value: "Saves energy and extends battery life automatically by adjusting charging speeds based on real-time grid conditions.", tip: "Toggle 'Solar Sync' to charge using 100% clean, free energy from the building's roof panel." }}>Smart Charging Controls</SL>
                  {[
                    {label:"Off-Peak Scheduling",    sub:"~38% avg savings",      state:smartSched, toggle:()=>setSmartSched(v=>!v), icon:"🕐"},
                    {label:"Demand Response",        sub:"Grid-aware charging",   state:demandResp, toggle:()=>setDemandResp(v=>!v), icon:"🔋"},
                    {label:"Battery Preconditioning",sub:"Pre-warm for DC fast",  state:precond,    toggle:()=>setPrecond(v=>!v),    icon:"🌡"},
                    {label:"Solar Sync",             sub:"Charge from solar first",state:solarSync, toggle:()=>setSolarSync(v=>!v),  icon:"☀️"},
                    {label:"V2G Export",             sub:"Sell back to grid at peak",state:v2gEnabled,toggle:()=>setV2gEnabled(v=>!v),icon:"♻️"},
                  ].map((s,i,arr)=>(
                    <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}>
                        <span style={{fontSize:18}}>{s.icon}</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:600}}>{s.label}</div>
                          <div style={{fontSize:11,color:C.textMuted}}>{s.sub}</div>
                        </div>
                      </div>
                      <Toggle on={s.state} onToggle={s.toggle}/>
                    </div>
                  ))}
                  <div style={{marginTop:14,padding:"12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontSize:11,fontWeight:600,color:C.textMed}}>Schedule Start</span>
                      <span style={{fontSize:12,fontWeight:700,color:C.accent}}>{schedHour}:00 {schedHour<12?"AM":"PM"}</span>
                    </div>
                    <input type="range" min={0} max={23} value={schedHour} onChange={e=>setSchedHour(+e.target.value)} style={{width:"100%"}}/>
                    <div style={{marginTop:8,padding:"8px 10px",background:schedHour>=22||schedHour<=5?C.greenLight:schedHour<=9?C.accentLight:C.amberLight,borderRadius:9,fontSize:11,color:schedHour>=22||schedHour<=5?C.green:schedHour<=9?C.accent:C.amber,fontWeight:600,border:`1px solid ${schedHour>=22||schedHour<=5?C.green+"30":schedHour<=9?C.accent+"30":C.amber+"30"}`}}>
                      {scheduleReason()}
                    </div>
                  </div>
                  <div style={{marginTop:12,padding:"12px",background:C.purpleLight+"40",border:`1px solid ${C.purple}25`,borderRadius:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:8}}>🚗 Ready By (departure target)</div>
                    <div className="responsive-grid-1-1" style={{gap:8}}>
                      <div>
                        <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>Departure time</div>
                        <input type="time" value={deptTime} onChange={e=>setDeptTime(e.target.value)} style={{width:"100%",padding:"6px 8px",border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",color:C.text,background:C.white}}/>
                      </div>
                      <div>
                        <div style={{fontSize:10,color:C.textMuted,marginBottom:4}}>Target charge %</div>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <input type="range" min={50} max={100} value={deptTarget} onChange={e=>setDeptTarget(+e.target.value)} style={{flex:1}}/>
                          <span style={{fontSize:12,fontWeight:700,color:C.purple,minWidth:32}}>{deptTarget}%</span>
                        </div>
                      </div>
                    </div>
                    <div style={{marginTop:8,fontSize:11,color:C.purple}}>AI will start charging at {deptTarget<=60?"11:02 PM":deptTarget<=80?"10:18 PM":"09:41 PM"} to reach {deptTarget}% by {deptTime}.</div>
                  </div>
                </Card>

                <Card style={{gridColumn:"3/4"}}>
                  <SL tourMode={tourMode} tour={{ title: "Vehicle Health Indicators", concept: "Real-time battery diagnostics including temperature, health state, voltage, and charging efficiency.", value: "Helps predict battery degradation and avoid unexpected thermal breakdowns during fast charging.", tip: "Point out the Battery SoH (State of Health) at 97% to show that the battery remains highly efficient." }}>Vehicle Health</SL>
                  <div className="responsive-grid-1-1" style={{gap:8}}>
                    {[
                      {label:"Battery Temp",  val:"28°C",    icon:"🌡", color:C.green,  sub:"Optimal"},
                      {label:"Charger Temp",  val:"42°C",    icon:"⚡", color:C.amber,  sub:"Warm"},
                      {label:"Battery SoH",   val:"97%",     icon:"🔋", color:C.green,  sub:"Excellent"},
                      {label:"Cell Balance",  val:"±12mV",   icon:"⚖", color:C.accent, sub:"Good"},
                      {label:"Input Voltage", val:"800V",    icon:"🔌", color:C.text,   sub:"Nominal"},
                      {label:"Efficiency",    val:"94.1%",   icon:"📈", color:C.teal,   sub:"This session"},
                    ].map(v=>(
                      <div key={v.label} style={{background:C.bg,borderRadius:10,padding:"9px 11px",border:`1px solid ${C.border}`}}>
                        <div style={{display:"flex",justifyContent:"space-between"}}>
                          <span style={{fontSize:16}}>{v.icon}</span>
                          <span style={{fontSize:11,fontWeight:700,color:v.color}}>{v.val}</span>
                        </div>
                        <div style={{fontSize:11,fontWeight:600,marginTop:4}}>{v.label}</div>
                        <div style={{fontSize:10,color:C.textMuted}}>{v.sub}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            ) : (
              /* OPERATOR VIEW */
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <div style={{background:C.amberLight,border:`1px solid ${C.amber}40`,borderRadius:14,padding:"12px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <span style={{fontSize:24, display:"flex", alignItems:"center"}}>🤖{tourMode && <TourHelper tourMode={tourMode} title="AI Tariff Optimizer Advice" concept="Intelligent predictions warning when utility prices are about to spike." value="Proactively shifts heavy electrical loads out of expensive hours, preventing massive utility bills." tip="Explain to the client how the system auto-schedules high-power tasks for cheap periods." />}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.amber}}>AI Forecast Alert — Peak demand window 5–9 PM today</div>
                    <div style={{fontSize:12,color:C.textMed,marginTop:2}}>Grid operator signal received. AI recommends shifting all bay charging to after 9 PM. Estimated savings: $4.80. Demand response credit: $0.18. <span style={{color:C.accent,fontWeight:600,cursor:"pointer"}}>Accept AI recommendation →</span></div>
                  </div>
                </div>
                <div className="responsive-grid-4" style={{gap:14}}>
                  {operatorBays.map((bay,i)=>{
                    const statusColor = bay.status==="charging"?C.green:bay.status==="complete"?C.accent:bay.status==="fault"?C.red:C.textMuted;
                    const sourceColor = bay.source==="solar"?C.amber:bay.source==="grid"?C.accent:C.green;
                    return (
                      <Card key={i} accent={statusColor} style={{padding:"18px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                          <div style={{fontSize:14,fontWeight:700,display:"flex",alignItems:"center"}}><span>{bay.id}</span><TourHelper tourMode={tourMode} title="Active Bay Telemetry" concept="Status and state-of-charge for individual charging bays in your depot." value="Provides operators real-time feedback on bay utilization, energy sources, and electrical load." tip="Point out the green 'via solar' tag indicating a vehicle charging on 100% free rooftop energy." /></div>
                          <Pill label={bay.status.toUpperCase()} color={statusColor} small/>
                        </div>
                        <div style={{fontSize:12,color:C.textMed,marginBottom:12}}>{bay.vehicle}</div>
                        {bay.status==="charging"&&<><ChargeArc pct={bay.soc} size={100} thick={9}/><div style={{fontSize:11,color:C.textMuted,marginTop:6,textAlign:"center"}}>{bay.power} kW · {bay.source&&<span style={{color:sourceColor,fontWeight:600}}>via {bay.source}</span>}</div></>}
                        {bay.status==="complete"&&<div style={{fontSize:28,textAlign:"center",margin:"12px 0"}}>✅</div>}
                        {bay.status==="fault"&&<div style={{fontSize:28,textAlign:"center",margin:"12px 0"}}>🔴</div>}
                        {bay.alert&&<div style={{marginTop:10,padding:"6px 10px",background:bay.status==="fault"?C.redLight:C.amberLight,border:`1px solid ${bay.status==="fault"?C.red+"40":C.amber+"40"}`,borderRadius:9,fontSize:11,fontWeight:600,color:bay.status==="fault"?C.red:C.amber}}>⚠ {bay.alert}</div>}
                      </Card>
                    );
                  })}
                </div>
                <div className="responsive-grid-4" style={{gap:12}}>
                  <Kpi icon="⚡" label="Active Sessions" value="2" color={C.green} sub="2 bays charging" tourMode={tourMode} tour={{ title: "Active Charger Sessions", concept: "The number of vehicles currently drawing power at the depot.", value: "Helps monitor immediate grid impact and bay occupancy.", tip: "Note the status changes as cars plug in or unplug." }}/>
                  <Kpi icon="🔌" label="Total Power" value="148 kW" color={C.accent} sub="Bay 1+2 combined" tourMode={tourMode} tour={{ title: "Total Charger Draw", concept: "Combined electrical power currently delivered to all active charging bays.", value: "Essential for staying under substation load limits and avoiding peak demand fees.", tip: "Watch this number rise and fall dynamically in response to vehicle charging rates." }}/>
                  <Kpi icon="💰" label="Revenue Today" value="$38.40" color={C.amber} delta="+18%" tourMode={tourMode} tour={{ title: "Depot Revenue", concept: "Estimated charging fees collected from vehicles today.", value: "Tracks charger profitability and financial performance in real time.", tip: "Point out the delta percentage showing revenue growth compared to yesterday." }}/>
                  <Kpi icon="⚠️" label="Faults Active" value="1" color={C.red} sub="Bay 4 — cable" tourMode={tourMode} tour={{ title: "System Health Errors", concept: "The count of chargers currently reporting hardware issues or connection failures.", value: "Alerts maintenance teams immediately, reducing charger downtime and driver frustration.", tip: "Show how a red status alert highlights bays requiring immediate physical attention." }}/>
                </div>
              </div>
            )
          )}




          {/* ════ ANALYTICS ════ */}
          {tab==="ev-stats"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {["week","month","year"].map(p=>(
                  <div key={p} onClick={()=>setStatPeriod(p)} style={{padding:"7px 18px",borderRadius:99,cursor:"pointer",background:statPeriod===p?C.accent:C.surface,border:`1px solid ${statPeriod===p?C.accent:C.border}`,fontSize:12,fontWeight:600,textTransform:"capitalize",color:statPeriod===p?C.white:C.textMed,transition:"all 0.15s"}}>{p}</div>
                ))}
              </div>
              <div className="responsive-grid-5" style={{gap:12}}>
                <Kpi icon="⚡" label="Sessions" value={statPeriod==="week"?"7":statPeriod==="month"?"28":"134"} color={C.accent} delta="+12%" sub="vs last period" tourMode={tourMode} tour={{ title: "Charging Session Count", concept: "The total number of charging events completed in the selected time period.", value: "Helps analyze charger utilization rates and vehicle usage patterns.", tip: "Toggle between week, month, and year periods to see usage density change." }}/>
                <Kpi icon="🔋" label="Energy (kWh)" value={statPeriod==="week"?"277":statPeriod==="month"?"1,104":"2,841"} color={C.green} delta="+8%" tourMode={tourMode} tour={{ title: "Total Grid Energy Drawn", concept: "The total electrical energy in kilowatt-hours (kWh) consumed by chargers.", value: "Provides raw electricity consumption metrics needed for carbon reporting and utility budgeting.", tip: "Show how total energy consumption tracks closely with vehicle mileage." }}/>
                <Kpi icon="💳" label="Total Cost" value={statPeriod==="week"?"$48":statPeriod==="month"?"$189":"$612"} color={C.amber} delta="-5%" tourMode={tourMode} tour={{ title: "Depot Electricity Cost", concept: "Total utility expenses incurred for charging operations in the selected timeframe.", value: "Provides direct financial tracking of charging network operating expenses.", tip: "Compare this cost with fuel costs to see the massive savings of electric fleets." }}/>
                <Kpi icon="🌱" label="CO₂ Saved" value={statPeriod==="week"?"107kg":statPeriod==="month"?"426kg":"1.1t"} color={C.teal} delta="+15%" tourMode={tourMode} tour={{ title: "Carbon Emissions Avoided", concept: "Calculates kilograms of CO2 saved compared to driving conventional gasoline emissions.", value: "Provides verified environmental metrics for corporate sustainability audits and ESG compliance.", tip: "Show off this metric to clients interested in carbon footprint reductions." }}/>
                <Kpi icon="💰" label="vs Gas Savings" value={statPeriod==="week"?"$68":statPeriod==="month"?"$271":"$987"} color={C.green} delta="+11%" tourMode={tourMode} tour={{ title: "Fuel Displacement Value", concept: "Net financial savings achieved by choosing electricity over commercial gasoline.", value: "Proves the financial return on investment (ROI) of transition to electric vehicles.", tip: "Point out that charging electricity costs are a fraction of gas fuel prices." }}/>
              </div>
              <Card accent={C.purple}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:20}}>🤖</span><span style={{fontSize:14,fontWeight:700}}>AI Smart Charging Savings</span><TourHelper tourMode={tourMode} title="AI Savings Ledger" concept="Compares actual electricity billing (managed by AI) against standard flat-rate charging costs." value="Quantifies the exact savings generated by the AI's smart scheduler and V2G export features." tip="Note the purple '44% reduction' badge, highlighting the system's automated cost-cutting power." /></div>
                    <div style={{fontSize:12,color:C.textMuted}}>What you paid vs what unmanaged charging would have cost</div>
                  </div>
                  <div style={{display:"flex",gap:20,textAlign:"center"}}>
                    <div><div style={{fontSize:22,fontWeight:800,color:C.green}}>{statPeriod==="week"?"$38":statPeriod==="month"?"$152":"$481"}</div><div style={{fontSize:11,color:C.textMuted}}>AI saved you</div></div>
                    <div style={{width:1,background:C.border}}/>
                    <div><div style={{fontSize:22,fontWeight:800,color:C.textMuted}}>{statPeriod==="week"?"$86":statPeriod==="month"?"$341":"$1,093"}</div><div style={{fontSize:11,color:C.textMuted}}>unmanaged would cost</div></div>
                    <div style={{width:1,background:C.border}}/>
                    <div><div style={{fontSize:22,fontWeight:800,color:C.purple}}>{statPeriod==="week"?"44%":statPeriod==="month"?"45%":"44%"}</div><div style={{fontSize:11,color:C.textMuted}}>reduction</div></div>
                  </div>
                </div>
              </Card>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL right={`${statPeriod==="week"?"277":statPeriod==="month"?"1,104":"2,841"} kWh total`} tourMode={tourMode} tour={{ title: "Daily Consumption Trend", concept: "Graphs daily electricity usage in kWh for the selected time range.", value: "Helps identify anomalous consumption days and peak usage periods.", tip: "Hover over the highest bars to identify peak fleet dispatch days." }}>Energy by Day</SL>
                  <div style={{display:"flex",gap:8,alignItems:"flex-end",height:100}}>
                    {weekEnergy.map((v,i)=>{const today=i===6;return(
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{fontSize:10,color:today?C.accent:C.textMuted,fontWeight:today?700:400}}>{v}</div>
                        <div style={{width:"100%",height:(v/66)*72,background:today?C.accent:C.accentLight,border:`1px solid ${today?C.accent:C.border}`,borderRadius:"6px 6px 0 0",transition:"height 0.5s"}}/>
                        <div style={{fontSize:10,color:today?C.accent:C.textMuted,fontWeight:today?700:400}}>{weekLabels[i]}</div>
                      </div>
                    );})}
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Charging Location Distribution", concept: "Breaks down total energy consumption by charger type: Home, Workplace, or Public DC Fast chargers.", value: "Helps fleet managers optimize charger placements and verify if drivers are charging at the cheapest locations.", tip: "Point out that Home charging represents 52% of total use, which is the cheapest charging category." }}>Where You Charge</SL>
                  {[{label:"Home",pct:52,sessions:70,color:C.accent},{label:"Workplace",pct:22,sessions:29,color:C.purple},{label:"Public DC Fast",pct:18,sessions:24,color:C.green},{label:"Public Level 2",pct:8,sessions:11,color:C.amber}].map(b=>(
                    <div key={b.label} style={{marginBottom:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600}}>{b.label}</span><span style={{fontSize:11,color:b.color,fontWeight:700}}>{b.pct}%</span></div>
                      <Bar value={b.pct} color={b.color}/>
                      <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{b.sessions} sessions</div>
                    </div>
                  ))}
                </Card>
              </div>
              <div className="responsive-grid-1-1" style={{gap:14}}>
                <Card>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><SL tourMode={tourMode} tour={{ title: "Cost Trend Sparkline", concept: "Displays the month-over-month trajectory of electricity costs and average session spending.", value: "Allows financial auditors to forecast energy bills and track budgeting compliance.", tip: "Compare the cheapest session cost ($2.10) with the average ($8.40) to show off off-peak scheduling benefits." }}>Monthly Cost Trend</SL><Spark data={monthCost} color={C.amber} w={80} h={28}/></div>
                  <div className="responsive-grid-3" style={{gap:8}}>
                    {[{label:"Avg/Session",val:"$8.40"},{label:"Cheapest",val:"$2.10"},{label:"vs Gas",val:"-$312"}].map(m=>(
                      <div key={m.label} style={{background:C.bg,borderRadius:10,padding:"10px",textAlign:"center",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:16,fontWeight:800,color:C.amber}}>{m.val}</div>
                        <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <SL right="View All" tourMode={tourMode} tour={{ title: "Historical Session Audit", concept: "Chronological list of completed charging sessions showing date, cost, energy, and energy source.", value: "Maintains absolute traceability for driver expense reimbursement and grid auditing.", tip: "Point out the horizontal color bar: it indicates how much energy came from solar vs battery vs the grid." }}>Recent Sessions</SL>
                  {sessions.slice(0,4).map((s,i)=>(
                    <div key={i} style={{padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <div style={{width:32,height:32,borderRadius:9,background:C.accentLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{s.icon}</div>
                          <div>
                            <div style={{fontSize:12,fontWeight:600}}>{s.name}</div>
                            <div style={{fontSize:10,color:C.textMuted}}>{s.date} · {s.dur} · {s.type}</div>
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:14,fontWeight:700,color:C.accent}}>${s.cost.toFixed(2)}</div>
                          <div style={{fontSize:10,color:C.textMuted}}>{s.kwh} kWh</div>
                        </div>
                      </div>
                      <EnergySourceBar solar={s.solar} bess={s.bess} grid={s.grid}/>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ════ ENERGY HUB ════ */}
          {tab==="ev-energy"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="☀️" label="Solar Today" value="18.4 kWh" color={C.amber} delta="+23%" sub="7.2 kW current" tourMode={tourMode} tour={{ title: "Live Rooftop Solar Yield", concept: "Daily accumulated solar energy in kWh, with current solar power generation in kW.", value: "Tracks free, clean energy generation to maximize self-consumption and reduce grid draw.", tip: "Watch this number rise during peak daylight hours." }}/>
                <Kpi icon="🔋" label="Home Battery" value="82%" color={C.green} sub="Powerwall · 9.8 kWh" tourMode={tourMode} tour={{ title: "Battery Storage Level", concept: "Active charge level of your local backup battery storage unit.", value: "Provides building power security during outages and enables peak load shaving.", tip: "Note the reserve capacity held back to protect against grid failures." }}/>
                <Kpi icon="🏠" label="Home Usage" value="3.2 kW" color={C.accent} sub="4.1 kWh today" tourMode={tourMode} tour={{ title: "Active Building Draw", concept: "Live electrical power consumed by all household appliances, heating, and lighting.", value: "Monitors real-time demand to prevent overloading local network breakers.", tip: "Turn on heavy equipment to see this value change in real time." }}/>
                <Kpi icon="⚡" label="Grid Import" value="$0.08/kWh" color={C.teal} sub="Off-peak now" tourMode={tourMode} tour={{ title: "Substation Electricity Pricing", concept: "The current price per kWh charged by the utility grid provider.", value: "Allows you to verify peak-rate hours and check that the system is avoiding expensive grid imports.", tip: "Verify the price matches off-peak rates when grid load is low." }}/>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL right="Today's tariff" tourMode={tourMode} tour={{ title: "Utility Price Forecast", concept: "A 24-hour visualization of electricity tariff prices per kWh.", value: "Allows operators to spot peak price hours in advance and configure schedule shifts.", tip: "Highlight the red alert indicating peak pricing between 5:00 PM and 9:00 PM." }}>Electricity Price — 24hr</SL>
                  <Spark data={gridPriceData} color={C.amber} w={600} h={72} fill/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                    <span style={{fontSize:10,color:C.textMuted}}>12am</span>
                    <span style={{fontSize:10,fontWeight:700,color:C.red}}>⚠ Peak 5–9pm · $0.28</span>
                    <span style={{fontSize:10,color:C.textMuted}}>11pm</span>
                  </div>
                  <div style={{marginTop:14}}>
                    <SL tourMode={tourMode} tour={{ title: "Utility Rate Tariffs", concept: "Lists specific hourly intervals designated as Peak, Mid-Peak, or Off-Peak by the utility.", value: "Saves money by allowing facilities to configure automated charging rules around these rates.", tip: "Notice the difference: Peak rates are more than triple Off-Peak rates ($0.28 vs $0.08)." }}>Rate Schedule</SL>
                    {energyTariffs.map((t,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",borderRadius:9,marginBottom:4,background:t.color===C.red?C.redLight:t.color===C.amber?C.amberLight:C.greenLight,border:`1px solid ${t.color+"25"}`}}>
                        <span style={{fontSize:12,fontWeight:600,color:t.color}}>{t.label}</span>
                        <span style={{fontSize:12,color:C.textMed}}>{t.hour}</span>
                        <span style={{fontSize:12,fontWeight:700,color:t.color}}>{t.rate}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <Card>
                    <SL tourMode={tourMode} tour={{ title: "Dynamic Energy Flow flowchart", concept: "Tracks real-time energy routing between solar panels, building load, EV chargers, and the grid.", value: "Gives immediate visibility into self-sufficiency rates and active power exports.", tip: "Observe the active flows: green indicates power drawn from local battery storage." }}>Live Energy Flow</SL>
                    {[{icon:"☀️",from:"Solar",to:"Car",kw:"3.2 kW",color:C.amber,active:solarSync},{icon:"🔋",from:"Powerwall",to:"Home",kw:"1.8 kW",color:C.green,active:true},{icon:"🔌",from:"Grid",to:"Powerwall",kw:"0.5 kW",color:C.accent,active:true},{icon:"♻️",from:"Car",to:"Grid",kw:"2.1 kW",color:C.purple,active:v2gEnabled}].map((f,i)=>(
                      <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:f.active?f.color+"10":C.bg,borderRadius:10,border:`1px solid ${f.active?f.color+"30":C.border}`,marginBottom:6}}>
                        <span style={{fontSize:16}}>{f.icon}</span>
                        <div style={{flex:1,padding:"0 10px"}}><div style={{fontSize:11,fontWeight:600,color:f.active?f.color:C.textMuted}}>{f.from} → {f.to}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:f.active?f.color:C.textMuted}}>{f.kw}</div><Pill label={f.active?"ACTIVE":"IDLE"} color={f.active?f.color:C.textMuted} small/></div>
                      </div>
                    ))}
                  </Card>
                  <Card>
                    <SL tourMode={tourMode} tour={{ title: "Charging Scheduler", concept: "Configure target hours to lock charging, avoiding peak utility rates.", value: "Guarantees EV batteries charge during the cheapest hours, reducing bills by up to 50%.", tip: "Drag the slider to 11:00 PM to schedule charging during off-peak windows." }}>Schedule Charging</SL>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                      <span style={{fontSize:12,fontWeight:600}}>Start Time</span>
                      <span style={{fontSize:13,fontWeight:700,color:C.accent}}>{schedHour}:00 {schedHour<12?"AM":"PM"}</span>
                    </div>
                    <input type="range" min={0} max={23} value={schedHour} onChange={e=>setSchedHour(+e.target.value)} style={{width:"100%"}}/>
                    <div style={{marginTop:8,padding:"8px 10px",background:schedHour>=22||schedHour<=5?C.greenLight:C.amberLight,borderRadius:9,fontSize:11,color:schedHour>=22||schedHour<=5?C.green:C.amber,fontWeight:600,border:`1px solid ${schedHour>=22||schedHour<=5?C.green+"30":C.amber+"30"}`}}>
                      {scheduleReason()}
                    </div>
                    <button style={{width:"100%",padding:"10px",background:C.accent,border:"none",borderRadius:10,color:C.white,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:10}}>Set Schedule</button>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* ════ V2G / EXPORT ════ */}
          {tab==="ev-v2g"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="💰" label="V2G Earnings Today" value="$3.40" color={C.purple} delta="+18%" sub="2.1 kWh exported" tourMode={tourMode} tour={{ title: "Daily V2G Earnings", concept: "Revenues generated today by discharging EV battery power back to the grid.", value: "Provides immediate financial returns, offsetting vehicle purchasing and electricity costs.", tip: "Note the amount of energy in kWh exported to secure these earnings." }}/>
                <Kpi icon="📅" label="This Month" value="$42.80" color={C.green} delta="+31%" sub="68.4 kWh exported" tourMode={tourMode} tour={{ title: "Monthly Cumulative Earnings", concept: "Revenues accumulated during the current billing month from grid services.", value: "Allows fleet managers to track monthly ROI and grid service profits.", tip: "Compare this month's earnings with historical periods to audit performance." }}/>
                <Kpi icon="🌐" label="Grid Services" value="Active" color={C.teal} sub="Frequency reg." tourMode={tourMode} tour={{ title: "Active Grid Programs", concept: "The grid services program (e.g., Frequency Regulation) the system is currently participating in.", value: "Qualifies the building for higher incentive rates from the utility provider.", tip: "Status 'Active' means the system is responding to grid frequency signals." }}/>
                <Kpi icon="🔋" label="Available V2G" value="14 kWh" color={C.accent} sub="Battery reserve: 30%" tourMode={tourMode} tour={{ title: "Export Capacity Reserve", concept: "The amount of energy in EV batteries currently available to export without violating reserve limits.", value: "Ensures vehicles always retain enough charge for planned trips while exporting excess power.", tip: "Observe the battery reserve limit setting, which controls this capacity." }}/>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL right="Last 12 hours" tourMode={tourMode} tour={{ title: "Hourly Export Revenue", concept: "Graphs V2G revenues earned over the last 12 hours.", value: "Visualizes the precise hours V2G was active and corresponding payouts.", tip: "Notice the peak export between 4:00 AM and 6:00 AM, matching early-morning grid peak demand." }}>V2G Export Earnings</SL>
                  <Spark data={v2gEarnings} color={C.purple} w={580} h={72} fill/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:10,color:C.textMuted}}>12am</span>
                    <span style={{fontSize:11,fontWeight:700,color:C.purple}}>Peak export 4–6am · $2.40</span>
                    <span style={{fontSize:10,color:C.textMuted}}>12pm</span>
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "V2G Safety Reserve", concept: "Configures the minimum charge level the battery must retain during grid discharging.", value: "Protects vehicle range: the system will never drain your car's battery below this limit, guaranteeing you can drive when needed.", tip: "Drag the slider to adjust the minimum reserve (e.g., to 40%). Note the available V2G capacity shifts immediately." }}>V2G Settings</SL>
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:12,fontWeight:600}}>Battery Reserve Limit</span><span style={{fontSize:13,fontWeight:700,color:C.purple}}>{v2gLimit}%</span></div>
                    <input type="range" min={10} max={80} value={v2gLimit} onChange={e=>setV2gLimit(+e.target.value)} style={{width:"100%"}}/>
                    <div style={{fontSize:11,color:C.textMuted,marginTop:4}}>V2G will never discharge below this level</div>
                  </div>
                  {[{label:"V2G Export",state:v2gEnabled,toggle:()=>setV2gEnabled(v=>!v),icon:"♻️",sub:"Sell back to grid"},{label:"Demand Response",state:demandResp,toggle:()=>setDemandResp(v=>!v),icon:"⚡",sub:"Auto-respond to grid signals"},{label:"Frequency Regulation",state:true,toggle:()=>{},icon:"📡",sub:"Ancillary services"}].map((s,i,arr)=>(
                    <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:8}}><span style={{fontSize:16}}>{s.icon}</span><div><div style={{fontSize:12,fontWeight:600}}>{s.label}</div><div style={{fontSize:10,color:C.textMuted}}>{s.sub}</div></div></div>
                      <Toggle on={s.state} onToggle={s.toggle}/>
                    </div>
                  ))}
                </Card>
              </div>
              <Card>
                <SL right="Last 30 days" tourMode={tourMode} tour={{ title: "V2G Revenue Streams", concept: "Breaks down total earnings by grid program: Peak Shaving, Frequency Regulation, Demand Response, and Spot Market sales.", value: "Helps identify which programs generate the most value for your specific fleet setup.", tip: "Point out that Peak Shaving accounts for 43% of earnings, which is your most profitable program." }}>V2G Revenue Breakdown</SL>
                <div className="responsive-grid-4" style={{gap:10}}>
                  {[{label:"Peak Shaving",val:"$18.40",pct:43,color:C.purple,icon:"⚡"},{label:"Freq. Regulation",val:"$12.20",pct:29,color:C.accent,icon:"📡"},{label:"Demand Response",val:"$8.80",pct:21,color:C.teal,icon:"🔋"},{label:"Spot Market",val:"$3.40",pct:8,color:C.amber,icon:"📈"}].map(b=>(
                    <div key={b.label} style={{padding:"14px",background:b.color+"08",border:`1px solid ${b.color+"25"}`,borderRadius:12}}>
                      <div style={{fontSize:22}}>{b.icon}</div>
                      <div style={{fontSize:18,fontWeight:800,color:b.color,marginTop:8}}>{b.val}</div>
                      <div style={{fontSize:12,color:C.textMed,marginTop:2}}>{b.label}</div>
                      <div style={{marginTop:8}}><Bar value={b.pct} color={b.color} height={4}/><div style={{fontSize:10,color:C.textMuted,marginTop:3}}>{b.pct}% of earnings</div></div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ════ AI LOG ════ */}
          {tab==="ev-ailog"&&(
            <div className="responsive-grid-fixed-right" style={{gap:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Card>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,display:"flex",alignItems:"center"}}><span>AI Decision Log</span><TourHelper tourMode={tourMode} title="Transparent AI Operation Log" concept="A detailed list of all automation decisions made by the AI, showing the timestamp, action, type, and reasoning." value="Eliminates the 'black box' problem of AI, giving operators full auditing capability and peace of mind." tip="Filter by 'savings' or 'grid' to view specific actions taken to optimize costs." /></div>
                      <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Every action the AI has taken — with full reasoning. No black box.</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {["all","savings","schedule","grid","export","fault"].map(f=>(
                        <div key={f} onClick={()=>setAiLogFilter(f)} style={{padding:"4px 12px",borderRadius:99,cursor:"pointer",background:aiLogFilter===f?C.accent:C.bg,border:`1px solid ${aiLogFilter===f?C.accent:C.border}`,fontSize:11,fontWeight:600,color:aiLogFilter===f?C.white:C.textMed,textTransform:"capitalize"}}>{f}</div>
                      ))}
                    </div>
                  </div>
                  {aiLogFiltered.map((e,i)=>(
                    <AiLogEntry key={i} time={e.time} action={e.action} reason={e.reason} type={e.type}/>
                  ))}
                  {aiLogFiltered.length===0&&<div style={{textAlign:"center",padding:"24px",color:C.textMuted,fontSize:13}}>No log entries for this filter.</div>}
                </Card>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Card accent={C.accent}>
                  <SL tourMode={tourMode} tour={{ title: "AI Prioritisation Goal", concept: "Configures the primary objective the AI optimizes for: Minimising Cost, Maximising Green Energy, or Protecting Battery Life.", value: "Aligns system automated decisions with your current corporate values or financial targets.", tip: "Click 'Minimise Cost' or 'Protect Battery Life'. You will see the green active banner update instantly." }}>AI Optimisation Goal</SL>
                  <div style={{fontSize:11,color:C.textMuted,marginBottom:12}}>What should the AI prioritise when making charging decisions?</div>
                  {[{id:"cost",icon:"💰",label:"Minimise Cost",sub:"Off-peak, demand response, V2G"},{id:"green",icon:"🌱",label:"Maximise Green Energy",sub:"Solar first, avoid grid peak"},{id:"battery",icon:"🔋",label:"Protect Battery Life",sub:"80% cap, slow charge, no heat"}].map(g=>(
                    <div key={g.id} onClick={()=>setAiGoal(g.id)} style={{display:"flex",gap:12,padding:"12px",borderRadius:12,cursor:"pointer",border:`1.5px solid ${aiGoal===g.id?C.accent:C.border}`,background:aiGoal===g.id?C.accentLight:"none",marginBottom:8,transition:"all 0.15s"}}>
                      <span style={{fontSize:22}}>{g.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:700,color:aiGoal===g.id?C.accent:C.text}}>{g.label}</div>
                        <div style={{fontSize:11,color:C.textMuted,marginTop:2}}>{g.sub}</div>
                      </div>
                      {aiGoal===g.id&&<div style={{width:18,height:18,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.white,flexShrink:0,marginTop:2}}>✓</div>}
                    </div>
                  ))}
                  <div style={{padding:"10px 12px",background:C.greenLight,border:`1px solid ${C.green+"30"}`,borderRadius:10,fontSize:11,color:C.green,fontWeight:600}}>
                    Active: {goalDesc[aiGoal]}
                  </div>
                </Card>

                <Card>
                  <SL tourMode={tourMode} tour={{ title: "AI Monthly Performance Audit", concept: "Aggregated stats showing decisions made, grid signals acted on, cost saved, and safety limits enforced.", value: "Allows managers to easily quantify the business value and savings generated by the AI optimizer.", tip: "Show off the 'Faults Detected Early' metric, highlighting how the AI protects hardware from damage." }}>AI Performance This Month</SL>
                  {[{label:"Decisions Made",val:"247",icon:"🤖"},{label:"Cost Saved",val:"$152",icon:"💰",color:C.green},{label:"CO₂ Avoided",val:"58 kg",icon:"🌱",color:C.teal},{label:"Grid Signals Acted On",val:"12",icon:"⚡",color:C.amber},{label:"Faults Detected Early",val:"2",icon:"⚠️",color:C.red}].map((m,i,arr)=>(
                    <div key={m.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:16}}>{m.icon}</span><span style={{fontSize:12,color:C.textMed}}>{m.label}</span></div>
                      <span style={{fontSize:14,fontWeight:700,color:m.color||C.text}}>{m.val}</span>
                    </div>
                  ))}
                </Card>

                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Static Safety Enforcements", concept: "Hard-coded safety limits (battery temperature, max voltage, min reserve) that the AI can never override.", value: "Protects physical hardware and vehicle warranties from aggressive AI discharging rules.", tip: "Explain to the client that these safety parameters are locked by engineers and cannot be changed by the AI." }}>Static Safety Limits</SL>
                  <div style={{fontSize:11,color:C.textMuted,marginBottom:10}}>These limits are locked — the AI cannot override them regardless of goal.</div>
                  {[{label:"Max charge voltage",val:"410 V",icon:"🔌"},{label:"Max battery temp",val:"45°C",icon:"🌡"},{label:"Min reserve (V2G)",val:"20%",icon:"🔋"},{label:"Max session power",val:"250 kW",icon:"⚡"}].map((l,i,arr)=>(
                    <div key={l.label} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",background:C.amberLight,border:`1px solid ${C.amber+"30"}`,borderRadius:9,marginBottom:i<arr.length-1?6:0}}>
                      <span style={{fontSize:12,color:C.textMed,display:"flex",gap:6,alignItems:"center"}}><span>{l.icon}</span>{l.label}</span>
                      <span style={{fontSize:12,fontWeight:700,color:C.amber}}>{l.val} 🔒</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ════ FLEET ════ */}
          {tab==="ev-fleet"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="🚗" label="Total Vehicles" value="4" color={C.accent} sub="3 active · 1 idle" tourMode={tourMode} tour={{ title: "Fleet Asset Registry", concept: "Total number of electric vehicles registered and tracked in the fleet.", value: "Provides a quick overview of fleet capacity and active deployments.", tip: "Note the active vs idle count to track daily vehicle utilization." }}/>
                <Kpi icon="⚡" label="Currently Charging" value="1" color={C.green} sub="At depot A" tourMode={tourMode} tour={{ title: "Depot Charging Activity", concept: "The count of fleet vehicles currently connected to depot chargers.", value: "Allows fleet managers to track charging queues and ensure delivery vans are charging on schedule.", tip: "Show that vehicles are charging to meet scheduled departure times." }}/>
                <Kpi icon="🔋" label="Fleet Avg SoC" value="59%" color={C.amber} sub="Across all vehicles" tourMode={tourMode} tour={{ title: "Average State of Charge", concept: "The mean battery percentage across all vehicles in the fleet.", value: "Gives an immediate gauge of overall fleet energy readiness for new routes.", tip: "If this average is low, check which vehicles require immediate plugging." }}/>
                <Kpi icon="💰" label="Fleet Energy Cost" value="$124/mo" color={C.teal} delta="-12%" sub="vs. last month" tourMode={tourMode} tour={{ title: "Fleet Charging Expenses", concept: "Accumulated charging utility costs for the entire fleet during the current billing period.", value: "Tracks operating costs to keep fuel expenses within fleet budget limits.", tip: "Point out the green delta percentage showing cost savings compared to last month." }}/>
              </div>
              <Card>
                <SL right="Manage Fleet" tourMode={tourMode} tour={{ title: "Live Fleet Registry", concept: "Status cards for each vehicle showing battery charge %, active driver, location, and operating status.", value: "Enables real-time fleet dispatching and tracking, ensuring vehicles are charged and ready for their routes.", tip: "Point out the Rivian R1T: it is currently charging at Depot A with a 55% charge level." }}>Fleet Vehicles</SL>
                <div className="responsive-grid-1-1" style={{gap:12}}>
                  {fleetVehicles.map((v,i)=>(
                    <div key={i} style={{padding:"14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:12}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div style={{display:"flex",gap:10,alignItems:"center"}}>
                          <span style={{fontSize:24}}>🚗</span>
                          <div><div style={{fontSize:13,fontWeight:700}}>{v.name}</div><div style={{fontSize:11,color:C.textMuted}}>{v.plate} · Driver: {v.driver}</div></div>
                        </div>
                        <Pill label={v.status.toUpperCase()} small color={v.status==="charging"?C.green:v.status==="driving"?C.accent:v.status==="ready"?C.teal:C.amber}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                        <span style={{fontSize:12,color:C.textMuted}}>SoC: <strong style={{color:statColor(v.soc)}}>{v.soc}%</strong></span>
                        <span style={{fontSize:12,color:C.textMuted}}>📍 {v.location}</span>
                      </div>
                      <Bar value={v.soc} color={statColor(v.soc)} height={6}/>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="responsive-grid-1-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Depot Charging Planner", concept: "Detailed charging schedules and completion targets for each vehicle.", value: "Saves money by automatically scheduling charging for off-peak hours while guaranteeing vehicles are ready by departure.", tip: "Notice the scheduled time for the F-150: charging is deferred to 11:00 PM to save costs." }}>Fleet Charging Schedule</SL>
                  {fleetVehicles.map((v,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<fleetVehicles.length-1?`1px solid ${C.border}`:"none"}}>
                      <div style={{fontSize:12,fontWeight:600}}>{v.id} · {v.name.split(" ").slice(-2).join(" ")}</div>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}>
                        <div style={{fontSize:11,color:C.textMuted}}>{v.status==="charging"?"Now → 100%":"Sched. 11pm"}</div>
                        <Pill label={v.soc+"%"} color={statColor(v.soc)} small/>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Fleet Diagnostics & Warnings", concept: "Aggregated alerts including low battery warnings, scheduled maintenance triggers, and charger completions.", value: "Prevents operational delays by flagging low-battery vehicles before their shift starts.", tip: "Observe the red alert for the Rivian R1T: it warns the operator of a low 22% charge level needing immediate attention." }}>Fleet Health Alerts</SL>
                  {[{icon:"⚠️",text:"V-004 Rivian R1T — low SoC (22%), needs charge soon",color:C.red},{icon:"🔧",text:"V-002 Bolt EUV — battery check recommended at 50k mi",color:C.amber},{icon:"✅",text:"V-001 Model 3 — charging complete at 100%",color:C.green},{icon:"📅",text:"V-003 F-150 — scheduled maintenance Jun 15",color:C.accent}].map((a,i)=>(
                    <div key={i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<3?`1px solid ${C.border}`:"none",alignItems:"flex-start"}}>
                      <span style={{fontSize:16}}>{a.icon}</span>
                      <div style={{fontSize:12,color:C.textMed,flex:1,lineHeight:1.5}}>{a.text}</div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ════ PROFILE ════ */}
          {tab==="ev-profile"&&(
            <div className="responsive-grid-fixed-left-340" style={{gap:16}}>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Card style={{textAlign:"center",padding:"28px 20px",background:`linear-gradient(145deg,${C.accentLight},${C.surface})`}}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:-10,marginRight:-10}}>{tourMode && <TourHelper tourMode={tourMode} title="User Profile Portal" concept="Displays user credentials, loyalty membership tier, and aggregate lifetime savings metrics." value="Personalizes the client workspace and tracks lifetime smart-charging achievements." tip="Highlight the 'Platinum' status, denoting premium access benefits." />}</div>
                  <div style={{position:"relative",display:"inline-block",marginBottom:14}}>
                    <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.accent},${C.purple})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto",color:C.white,fontWeight:800}}>AJ</div>
                    <div style={{position:"absolute",bottom:0,right:-2,background:C.green,borderRadius:"50%",width:18,height:18,border:"3px solid white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:C.white}}>✓</div>
                  </div>
                  <div style={{fontSize:20,fontWeight:800}}>Alex Johnson</div>
                  <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>alex.johnson@email.com</div>
                  <div style={{marginTop:10,display:"flex",gap:6,justifyContent:"center",flexWrap:"wrap"}}>
                    <Pill label="💎 PLATINUM" color={C.purple}/>
                    <Pill label="134 sessions" color={C.textMuted}/>
                  </div>
                  <div className="responsive-grid-3" style={{gap:8,marginTop:16}}>
                    {[{val:"134",label:"Sessions"},{val:"1.1t",label:"CO₂ Saved"},{val:"2,841",label:"kWh Total"}].map(m=>(
                      <div key={m.label} style={{background:C.bg,borderRadius:10,padding:"10px 0",border:`1px solid ${C.border}`}}>
                        <div style={{fontSize:18,fontWeight:800,color:C.accent}}>{m.val}</div>
                        <div style={{fontSize:10,color:C.textMuted}}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Primary Vehicle Registry", concept: "Details of the active EV registered to this profile, including battery capacity, plug type, and health status.", value: "Allows the software to calibrate optimization algorithms matching the vehicle's specific charge curve.", tip: "Observe the registered Tesla Model 3: the system tailors charge voltage and SoC limits to this model." }}>My Vehicle</SL>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:32}}>🚗</span><div><div style={{fontSize:13,fontWeight:700}}>Tesla Model 3 LR</div><div style={{fontSize:11,color:C.textMuted}}>2023 · 75 kWh · NACS + CCS</div></div></div>
                    <Pill label="ACTIVE" color={C.green} small/>
                  </div>
                  <div className="responsive-grid-1-1" style={{gap:8}}>
                    {[{label:"Range (Full)",val:"340 mi"},{label:"Max DC",val:"250 kW"},{label:"Battery Health",val:"97%"},{label:"Max AC",val:"11 kW"}].map(v=>(
                      <div key={v.label} style={{background:C.bg,borderRadius:9,padding:"8px 10px",border:`1px solid ${C.border}`}}><div style={{fontSize:13,fontWeight:700}}>{v.val}</div><div style={{fontSize:10,color:C.textMuted}}>{v.label}</div></div>
                    ))}
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Wallet & Payment Credentials", concept: "Stored payment cards, mobile wallets, or RFID badges linked to the user account.", value: "Enables instant plug-and-charge authorization at public stations without needing physical cards.", tip: "Show how drivers can register local RFID tags to start charger sessions on-site." }}>Payment Methods</SL>
                  {[{name:"Visa •••• 4921",icon:"💳",isDefault:true},{name:"Apple Pay",icon:"⬛",isDefault:false},{name:"RFID Card #A4",icon:"📟",isDefault:false}].map((p,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                      <div style={{display:"flex",gap:10,alignItems:"center"}}><span style={{fontSize:18}}>{p.icon}</span><span style={{fontSize:13,fontWeight:500}}>{p.name}</span></div>
                      {p.isDefault?<Pill label="DEFAULT" color={C.green} small/>:<span style={{fontSize:11,color:C.accent,cursor:"pointer"}}>Set default</span>}
                    </div>
                  ))}
                </Card>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <Card>
                  <SL right={`${badges.filter(b=>b.earned).length}/${badges.length} earned`} tourMode={tourMode} tour={{ title: "Green Achievements Ledger", concept: "Unlocks gamified badges (e.g., Solar Master, Grid Friend) for smart energy habits.", value: "Encourages drivers to participate in cost-saving demand response programs.", tip: "Hover over the unlocked Solar Master badge to show how drivers are rewarded for solar-sync charging." }}>Achievements</SL>
                  <div className="responsive-grid-3" style={{gap:10}}>
                    {badges.map((b,i)=>(
                      <div key={i} style={{background:b.earned?b.color+"08":C.bg,border:`1px solid ${b.earned?b.color+"30":C.border}`,borderRadius:12,padding:"14px 10px",textAlign:"center",opacity:b.earned?1:0.5}}>
                        <div style={{fontSize:28,filter:b.earned?"none":"grayscale(1)"}}>{b.icon}</div>
                        <div style={{fontSize:12,fontWeight:700,marginTop:6,color:b.earned?C.text:C.textMuted}}>{b.label}</div>
                        <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>{b.sub}</div>
                        {b.earned&&<div style={{fontSize:9,color:b.color,marginTop:6,fontWeight:700}}>EARNED ✓</div>}
                      </div>
                    ))}
                  </div>
                </Card>
                <Card style={{background:`linear-gradient(135deg,#F5F0FF,#EEF6FF)`,border:`1px solid ${C.purple+"25"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <Pill label="💎 PLATINUM MEMBER" color={C.purple}/>
                      <div style={{fontSize:15,fontWeight:700,marginTop:8}}>All Benefits Active</div>
                      <div style={{fontSize:12,color:C.textMuted,marginTop:2}}>Roaming on 350,000+ stations · 18% avg discount</div>
                      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                        {["Plug & Charge","Priority Support","Roaming","V2G Access","AI Smart Schedule"].map(b=>(
                          <Pill key={b} label={b} color={C.purple} small/>
                        ))}
                      </div>
                    </div>
                    <div style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:C.purple}}>$7<span style={{fontSize:14}}>/mo</span></div><div style={{fontSize:10,color:C.textMuted}}>renews Jun 30</div></div>
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Security & Notification Center", concept: "Access controls to adjust notification preferences, roaming networks, and account privacy.", value: "Ensures compliance with local data privacy laws (GDPR) and gives users full control over alerts.", tip: "Explain to the client how easily notifications can be configured or turned off." }}>Settings</SL>
                  <div className="responsive-grid-1-1" style={{gap:0}}>
                    {["🔔 Notifications & Alerts","🌍 Roaming Networks","🔒 Privacy & Security","🤝 Refer a Friend","📞 Help & Support","🚪 Sign Out"].map((s,i)=>(
                      <div key={s} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 12px",borderBottom:`1px solid ${C.border}`,borderRight:i%2===0?`1px solid ${C.border}`:"none",cursor:"pointer"}}>
                        <span style={{fontSize:13,color:s.startsWith("🚪")?C.red:C.text}}>{s}</span>
                        {!s.startsWith("🚪")&&<span style={{color:C.textMuted,fontSize:14}}>›</span>}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════ BEMS OVERVIEW ════ */}
          {tab==="bems-overview"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="🏢" label="Total Building Load" value={`${(98.4 + electricityMeter).toFixed(1)} kW`} color={C.accent} sub="Grid Import + local solar" tourMode={tourMode} tour={{ title: "Total Building Load", concept: "Combined live electricity import of HVAC, lighting, and EV chargers.", value: "Helps monitor the total energy footprint to stay under utility-imposed limits.", tip: "Watch this spike when EV charging starts or when HVAC compressors turn on." }}/>
                <Kpi icon="🌡️" label="HVAC Energy Share" value={`${chillerLoad}%`} color={C.amber} sub="AC Compressor load" tourMode={tourMode} tour={{ title: "HVAC Energy Share", concept: "Percentage of total building power drawn by air conditioning chillers.", value: "Identifies heavy HVAC draw which can be throttled during peak load times to save money.", tip: "In peak load-shedding states, this value automatically drops to protect the grid." }}/>
                <Kpi icon="💡" label="Lighting Energy Share" value="18%" color={C.green} sub="Smart LED grid load" tourMode={tourMode} tour={{ title: "Lighting Energy Share", concept: "Energy share used by all lighting fixtures in the building.", value: "Helps verify savings from Daylight Harvesting and motion-sensing sweeps.", tip: "This value changes based on daylight availability and scheduled office hours." }}/>
                <Kpi icon="💨" label="Air Quality (AQI)" value="38" color={C.teal} sub="Status: Healthy" tourMode={tourMode} tour={{ title: "Air Quality (AQI)", concept: "Real-time indoor air quality index measured by ventilation sensors.", value: "Ensures occupant health and comfort while optimizing fresh air exchange.", tip: "Lower AQI numbers represent cleaner air. The AI cycles ventilation to maintain this." }}/>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Floor-by-Floor Load Distribution", concept: "Detailed live load consumption in kW for each floor and server room.", value: "Allows localized auditing to find energy waste, leakages, or off-hours consumption.", tip: "Point out the high server room base draw vs the dynamic lobby and office loads." }}>Live Load Distribution by Floor</SL>
                  {[{floor:"Floor 1 (Lobby & Parking)",load:48,solar:15,color:C.accent},{floor:"Floor 2 (Main Offices)",load:84,solar:32,color:C.purple},{floor:"Floor 3 (Conference Suites)",load:31,solar:0,color:C.green},{floor:"Server Room & Infrastructure",load:72,solar:0,color:C.red}].map(f=>(
                    <div key={f.floor} style={{marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600}}>{f.floor}</span>
                        <span style={{fontSize:12,fontWeight:700,color:f.color}}>{f.load} kW</span>
                      </div>
                      <Bar value={f.load} max={100} color={f.color}/>
                      <div style={{fontSize:9,color:C.textMuted,marginTop:3}}>Solar coverage: {f.solar > 0 ? `${f.solar} kW active` : "None"}</div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Smart Occupancy Tracker", concept: "Tracks motion-sensor status across campus zones.", value: "Enables automation: unoccupied spaces automatically dial down heating and lights to cut waste.", tip: "Show how vacant zones are automatically prioritized for energy-saving sweeps." }}>Zone Occupancy Profile</SL>
                  {[{zone:"Main Lobby",occ:lobbyOcc,icon:"🏨"},{zone:"Executive Offices",occ:officesOcc,icon:"👨‍💼"},{zone:"Conference Hall",occ:confOcc,icon:"👥"},{zone:"Basement Parking",occ:garageOcc,icon:"🚗"}].map(z=>(
                    <div key={z.zone} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",gap:8}}><span style={{fontSize:16}}>{z.icon}</span><span style={{fontSize:12,fontWeight:600}}>{z.zone}</span></div>
                      <Pill label={z.occ?"OCCUPIED":"VACANT"} color={z.occ?C.green:C.textMuted} small/>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ════ BEMS HVAC CONTROLS ════ */}
          {tab==="bems-hvac"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="🌡️" label="Average Indoor Temp" value="21.5°C" color={C.green} sub="Target: 21°C" tourMode={tourMode} tour={{ title: "Average Indoor Temp", concept: "The mean temperature of all building zones calculated from indoor thermostat sensors.", value: "Monitors overall thermal comfort while helping audit HVAC cooling efficiency.", tip: "This value fluctuates around the configured target temperature setpoint." }}/>
                <Kpi icon="❄️" label="HVAC Operating Mode" value={hvacMode.toUpperCase()} color={C.accent} sub={hvacAuto?"AI Auto-optimization active":"Manual override active"} tourMode={tourMode} tour={{ title: "AI HVAC Optimization", concept: "Controls the active state (Cooling, Heating, Ventilation) of the HVAC chillers.", value: "Saves energy by adapting ventilation speeds and coolant flows dynamically based on occupancy.", tip: "Observe how this status changes when BEMS automatically triggers load shedding." }}/>
                <Kpi icon="💨" label="Fan Status" value={`Speed: ${fanSpeed}`} color={C.teal} sub="Ventilation active" tourMode={tourMode} tour={{ title: "Ventilation Fan Status", concept: "Current speed level of the central air ventilation fans.", value: "Directly impacts building air flow comfort. Lowering fan speed during low occupancy cuts fan electricity consumption.", tip: "Adjust the global fan speed below to watch this value update dynamically." }}/>
                <Kpi icon="🔥" label="Boiler Load" value="0%" color={C.red} sub="Status: Standby" tourMode={tourMode} tour={{ title: "Central Boiler Load", concept: "Operating percentage of the building's central heating boiler.", value: "Shows heating fuel usage. In summer months, this remains at 0% standby to prevent energy waste.", tip: "This status will change to active heating if zone temperature setpoints exceed current ambient room temperatures." }}/>
              </div>
              <div className="responsive-grid-1-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Zone-Based Thermostats", concept: "Independent climate targets for separate sectors of your building.", value: "Modifying target temperatures per zone helps control heating/cooling costs. Raising target cooling by 1°C saves up to 8% in electricity.", tip: "Click '+' or '-' to adjust temperatures. Notice the Chiller Operating Load adjustment." }}>Zone Climate Controllers</SL>
                  {[
                    {id:"lobby",name:"Building Lobby",temp:lobbyTemp,set:setLobbyTemp,color:C.accent},
                    {id:"offices",name:"Main Offices",temp:officesTemp,set:setOfficesTemp,color:C.purple},
                    {id:"conf",name:"Conference Suite",temp:confRoomTemp,set:setConfRoomTemp,color:C.green},
                    {id:"garage",name:"Parking Garage Ventilation",temp:garageTemp,set:setGarageTemp,color:C.amber}
                  ].map(z=>(
                    <div key={z.id} style={{padding:"12px",background:C.bg,borderRadius:12,marginBottom:10,border:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div><div style={{fontSize:13,fontWeight:700}}>{z.name}</div><div style={{fontSize:11,color:C.textMuted}}>Current: {z.temp}°C</div></div>
                      <div style={{display:"flex",alignItems:"center",gap:12}}>
                        <button onClick={()=>z.set(t=>t-1)} style={{width:28,height:28,borderRadius:"50%",background:C.white,border:`1px solid ${C.border}`,fontWeight:"bold",cursor:"pointer"}}>-</button>
                        <span style={{fontSize:14,fontWeight:800,width:35,textAlign:"center"}}>{z.temp}°C</span>
                        <button onClick={()=>z.set(t=>t+1)} style={{width:28,height:28,borderRadius:"50%",background:C.white,border:`1px solid ${C.border}`,fontWeight:"bold",cursor:"pointer"}}>+</button>
                      </div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Climate Modes & Controls", concept: "Manual override panel for central heating, cooling, fan speeds, and AI mode.", value: "Gives facilities managers instant toggle ability while keeping automated load rules active.", tip: "Toggle the AI Auto-optimisation switch to show how the system bridges with EV load." }}>HVAC Settings & Control Profile</SL>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    {["cool","heat","fan","off"].map(m=>(
                      <button key={m} onClick={()=>setHvacMode(m)} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${hvacMode===m?C.accent:C.border}`,background:hvacMode===m?C.accentLight:C.white,color:hvacMode===m?C.accent:C.textMed,fontWeight:700,textTransform:"uppercase",fontSize:10,cursor:"pointer"}}>{m}</button>
                    ))}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:12,fontWeight:600}}>AI Auto-optimisation</div><div style={{fontSize:10,color:C.textMuted}}>Auto adjust climate setpoints based on EV load limits</div></div>
                    <Toggle on={hvacAuto} onToggle={()=>setHvacAuto(v=>!v)}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:12,fontWeight:600}}>Global Fan Speed</div><div style={{fontSize:10,color:C.textMuted}}>Ventilation speed multiplier</div></div>
                    <div style={{display:"flex",gap:4}}>
                      {[1,2,3].map(s=>(
                        <button key={s} onClick={()=>setFanSpeed(s)} style={{width:28,height:28,borderRadius:6,border:`1px solid ${fanSpeed===s?C.teal:C.border}`,background:fanSpeed===s?C.tealLight:C.white,color:fanSpeed===s?C.teal:C.textMed,fontWeight:"bold",cursor:"pointer"}}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{marginTop:14}}>
                    <SL tourMode={tourMode} tour={{ title: "Compressor Operations", concept: "Actual electrical load percentage drawn by the primary chillers.", value: "Shedding load dynamically throttles this output, saving large energy chunks during grid demand peaks.", tip: "Point out the COP (Coefficient of Performance), indicating efficient cooling delivery." }}>Chiller Compression Output</SL>
                    <Bar value={chillerLoad} color={C.amber}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}><span style={{fontSize:10,color:C.textMuted}}>Operating Load: {chillerLoad}%</span><span style={{fontSize:10,color:C.textMuted}}>COP: 4.1 (Efficient)</span></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════ BEMS SMART LIGHTING ════ */}
          {tab==="bems-lighting"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-3" style={{gap:12}}>
                <Kpi icon="💡" label="Active Fixtures" value="142 / 180" color={C.green} sub="LED energy saving enabled" tourMode={tourMode} tour={{ title: "Active Lighting Fixtures", concept: "The ratio of currently illuminated light fixtures compared to the building total.", value: "Tracks lighting density to audit energy waste in vacant office sections.", tip: "Observe this count decrease when schedule-based sweeps turn off unoccupied office grids." }}/>
                <Kpi icon="☀️" label="Daylight Harvesting" value={daylightHarvesting?"ACTIVE":"DISABLED"} color={C.accent} sub="Auto dimming active" tourMode={tourMode} tour={{ title: "Daylight Harvesting", concept: "Uses ambient light sensors to dim building lights automatically if sunlight is bright enough.", value: "Saves up to 40% in lighting electricity costs during the day without human intervention.", tip: "Toggle Daylight Harvesting under Automation Settings and watch how it affects lighting levels." }}/>
                <Kpi icon="⚡" label="Lighting Demand" value="8.4 kW" color={C.teal} sub="Savings vs legacy lighting: -64%" tourMode={tourMode} tour={{ title: "Lighting Electrical Power Draw", concept: "The active power demand in kW consumed by the building's LED lights.", value: "Shows live lighting electrical draw. Upgrading to smart LED grids cuts base lighting costs by over 60%.", tip: "Watch this value drop when daylight harvesting dimming is active." }}/>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "LED Zone Controllers", concept: "Manual override switches and dimming levels for specific facility sectors.", value: "Let's you manually fine-tune power usage. Dimming LED fixtures by 20% cuts energy consumption by 20% but is virtually unnoticeable to occupants.", tip: "Toggle a zone OFF or drag its slider to see how simple dimming actions are set up." }}>Smart Lighting Zone Controllers</SL>
                  {[
                    {id:"lobby",name:"Main Lobby",state:lobbyLight,toggle:setLobbyLight,dim:lobbyDim,setDim:setLobbyDim,occ:lobbyOcc},
                    {id:"offices",name:"Executive Offices",state:officesLight,toggle:setOfficesLight,dim:officesDim,setDim:setOfficesDim,occ:officesOcc},
                    {id:"conf",name:"Conference Suites",state:confLight,toggle:setConfLight,dim:confDim,setDim:setConfDim,occ:confOcc},
                    {id:"garage",name:"Basement Parking Lot",state:garageLight,toggle:setGarageLight,dim:garageDim,setDim:setGarageDim,occ:garageOcc}
                  ].map(z=>(
                    <div key={z.id} style={{padding:"14px",background:C.bg,borderRadius:12,marginBottom:10,border:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700}}>{z.name}</div>
                          <div style={{fontSize:10,color:C.textMuted}}>Occupancy: {z.occ?"Motion detected":"No motion detected"}</div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:12}}>
                          <span style={{fontSize:11,fontWeight:600,color:z.state?C.green:C.textMuted}}>{z.state?`ON (${z.dim}%)`:"OFF"}</span>
                          <Toggle on={z.state} onToggle={()=>z.toggle(v=>!v)}/>
                        </div>
                      </div>
                      <input type="range" min={0} max={100} value={z.dim} disabled={!z.state} onChange={e=>z.setDim(+e.target.value)} style={{width:"100%",opacity:z.state?1:0.4}}/>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Automation Settings", concept: "Preconfigured rules that control lights automatically based on schedules or sensors.", value: "Saves energy by turning off lights in empty spaces and during off-hours, eliminating human error.", tip: "Toggle Daylight Harvesting to activate light-sensor dimming automatically." }}>Automation Settings</SL>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:12,fontWeight:600}}>Daylight Harvesting</div><div style={{fontSize:10,color:C.textMuted}}>Auto dim fixtures near windows when sun is bright</div></div>
                    <Toggle on={daylightHarvesting} onToggle={()=>setDaylightHarvesting(v=>!v)}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`}}>
                    <div><div style={{fontSize:12,fontWeight:600}}>Schedule Sweeping</div><div style={{fontSize:10,color:C.textMuted}}>Auto turn off unoccupied zones after 9:00 PM</div></div>
                    <Toggle on={true} onToggle={()=>{}}/>
                  </div>
                  <div style={{padding:"12px",background:C.greenLight,border:`1px solid ${C.green}30`,borderRadius:10,marginTop:14,fontSize:11,color:C.green,fontWeight:600}}>
                    💡 Daylight harvesting dimmers are currently reducing lobby lighting loads by 30% dynamically.
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ════ BEMS UTILITY METERS ════ */}
          {tab==="bems-meters"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-3" style={{gap:12}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Live Electricity Meter", concept: "Instantly reports total building electricity consumption (in kW).", value: "Tracks active power draw to catch abnormal usage spikes or device failures in real time.", tip: "Observe how this meter updates every 3 seconds with slight variations, representing a live feed." }}>Electricity Sub-Meter</SL>
                  <div style={{fontSize:24,fontWeight:800,color:C.accent}}>{electricityMeter.toFixed(1)} kW</div>
                  <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Live demand meter · Updated 3s ago</div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Water Flow Sub-Meter", concept: "Live water flow rate in cubic meters per hour passing through the main supply pipeline.", value: "Tracks facility water utilization and flags continuous flows that might indicate pipe leaks or open valves.", tip: "Observe the slight variations in flow rate, representing active occupant usage." }}>Water Meter</SL>
                  <div style={{fontSize:24,fontWeight:800,color:C.teal}}>{waterMeter.toFixed(1)} m³/h</div>
                  <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Main flow meter · Updated 3s ago</div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Gas Supply Sub-Meter", concept: "Live gas flow rate in cubic meters per hour consumed by heating boilers and furnaces.", value: "Provides raw metrics for heating fuel costs and carbon emission tracking.", tip: "In standby mode, this meter registers 0.0 m³/h, indicating zero fuel burn." }}>Gas Import Meter</SL>
                  <div style={{fontSize:24,fontWeight:800,color:C.amber}}>{gasMeter.toFixed(1)} m³/h</div>
                  <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Furnace supply line · Updated 3s ago</div>
                </Card>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "AI Load Forecast", concept: "Predictive graph showing electricity draw over the next 24 hours.", value: "Saves money by allowing building operators to schedule energy-heavy tasks during cheaper, off-peak windows.", tip: "Point out the forecasted peak at 6:00 PM, which indicates when the building should proactively shed load." }}>Peak Building Load Forecast (24hr)</SL>
                  <Spark data={[118,124,121,115,138,142,159,168,184,171,155,142,148,159,178,198,212,218,184,142,121,118,110,105]} color={C.accent} w={600} h={100} fill/>
                  <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                    <span style={{fontSize:10,color:C.textMuted}}>12am</span>
                    <span style={{fontSize:10,fontWeight:700,color:C.red}}>Peak expected 6pm: 218 kW</span>
                    <span style={{fontSize:10,color:C.textMuted}}>11pm</span>
                  </div>
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Daily Utility Billing Audit", concept: "Accumulated daily consumption and estimated costs for electricity, water, and gas.", value: "Gives facilities managers daily financial tracking to prevent end-of-month utility bill surprises.", tip: "Compare the daily electricity cost ($409.44) with water ($168.40) to see where major savings can be made." }}>Daily Consumption Summary</SL>
                  {[{label:"Electricity (Total)",val:"3,412 kWh",cost:"$409.44",color:C.accent},{label:"Water (Total)",val:"84.2 m³",cost:"$168.40",color:C.teal},{label:"Gas (Total)",val:"42.8 m³",cost:"$51.36",color:C.amber}].map(m=>(
                    <div key={m.label} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontSize:12,fontWeight:600}}>{m.label}</span><span style={{fontSize:12,fontWeight:700,color:m.color}}>{m.val}</span></div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.textMuted}}><span>Estimated Cost</span><span>{m.cost}</span></div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ════ BEMS CO-OPTIMISATION ════ */}
          {tab==="bems-coopt"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div className="responsive-grid-4" style={{gap:12}}>
                <Kpi icon="♻️" label="Optimisation Status" value={sheddingActive?"SHEDDING ACTIVE":"HEALTHY"} color={sheddingActive?C.red:C.green} sub={coOptMode==="auto"?"AI automated dispatching":"Manual profile active"} tourMode={tourMode} tour={{ title: "Optimisation Status", concept: "Tells you if the building is currently shedding load to stay under its limit.", value: "Saves thousands of dollars in peak demand surcharges and prevents electrical failure.", tip: "When shedding is active, AC chillers run at lower speeds and non-essential lights are dimmed." }}/>
                <Kpi icon="⚡" label="EV Grid Demand" value="98.4 kW" color={C.accent} sub="Total vehicle charging load" tourMode={tourMode} tour={{ title: "EV Charger Demand", concept: "The combined live power load in kW drawn by all vehicles plugged into depot chargers.", value: "Essential for monitoring total facility demand to avoid substation overloads.", tip: "This value increases as vehicles plug in or draw higher charging power levels." }}/>
                <Kpi icon="🏢" label="Building Base Demand" value={`${electricityMeter.toFixed(1)} kW`} color={C.purple} sub="HVAC + lighting load" tourMode={tourMode} tour={{ title: "Building Base Demand", concept: "Live electricity load consumed by HVAC chillers, lighting, and ventilation systems (excluding EV chargers).", value: "Tracks the building's core load footprint to identify baseline energy waste.", tip: "Compare the building base demand with the EV charger demand to see which system is drawing more power." }}/>
                <Kpi icon="🛑" label="Building peak Limit" value={`${peakThreshold} kW`} color={C.red} sub="Demand threshold limit" tourMode={tourMode} tour={{ title: "Building Peak Limit", concept: "The maximum power draw allowed for the entire facility.", value: "Capping this limit prevents high charges and guarantees you do not overload your local grid connection.", tip: "This limit is controlled via the slider below." }}/>
              </div>
              <div className="responsive-grid-2-1" style={{gap:14}}>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Peak Demand Limit Controller", concept: "Sets the maximum grid import threshold allowed for the combined building and EV charger systems.", value: "Directly controls peak-demand surcharges, capping your utility bill and preventing local electrical outages.", tip: "Drag the threshold slider down. When it goes below the combined current load, highlight the red 'SHEDDING ACTIVE' alert that appears instantly." }}>Peak Load Control Configuration</SL>
                  <div style={{marginBottom:18}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:12,fontWeight:600}}>Max Combined Peak Threshold Limit</span><span style={{fontSize:14,fontWeight:800,color:C.red}}>{peakThreshold} kW</span></div>
                    <input type="range" min={120} max={300} value={peakThreshold} onChange={e=>setPeakThreshold(+e.target.value)} style={{width:"100%"}}/>
                    <div style={{fontSize:10,color:C.textMuted,marginTop:4}}>If Combined Load (EV Charger + Building HVAC/Lights) exceeds this limit, automatic load shedding triggers.</div>
                  </div>
                  <SL tourMode={tourMode} tour={{ title: "Optimisation Mode Selector", concept: "Choose between AI co-optimisation (dynamic limit capping), forcing load-shedding manually, or disabling building-to-charger linkage.", value: "Gives facility managers instant override capability to prioritize either grid stability or maximum charger speeds.", tip: "Click 'Force Shedding' to manually trigger energy conservation rules. Watch the AC chiller load drop to 42%." }}>Co-Optimisation Operations Profile</SL>
                  <div style={{display:"flex",gap:8,marginBottom:16}}>
                    {[{id:"auto",label:"AI Co-optimise"},{id:"manual",label:"Force Shedding"},{id:"off",label:"Disable Linkage"}].map(m=>(
                      <button key={m.id} onClick={()=>{
                        setCoOptMode(m.id);
                        if (m.id === "manual") { setSheddingActive(true); setChillerLoad(42); }
                        if (m.id === "off") { setSheddingActive(false); setChillerLoad(68); }
                      }} style={{flex:1,padding:"10px",borderRadius:8,border:`1px solid ${coOptMode===m.id?C.accent:C.border}`,background:coOptMode===m.id?C.accentLight:C.white,color:coOptMode===m.id?C.accent:C.textMed,fontWeight:700,fontSize:10,cursor:"pointer"}}>{m.label}</button>
                    ))}
                  </div>
                  {sheddingActive && (
                    <div style={{padding:"12px",background:C.redLight,border:`1px solid ${C.red}40`,borderRadius:12,color:C.red,fontWeight:600,fontSize:11,marginBottom:14}}>
                      ⚠ Peak Shedding Profile Active: AC Chiller load throttled to 42%, non-essential building lighting dimmed by 30%. Saving {(98.4 + electricityMeter - peakThreshold).toFixed(1)} kW from grid.
                    </div>
                  )}
                  <SL tourMode={tourMode} tour={{ title: "Load Shed Priority Rules", concept: "The ordered checklist the AI follows to shed electrical load when demand approaches the configured limit.", value: "Ensures critical operations (like servers) stay powered, while shedding non-essential loads (like lobby AC or parking lights) first.", tip: "Show the client how Rule 1 and Rule 2 are marked as 'Triggered (Active)' while Rule 4 is 'Standby'." }}>Load Shed Priority Ranking</SL>
                  {[{rule:"1. Reduce HVAC setpoint load in lobby/garage",status:"Triggered (Active)"},{rule:"2. Dim hallway lighting grid to 50%",status:"Triggered (Active)"},{rule:"3. Cycle server room backup AC cooling zones",status:"Standby"},{rule:"4. Throttle EV charging station outlets to 11 kW",status:"Standby"}].map(r=>(
                    <div key={r.rule} style={{display:"flex",justifyContent:"space-between",padding:"8px 10px",background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,marginBottom:6,fontSize:11}}>
                      <span>{r.rule}</span>
                      <span style={{fontWeight:700,color:r.status.includes("Active")?C.green:C.textMuted}}>{r.status}</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SL tourMode={tourMode} tour={{ title: "Audit & Operations Log", concept: "Chronological log showing automatic control adjustments made by the AI.", value: "Provides absolute transparency and verification of energy saving actions for auditing.", tip: "Point out the log entries to demonstrate that the system tracks exactly why each action was taken." }}>Co-Optimisation Log</SL>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {shedActionsLog.map((l,i)=>(
                      <div key={i} style={{padding:"8px 0",borderBottom:i<shedActionsLog.length-1?`1px solid ${C.border}`:"none"}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700}}><span>{l.action}</span><span style={{color:C.textMuted}}>{l.time}</span></div>
                        <div style={{fontSize:10,color:C.textMuted,marginTop:2}}>Trigger: {l.trigger}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}


          {/* ════ EMS CONTROL SYSTEM ════ */}
          {tab==="ems-control" && (() => {
            const isManual = emsControlMode === "manual";
            const isAi = emsControlMode === "ai";
            const isHybrid = emsControlMode === "hybrid";
            const modeColor = isManual ? C.amber : isAi ? C.purple : C.accent;
            const modeDesc = {
              manual: "You are in full control. Set charge rates, source priority, and schedules manually. The AI is off.",
              ai: "The AI manages all charging decisions automatically based on your goal. No manual input required.",
              hybrid: "AI makes smart decisions, but you can override key parameters using the sliders below.",
            }[emsControlMode];

            const sourcePriorityOptions = [
              { id: "solar", icon: "☀️", label: "Solar First", sub: "Use rooftop solar before anything else" },
              { id: "battery", icon: "🔋", label: "Battery First", sub: "Drain stored BESS before touching the grid" },
              { id: "grid", icon: "⚡", label: "Grid Only", sub: "Draw directly from the grid at current rate" },
            ];
            const aiGoals = [
              { id: "cost", icon: "💰", label: "Minimise Cost", sub: "Off-peak windows, V2G, demand response" },
              { id: "green", icon: "🌱", label: "Maximise Renewables", sub: "Solar first, avoid carbon-heavy grid hours" },
              { id: "battery", icon: "🔋", label: "Protect Battery", sub: "80% cap, slow charge, avoid heat stress" },
            ];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Mode Selector Banner */}
                <Card style={{ padding: "20px 24px", background: `linear-gradient(135deg, ${modeColor}10, ${C.surface})`, border: `1.5px solid ${modeColor}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: modeColor, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>EV Charging (EMS) — Control Mode</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                        {isManual ? "🕹️ Manual Control" : isAi ? "🤖 Full AI Control" : "🔀 Hybrid Control"}
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, maxWidth: 480 }}>{modeDesc}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { id: "manual", label: "🕹️ Manual", color: C.amber },
                        { id: "ai", label: "🤖 Full AI", color: C.purple },
                        { id: "hybrid", label: "🔀 Hybrid", color: C.accent },
                      ].map(m => (
                        <button key={m.id} onClick={() => setEmsControlMode(m.id)} style={{
                          padding: "10px 18px", borderRadius: 10,
                          border: `1.5px solid ${emsControlMode === m.id ? m.color : C.border}`,
                          background: emsControlMode === m.id ? m.color + "15" : C.white,
                          color: emsControlMode === m.id ? m.color : C.textMed,
                          fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s"
                        }}>{m.label}</button>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="responsive-grid-2-1" style={{ gap: 16 }}>
                  {/* Left column: controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* AI Goal — shown in AI + Hybrid modes */}
                    {!isManual && (
                      <Card>
                        <SL tourMode={tourMode} tour={{ title: "AI Optimisation Goal", concept: "Choose between minimizing cost, maximizing green energy, or protecting battery health.", value: "Instructs the AI dispatcher to adjust charging patterns to meet target priorities.", tip: "Select 'Minimise Cost' to see the AI automatically schedule charging for low-tariff hours." }}>🎯 AI Optimisation Goal</SL>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>What should the AI prioritise when making EV charging decisions?</div>
                        {aiGoals.map(g => (
                          <div key={g.id} onClick={() => setEmsAiGoalControl(g.id)} style={{
                            display: "flex", gap: 12, padding: "12px", borderRadius: 12, cursor: "pointer",
                            border: `1.5px solid ${emsAiGoalControl === g.id ? C.purple : C.border}`,
                            background: emsAiGoalControl === g.id ? C.purpleLight + "40" : "none",
                            marginBottom: 8, transition: "all 0.15s"
                          }}>
                            <span style={{ fontSize: 22 }}>{g.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: emsAiGoalControl === g.id ? C.purple : C.text }}>{g.label}</div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{g.sub}</div>
                            </div>
                            {emsAiGoalControl === g.id && <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.white, flexShrink: 0, marginTop: 2 }}>✓</div>}
                          </div>
                        ))}
                      </Card>
                    )}

                    {/* Source Priority — always shown; disabled in AI mode */}
                    <Card>
                      <SL tourMode={tourMode} tour={{ title: "Energy Source Priority", concept: "Prioritize rooftop solar generation or battery storage before importing grid power.", value: "Saves money and cuts carbon footprint by using local renewable resources.", tip: "Click 'Solar First' to prioritize locally generated energy." }}>⚡ Energy Source Priority</SL>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
                        {isAi ? "AI is managing source selection automatically based on your goal." : "Choose which energy source powers your EV chargers first."}
                      </div>
                      {sourcePriorityOptions.map(s => (
                        <div key={s.id} onClick={() => !isAi && setEmsSourcePriority(s.id)} style={{
                          display: "flex", gap: 12, padding: "12px", borderRadius: 12,
                          cursor: isAi ? "not-allowed" : "pointer",
                          border: `1.5px solid ${emsSourcePriority === s.id ? C.amber : C.border}`,
                          background: emsSourcePriority === s.id ? C.amberLight : "none",
                          marginBottom: 8, opacity: isAi ? 0.5 : 1, transition: "all 0.15s"
                        }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: emsSourcePriority === s.id ? C.amber : C.text }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.sub}</div>
                          </div>
                          {emsSourcePriority === s.id && <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.white, flexShrink: 0, marginTop: 2 }}>✓</div>}
                        </div>
                      ))}
                    </Card>

                    {/* Manual sliders — shown in Manual + Hybrid */}
                    {!isAi && (
                      <Card>
                        <SL tourMode={tourMode} tour={{ title: "Charging Parameter Overrides", concept: "Manual override inputs for charging rate, current limit, and target State of Charge.", value: "Lets drivers adjust charging behavior on the fly, bypassing default schedules when needed.", tip: "Use the Charging Current slider to test limiting the speed to exactly what your vehicle requires." }}>{isHybrid ? "🔀 Hybrid Overrides" : "🕹️ Manual Controls"}</SL>
                        {isHybrid && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, padding: "8px 10px", background: C.accentLight, borderRadius: 9, border: `1px solid ${C.accent}30` }}>AI handles scheduling and grid signals. Use the sliders below to override specific parameters.</div>}

                        {/* Charge Rate */}
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>⚡ Max Charge Rate</span>
                              <TourHelper tourMode={tourMode} title="Max Charge Rate" concept="The maximum power limit in kW set for the EV chargers." value="Prevents exceeding site power capacity and tripping local grid breakers." tip="Slide this up to 350 kW for fast DC charging, or down to 7 kW for gentle Level 2 overnight charging." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{emsChargeRate} kW</span>
                          </div>
                          <input type="range" min={7} max={350} value={emsChargeRate} onChange={e => setEmsChargeRate(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>7 kW (Level 2)</span><span>350 kW (Ultra-fast DC)</span>
                          </div>
                        </div>

                        {/* Charging Current */}
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>🔌 Charging Current</span>
                              <TourHelper tourMode={tourMode} title="Charging Current" concept="Manually restricts the electrical current (Amps) produced by the charger." value="Protects older electrical installations from overheating and allows fine-tuning charging speed." tip="Adjust this slider from 8 A up to 400 A to control the current flowing to the vehicle." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.amber }}>{emsChargeCurrent} A</span>
                          </div>
                          <input type="range" min={8} max={400} value={emsChargeCurrent} onChange={e => setEmsChargeCurrent(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>8 A (Min)</span><span>400 A (Max)</span>
                          </div>
                        </div>

                        {/* Target SoC */}
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>🎯 Target State of Charge</span>
                              <TourHelper tourMode={tourMode} title="Target State of Charge" concept="The target battery percentage to charge the vehicle to." value="Avoids keeping the battery at 100% SoC for long periods, which preserves long-term battery health." tip="Set this to 80% for normal daily commuting, or 100% for long road trips." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{emsTargetSoc}%</span>
                          </div>
                          <input type="range" min={50} max={100} value={emsTargetSoc} onChange={e => setEmsTargetSoc(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>50% (daily use)</span><span>100% (road trip)</span>
                          </div>
                        </div>

                        {/* Schedule Start (Manual only) */}
                        {isManual && (
                          <div style={{ marginBottom: 18 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                                <span>🕐 Charge Start Time</span>
                                <TourHelper tourMode={tourMode} title="Charge Start Time" concept="The delayed hour when EV charging is scheduled to automatically begin." value="Allows charging to start late at night, ensuring you consume cheaper off-peak electricity." tip="Move this to 11 PM or 12 AM to utilize lower grid tariffs." />
                              </span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{emsScheduleStart}:00 {emsScheduleStart < 12 ? "AM" : "PM"}</span>
                            </div>
                            <input type="range" min={0} max={23} value={emsScheduleStart} onChange={e => setEmsScheduleStart(+e.target.value)} style={{ width: "100%" }} />
                            <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 9, fontSize: 11, fontWeight: 600,
                              background: (emsScheduleStart >= 22 || emsScheduleStart <= 5) ? C.greenLight : C.amberLight,
                              color: (emsScheduleStart >= 22 || emsScheduleStart <= 5) ? C.green : C.amber,
                              border: `1px solid ${(emsScheduleStart >= 22 || emsScheduleStart <= 5) ? C.green + "30" : C.amber + "30"}`
                            }}>
                              {(emsScheduleStart >= 22 || emsScheduleStart <= 5)
                                ? "✅ Super off-peak rate active — excellent timing ($0.08/kWh)"
                                : "⚠ Near-peak or peak rate. Consider shifting to 11 PM for max savings."}
                            </div>
                          </div>
                        )}

                        {/* V2G Override */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${C.border}` }}>
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>♻️ V2G Export Override</span>
                              <TourHelper tourMode={tourMode} title="V2G Export Override" concept="Overrides automated AI dispatch to force grid exports from the vehicle's battery." value="Let's you manually sell energy back to the grid during extreme price spikes." tip="Toggle this switch on to enable manually-controlled power feedback to the building." />
                            </span>
                            <div style={{ fontSize: 10, color: C.textMuted }}>Allow vehicle-to-grid export during peak hours</div>
                          </div>
                          <Toggle on={emsV2gOverride} onToggle={() => setEmsV2gOverride(v => !v)} />
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Right column: status + log */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Live Status Summary */}
                    <Card>
                      <SL tourMode={tourMode} tour={{ title: "Live EMS Status", concept: "Real-time summary of the active control parameters, charge limits, and energy sources.", value: "Gives operators immediate visibility into how the EV chargers are currently being regulated.", tip: "Observe how changing manual sliders updates active rate and current limits instantaneously." }}>📊 Live EMS Status</SL>
                      {[
                        { label: "Control Mode", val: isManual ? "Manual" : isAi ? "Full AI" : "Hybrid", color: modeColor },
                        { label: "Active Source", val: emsSourcePriority === "solar" ? "☀️ Solar" : emsSourcePriority === "battery" ? "🔋 Battery" : "⚡ Grid", color: emsSourcePriority === "solar" ? C.amber : emsSourcePriority === "battery" ? C.green : C.accent },
                        { label: "Max Charge Rate", val: isAi ? "AI-managed" : `${emsChargeRate} kW`, color: C.accent },
                        { label: "Charging Current", val: isAi ? "AI-managed" : `${emsChargeCurrent} A`, color: C.amber },
                        { label: "Target SoC", val: isAi ? "AI-managed" : `${emsTargetSoc}%`, color: C.green },
                        { label: "V2G Export", val: (isAi || emsV2gOverride) ? "Enabled" : "Disabled", color: (isAi || emsV2gOverride) ? C.purple : C.textMuted },
                        { label: "AI Optimising For", val: isManual ? "Off" : aiGoals.find(g => g.id === emsAiGoalControl)?.label, color: isManual ? C.textMuted : C.purple },
                      ].map((r, i, arr) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <span style={{ fontSize: 12, color: C.textMed }}>{r.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
                        </div>
                      ))}
                    </Card>

                    {/* AI Decision Log (hidden in Manual mode) */}
                    {!isManual && (
                      <Card>
                        <SL>🤖 Recent AI Actions</SL>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Every automated decision with full reasoning.</div>
                        {emsAiLog.map((e, i) => (
                          <div key={i} style={{ padding: "10px 0", borderBottom: i < emsAiLog.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.action}</span>
                              <span style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap", marginLeft: 8 }}>{e.time}</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>💬 {e.reason}</div>
                          </div>
                        ))}
                      </Card>
                    )}

                    {/* Manual mode — locked AI notice */}
                    {isManual && (
                      <Card style={{ background: C.amberLight, border: `1px solid ${C.amber}40` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 6 }}>🕹️ Full Manual Active</div>
                        <div style={{ fontSize: 12, color: C.textMed, lineHeight: 1.6 }}>
                          AI optimisation is completely off. All charging decisions use only the parameters you set above. No automatic schedule shifting, demand response, or V2G decisions will be made.
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                          Tip: Switch to Hybrid mode to let AI handle grid signals while you keep control of rate and source priority.
                        </div>
                      </Card>
                    )}

                    {/* Safety locks — always visible */}
                    <Card>
                      <SL>🔒 Safety Limits (Locked)</SL>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>These cannot be changed in any mode — they protect hardware and warranties.</div>
                      {[
                        { label: "Max charge voltage", val: "410 V", icon: "🔌" },
                        { label: "Max battery temp", val: "45°C", icon: "🌡" },
                        { label: "Min V2G reserve", val: "20%", icon: "🔋" },
                        { label: "Max session power", val: "350 kW", icon: "⚡" },
                      ].map((l, i, arr) => (
                        <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: C.amberLight, border: `1px solid ${C.amber}30`, borderRadius: 9, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                          <span style={{ fontSize: 12, color: C.textMed, display: "flex", gap: 6, alignItems: "center" }}><span>{l.icon}</span>{l.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>{l.val} 🔒</span>
                        </div>
                      ))}
                    </Card>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════ BEMS CONTROL SYSTEM ════ */}
          {tab==="bems-control" && (() => {
            const isManual = bemsControlMode === "manual";
            const isAi = bemsControlMode === "ai";
            const isHybrid = bemsControlMode === "hybrid";
            const modeColor = isManual ? C.amber : isAi ? C.purple : C.teal;
            const modeDesc = {
              manual: "You control HVAC setpoints, lighting levels, peak limits, and source priority directly. The AI is off.",
              ai: "The AI automatically manages all building systems — HVAC, lighting, demand response, and energy routing.",
              hybrid: "AI handles grid signals, occupancy response, and scheduling. You can override key comfort setpoints below.",
            }[bemsControlMode];

            const sourcePriorityOptions = [
              { id: "solar", icon: "☀️", label: "Solar First", sub: "Prioritise rooftop generation before grid import" },
              { id: "battery", icon: "🔋", label: "Battery First", sub: "Discharge BESS before drawing from the grid" },
              { id: "grid", icon: "⚡", label: "Grid Only", sub: "Standard grid import at current tariff rate" },
            ];
            const aiGoals = [
              { id: "cost", icon: "💰", label: "Minimise Cost", sub: "Off-peak HVAC, demand response, peak shaving" },
              { id: "green", icon: "🌱", label: "Maximise Renewables", sub: "Solar and battery first; avoid carbon grid hours" },
              { id: "comfort", icon: "🏢", label: "Prioritise Comfort", sub: "Maintain perfect climate regardless of cost" },
            ];

            return (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Mode Selector Banner */}
                <Card style={{ padding: "20px 24px", background: `linear-gradient(135deg, ${modeColor}10, ${C.surface})`, border: `1.5px solid ${modeColor}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: modeColor, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Building (BEMS) — Control Mode</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>
                        {isManual ? "🕹️ Manual Control" : isAi ? "🤖 Full AI Control" : "🔀 Hybrid Control"}
                      </div>
                      <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, maxWidth: 480 }}>{modeDesc}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {[
                        { id: "manual", label: "🕹️ Manual", color: C.amber },
                        { id: "ai", label: "🤖 Full AI", color: C.purple },
                        { id: "hybrid", label: "🔀 Hybrid", color: C.teal },
                      ].map(m => (
                        <button key={m.id} onClick={() => setBemsControlMode(m.id)} style={{
                          padding: "10px 18px", borderRadius: 10,
                          border: `1.5px solid ${bemsControlMode === m.id ? m.color : C.border}`,
                          background: bemsControlMode === m.id ? m.color + "15" : C.white,
                          color: bemsControlMode === m.id ? m.color : C.textMed,
                          fontWeight: 700, fontSize: 12, cursor: "pointer", transition: "all 0.15s"
                        }}>{m.label}</button>
                      ))}
                    </div>
                  </div>
                </Card>

                <div className="responsive-grid-2-1" style={{ gap: 16 }}>
                  {/* Left column: controls */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* AI Goal — shown in AI + Hybrid */}
                    {!isManual && (
                      <Card>
                        <SL tourMode={tourMode} tour={{ title: "Building AI Goal", concept: "Optimization priority for the building energy management system.", value: "Guides AI scheduling of HVAC duty cycles, battery dispatch, and solar allocation.", tip: "Choose 'Prioritise Comfort' to maintain strict temperature setpoints regardless of spot tariff prices." }}>🎯 AI Optimisation Goal</SL>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>What should the AI prioritise when managing building systems?</div>
                        {aiGoals.map(g => (
                          <div key={g.id} onClick={() => setBemsAiGoalControl(g.id)} style={{
                            display: "flex", gap: 12, padding: "12px", borderRadius: 12, cursor: "pointer",
                            border: `1.5px solid ${bemsAiGoalControl === g.id ? C.teal : C.border}`,
                            background: bemsAiGoalControl === g.id ? C.tealLight : "none",
                            marginBottom: 8, transition: "all 0.15s"
                          }}>
                            <span style={{ fontSize: 22 }}>{g.icon}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: bemsAiGoalControl === g.id ? C.teal : C.text }}>{g.label}</div>
                              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{g.sub}</div>
                            </div>
                            {bemsAiGoalControl === g.id && <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.white, flexShrink: 0, marginTop: 2 }}>✓</div>}
                          </div>
                        ))}

                        {/* AI automation toggles */}
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: 1, marginBottom: 10 }}>AI AUTOMATION RULES</div>
                          {[
                            { label: "Occupancy-Based Response", sub: "Dim lights & adjust HVAC in vacant zones", state: bemsOccupancyResp, set: () => setBemsOccupancyResp(v => !v) },
                            { label: "Demand Response", sub: "Shed load when grid sends DR signal", state: bemsDemandResp, set: () => setBemsDemandResp(v => !v) },
                          ].map((s, i) => (
                            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i === 0 ? `1px solid ${C.border}` : "none" }}>
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</div>
                                <div style={{ fontSize: 10, color: C.textMuted }}>{s.sub}</div>
                              </div>
                              <Toggle on={s.state} onToggle={s.set} />
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Source Priority */}
                    <Card>
                      <SL tourMode={tourMode} tour={{ title: "Building Energy Source", concept: "Prioritize rooftop solar, stored battery energy, or utility grid import.", value: "Saves building operational expenses by maximizing behind-the-meter renewable consumption.", tip: "Set to 'Battery First' to discharge site BESS during peak tariff hours." }}>⚡ Energy Source Priority</SL>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 12 }}>
                        {isAi ? "AI selects optimal energy source automatically based on your goal and live pricing." : "Choose which energy source powers building systems first."}
                      </div>
                      {sourcePriorityOptions.map(s => (
                        <div key={s.id} onClick={() => !isAi && setBemsSourcePriority(s.id)} style={{
                          display: "flex", gap: 12, padding: "12px", borderRadius: 12,
                          cursor: isAi ? "not-allowed" : "pointer",
                          border: `1.5px solid ${bemsSourcePriority === s.id ? C.amber : C.border}`,
                          background: bemsSourcePriority === s.id ? C.amberLight : "none",
                          marginBottom: 8, opacity: isAi ? 0.5 : 1, transition: "all 0.15s"
                        }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: bemsSourcePriority === s.id ? C.amber : C.text }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{s.sub}</div>
                          </div>
                          {bemsSourcePriority === s.id && <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.amber, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: C.white, flexShrink: 0, marginTop: 2 }}>✓</div>}
                        </div>
                      ))}
                    </Card>

                    {/* Manual / Hybrid sliders */}
                    {!isAi && (
                      <Card>
                        <SL tourMode={tourMode} tour={{ title: "BEMS Manual Overrides", concept: "Direct controls for building HVAC setpoint temperature, global light output, and peak power cap.", value: "Allows facilities managers to override automated AI modes during occupancy events or extreme weather.", tip: "Use the Peak Demand Cap slider to limit total building draw from the utility grid." }}>{isHybrid ? "🔀 Hybrid Overrides" : "🕹️ Manual Controls"}</SL>
                        {isHybrid && <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14, padding: "8px 10px", background: C.tealLight, borderRadius: 9, border: `1px solid ${C.teal}30` }}>AI handles occupancy, grid signals, and scheduling. Adjust comfort setpoints below to override.</div>}

                        {/* HVAC Setpoint */}
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>🌡️ Building HVAC Setpoint</span>
                              <TourHelper tourMode={tourMode} title="HVAC Setpoint" concept="Target indoor temperature setpoint for building HVAC units." value="Allows comfort regulation while avoiding peak electrical load spikes." tip="Set between 16°C (max cool) and 30°C (max heat) as needed." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.accent }}>{bemsHvacSetpoint}°C</span>
                          </div>
                          <input type="range" min={16} max={30} value={bemsHvacSetpoint} onChange={e => setBemsHvacSetpoint(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>16°C (max cool)</span><span>30°C (max heat)</span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 11, color: bemsHvacSetpoint <= 22 ? C.green : bemsHvacSetpoint <= 25 ? C.amber : C.red, fontWeight: 600 }}>
                            {bemsHvacSetpoint <= 22 ? "✅ Energy-efficient range" : bemsHvacSetpoint <= 25 ? "⚡ Moderate energy use" : "⚠ High cooling/heating demand — consider adjusting"}
                          </div>
                        </div>

                        {/* Lighting Level */}
                        <div style={{ marginBottom: 18 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>💡 Global Lighting Level</span>
                              <TourHelper tourMode={tourMode} title="Lighting Level" concept="Global brightness scale for building interior lighting zones." value="Saves massive amounts of energy via daylight harvesting and occupancy dimming." tip="Slide down to dim lights globally during bright sunny afternoons." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{bemsLightingLevel}%</span>
                          </div>
                          <input type="range" min={0} max={100} value={bemsLightingLevel} onChange={e => setBemsLightingLevel(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>0% (off)</span><span>100% (full brightness)</span>
                          </div>
                        </div>

                        {/* Peak Cap */}
                        <div style={{ marginBottom: 6 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span>🛑 Peak Demand Cap</span>
                              <TourHelper tourMode={tourMode} title="Peak Demand Cap" concept="The maximum power limit in kW permitted to be drawn from the utility grid." value="Protects the facility from expensive peak-demand charges by shed-billing building loads." tip="Set a strict limit (e.g. 150 kW) to force the AI to aggressively load-shed." />
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: C.red }}>{bemsPeakCap} kW</span>
                          </div>
                          <input type="range" min={100} max={350} value={bemsPeakCap} onChange={e => setBemsPeakCap(+e.target.value)} style={{ width: "100%" }} />
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, fontSize: 10, color: C.textMuted }}>
                            <span>100 kW (aggressive)</span><span>350 kW (relaxed)</span>
                          </div>
                          <div style={{ marginTop: 6, fontSize: 11, color: bemsPeakCap < 180 ? C.red : bemsPeakCap < 250 ? C.amber : C.green, fontWeight: 600 }}>
                            {bemsPeakCap < 180 ? "⚠ Strict cap — shedding will trigger frequently" : bemsPeakCap < 250 ? "✅ Balanced — good for demand charge savings" : "💡 Relaxed — minimal shedding, higher potential bills"}
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Right column: status + log */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Live Status */}
                    <Card>
                      <SL tourMode={tourMode} tour={{ title: "Live BEMS Status", concept: "Real-time summary of the active building setpoints and optimization states.", value: "Provides a single pane of glass for building operational state.", tip: "Observe the HVAC Setpoint and Lighting level updates dynamically as sliders are moved." }}>📊 Live BEMS Status</SL>
                      {[
                        { label: "Control Mode", val: isManual ? "Manual" : isAi ? "Full AI" : "Hybrid", color: modeColor },
                        { label: "Active Source", val: bemsSourcePriority === "solar" ? "☀️ Solar" : bemsSourcePriority === "battery" ? "🔋 Battery" : "⚡ Grid", color: bemsSourcePriority === "solar" ? C.amber : bemsSourcePriority === "battery" ? C.green : C.accent },
                        { label: "HVAC Setpoint", val: isAi ? "AI-managed" : `${bemsHvacSetpoint}°C`, color: C.accent },
                        { label: "Lighting Level", val: isAi ? "AI-managed" : `${bemsLightingLevel}%`, color: C.green },
                        { label: "Peak Cap", val: isAi ? "AI-managed" : `${bemsPeakCap} kW`, color: C.red },
                        { label: "AI Goal", val: isManual ? "Off" : aiGoals.find(g => g.id === bemsAiGoalControl)?.label, color: isManual ? C.textMuted : C.teal },
                        { label: "Occupancy Response", val: isManual ? "Off" : bemsOccupancyResp ? "Enabled" : "Disabled", color: (!isManual && bemsOccupancyResp) ? C.green : C.textMuted },
                      ].map((r, i, arr) => (
                        <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                          <span style={{ fontSize: 12, color: C.textMed }}>{r.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.val}</span>
                        </div>
                      ))}
                    </Card>

                    {/* AI Log */}
                    {!isManual && (
                      <Card>
                        <SL>🤖 Recent AI Actions</SL>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Automated building management decisions with full reasoning.</div>
                        {bemsAiLog.map((e, i) => (
                          <div key={i} style={{ padding: "10px 0", borderBottom: i < bemsAiLog.length - 1 ? `1px solid ${C.border}` : "none" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{e.action}</span>
                              <span style={{ fontSize: 10, color: C.textMuted, whiteSpace: "nowrap", marginLeft: 8 }}>{e.time}</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>💬 {e.reason}</div>
                          </div>
                        ))}
                      </Card>
                    )}

                    {isManual && (
                      <Card style={{ background: C.amberLight, border: `1px solid ${C.amber}40` }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, marginBottom: 6 }}>🕹️ Full Manual Active</div>
                        <div style={{ fontSize: 12, color: C.textMed, lineHeight: 1.6 }}>
                          All BEMS automation is off. HVAC, lighting, and peak shedding follow only your manual setpoints. No occupancy-based dimming, demand response, or AI scheduling will occur.
                        </div>
                        <div style={{ marginTop: 12, fontSize: 11, color: C.amber, fontWeight: 600 }}>
                          Tip: Switch to Hybrid mode to keep your setpoints but let AI handle occupancy response and grid signals.
                        </div>
                      </Card>
                    )}

                    {/* Safety locks */}
                    <Card>
                      <SL>🔒 Safety Limits (Locked)</SL>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 10 }}>Hard limits enforced in all modes — AI cannot override these.</div>
                      {[
                        { label: "Min indoor temp (occupied)", val: "16°C", icon: "🌡" },
                        { label: "Max indoor temp (occupied)", val: "30°C", icon: "🌡" },
                        { label: "Max HVAC compressor load", val: "100%", icon: "❄️" },
                        { label: "Min emergency lighting", val: "10%", icon: "💡" },
                      ].map((l, i, arr) => (
                        <div key={l.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: C.amberLight, border: `1px solid ${C.amber}30`, borderRadius: 9, marginBottom: i < arr.length - 1 ? 6 : 0 }}>
                          <span style={{ fontSize: 12, color: C.textMed, display: "flex", gap: 6, alignItems: "center" }}><span>{l.icon}</span>{l.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: C.amber }}>{l.val} 🔒</span>
                        </div>
                      ))}
                    </Card>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ════ CUSTOMER DASHBOARD ════ */}
          
          {/* Default fallback */}
          {![
            "devices", "organizations", "users", "gateways",
            "ev-live", "ev-stats", "ev-energy", "ev-v2g", "ev-ailog", "ev-fleet", "ev-profile", "ems-control",
            "bems-overview", "bems-hvac", "bems-lighting", "bems-meters", "bems-coopt", "bems-control"
          ].includes(tab) && (
            <div style={{ padding: 20, textAlign: 'center', color: C.textMuted }}>
              <h3>Select a sub-tab under Energy Management to view dashboard</h3>
            </div>
          )}
      </div>
      );
    }
    