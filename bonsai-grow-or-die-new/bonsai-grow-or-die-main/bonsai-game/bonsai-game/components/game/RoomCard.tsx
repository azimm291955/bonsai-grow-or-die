"use client";

import { useGameStore } from "@/store/useGameStore";
import {
  getRoomUpgradeTier,
  getVegDaysForRoom,
  getFlowerDaysForRoom,
  getRotQuality,
  getRotSpeedMultiplierForRoom,
  getYieldMultiplierForRoom,
  getPriceMultiplierForRoom,
  formatCash,
} from "@/lib/helpers";
import { UPGRADE_TRACKS, BASE_YIELD_PER_HARVEST, ROOM_COSTS } from "@/lib/constants";
import type { Room } from "@/lib/types";

interface RoomCardProps {
  room: Room;
  roomIndex: number;
}

// ─── Plant SVGs (preserved exactly from original) ─────────────────────────

function VegPlant({ room, upgrades, roomIndex }: { room: Room; upgrades: any; roomIndex: number }) {
  const w = 90, h = 82;
  const growPct = Math.min(room.status === "ready_to_flip" ? 1 : room.daysGrown / getVegDaysForRoom(upgrades, roomIndex), 1);
  const stemH = 8 + growPct * 38;
  const leafPairs = Math.floor(growPct * 5);
  const potY = h - 12;
  const stemBottom = potY - 3;
  const stemTop = stemBottom - stemH;
  const gr = Math.round(180 - growPct * 50);
  const gg = Math.round(220 - growPct * 40);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M${w/2-12},${potY-2} L${w/2-10},${potY+8} L${w/2+10},${potY+8} L${w/2+12},${potY-2}Z`} fill="#5D4037"/>
      <rect x={w/2-13} y={potY-5} width={26} height={4} rx={1.5} fill="#6D4C41"/>
      <ellipse cx={w/2} cy={potY-1} rx={10} ry={2.5} fill="#3E2723"/>
      <line x1={w/2} y1={stemBottom} x2={w/2} y2={stemTop} stroke={`rgb(80,${gr-20},50)`} strokeWidth={1.5 + growPct * 1.5} strokeLinecap="round"/>
      {Array.from({ length: leafPairs }).map((_, li) => {
        const pairPct = (li + 1) / (leafPairs + 1);
        const leafY = stemBottom - stemH * pairPct;
        const maturity = pairPct * growPct;
        const fingers = maturity > 0.6 ? 5 : maturity > 0.3 ? 3 : 1;
        const leafLen = 6 + maturity * 14;
        const leafG = Math.round(gg - li * 8);
        const leafR = Math.round(60 + li * 10);

        return ([-1, 1] as const).map(side => {
          const baseX = w/2;
          const tipX = baseX + side * leafLen;
          const midX = baseX + side * leafLen * 0.5;

          if (fingers === 1) {
            return (
              <path key={`${li}-${side}`}
                d={`M${baseX},${leafY} Q${midX},${leafY - 4} ${tipX},${leafY - 2} Q${midX},${leafY + 2} ${baseX},${leafY}`}
                fill={`rgba(${leafR},${leafG},55,0.85)`} stroke={`rgba(${leafR-20},${leafG-30},40,0.5)`} strokeWidth="0.3"/>
            );
          }
          const paths = [];
          for (let f = 0; f < fingers; f++) {
            const fPct = f / (fingers - 1);
            const angle = -30 + fPct * 60;
            const fLen = f === Math.floor(fingers/2) ? leafLen : leafLen * (0.5 + 0.3 * (1 - Math.abs(fPct - 0.5) * 2));
            const rad = (angle * Math.PI) / 180;
            const fx = baseX + side * Math.cos(rad) * fLen;
            const fy = leafY - Math.sin(rad) * fLen * 0.6;
            const cx1 = baseX + side * Math.cos(rad) * fLen * 0.4;
            const cy1 = leafY - Math.sin(rad) * fLen * 0.5 - 1.5;
            const cx2 = baseX + side * Math.cos(rad) * fLen * 0.4;
            const cy2 = leafY - Math.sin(rad) * fLen * 0.2 + 1.5;
            const fOpacity = 0.7 + maturity * 0.3;
            paths.push(
              <path key={`${li}-${side}-${f}`}
                d={`M${baseX},${leafY} Q${cx1},${cy1} ${fx},${fy} Q${cx2},${cy2} ${baseX},${leafY}`}
                fill={`rgba(${leafR + f * 5},${leafG + f * 3},${50 + f * 5},${fOpacity})`}
                stroke={`rgba(${leafR - 10},${leafG - 20},35,0.3)`} strokeWidth="0.25"/>
            );
            if (f === Math.floor(fingers/2)) {
              paths.push(
                <line key={`v-${li}-${side}`} x1={baseX} y1={leafY}
                  x2={fx * 0.8 + baseX * 0.2} y2={fy * 0.8 + leafY * 0.2}
                  stroke={`rgba(${leafR - 20},${leafG - 30},30,0.3)`} strokeWidth="0.3"/>
              );
            }
          }
          return <g key={`${li}-${side}`}>{paths}</g>;
        });
      })}
      {growPct > 0.05 && (
        <g>
          <ellipse cx={w/2} cy={stemTop - 1.5} rx={2 + growPct * 3} ry={1.5 + growPct * 2.5} fill={`rgba(130,${gg + 20},80,0.9)`}/>
          {growPct > 0.3 && <ellipse cx={w/2} cy={stemTop - 3} rx={1.5 + growPct * 2} ry={1 + growPct * 1.5} fill={`rgba(160,${gg + 30},100,0.7)`}/>}
        </g>
      )}
    </svg>
  );
}

function FlowerPlant({ room, upgrades, roomIndex }: { room: Room; upgrades: any; roomIndex: number }) {
  const w = 90, h = 82;
  const days = room.status === "ready_to_harvest" ? getFlowerDaysForRoom(upgrades, roomIndex) : room.daysGrown;
  const stretchPct = Math.min(days / 16, 1);
  const nugPct = days > 16 ? Math.min((days - 16) / 48, 1) : 0;
  const stemH = 22 + stretchPct * 24;
  const potY = h - 12;
  const stemBottom = potY - 3;
  const stemTop = stemBottom - stemH;
  const purpleShift = nugPct * 0.7;

  const drawBud = (bx: number, by: number, size: number, opacity: number) => {
    const layers = Math.max(2, Math.round(size / 2));
    const elements: React.ReactNode[] = [];
    for (let l = 0; l < layers; l++) {
      const lPct = l / layers;
      const lx = bx + (Math.sin(l * 2.1) * size * 0.15);
      const ly = by + lPct * size * 0.6 - size * 0.3;
      const lr = size * (0.6 + lPct * 0.4);
      const lh = size * (0.5 + lPct * 0.3);
      const pr = Math.round(90 + purpleShift * 70 + l * 10);
      const pg = Math.round(50 - purpleShift * 20 + l * 5);
      const pb = Math.round(100 + purpleShift * 80 + l * 15);
      elements.push(<ellipse key={`b-${l}`} cx={lx} cy={ly} rx={lr} ry={lh} fill={`rgba(${pr},${pg},${pb},${opacity * (0.5 + lPct * 0.3)})`}/>);
    }
    if (nugPct > 0.2) {
      const pistilCount = Math.min(Math.floor(nugPct * 5), 4);
      for (let p = 0; p < pistilCount; p++) {
        const angle = (p / pistilCount) * Math.PI - Math.PI / 2;
        const px1 = bx + Math.cos(angle) * size * 0.3;
        const py1 = by - size * 0.4 + Math.sin(angle) * size * 0.2;
        const px2 = bx + Math.cos(angle) * size * 0.8;
        const py2 = by - size * 0.6 + Math.sin(angle) * size * 0.3;
        const pistilAge = nugPct > 0.7 ? "#EF6C00" : nugPct > 0.4 ? "#FF8F00" : "#FFB74D";
        elements.push(<path key={`p-${p}`} d={`M${px1},${py1} Q${(px1+px2)/2},${py2 - 1.5} ${px2},${py2}`} fill="none" stroke={pistilAge} strokeWidth={0.4 + nugPct * 0.2} strokeLinecap="round"/>);
      }
    }
    if (nugPct > 0.5) {
      const trichCount = Math.floor((nugPct - 0.5) * 8);
      for (let t = 0; t < trichCount; t++) {
        const tx = bx + (Math.sin(t * 3.7) * size * 0.5);
        const ty = by + (Math.cos(t * 2.3) * size * 0.4) - size * 0.2;
        elements.push(<circle key={`t-${t}`} cx={tx} cy={ty} r={0.4 + nugPct * 0.3} fill="#fff" opacity={0.3 + nugPct * 0.3}/>);
      }
    }
    return <g key={`bud-${bx}-${by}`}>{elements}</g>;
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {nugPct > 0.3 && <ellipse cx={w/2} cy={stemTop + 2} rx={8 + nugPct * 6} ry={3 + nugPct * 2} fill={`rgba(156,39,176,${nugPct * 0.08})`}/>}
      <path d={`M${w/2-12},${potY-2} L${w/2-10},${potY+8} L${w/2+10},${potY+8} L${w/2+12},${potY-2}Z`} fill="#5D4037"/>
      <rect x={w/2-13} y={potY-5} width={26} height={4} rx={1.5} fill="#6D4C41"/>
      <ellipse cx={w/2} cy={potY-1} rx={10} ry={2.5} fill="#3E2723"/>
      <line x1={w/2} y1={stemBottom} x2={w/2} y2={stemTop} stroke="#2E7D32" strokeWidth={3} strokeLinecap="round"/>
      {([0.2, 0.4, 0.6, 0.8] as const).map((pos, bi) => {
        const branchY = stemBottom - stemH * pos;
        const side = bi % 2 === 0 ? -1 : 1;
        const bLen = 10 + pos * 8;
        const endX = w/2 + side * bLen;
        const endY = branchY - 4;
        const leafFade = nugPct > 0.6 ? (nugPct - 0.6) * 2.5 : 0;
        const leafGreen = Math.round(160 - leafFade * 80);
        const leafRed = Math.round(50 + leafFade * 80);
        return (
          <g key={bi}>
            <line x1={w/2} y1={branchY} x2={endX} y2={endY} stroke="#558B2F" strokeWidth={1.5} strokeLinecap="round"/>
            <path d={`M${endX},${endY} Q${endX+side*6},${endY-7} ${endX+side*3},${endY} Q${endX+side*6},${endY+2} ${endX},${endY}`} fill={`rgba(${leafRed},${leafGreen},50,0.6)`} stroke={`rgba(${leafRed-10},${leafGreen-20},35,0.3)`} strokeWidth="0.3"/>
            <path d={`M${endX},${endY} Q${endX+side*4},${endY-9} ${endX+side*1.5},${endY-1}`} fill={`rgba(${leafRed+10},${leafGreen+5},55,0.4)`} stroke="none"/>
            <path d={`M${endX},${endY} Q${endX+side*5},${endY-3} ${endX+side*4},${endY+3}`} fill={`rgba(${leafRed},${leafGreen-10},45,0.4)`} stroke="none"/>
            {nugPct > 0 && drawBud(endX + side * 1, endY - 2, 3 + nugPct * 5, 0.8)}
          </g>
        );
      })}
      {([0.08] as const).map((pos, li) => {
        const ly = stemBottom - stemH * pos;
        const fade = nugPct > 0.4 ? 0.4 : 0.7;
        return ([-1, 1] as const).map(side => (
          <path key={`low-${li}-${side}`} d={`M${w/2},${ly} Q${w/2+side*10},${ly-5} ${w/2+side*8},${ly} Q${w/2+side*10},${ly+3} ${w/2},${ly}`} fill={nugPct > 0.5 ? `rgba(130,120,30,${fade})` : `rgba(50,130,50,${fade})`} stroke="none"/>
        ));
      })}
      {nugPct > 0 ? drawBud(w/2, stemTop - 1, 4 + nugPct * 9, 0.9) : (
        <g>
          <ellipse cx={w/2} cy={stemTop - 1} rx={3 + stretchPct * 3} ry={2.5 + stretchPct * 2} fill="#7CB342" opacity={0.8}/>
          {stretchPct > 0.5 && (
            <g>
              <line x1={w/2 - 1} y1={stemTop - 3} x2={w/2 - 3} y2={stemTop - 6} stroke="#E8F5E9" strokeWidth="0.5" strokeLinecap="round"/>
              <line x1={w/2 + 1} y1={stemTop - 3} x2={w/2 + 3} y2={stemTop - 6} stroke="#E8F5E9" strokeWidth="0.5" strokeLinecap="round"/>
              <circle cx={w/2 - 3} cy={stemTop - 6} r="0.5" fill="#E8F5E9"/>
              <circle cx={w/2 + 3} cy={stemTop - 6} r="0.5" fill="#E8F5E9"/>
            </g>
          )}
        </g>
      )}
      {nugPct > 0.3 && ([-1, 1] as const).map(side => (
        <path key={`sugar-${side}`} d={`M${w/2},${stemTop+2} Q${w/2+side*5},${stemTop-6} ${w/2+side*3},${stemTop-1}`} fill={`rgba(80,150,50,${0.3 + nugPct * 0.2})`} stroke="none"/>
      ))}
    </svg>
  );
}

// ─── RoomCard ──────────────────────────────────────────────────────────────

export default function RoomCard({ room, roomIndex }: RoomCardProps) {
  // Only subscribe to upgrades — room data comes from props
  const upgrades = useGameStore((s) => s.state?.upgrades);
  const setShowRoomBuy = useGameStore((s) => s.setShowRoomBuy);
  const setSelectedRoom = useGameStore((s) => s.setSelectedRoom);
  if (!upgrades) return null;

  const i = roomIndex;
  const isVeg = room.type === "veg";
  const isFlower = room.type === "flower";
  const targetDays = isVeg ? getVegDaysForRoom(upgrades, i) : getFlowerDaysForRoom(upgrades, i);
  const progress = room.status === "growing"
    ? Math.min(room.daysGrown / targetDays, 1)
    : (room.status === "ready_to_flip" || room.status === "ready_to_harvest") ? 1 : 0;

  const roomRotQuality = (room.status === "ready_to_flip" || room.status === "ready_to_harvest")
    ? getRotQuality(room.rotDays || 0, getRotSpeedMultiplierForRoom(upgrades, i))
    : 1.0;
  const isRotting = roomRotQuality < 1.0 && roomRotQuality > 0;
  const displayQuality = roomRotQuality >= 1.0 ? 1.0
    : room.status === "ready_to_flip"
      ? Math.max(0.85, 1.0 - (1.0 - roomRotQuality) * 0.45)
      : 1.0 - (1.0 - roomRotQuality) * 0.45;

  // Genetics tier glow
  const geneticsTier = getRoomUpgradeTier(upgrades, "genetics", i);
  const geneticsColors: Record<number, { border: string; bg: string; glow: string }> = {
    1: { border: "rgba(139,195,74,0.75)", bg: "rgba(139,195,74,0.14)", glow: "rgba(139,195,74,0.30)" },
    2: { border: "rgba(180,60,210,0.75)", bg: "rgba(156,39,176,0.14)", glow: "rgba(156,39,176,0.30)" },
    3: { border: "rgba(255,193,7,0.80)", bg: "rgba(255,193,7,0.16)", glow: "rgba(255,193,7,0.35)" },
  };
  const genColor = geneticsColors[geneticsTier] || null;
  let borderColor = genColor ? genColor.border : "rgba(255,255,255,0.06)";
  const cardBg = genColor
    ? `radial-gradient(ellipse at 50% 80%, ${genColor.glow}, ${genColor.bg} 60%, rgba(255,255,255,0.02) 100%)`
    : "rgba(255,255,255,0.02)";

  let glowAnim = "";
  let statusLabel: { text: string; color: string } | null = null;

  if (room.status === "growing") {
    if (!genColor) borderColor = isVeg ? "rgba(139,195,74,0.2)" : "rgba(206,147,216,0.2)";
    glowAnim = isVeg ? "glow-green 3s ease-in-out infinite" : "glow-purple 3s ease-in-out infinite";
  } else if (room.status === "ready_to_flip") {
    if (!genColor) borderColor = isRotting ? `rgba(239,83,80,${0.2 + (1 - roomRotQuality) * 0.4})` : "rgba(255,183,77,0.4)";
    glowAnim = "action-pulse 2s ease-in-out infinite";
    statusLabel = { text: isRotting ? `⚡ FLIP · ${Math.round(displayQuality * 100)}%` : "⚡ FLIP", color: isRotting ? (roomRotQuality < 0.3 ? "#ef5350" : "#FFB74D") : "#FFB74D" };
  } else if (room.status === "ready_to_harvest") {
    if (!genColor) borderColor = isRotting ? `rgba(239,83,80,${0.2 + (1 - roomRotQuality) * 0.4})` : "rgba(255,183,77,0.4)";
    glowAnim = "action-pulse 2s ease-in-out infinite";
    statusLabel = { text: isRotting ? `🌿 HARVEST · ${Math.round(displayQuality * 100)}%` : "🌿 HARVEST", color: isRotting ? (roomRotQuality < 0.3 ? "#ef5350" : "#FFB74D") : "#FFB74D" };
  } else if (room.status === "empty") {
    statusLabel = { text: isFlower ? "Waiting for flip" : "Empty", color: isFlower ? "#5a3a6a" : "#444" };
  }

  // ── LOCKED ROOM ──
  if (!room.unlocked) {
    return (
      <button
        onClick={() => setShowRoomBuy(i)}
        className="bg-white/[0.01] border border-dashed border-white/[0.06] rounded-[14px] px-2.5 py-4 cursor-pointer text-center min-h-[140px] flex flex-col items-center justify-center transition-all duration-300"
        style={{ animation: "lock-breathe 4s ease-in-out infinite" }}
        data-tutorial={i === 1 ? "room-2" : undefined}
        aria-label={`Unlock Room ${i + 1} for ${formatCash(ROOM_COSTS[i])}`}
      >
        <div className="text-[9px] text-[#333] font-semibold tracking-widest mb-2">ROOM {i + 1}</div>
        <div className="text-[22px] mb-2 opacity-30">🔒</div>
        <div className="text-sm text-[#555] font-bold">{formatCash(ROOM_COSTS[i])}</div>
        <div className="text-[9px] text-bonsai-red mt-0.5">+overhead/mo</div>
        <div className="text-[9px] text-[#333] mt-0.5">tap to unlock</div>
      </button>
    );
  }

  // ── UNLOCKED ROOM ──
  const renderPlant = () => {
    if (room.status === "empty") return null;
    if (isVeg && (room.status === "growing" || room.status === "ready_to_flip"))
      return <VegPlant room={room} upgrades={upgrades} roomIndex={i} />;
    if (isFlower && (room.status === "growing" || room.status === "ready_to_harvest"))
      return <FlowerPlant room={room} upgrades={upgrades} roomIndex={i} />;
    return null;
  };

  const trackIcons: [string, string][] = [
    ["lighting", "💡"], ["irrigation", "💧"], ["environmental", "🌡️"],
    ["genetics", "🧬"], ["preroll", "🚬"], ["operations", "👤"],
  ];
  const hasUpgrades = trackIcons.some(([t]) => getRoomUpgradeTier(upgrades, t as keyof typeof UPGRADE_TRACKS, i) > 0);

  return (
    <button
      onClick={() => setSelectedRoom(i)}
      className="rounded-[14px] px-2 pb-3 pt-2.5 cursor-pointer text-center relative min-h-[150px] flex flex-col items-center justify-end transition-all duration-300"
      style={{
        background: cardBg,
        border: `${genColor ? 2 : 1}px solid ${borderColor}`,
        animation: glowAnim || undefined,
        boxShadow: genColor ? `0 0 28px ${genColor.glow}, inset 0 0 20px ${genColor.glow}` : undefined,
      }}
      data-tutorial={i === 0 ? "room-1" : i === 1 ? "room-2" : undefined}
      aria-label={`Room ${i + 1} — ${room.type ?? "empty"} — ${room.status}`}
    >
      {/* Room label + upgrade indicators */}
      <div className="absolute top-2 left-0 right-0 flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-[#444] font-semibold tracking-widest">ROOM {i + 1}</span>
          {room.type && (
            <span className={`text-[8px] font-bold tracking-widest px-1.5 py-px rounded ${
              isVeg ? "text-bonsai-green bg-bonsai-green/10" : "text-bonsai-purple bg-bonsai-purple/10"
            }`}>
              {isVeg ? "VEG" : "FLOWER"}
            </span>
          )}
        </div>
        {hasUpgrades && (
          <div className="flex gap-0.5 items-center">
            {trackIcons.map(([t, icon]) => {
              const tier = getRoomUpgradeTier(upgrades, t as keyof typeof UPGRADE_TRACKS, i);
              if (tier === 0) return null;
              return <span key={t} title={`${t} T${tier}`} className="text-[7px] leading-none opacity-70">{icon}</span>;
            })}
          </div>
        )}
      </div>

      {/* Plant */}
      <div className="mt-2">{renderPlant()}</div>

      {/* Progress bar */}
      {(room.status === "growing" || room.status === "ready_to_flip" || room.status === "ready_to_harvest") && (
        <div className="w-[90%] h-[3px] bg-white/[0.06] rounded-sm mt-1 overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{
              width: `${progress * 100}%`,
              background: (room.status === "ready_to_flip" || room.status === "ready_to_harvest")
                ? (isRotting ? "linear-gradient(90deg,#ef5350,#FFB74D)" : "linear-gradient(90deg,#FFB74D,#FFA726)")
                : isVeg ? "linear-gradient(90deg,#689F38,#8BC34A)" : "linear-gradient(90deg,#9C27B0,#CE93D8)",
              ...(room.status === "ready_to_flip" || room.status === "ready_to_harvest"
                ? { backgroundSize: "200% 100%", animation: "shimmer-bar 2s linear infinite" }
                : {}),
            }}
          />
        </div>
      )}

      {/* Rot quality bar */}
      {isRotting && (
        <div className="w-[90%] h-0.5 bg-bonsai-red/15 rounded-sm mt-0.5 overflow-hidden">
          <div
            className="h-full rounded-sm transition-all duration-500"
            style={{
              width: `${roomRotQuality * 100}%`,
              background: roomRotQuality > 0.5
                ? "linear-gradient(90deg,#8BC34A,#FFB74D)"
                : roomRotQuality > 0.25
                  ? "linear-gradient(90deg,#FFB74D,#FF8F00)"
                  : "linear-gradient(90deg,#ef5350,#c62828)",
            }}
          />
        </div>
      )}

      {/* Status label */}
      {statusLabel && (
        <div className="text-[11px] font-bold mt-1 tracking-wide" style={{ color: statusLabel.color }}>
          {statusLabel.text}
        </div>
      )}
    </button>
  );
}
