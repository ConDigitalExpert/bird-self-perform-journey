/* substation.js
   Generic, illustrative substations for the Bird "From Site to Service" story model.
   No project or vendor design: every part is a plain box or prism built with the same
   helpers buildCampus uses in model.js, so it renders in explore mode and story mode alike.

   import {buildSubstation} from './substation.js';
   const r = buildSubstation({box, pipe, route, frame, C}, {kv: 500, x: -420, z: -310, rot: 0.6,
     extra: {build: 3, storyOnly: true, story: {region: 'energy', appear: 'grid', disc: 'power'}}});

   opts
     kv       500 (large collector substation, about 120 x 78 m) or 230 (campus substation, about 41 x 37 m)
     x, z     world position of the plan centre (ground level, y = 0)
     rot      radians about Y (same convention as the angle option of box). At rot 0 the incoming line is on the
              -x (west) side and the feeders are on the +x (east) side. The 230 kV layout has its buildings on the
              -z (north) side and the line bays and buses on the +z (south) side, so a camera looking north from the
              south sees the line bays first, then the transformer bays with their blast walls, then the buildings.
     scope    scope string for every element (default 'substations')
     extra    options merged into every element, for example {build: 3, storyOnly: true, story: {...}}.
              It may also be a function (component, unit) => options, so that story.order can differ by component.
              Every element gets its own deep copy: arrays and nested objects are never shared between elements or with the caller.
     lines    line bays, that is circuits, 1 or 2 (default 2, like the double circuit transmission line).
              500 kV: two bays on the first diameter. 230 kV: two bays, each with its own breaker and bus (the last transformer
              is fed from the second bus, the others from the first). Always 1 with compact.
     feeders  500 kV only: feeder bays on the collector gantry, 1 to 6 (default 5, one per energy source)
     transformers  230 kV only: 2 or 3 (default 3)
     compact  500 kV only: one diameter, one line bay (single circuit), one transformer bank (three single-phase units
              and a spare), tighter spacing. About 76 x 73 m at scale 1. See README for the footprint at other scales.
     scale    500 kV only: uniform size factor 0.3 to 2 (default 1). Positions, sizes and heights are all multiplied, so the
              equipment shrinks with the yard. Meant for fitting the diorama; footprint and bounds are reported at that scale.
     lineKv   voltage class of the transmission line (default: kv). Sets the disc count and disc size of the dead-end strings on
              the line gantry, so that one voltage shows along the whole line: give both substations and buildInsulatorString
              (for the towers) the same lineKv. The feeder gantry of the 500 kV yard is a 230 kV class gantry and keeps its own strings.
     discs    disc count of the line gantry strings (default discCount(lineKv): 20 at 500 kV, 10 at 230 kV)
     discRadius  disc radius of the line gantry strings in metres (default 0.30 at lineKv 365 and above, 0.21 below)
     ground   false leaves out the gravel yard, roads and trenches (default true)
     fence    false leaves out the perimeter fence and gate (default true)
     fenceStyle  'panel' (solid boxes, translucent in explore mode), 'rails' (posts and three rails, gate leaves as frames) or
              'auto' (default): rails when the elements carry story tags, because story mode has no fence style and draws panels as
              an opaque white wall
     groundDisc  false leaves the story tags of the flat ground details as given. By default, when extra carries a story object,
              the gravel yard, roads and trench covers get story.disc = 'context' and a dark hex (yard: the story ground colour,
              roads and trench covers: the faint grid line colour), so the story renderer draws them as ground and faint lines,
              not as a lighter slab. The explore colour (o.color) is untouched.

   Every element also carries subKv, subComp (component type, a key of COMPONENTS) and subUnit (assembly id) so a
   caller or exporter can group, restyle or label them. Ground details use flat: true, the fence uses fence: true.
   The 230 kV duct bank is the only geometry under y = 0. No grounding grid or bonding mat is modelled (V32).

   Returns
     count         number of elements created
     footprint     {w, d} in metres: plan size of everything built (along the local x axis, west to east, and along z), rounded up to
                   the metre, at the chosen scale. It does not depend on rot.
     lineEntry     [x, y, z] world point, the string tip of the middle phase of the first line bay, where the line conductors terminate
     lineEntries   every phase tip of every line bay (three per bay), lineBays the same grouped by bay
     feederExit    500 kV: the middle feeder bay on the 230 kV collector gantry; 230 kV: the centre of the duct bank mouth below grade (y = -1.7)
     feederPoints  500 kV: one string tip per feeder bay; 230 kV: one point per conduit at the duct bank mouth
     feederExitSurface  230 kV only: the same point at ground level
     transformers  world centre of each transformer; controlBuilding: world point on the control building
     bounds        {min, max} world box of everything built; center: world position of the plan centre
     lineDir, feederDir  world (x, z) unit vectors from the centre toward the line side and the feeder side
     kv            500 or 230 */

export const SUBSTATION_VERSION = 3;   // 3 (6 Oct 2026): surge arresters stand on concrete pads, the feeder arresters are wired to their droppers

/* Component types. col is a key of the C palette or a literal hex. ifc is [IFC4 class, PredefinedType, ObjectType].
   metal and rough feed the glTF materials. */
export const COMPONENTS = {
  'gravel-yard':             {name: 'Gravel yard',                col: '#c9c7ba',  ifc: ['IfcSlab', 'BASESLAB'],                              metal: 0,   rough: 1},
  'access-road':             {name: 'Access road',                col: '#a9b1ab',  ifc: ['IfcSlab', 'BASESLAB'],                              metal: 0,   rough: .95},
  'cable-trench':            {name: 'Cable trench cover',         col: '#98a29b',  ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'CABLE_TRENCH'], metal: 0,   rough: .9},
  'duct-bank':               {name: 'Duct bank',                  col: 'concrete', ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'DUCT_BANK'],   metal: 0,   rough: .9},
  'foundation':              {name: 'Equipment foundation',       col: 'concrete', ifc: ['IfcFooting', 'PAD_FOOTING'],                         metal: 0,   rough: .9},
  'fence':                   {name: 'Perimeter fence',            col: 'steel',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'PERIMETER_FENCE'], metal: .6, rough: .6},
  'gate':                    {name: 'Gate',                       col: 'steel',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'GATE'],        metal: .6,  rough: .6},
  'steel-structure':         {name: 'Gantry and support steel',   col: 'steel',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'STEEL_STRUCTURE'], metal: .7, rough: .55},
  'lightning-mast':          {name: 'Lightning mast',             col: 'steel',    ifc: ['IfcColumn', 'COLUMN'],                               metal: .7,  rough: .5},
  'shield-wire':             {name: 'Shield wire',                col: 'metal',    ifc: ['IfcCableSegment', 'CONDUCTORSEGMENT'],               metal: .9,  rough: .4},
  'insulator-string':        {name: 'Insulator string',           col: 'white',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'INSULATOR_STRING'], metal: 0, rough: .25},
  'post-insulator':          {name: 'Post insulator',             col: 'white',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'POST_INSULATOR'], metal: 0, rough: .25},
  'bushing':                 {name: 'Bushing',                    col: 'white',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'BUSHING'],     metal: 0,   rough: .25},
  'bus-tube':                {name: 'Rigid tubular bus',          col: 'metal',    ifc: ['IfcCableSegment', 'BUSBARSEGMENT'],                  metal: .9,  rough: .35},
  'conductor':               {name: 'Conductor and jumper',       col: 'metal',    ifc: ['IfcCableSegment', 'CONDUCTORSEGMENT'],               metal: .9,  rough: .4},
  'circuit-breaker':         {name: 'SF6 circuit breaker',        col: 'steel',    ifc: ['IfcProtectiveDevice', 'CIRCUITBREAKER'],             metal: .5,  rough: .5},
  'disconnect-switch':       {name: 'Disconnect switch',          col: 'metal',    ifc: ['IfcSwitchingDevice', 'SWITCHDISCONNECTOR'],          metal: .8,  rough: .4},
  'current-transformer':     {name: 'Current transformer',        col: 'steel',    ifc: ['IfcTransformer', 'CURRENT'],                         metal: .5,  rough: .5},
  'voltage-transformer':     {name: 'Voltage transformer (CVT)',  col: 'steel',    ifc: ['IfcTransformer', 'VOLTAGE'],                         metal: .5,  rough: .5},
  'surge-arrester':          {name: 'Surge arrester',             col: 'white',    ifc: ['IfcProtectiveDevice', 'VARISTOR'],                   metal: 0,   rough: .3},
  'power-transformer':       {name: 'Power transformer',          col: 'green',    ifc: ['IfcTransformer', 'USERDEFINED', 'POWER_TRANSFORMER'], metal: .3, rough: .55},
  'transformer-radiator':    {name: 'Transformer radiator',       col: 'steel',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'TRANSFORMER_RADIATOR'], metal: .4, rough: .6},
  'transformer-conservator': {name: 'Transformer conservator',    col: 'green',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'TRANSFORMER_CONSERVATOR'], metal: .3, rough: .55},
  'fire-wall':               {name: 'Concrete fire and blast wall', col: '#d5dbd5', ifc: ['IfcWall', 'SOLIDWALL'],                            metal: 0,   rough: .95},
  'control-building':        {name: 'Control building',           col: 'white',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'CONTROL_BUILDING'], metal: 0, rough: .85},
  'switchgear-building':     {name: 'MV switchgear building',     col: 'white',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'MV_SWITCHGEAR_BUILDING'], metal: 0, rough: .85},
  'relay-kiosk':             {name: 'Relay kiosk',                col: 'metal',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'RELAY_KIOSK'], metal: .3,  rough: .6},
  'building-roof':           {name: 'Building roof',              col: 'concrete', ifc: ['IfcSlab', 'ROOF'],                                   metal: 0,   rough: .9},
  'building-opening':        {name: 'Building door',              col: 'black',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'DOOR'],        metal: .3,  rough: .6},
  'hvac-unit':               {name: 'HVAC unit',                  col: 'metal',    ifc: ['IfcBuildingElementProxy', 'ELEMENT', 'HVAC_UNIT'],   metal: .5,  rough: .5}
};

/* Story mode hex of the flat ground details (the story ground is #161918, its faint grid lines #1e2220). */
const STORY_GROUND_HEX = {'gravel-yard': '#161918', 'access-road': '#1e2220', 'cable-trench': '#1e2220'};

/* Unit id prefix (the part of subUnit before the first hyphen) to the component type that decides the IFC class
   of the whole assembly. */
export const UNIT_KINDS = {
  YARD: 'gravel-yard', ROAD: 'access-road', TRENCH: 'cable-trench', DUCT: 'duct-bank',
  FENCE: 'fence', GATE: 'gate', GANTRY: 'steel-structure', MAST: 'lightning-mast', SW: 'shield-wire',
  STR: 'insulator-string', BUS: 'bus-tube', TAP: 'bus-tube', LINK: 'conductor',
  CB: 'circuit-breaker', DS: 'disconnect-switch', CT: 'current-transformer', CVT: 'voltage-transformer',
  ARR: 'surge-arrester', TX: 'power-transformer', FW: 'fire-wall',
  CTRL: 'control-building', MVSG: 'switchgear-building', KIOSK: 'relay-kiosk'
};

/* ---------------------------------------------------------------------------------------------------
   Insulator strings. The disc count scales with voltage (V08): about 20 discs at 500 kV, 10 at 230 kV.
--------------------------------------------------------------------------------------------------- */
/* Disc count by voltage class, stepping up with the voltage so a higher class always shows more discs:
   765 kV 26, 500 kV 20 (400 kV 17), 345 kV 15, 230 kV 10 (also 161 kV), then about one per 14 kV down to 4. */
export function discCount(kv) {
  kv = +kv || 115;
  return kv >= 700 ? 26 : kv >= 450 ? 20 : kv >= 380 ? 17 : kv >= 300 ? 15 : kv >= 161 ? 10 : Math.max(4, Math.round(kv / 14));
}

/* Deep copy of plain data (arrays and plain objects). Anything else is returned as it is. Every element gets its own copy of
   the caller's options, so editing one element's story.reprise (or any array or nested object) never touches another element
   or the caller's object. */
function clone(v) {
  if (Array.isArray(v)) return v.map(clone);
  if (v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype) { const o = {}; for (const k of Object.keys(v)) o[k] = clone(v[k]); return o; }
  return v;
}
const cloneOpts = ex => { const o = {}; for (const k of Object.keys(ex)) o[k] = clone(ex[k]); return o; };

/* Rod and disc segments of one string from a to b (any coordinate system). m0 and m1 are the end margins. */
function stringSegments(a, b, n, Rd, m0, m1) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1, u = d.map(v => v / L);
  const pitch = (L - m0 - m1) / n, th = Math.min(.075, pitch * .5), at = t => a.map((v, i) => v + u[i] * t);
  const segs = [{a: at(Math.min(.1, L * .05)), b: b, r: .045, sides: 6}];
  for (let i = 0; i < n; i++) { const c = m0 + (i + .5) * pitch; segs.push({a: at(c - th / 2), b: at(c + th / 2), r: Rd, sides: 8}); }
  return segs;
}

/* Optional helper for the transmission towers: one insulator string from point a to point b (world coordinates),
   with the disc count and disc size taken from the voltage. Same helpers and tags as buildSubstation.
   buildInsulatorString({box, pipe, route, frame, C}, {kv: 500, from: [x, y, z], to: [x, y, z], scope: 'powerlines', extra: {...}})
   returns {count, tip: to, discs}. */
export function buildInsulatorString(api, opts = {}) {
  const kv = +opts.kv || 500, n = Math.max(2, (opts.discs | 0) || discCount(kv)), a = opts.from, b = opts.to, k = Math.max(.3, +opts.scale || 1);
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), m0 = Math.min(.45, L * .12), m1 = Math.min(.3, L * .08);
  const pitch = (L - m0 - m1) / n, Rd = Math.min((+opts.discRadius || (kv >= 365 ? .30 : .21)) * k, pitch * 1.9);
  const col = (api.C && api.C.white) || '#dce4df';
  const ex = typeof opts.extra === 'function' ? (opts.extra('insulator-string', opts.unit || 'STR') || {}) : (opts.extra || {});
  let count = 0;
  for (const s of stringSegments(a, b, n, Rd, m0, m1)) {
    const o = Object.assign(cloneOpts(ex), {subKv: kv, subComp: 'insulator-string', subUnit: opts.unit || 'STR', sides: s.sides});
    api.pipe(opts.scope || 'powerlines', s.a, s.b, s.sides === 6 ? s.r * k : s.r, col, o); count++;
  }
  return {count, tip: b.slice(), discs: n};
}

export function buildSubstation(api, opts = {}) {
  const kv = (+opts.kv || 500) >= 365 ? 500 : 230;
  const HV = kv === 500;
  const S = HV ? 1 : 0.72;                       // equipment scale against the 500 kV dimensions
  const MZ = !HV;                                // the 230 kV layout is mirrored in z (buildings on the north side)
  const K = HV ? Math.max(.3, Math.min(2, +opts.scale || 1)) : 1;   // uniform size of the whole layout (500 kV only)
  const scope = opts.scope || 'substations';
  const rot = +opts.rot || 0, ox = +opts.x || 0, oz = +opts.z || 0;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const C = Object.assign({green: '#00703c', steel: '#819590', metal: '#bfc9c5', concrete: '#bdc6bd', black: '#354b41', white: '#dce4df'}, api.C);
  const extra = opts.extra;
  const withGround = opts.ground !== false, withFence = opts.fence !== false;
  // fence style: 'panel' (solid boxes), 'rails' (posts and rails), 'auto' (default): rails when the elements carry story tags
  const probe = typeof extra === 'function' ? extra('fence', 'FENCE-N0') : extra;
  const railFence = opts.fenceStyle === 'rails' || (opts.fenceStyle !== 'panel' && !!(probe && probe.story));
  // dead-end strings on the line gantry take their disc count and size from the voltage class of the line (default: the station's own)
  const lineKv = +opts.lineKv || kv, hvLine = lineKv >= 365;
  const discsL = Math.max(4, (opts.discs | 0) || discCount(lineKv)), RdL = +opts.discRadius || (hvLine ? .30 : .21), pitchL = hvLine ? .17 : .15;
  let count = 0, kvNow = kv;                    // kvNow is the voltage class tagged on new elements (the 500 kV yard has a 230 kV collector side)
  let X0 = 0, Z0 = 0;                            // local point that lands on (x, z): the footprint centre, set by the layout
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  const ext = {x0: 1e9, x1: -1e9, z0: 1e9, z1: -1e9};   // plan extent of everything built, in the local frame (before scale)
  const keep = [];                               // local footprints of pads, buildings and walls, so supports can avoid them
  const KEEP = new Set(['foundation', 'relay-kiosk', 'control-building', 'switchgear-building', 'fire-wall']);
  const lin = [];                                // local conductor and tube segments, so supports can avoid them
  const LIN = new Set(['conductor', 'bus-tube']);

  /* ---------- primitives: every point goes through the local frame, then scale, rot and translation ---------- */
  const grow = (p, r) => { for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], p[i] - r); hi[i] = Math.max(hi[i], p[i] + r); } };
  const widen = (x0, x1, z0, z1) => { ext.x0 = Math.min(ext.x0, x0); ext.x1 = Math.max(ext.x1, x1); ext.z0 = Math.min(ext.z0, z0); ext.z1 = Math.max(ext.z1, z1); };
  const W = (x, z) => { const xc = x - X0, zc = z - Z0, zz = MZ ? -zc : zc; return [ox + K * xc * cs - K * zz * sn, oz + K * xc * sn + K * zz * cs]; };   // local (x, z) to world (X, Z)
  const col = c => { const k = COMPONENTS[c].col; return C[k] || k; };   // C key or literal hex
  const mk = (comp, unit, o) => {
    const ex = typeof extra === 'function' ? (extra(comp, unit) || {}) : (extra || {});
    const out = Object.assign(cloneOpts(ex), o || {});
    if (out.story && typeof out.story === 'object') {
      // ground details (gravel yard, roads, trench covers) are context, so story mode draws them as ground and faint lines. Story mode
      // takes their tone from o.hex, so they get the dark hexes the story model uses for its own ground (yard: the ground itself, so
      // it does not read as a slab, roads and trench covers: the faint ground grid line). The explore colour is untouched (o.color).
      if (out.flat && opts.groundDisc !== false) { out.story.disc = 'context'; if (out.hex === undefined && STORY_GROUND_HEX[comp]) out.hex = STORY_GROUND_HEX[comp]; }
    }
    out.subKv = kvNow; out.subComp = comp; out.subUnit = unit;
    return out;
  };
  /* A frame is an item placed at local (x, z) and turned by angle a. u runs along the item, v across it. */
  function fr(x, z, a) {
    a = a || 0;
    const ca = Math.cos(a), sa = Math.sin(a);
    const L = (u, v) => [x + u * ca - v * sa, z + u * sa + v * ca];          // item (u, v) to substation-local (x, z)
    const P = (u, y, v) => { const l = L(u, v), w = W(l[0], l[1]); return [w[0], y * K, w[1]]; };
    return {x, z, a, L, P};
  }
  const R = fr(0, 0, 0);
  function bx(f, comp, unit, u, y, v, w, h, d, o) {
    const p = f.P(u, y, v), ang = rot + (MZ ? -f.a : f.a), op = mk(comp, unit, o);
    if (ang) op.angle = ang;
    api.box(scope, p[0], p[1], p[2], w * K, h * K, d * K, col(comp), op);
    count++;
    const c = Math.abs(Math.cos(ang)), s = Math.abs(Math.sin(ang)), hx = (w * K * c + d * K * s) / 2, hz = (w * K * s + d * K * c) / 2;
    grow([p[0] - hx, p[1], p[2] - hz], 0); grow([p[0] + hx, p[1] + h * K, p[2] + hz], 0);
    const l = f.L(u, v), ca = Math.abs(Math.cos(f.a)), sa = Math.abs(Math.sin(f.a));
    const kx = (w * ca + d * sa) / 2, kz = (w * sa + d * ca) / 2;
    widen(l[0] - kx, l[0] + kx, l[1] - kz, l[1] + kz);
    if (KEEP.has(comp) && !(o && o.flat)) keep.push([l[0] - kx, l[0] + kx, l[1] - kz, l[1] + kz]);
  }
  const regLin = (f, a, b, r) => { const A = f.L(a[0], a[2]), B = f.L(b[0], b[2]); lin.push({a: [A[0], a[1], A[1]], b: [B[0], b[1], B[1]], r}); };
  /* plan extent of a pipe: the end caps are discs perpendicular to the axis, so a pipe along x adds nothing beyond its ends in x */
  const widenSeg = (f, a, b, r) => {
    const A = f.L(a[0], a[2]), B = f.L(b[0], b[2]), dx = B[0] - A[0], dy = b[1] - a[1], dz = B[1] - A[1], L = Math.hypot(dx, dy, dz) || 1;
    const ex = r * Math.sqrt(Math.max(0, 1 - (dx / L) ** 2)), ez = r * Math.sqrt(Math.max(0, 1 - (dz / L) ** 2));
    widen(Math.min(A[0], B[0]) - ex, Math.max(A[0], B[0]) + ex, Math.min(A[1], B[1]) - ez, Math.max(A[1], B[1]) + ez);
  };
  function pp(f, comp, unit, a, b, r, sides, o) {
    const A = f.P(a[0], a[1], a[2]), B = f.P(b[0], b[1], b[2]), op = mk(comp, unit, o);
    if (sides) op.sides = sides;
    api.pipe(scope, A, B, r * K, col(comp), op);
    count++; grow(A, r * K); grow(B, r * K); widenSeg(f, a, b, r);
    if (LIN.has(comp)) regLin(f, a, b, r);
  }
  function rt(f, comp, unit, pts, r, sides, o) {
    const Q = pts.map(p => f.P(p[0], p[1], p[2])), op = mk(comp, unit, o);
    if (sides) op.sides = sides;
    api.route(scope, Q, r * K, col(comp), op);
    count += Q.length - 1; Q.forEach(q => grow(q, r * K)); for (let i = 0; i < pts.length - 1; i++) widenSeg(f, pts[i], pts[i + 1], r);
    if (LIN.has(comp)) for (let i = 0; i < pts.length - 1; i++) regLin(f, pts[i], pts[i + 1], r);
  }
  const wp = (f, u, y, v) => f.P(u, y, v);                                    // world point of an item point

  /* ---------- structures ---------- */
  /* Tapered four-leg lattice column. f at the column base centre, u along the beam, v across. */
  function latticeColumn(f, unit, H, bu, bv, tu, tv, panels) {
    for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
      pp(f, 'steel-structure', unit, [su * bu / 2, 0, sv * bv / 2], [su * tu / 2, H, sv * tv / 2], .11, 6);
    for (let j = 1; j <= panels; j++) {
      const y0 = H * (j - 1) / panels, y1 = H * j / panels;
      const w0 = bu + (tu - bu) * y0 / H, w1 = bu + (tu - bu) * y1 / H;
      const d0 = bv + (tv - bv) * y0 / H, d1 = bv + (tv - bv) * y1 / H;
      for (const sv of [-1, 1]) {
        const a = j % 2 ? -1 : 1;
        pp(f, 'steel-structure', unit, [a * w0 / 2, y0, sv * d0 / 2], [-a * w1 / 2, y1, sv * d1 / 2], .055, 4);
        bx(f, 'steel-structure', unit, 0, y1 - .07, sv * d1 / 2, w1, .14, .14);
      }
    }
  }
  /* A-frame tubular column with a cross brace and a short mast on top. */
  function aFrame(f, unit, H, half, mastH) {
    for (const s of [-1, 1]) pp(f, 'steel-structure', unit, [0, 0, s * half], [0, H, s * half * .18], .2, 8);
    bx(f, 'steel-structure', unit, 0, H * .42, 0, .22, .22, half * 1.2);
    if (mastH) pp(f, 'steel-structure', unit, [0, H, 0], [0, H + mastH, 0], .09, 6);
  }
  /* Truss beam along u at height y. */
  function trussBeam(f, unit, u0, u1, y, h, n, r) {
    pp(f, 'steel-structure', unit, [u0, y, 0], [u1, y, 0], r, 6);
    pp(f, 'steel-structure', unit, [u0, y + h, 0], [u1, y + h, 0], r, 6);
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([u0 + (u1 - u0) * i / n, i % 2 ? y + h : y, 0]);
    rt(f, 'steel-structure', unit, pts, r * .55, 4);
  }
  function busSupport(unit, x, z, yTube, r) {
    const ins = HV ? 2.8 : 2.0, top = yTube - r - .08, base = top - ins, rp = HV ? .22 : .17;
    if (base > 5) pp(R, 'steel-structure', unit, [x, 0, z], [x, base, z], .2, 8);
    else if (base > .3) bx(R, 'steel-structure', unit, x, 0, z, HV ? .5 : .4, base, HV ? .5 : .4);
    pp(R, 'post-insulator', unit, [x, Math.max(base, 0), z], [x, top, z], rp, 8);
    keep.push([x - .25, x + .25, z - .25, z + .25]);
  }
  /* True when a support of height top at (px, pz) would stand on a pad, building or wall, or pierce a conductor. */
  function blocked(px, pz, top) {
    if (keep.some(k => px > k[0] - .5 && px < k[1] + .5 && pz > k[2] - .5 && pz < k[3] + .5)) return true;
    return lin.some(s => {
      const dx = s.b[0] - s.a[0], dz = s.b[2] - s.a[2], L2 = dx * dx + dz * dz;
      let t = L2 > 1e-6 ? ((px - s.a[0]) * dx + (pz - s.a[2]) * dz) / L2 : 0;
      t = Math.max(0, Math.min(1, t));
      const qx = s.a[0] + dx * t, qz = s.a[2] + dz * t;
      const ylo = L2 > 1e-6 ? s.a[1] + (s.b[1] - s.a[1]) * t : Math.min(s.a[1], s.b[1]);
      return Math.hypot(px - qx, pz - qz) < s.r + .45 && ylo < top + .3;
    });
  }
  /* Nearest spot to (x, z) along axis ('x' or 'z') that is not blocked and stays inside lim = [min, max], or null. */
  function freeSpot(x, z, axis, top, lim) {
    if (!blocked(x, z, top)) return [x, z];
    for (let d = .5; d <= 10; d += .5) for (const s of [1, -1]) {
      const px = axis === 'x' ? x + s * d : x, pz = axis === 'z' ? z + s * d : z, c = axis === 'x' ? px : pz;
      if (lim && (c < lim[0] || c > lim[1])) continue;
      if (!blocked(px, pz, top)) return [px, pz];
    }
    return null;
  }
  function mast(unit, x, z, h) {
    bx(R, 'foundation', unit, x, 0, z, .9, .45, .9);
    pp(R, 'lightning-mast', unit, [x, .45, z], [x, h, z], .14, 8);
    pp(R, 'lightning-mast', unit, [x, h, z], [x, h + 3, z], .05, 6);
  }
  function wire(unit, A, B, sag) {
    const m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - sag, (A[2] + B[2]) / 2];
    rt(R, 'shield-wire', unit, [A, m, B], .04, 4);
  }

  /* ---------- dead-end insulator string, horizontal and pointing out along +v of frame f ---------- */
  /* hang = {unit, up, back}: a hanger (one steel pipe) from the lower chord of the beam, which is `up` above the string root
     and `back` inboard of it, down to the first rod of the string, so the string is held by the gantry and does not float. */
  function deadEnd(f, unit, y, n, Rd, pitch, hang) {
    const L = .45 + n * pitch + .3, droop = .05 * L;
    const a = [0, y, 0], b = [0, y - droop, L];
    const segs = stringSegments(a, b, n, Rd, .45, .3);
    for (const s of segs) pp(f, 'insulator-string', unit, s.a, s.b, s.r, s.sides);
    if (hang) pp(f, 'steel-structure', hang.unit, [0, y + hang.up, -hang.back], segs[0].a, .06, 6);
    return b;
  }

  /* ---------- switching and instrument equipment: three poles in a row along v, spacing P ---------- */
  /* Dead-tank SF6 breaker. u along the tank. Returns the terminal height of the bushings. */
  function cbSet(f, unit, P) {
    const tl = 5.0 * S, tr = .78 * S, y0 = .28 + .5 * S + tr, bush = HV ? 5.25 : 3.5;
    bx(f, 'foundation', unit, 0, 0, 0, tl + 2.8 * S, .28, 2 * P + 2.4 * S);
    for (const k of [-1, 0, 1]) {
      const v = k * P;
      bx(f, 'circuit-breaker', unit, 0, .28, v, tl * .8, .5 * S, .9 * S);
      pp(f, 'circuit-breaker', unit, [-tl / 2, y0, v], [tl / 2, y0, v], tr, 12);
      for (const s of [-1, 1]) pp(f, 'bushing', unit, [s * tl * .31, y0 + tr * .5, v], [s * tl * .31, y0 + tr * .5 + bush, v], .27 * S, 8);
      bx(f, 'circuit-breaker', unit, tl / 2 + .75 * S, .28, v, 1.2 * S, 1.5 * S, .9 * S);
    }
    return {top: y0 + tr * .5 + bush, bushU: tl * .31};
  }
  /* Centre-break disconnect switch, blade along u. Returns the blade end height and half length. */
  function dsSet(f, unit, P) {
    const half = 1.9 * S, bl = 2.15 * S, ph = 3.2 * S;
    for (const s of [-1, 1]) bx(f, 'foundation', unit, s * half, 0, 0, .7 * S, .3, 2 * P + 1.6 * S);
    for (const k of [-1, 0, 1]) {
      const v = k * P;
      for (const s of [-1, 1]) pp(f, 'post-insulator', unit, [s * half, .3, v], [s * half, .3 + ph, v], .2 * S, 8);
      pp(f, 'disconnect-switch', unit, [-bl, .35 + ph, v], [bl, .35 + ph, v], .1 * S, 6);
    }
    return {top: .35 + ph, half: bl};
  }
  /* Free-standing current transformer, three poles. With yc the head sits at the height of the conductor that runs through it
     (the head is the vertical cylinder the conductor enters and leaves), so the set is in the conductor path. */
  function ctSet(f, unit, P, yc) {
    bx(f, 'foundation', unit, 0, 0, 0, 1.6 * S, .2, 2 * P + 1.6 * S);
    const hh = .9 * S, y0 = yc != null ? yc - hh / 2 : .2 + 3.0 * S;
    for (const k of [-1, 0, 1]) {
      const v = k * P;
      pp(f, 'current-transformer', unit, [0, .2, v], [0, y0, v], .27 * S, 8);
      pp(f, 'current-transformer', unit, [0, y0, v], [0, y0 + hh, v], .42 * S, 10);
    }
    return {top: y0 + hh, head: .42 * S};
  }
  function cvtSet(f, unit, P) {
    for (const k of [-1, 0, 1]) {
      const v = k * P;
      bx(f, 'voltage-transformer', unit, 0, 0, v, .8 * S, 1.3 * S, .8 * S);
      pp(f, 'voltage-transformer', unit, [0, 1.3 * S, v], [0, 4.3 * S, v], .22 * S, 8);
    }
    return {top: 4.3 * S};
  }
  function arrSet(f, unit, P) {
    for (const k of [-1, 0, 1]) {
      const v = k * P;
      bx(f, 'foundation', unit, 0, 0, v, .9 * S, .35, .9 * S);                      // concrete pad: the arrester stands on it
      pp(f, 'surge-arrester', unit, [0, .35, v], [0, 4.3 * S, v], .21 * S, 8);
      pp(f, 'surge-arrester', unit, [0, 4.3 * S, v], [0, 4.36 * S, v], .38 * S, 12);
    }
    return {top: 4.36 * S};
  }

  /* ---------- transformers ---------- */
  /* Single-phase 500/230/34.5 kV autotransformer: tank, cover, radiator banks, conservator, bushings, cabinet.
     u along the tank (HV bushing at -u, 230 kV bushing at +u). */
  function autoTransformer(f, unit) {
    const L = 6.4, Wd = 3.8, Ht = 4.6, pl = .35, yTop = pl + Ht, by = yTop + .22, bv = .7;
    bx(f, 'foundation', unit, 0, 0, 0, L + 2.4, pl, Wd + 4.2);
    bx(f, 'power-transformer', unit, 0, pl, 0, L, Ht, Wd);
    bx(f, 'power-transformer', unit, 0, yTop, 0, L + .25, .22, Wd + .25);
    for (const s of [-1, 1]) {
      for (const u of [-2.1, 0, 2.1]) bx(f, 'transformer-radiator', unit, u, .85, s * (Wd / 2 + .65), 1.6, 3.5, 1.0);
      pp(f, 'transformer-radiator', unit, [-3.0, 4.5, s * (Wd / 2 + .15)], [3.0, 4.5, s * (Wd / 2 + .15)], .15, 6);
    }
    const cy = by + .5 + .62;
    pp(f, 'transformer-conservator', unit, [-2.2, cy, -1.0], [2.2, cy, -1.0], .62, 12);
    for (const u of [-1.6, 1.6]) bx(f, 'transformer-conservator', unit, u, by, -1.0, .5, .5, .9);
    // HV bushing (500 kV)
    pp(f, 'bushing', unit, [-2.4, by, bv], [-2.4, by + .45, bv], .42, 10);
    pp(f, 'bushing', unit, [-2.4, by + .45, bv], [-2.4, by + 3.0, bv], .30, 8);
    pp(f, 'bushing', unit, [-2.4, by + 3.0, bv], [-2.4, by + 5.1, bv], .22, 8);
    pp(f, 'bushing', unit, [-2.4, by + 5.1, bv], [-2.4, by + 5.45, bv], .27, 8);
    // 230 kV bushing
    pp(f, 'bushing', unit, [2.6, by, bv], [2.6, by + .4, bv], .34, 10);
    pp(f, 'bushing', unit, [2.6, by + .4, bv], [2.6, by + 3.0, bv], .24, 8);
    pp(f, 'bushing', unit, [2.6, by + 3.0, bv], [2.6, by + 3.3, bv], .2, 8);
    // tertiary and neutral
    for (const u of [-.3, .7]) pp(f, 'bushing', unit, [u, by, bv], [u, by + 1.6, bv], .14, 8);
    pp(f, 'bushing', unit, [1.6, by, bv], [1.6, by + 1.5, bv], .12, 8);
    bx(f, 'power-transformer', unit, -3.7, pl, .8, .7, 1.5, .9);
    return {h1: [-2.4, by + 5.45, bv], x1: [2.6, by + 3.3, bv]};
  }
  /* Three-phase 230/34.5 kV power transformer: HV bushings at v = -.9, LV at +.9, radiators on both long sides. */
  function powerTransformer(f, unit, P) {
    const L = 5.4, Wd = 3.4, Ht = 3.8, pl = .3, yTop = pl + Ht, by = yTop + .2;
    bx(f, 'foundation', unit, 0, 0, 0, L + 1.2, pl, Wd + 3.4);
    bx(f, 'power-transformer', unit, 0, pl, 0, L, Ht, Wd);
    bx(f, 'power-transformer', unit, 0, yTop, 0, L + .22, .2, Wd + .22);
    for (const s of [-1, 1]) {
      for (const u of [-1.4, 1.4]) bx(f, 'transformer-radiator', unit, u, .7, s * (Wd / 2 + .55), 1.8, 2.9, .95);
      pp(f, 'transformer-radiator', unit, [-2.3, 3.7, s * (Wd / 2 + .12)], [2.3, 3.7, s * (Wd / 2 + .12)], .12, 6);
    }
    const cy = by + .4 + .5;
    pp(f, 'transformer-conservator', unit, [-1.8, cy, .3], [1.8, cy, .3], .5, 12);
    for (const u of [-1.3, 1.3]) bx(f, 'transformer-conservator', unit, u, by, .3, .4, .4, .7);
    const hv = [];
    for (const k of [-1, 0, 1]) {
      pp(f, 'bushing', unit, [k * P, by, -.9], [k * P, by + 2.7, -.9], .24, 8);
      pp(f, 'bushing', unit, [k * P, by + 2.7, -.9], [k * P, by + 3.0, -.9], .2, 8);
      hv.push([k * P, by + 3.0, -.9]);
    }
    for (const k of [-1, 0, 1]) pp(f, 'bushing', unit, [k * 1.5, by, .9], [k * 1.5, by + 1.4, .9], .13, 8);
    pp(f, 'bushing', unit, [2.3, by, .9], [2.3, by + 1.2, .9], .11, 8);
    bx(f, 'power-transformer', unit, 0, pl, -(Wd / 2 + .45), .7, 1.4, .8);
    return {hv, lvY: by + 1.4};
  }
  function fireWall(unit, x, z, len, thick, h, alongX) {
    const f = fr(x, z, alongX ? 0 : Math.PI / 2);
    bx(f, 'fire-wall', unit, 0, 0, 0, len, h, thick);
    bx(f, 'fire-wall', unit, 0, h, 0, len + .2, .25, thick + .2);
  }

  /* ---------- buildings ---------- */
  function building(unit, comp, x, z, a, w, d, h, doors, hvac) {
    const f = fr(x, z, a);
    bx(f, comp, unit, 0, 0, 0, w, h, d);
    bx(f, 'building-roof', unit, 0, h, 0, w + .5, .25, d + .5);
    for (const u of doors) bx(f, 'building-opening', unit, u, 0, d / 2 + .03, 1.1, 2.2, .06);
    for (const u of hvac) bx(f, 'hvac-unit', unit, u, h + .25, -d * .15, 1.8, .9, 1.2);
    return f;
  }
  function kiosk(unit, x, z, a) {
    const f = fr(x, z, a);
    bx(f, 'relay-kiosk', unit, 0, 0, 0, 5.2, 3.0, 2.6);
    bx(f, 'building-roof', unit, 0, 3.0, 0, 5.5, .2, 2.9);
    bx(f, 'building-opening', unit, -1.2, 0, 1.33, .9, 2.1, .06);
  }

  /* ---------- ground details ---------- */
  function trench(unit, x1, z1, x2, z2, w) {
    const len = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(z2 - z1, x2 - x1);
    bx(fr((x1 + x2) / 2, (z1 + z2) / 2, a), 'cable-trench', unit, 0, .13, 0, len, .03, w, {flat: true});
  }
  /* Rectangular fence with an optional gate gap. gate = {side: 'N'|'S'|'W'|'E', c, w}. Panels are solid boxes (explore mode draws
     them translucent through the fence flag); rails are three thin rails between the posts, a frame for each gate leaf (story mode
     has no fence style and would draw panels as an opaque white wall that hides the low equipment). */
  function perimeterFence(x0, x1, z0, z1, gate, postStep, rails) {
    const sides = [['N', x0, z0, x1, z0], ['S', x0, z1, x1, z1], ['W', x0, z0, x0, z1], ['E', x1, z0, x1, z1]];
    for (const [name, ax, az, bx_, bz] of sides) {
      const horiz = az === bz, a = horiz ? ax : az, b = horiz ? bx_ : bz, fix = horiz ? az : ax;
      let segs = [[a, b]];
      if (gate && gate.side === name) segs = [[a, gate.c - gate.w / 2], [gate.c + gate.w / 2, b]];
      let si = 0;
      for (const [s0, s1] of segs) {
        const len = s1 - s0, mid = (s0 + s1) / 2, unit = `FENCE-${name}${si++}`;
        if (rails) { for (const y of [.55, 1.45, 2.35]) pp(R, 'fence', unit, horiz ? [s0, y, fix] : [fix, y, s0], horiz ? [s1, y, fix] : [fix, y, s1], .035, 4, {fence: true}); }
        else if (horiz) bx(R, 'fence', unit, mid, 0, fix, len, 2.4, .06, {fence: true});
        else bx(R, 'fence', unit, fix, 0, mid, .06, 2.4, len, {fence: true});
        const n = Math.max(1, Math.ceil(len / postStep));
        for (let i = 0; i <= n; i++) {
          const s = s0 + len * i / n;
          const p = horiz ? [s, 0, fix] : [fix, 0, s], q = horiz ? [s, 2.7, fix] : [fix, 2.7, s];
          pp(R, 'fence', unit, p, q, .08, 6, {fence: true});
        }
      }
      if (gate && gate.side === name) {
        const g0 = gate.c - gate.w / 2, g1 = gate.c + gate.w / 2, unit = 'GATE-1', lw = gate.w / 2 - .12;
        for (const [s, dir] of [[g0, 1], [g1, -1]]) {
          const c = s + dir * (lw / 2 + .08);
          if (rails) {
            const a = s + dir * .08, b = s + dir * (.08 + lw), pt = (t, y) => horiz ? [t, y, fix] : [fix, y, t];
            for (const y of [.3, 2.1]) pp(R, 'gate', unit, pt(a, y), pt(b, y), .03, 4, {fence: true});
            pp(R, 'gate', unit, pt(b, .3), pt(b, 2.1), .03, 4, {fence: true});
            pp(R, 'gate', unit, pt(a, .3), pt(b, 2.1), .03, 4, {fence: true});
          } else if (horiz) bx(R, 'gate', unit, c, 0, fix, lw, 2.2, .08, {fence: true});
          else bx(R, 'gate', unit, fix, 0, c, .08, 2.2, lw, {fence: true});
          const p = horiz ? [s, 0, fix] : [fix, 0, s], q = horiz ? [s, 2.9, fix] : [fix, 2.9, s];
          pp(R, 'gate', unit, p, q, .15, 8, {fence: true});
        }
      }
    }
  }

  /* ---------- rigid bus runs ---------- */
  /* Pairing of tube sources and targets that does not cross in plan (nested L shapes). Sources farthest from the
     destination side take the farthest targets. dirX < 0 means the destination is west. */
  function pairs(srcs, dsts, zs, dirX) {
    const A = srcs.slice().sort((a, b) => dirX < 0 ? b[0] - a[0] : a[0] - b[0]);
    const B = dsts.slice().sort((a, b) => Math.abs(b[1] - zs) - Math.abs(a[1] - zs));
    return A.map((s, i) => [s, B[i]]);
  }
  /* A straight rigid tube from A to B (local x, y, z), axis aligned. With supports on, runs longer than 9 m get
     post-insulator supports, the first and last 4 m in from the ends (a bend is carried by the run next to it) and
     none more than maxSpan apart. Jogs over the bays have supports off: the ground under them is pads and conductors. */
  function highTube(unit, A, B, r, maxSpan, supports) {
    const len = Math.hypot(B[0] - A[0], B[2] - A[2]);
    if (len < .05) return;
    pp(R, 'bus-tube', unit, A, B, r, 8);
    if (!supports || len <= 9) return;
    const axis = Math.abs(B[0] - A[0]) > Math.abs(B[2] - A[2]) ? 'x' : 'z', n = Math.max(2, Math.ceil((len - 8) / maxSpan) + 1);
    const top = A[1] - r - .08 - (HV ? 2.8 : 2.0), a0 = axis === 'x' ? A[0] : A[2], a1 = axis === 'x' ? B[0] : B[2];
    const lim = [Math.min(a0, a1) + 1, Math.max(a0, a1) - 1];
    for (let i = 0; i < n; i++) {
      const d = 4 + (len - 8) * i / (n - 1), t = d / len;
      const p = freeSpot(A[0] + (B[0] - A[0]) * t, A[2] + (B[2] - A[2]) * t, axis, top, lim);
      if (p) busSupport(unit, p[0], p[1], A[1], r);
    }
  }
  /* Level 2 tap bus: from risers at (x_k, zt) a short jog along z, then a run along x, then a riser down at the end. */
  function nestedTap(prefix, srcs, dsts, zt, dirX, hHigh, r, endY) {
    pairs(srcs, dsts, zt, dirX).forEach(([s, d], i) => {
      const u = prefix + 'ABC'[i], jog = Math.abs(d[1] - zt) > .5, zr = jog ? d[1] : zt;
      if (jog) highTube(u, [s[0], hHigh, zt], [s[0], hHigh, zr], r, 13, false);
      highTube(u, [s[0], hHigh, zr], [d[0], hHigh, zr], r, 13, true);
      pp(R, 'bus-tube', u, [d[0], hHigh, zr], [d[0], endY(d), zr], r, 8);
    });
  }

  const out = {};

  /* =====================================================================================================
     500 kV collector substation, local frame: x west (line side) to east (feeder side), z north to south.
     Footprint 120 x 78 m, fence 114 x 73 m (the compact option builds one diameter in about 76 x 73 m). Breaker-and-a-half yard with two diameters, rigid tubular bus on
     two levels, two banks of single-phase autotransformers with a shared spare behind fire walls, and a
     230 kV collector gantry with one feeder bay per energy source.
     ===================================================================================================== */
  function layout500() {
    const P = 5.4, P2 = 3.0, BR = .17;
    const cp = !!opts.compact;                                         // one diameter: one line bay and one transformer bank
    const nLines = cp || (opts.lines | 0) === 1 ? 1 : 2;
    const nFeed = Math.max(1, Math.min(6, (opts.feeders | 0) || 5));
    const span = (a, b, max) => [a, b, (b - a) / Math.ceil((b - a) / max)];   // tube from a to b with supports at most max apart, a support at each end
    let g;
    if (!cp) {
      const XD0 = [-26, -4];
      const trenches = [];
      for (const xd of XD0) {
        trenches.push([xd + P + 1.9, -22, xd + P + 1.9, 22, .9]);
        for (const z of [-19.2, -9.6, 9.6, 19.2]) trenches.push([xd - P - 1.9, z, xd + P + 1.9, z, .8]);
      }
      trenches.push([3.0, 31.5, 10, 31.5, .9], [3.0, 22.5, 3.0, 31.5, .9], [-19.0, 22.5, 3.0, 22.5, .9], [-19.0, -22, -19.0, 22.5, .9]);
      g = {
        bayZ: nLines === 1 ? [-13] : [-13, 13], colHalf: 13,
        XG: -50, HG: 20.5, XD: XD0, ZCB: [-15, 0, 15], ZDSC: 21.8, ZCT: 9.8, ZTAP: [-7.5, 7.5], BUSZ: [24.6, 29.2, 33.8], HLO: 8.8, HHI: 13.0,
        XT: 33, XFEED: 52, HFEED: 12.2, TUBE230X: [41.0, 43.8, 46.6], H230: 7.6, fp: nFeed > 5 ? 11 : 13, xFarr: 48.6,
        xa: -46.8, xc: -44.9, xdl: -41.2,
        sx: [-34, -23.3, -15, -6.7, 4],
        units: [-31.2, -20.8, -10.4, 0, 10.4, 20.8, 31.2].map((z, i) => ({z, id: i + 1, spare: i === 3, bank: i < 3 ? 'T2' : i > 3 ? 'T1' : null, ph: i < 3 ? i : i - 4,
          name: i === 3 ? 'SP' : (i < 3 ? 'T2' + 'ABC'[i] : 'T1' + 'ABC'[i - 4])})),
        banks: [{bn: 'T2', sgn: -1, dia: 1}, {bn: 'T1', sgn: 1, dia: 1}],
        fw: [-26, -15.6, -5.2, 5.2, 15.6, 26], coll: span(-33, 33, 12),
        fence: [-57, 57, -36.5, 36.5], gate: {side: 'S', c: 8, w: 6}, postStep: 8,
        yard: [0, 0, 116, 75],
        roads: [['ROAD-S', 0, 0, 38.2, 120, .02, 3.2], ['ROAD-A1', -13.5, .12, 0, 4, .02, 68], ['ROAD-A2', 8, .12, 2, 4, .02, 72], ['ROAD-W', -55, .12, 0, 3, .02, 68]],
        trenches,
        mastsX: [-44, -13.5, 9, 45], mastZ: 35.2, mastH: 31, inner: [[-15, 0], [12, 0]],
        ctrl: [15.5, 31.2], kiosks: [[-17.6, -15], [-17.6, 15], [4.9, -20], [4.9, 20]],
        cx: 0, cz: 0
      };
    } else {
      /* Compact variant: the same equipment on one diameter. The line bay is served by the north tap of the diameter, the
         transformer bank (three single-phase units and a spare) by the south tap. Breaker pitch, bus lane spacing and the
         runs between the groups are tighter than in the full yard; nothing else changes. */
      const x0 = -29, x1 = 40.5, zf = 33.9;
      g = {
        bayZ: [-13], colHalf: 8.5,
        XG: -22, HG: 20.5, XD: [0], ZCB: [-12.6, 0, 12.6], ZDSC: 19.4, ZCT: 7.4, ZTAP: [-5.0, 5.0], BUSZ: [22.2, 26.4, 30.6], HLO: 8.8, HHI: 13.0,
        XT: 18, XFEED: 35.5, HFEED: 12.2, TUBE230X: [24.5, 27.3, 30.1], H230: 7.6, fp: 10, xFarr: 32.1,
        xa: -18.8, xc: -16.9, xdl: -13.2,
        sx: [-8, -2.7, 2.7, 8],
        units: [{z: 0, id: 1, spare: true, bank: null, ph: -1, name: 'SP'}, ...[9.6, 19.2, 28.8].map((z, i) => ({z, id: i + 2, spare: false, bank: 'T1', ph: i, name: 'T1' + 'ABC'[i]}))],
        banks: [{bn: 'T1', sgn: 1, dia: 0}],
        fw: [4.8, 14.4, 24.0], coll: span(-Math.max(23, (nFeed - 1) * 5 + 3), 31, 10),
        fence: [x0, x1, -zf, zf], gate: {side: 'S', c: 4, w: 6}, postStep: 8,
        yard: [(x0 + x1) / 2, 0, x1 - x0 + 2, 2 * zf + 2],
        roads: [['ROAD-S', (x0 + x1) / 2, 0, zf + 1.7, x1 - x0 + 6, .02, 3.2], ['ROAD-A1', 11, .12, 0, 4, .02, 2 * zf - 6], ['ROAD-W', x0 + 2, .12, 0, 3, .02, 2 * zf - 6]],
        trenches: [[-9, -26, -9, 26, .9], [9.5, -26, 9.5, 26, .9], [-9, -15, 9.5, -15, .8], [-9, 15, 9.5, 15, .8], [-20, -13, -9, -13, .8]],
        mastsX: [-24, 0, 26], mastZ: zf - 1.3, mastH: 31, inner: [[-11, -4.5], [11, -4.5]],
        ctrl: [17, -22], kiosks: [[-11, 15], [8.5, -12]],
        cx: (x0 + x1) / 2, cz: 0
      };
    }
    X0 = g.cx; Z0 = g.cz;
    const {XG, HG, XD, ZCB, ZDSC, ZTAP, BUSZ, HLO, HHI, XT, XFEED, HFEED, TUBE230X, H230, bayZ} = g;
    const discsF = Math.max(4, Math.round(discsL / 2));
    const lineBays = [], feedTips = [], txCentres = [], txTerms = [], diam = [];

    // ground, roads, trenches
    if (withGround) {
      bx(R, 'gravel-yard', 'YARD-1', g.yard[0], 0, g.yard[1], g.yard[2], .12, g.yard[3], {flat: true});
      for (const [id, x, y, z, w, h, d] of g.roads) bx(R, 'access-road', id, x, y, z, w, h, d, {flat: true});
      g.trenches.forEach((t, i) => trench(`TRENCH-${i + 1}`, t[0], t[1], t[2], t[3], t[4]));
    }
    if (withFence) perimeterFence(g.fence[0], g.fence[1], g.fence[2], g.fence[3], g.gate, g.postStep, railFence);

    // line gantry (dead-end): lattice columns and a truss beam
    const cols = [];
    {
      for (const c of bayZ) for (const z of [c - g.colHalf, c + g.colHalf]) if (!cols.includes(z)) cols.push(z);
      cols.sort((a, b) => a - b);
      cols.forEach((z, i) => {
        const f = fr(XG, z, Math.PI / 2);                     // u -> +z, v -> -x (outward)
        latticeColumn(f, `GANTRY-L${i + 1}`, HG, 2.4, 2.1, 1.2, 1.05, 5);
        pp(f, 'steel-structure', `GANTRY-L${i + 1}`, [0, HG, 0], [0, HG + 3.2, 0], .09, 6);
      });
      trussBeam(fr(XG, 0, Math.PI / 2), 'GANTRY-LB', cols[0], cols[cols.length - 1], HG, 1.1, Math.round((cols[cols.length - 1] - cols[0]) / 4.3), .12);
    }
    // feeder (collector) gantry: A-frame columns and a truss beam (230 kV class)
    kvNow = 230;
    {
      const zs = [];
      for (let i = 0; i <= nFeed; i++) zs.push((i - nFeed / 2) * g.fp);
      zs.forEach((z, i) => aFrame(fr(XFEED, z, -Math.PI / 2), `GANTRY-F${i + 1}`, HFEED, 1.1, 2.0));
      trussBeam(fr(XFEED, 0, -Math.PI / 2), 'GANTRY-FB', -zs[zs.length - 1], -zs[0], HFEED, 1.0, nFeed * 2, .11);
    }
    kvNow = kv;
    // lightning masts and shield wires
    {
      const mx = g.mastsX, mh = g.mastH, zIn = g.inner[0][1];
      let m = 0, w = 0;
      for (const sz of [-g.mastZ, g.mastZ]) mx.forEach(x => mast(`MAST-${++m}`, x, sz, mh));
      for (const [x, z] of g.inner) mast(`MAST-${++m}`, x, z, mh);
      for (const sz of [-g.mastZ, g.mastZ]) {
        for (let i = 0; i < mx.length - 1; i++) wire(`SW-${++w}`, [mx[i], mh - .6, sz], [mx[i + 1], mh - .6, sz], 1.2);
        const zc = sz < 0 ? cols[0] : cols[cols.length - 1];
        if (Math.abs(zc - sz) < 12) wire(`SW-${++w}`, [XG, HG + 3.0, zc], [mx[0], mh - .6, sz], .8);     // from the gantry end column to the first mast of that side
      }
      wire(`SW-${++w}`, [XG, HG + 3.0, zIn], [g.inner[0][0], mh - .6, zIn], 1.0);
      wire(`SW-${++w}`, [g.inner[0][0], mh - .6, zIn], [g.inner[1][0], mh - .6, g.inner[1][1]], 1.2);
    }

    // level 1 main buses (north and south), three phases each
    {
      const sx = g.sx;
      for (const sgn of [-1, 1]) ['A', 'B', 'C'].forEach((ph, k) => {
        const z = sgn * BUSZ[k], unit = `BUS-${sgn < 0 ? 'N' : 'S'}-${ph}`;
        pp(R, 'bus-tube', unit, [sx[0] - 1, HLO, z], [sx[sx.length - 1] + 1, HLO, z], BR, 8);
        sx.forEach(x => busSupport(unit, x, z, HLO, BR));
      });
    }

    // diameters: three breakers in series between the buses, bus-end disconnects, instrument transformers
    XD.forEach((xd, di) => {
      const dn = `D${di + 1}`, bushOff = 5.0 * .31;
      let top = 0, dsTop = 0;
      ZCB.forEach((z, bi) => { top = cbSet(fr(xd, z, bi === 2 ? -Math.PI / 2 : Math.PI / 2), `CB-${dn}-${bi + 1}`, P).top; });
      for (const sgn of [-1, 1]) dsTop = dsSet(fr(xd, sgn * ZDSC, Math.PI / 2), `DS-${dn}-${sgn < 0 ? 'N' : 'S'}`, P).top;
      let head = 0;
      for (const sgn of [-1, 1]) head = ctSet(fr(xd, sgn * g.ZCT, Math.PI / 2), `CT-${dn}-${sgn < 0 ? 'N' : 'S'}`, P, top).head;
      diam.push({xd, top, dsTop, bushOff, dn, head, di});
    });
    // line equipment under the gantry: arresters, CVTs, line disconnect switches
    const xa = g.xa, xc = g.xc, xdl = g.xdl, dsHalfL = 2.15;
    const lineEq = bayZ.map((zc, bi) => {
      const bn = `L${bi + 1}`;
      return {zc, bn, arr: arrSet(fr(xa, zc, 0), `ARR-${bn}`, P), cvt: cvtSet(fr(xc, zc, 0), `CVT-${bn}`, P), ds: dsSet(fr(xdl, zc, 0), `DS-${bn}`, P)};
    });
    // transformers and fire walls
    g.units.forEach((un, i) => {
      const f = fr(XT, un.z, 0), unit = `TX-${un.name}`;
      const t = autoTransformer(f, unit);
      const h1 = f.L(t.h1[0], t.h1[2]), x1 = f.L(t.x1[0], t.x1[2]);
      txCentres.push(wp(f, 0, 2.5, 0));
      txTerms.push({i, un, h1: [h1[0], t.h1[1], h1[1]], x1: [x1[0], t.x1[1], x1[1]]});
    });
    g.fw.forEach((z, i) => fireWall(`FW-${i + 1}`, XT, z, 11.4, .6, 8.4, true));
    // buildings
    building('CTRL-1', 'control-building', g.ctrl[0], g.ctrl[1], 0, 11, 6, 4.2, [-3, 3], [-2.5, 2.5]);
    g.kiosks.forEach(([x, z], i) => kiosk(`KIOSK-${i + 1}`, x, z, -Math.PI / 2));

    // conductors inside the diameters: bus to disconnect, disconnect to breaker, breaker to breaker, riser at the tap
    // a tap riser is built only where a line bay or a transformer bank hangs on it (with one line bay the south tap of the first diameter is free)
    const tapUsed = (di, sgn) => (di === 0 && (sgn < 0 || nLines === 2)) || g.banks.some(b => b.dia === di && b.sgn === sgn);
    diam.forEach(({xd, top, dsTop, bushOff, dn, head, di}) => {
      for (const sgn of [-1, 1]) {
        const side = sgn < 0 ? 'N' : 'S';
        [-1, 0, 1].forEach((k, ki) => {
          const x = xd + k * P, tube = BUSZ[ki === 0 ? 2 : ki === 1 ? 1 : 0];
          const zend = sgn * (ZDSC + 2.15), zin = sgn * (ZDSC - 2.15), zb = sgn * (ZCB[2] + bushOff);
          rt(R, 'conductor', `LINK-${dn}-${side}${ki + 1}a`, [[x, dsTop, zend], [x, 6.0, zend], [x, 6.0, sgn * tube], [x, HLO, sgn * tube]], .09, 6);
          rt(R, 'conductor', `LINK-${dn}-${side}${ki + 1}b`, [[x, dsTop, zin], [x, top, zin], [x, top, zb]], .09, 6);
          const zA = sgn * (ZCB[2] - bushOff), zB = sgn * bushOff, zt = sgn * Math.abs(ZTAP[0]), zc = sgn * g.ZCT, hd = head - .05;
          // the tap tube runs outer breaker, current transformer head, middle breaker: the transformer is in the conductor path
          pp(R, 'bus-tube', `TAP-${dn}-${side}${ki + 1}j`, [x, top, zA], [x, top, zc + sgn * hd], BR, 8);
          pp(R, 'bus-tube', `TAP-${dn}-${side}${ki + 1}j`, [x, top, zc - sgn * hd], [x, top, zB], BR, 8);
          if (tapUsed(di, sgn)) pp(R, 'bus-tube', `TAP-${dn}-${side}${ki + 1}r`, [x, top, zt], [x, HHI, zt], BR, 8);
        });
      }
    });
    // line bays: gantry strings and jumpers down to the line equipment
    lineEq.forEach(({zc, bn, arr, cvt, ds}) => {
      const tips = [];
      [-1, 0, 1].forEach((k, ki) => {
        const z = zc + k * P, f = fr(XG - .3, z, Math.PI / 2), unit = `STR-${bn}-${'ABC'[ki]}`;
        const tip = deadEnd(f, unit, HG - .55, discsL, RdL, pitchL, {unit: 'GANTRY-LB', up: .55, back: .3});
        tips.push(wp(f, tip[0], tip[1], tip[2]));
        const lu = `LINK-${bn}-${'ABC'[ki]}`;
        rt(R, 'conductor', lu + 'j', [[XG - .3 - tip[2], tip[1], z], [XG - .3 - tip[2] + 3.0, HG - 1.6, z], [xa, HG - 2.2, z], [xa, 6.2, z]], .09, 6);
        rt(R, 'conductor', lu + 'a', [[xa, 6.2, z], [xa, arr.top, z]], .09, 6);
        rt(R, 'conductor', lu + 'r', [[xa, 6.2, z], [xdl - dsHalfL, 6.2, z], [xdl - dsHalfL, ds.top, z]], .09, 6);
        rt(R, 'conductor', lu + 'c', [[xc, 6.2, z], [xc, cvt.top + .1, z]], .09, 6);
      });
      lineBays.push(tips);
    });
    // level 2 taps. The first diameter serves the line bays, the last one the transformer banks.
    lineEq.forEach(({zc, bn, ds}, bi) => {
      const zt = ZTAP[bi], xs = [-1, 0, 1].map(k => XD[0] + k * P), dsEnd = xdl + dsHalfL;
      nestedTap(`TAP-${bn}-`, xs.map(x => [x, zt]), [-1, 0, 1].map(k => [dsEnd, zc + k * P]), zt, -1, HHI, BR, () => ds.top);
    });
    g.banks.forEach(({bn, sgn, dia}) => {
      const zt = sgn * Math.abs(ZTAP[sgn < 0 ? 0 : 1]), xs = [-1, 0, 1].map(k => XD[dia] + k * P);
      const us = txTerms.filter(t => t.un.bank === bn);
      nestedTap(`TAP-${bn}-`, xs.map(x => [x, zt]), us.map(t => [t.h1[0], t.h1[2], t.i]), zt, 1, HHI, BR, d => txTerms[d[2]].h1[1]);
    });
    // 230 kV collector bus: three tubes along z, the units connect phase by phase
    kvNow = 230;
    TUBE230X.forEach((x, k) => {
      const unit = `BUS-C-${'ABC'[k]}`;
      pp(R, 'bus-tube', unit, [x, H230, g.coll[0]], [x, H230, g.coll[1]], .12, 8);
      for (let z = g.coll[0]; z <= g.coll[1] + 1e-6; z += g.coll[2]) busSupport(unit, x, z, H230, .12);
    });
    txTerms.forEach(t => {
      if (t.un.spare) return;
      const x = TUBE230X[t.un.ph], z = t.x1[2];
      rt(R, 'conductor', `LINK-X${t.un.id}`, [t.x1, [t.x1[0], 9.6, z], [x, 9.6, z], [x, H230 + .12, z]], .08, 6);
    });

    // feeder bays: strings out of the collector gantry, droppers to the 230 kV bus
    for (let b = 0; b < nFeed; b++) {
      const zc = (b - (nFeed - 1) / 2) * g.fp, fn = `F${b + 1}`;
      const arr = arrSet(fr(g.xFarr, zc, 0), `ARR-${fn}`, P2);
      [-1, 0, 1].forEach((k, ki) => {
        const z = zc + k * P2, f = fr(XFEED + .3, z, -Math.PI / 2), unit = `STR-${fn}-${'ABC'[ki]}`;
        const tip = deadEnd(f, unit, HFEED - .5, discsF, .21, .15, {unit: 'GANTRY-FB', up: .5, back: .3});
        if (ki === 1) feedTips.push(wp(f, tip[0], tip[1], tip[2]));
        // the dropper leaves the live end of the string (the tip), loops under the string and the gantry and lands on the collector tube
        const tl = f.L(tip[0], tip[2]);
        rt(R, 'conductor', `LINK-${fn}-${'ABC'[ki]}`, [[tl[0], tip[1], z], [tl[0] - 1.6, tip[1] - 1.4, z], [XFEED - .2, HFEED - 2.2, z], [TUBE230X[ki], 9.8, z], [TUBE230X[ki], H230 + .1, z]], .08, 6);
        // the feeder arrester is wired to its phase: a short conductor from the arrester top up to the dropper where it passes over the arrester
        {
          const xa0 = g.xFarr, t = (XFEED - .2 - xa0) / ((XFEED - .2) - TUBE230X[ki]), yD = (HFEED - 2.2) + (9.8 - (HFEED - 2.2)) * t;
          rt(R, 'conductor', `LINK-${fn}-${'ABC'[ki]}a`, [[xa0, arr.top, z], [xa0, yD, z]], .08, 6);
        }
      });
    }

    kvNow = kv;
    return {
      lineBays, lineTips: lineBays.flat(), feedTips,
      transformers: txCentres, control: wp(R, g.ctrl[0], 2, g.ctrl[1]),
      feederExit: feedTips[Math.floor(feedTips.length / 2)]
    };
  }

  /* =====================================================================================================
     230 kV campus substation, local frame: x west (line side) to east (duct bank toward the campus), z north to south
     (the layout is mirrored in z internally, see MZ: the transformer row and blast walls face south, the buildings sit
     on the north side). Footprint about 41 x 29 m (41 x 36 m with two line bays), fence 38 x 28 m. One or two incoming
     line bays (two circuits by default, like the transmission line), each with its own breaker and rigid bus, two or
     three 230/34.5 kV transformers with concrete blast walls between them, an MV switchgear building and a duct bank.
     With two line bays the second bay and its bus sit north of the first (local -z); the last transformer is fed from
     the second bus, the others from the first, so the two incoming circuits each carry part of the load.
     ===================================================================================================== */
  function layout230() {
    const P = 2.4, BR = .12, DZ = 7.2, HLO = 7.4, XG = -16.8, HG = 12.6;
    const nLn = (opts.lines | 0) === 1 ? 1 : 2;
    const nTx = (opts.transformers | 0) === 2 ? 2 : 3;
    const BUS0 = [-9.9, -7.5, -5.1];                                  // lanes of bay 1: line chain and bus
    const XT = nTx === 2 ? [3.75, 11.25] : [0, 7.5, 15.0], ZT = 2.8, ZDS = -2.4;
    const xa = -15.7, xc = -14.1, xd = -11.5, xb = -6.8, xt = -3.2, xs0 = xt - .35;   // line chain, then the bus starts just west of the current transformer
    const zNorth = -14 - (nLn - 1) * DZ;                              // north fence line
    X0 = 0; Z0 = (zNorth + 14) / 2;
    const lanes = b => BUS0.map(z => z - b * DZ);
    const busOf = i => (nLn === 2 && i === nTx - 1) ? 1 : 0;           // which bus feeds transformer i
    // bus supports sit between the transformer feeders; each bus runs from xs0 to its last feeder plus 0.6 m
    const busSx = nLn === 1 ? [nTx === 2 ? [-1.2, 7.5, 14.2] : [-1.2, 8.7, 18.4]]
      : nTx === 2 ? [[-1.2, 4.95], [-1.2, 7.5, 14.2]] : [[-1.2, 8.7], [-1.2, 8.7, 18.4]];
    const busEnd = nLn === 1 ? [nTx === 2 ? 14.8 : 19.0] : nTx === 2 ? [6.75, 14.8] : [10.5, 19.0];
    const lineTips = [], lineBays = [], txCentres = [];
    const dsHalf = 2.15 * S, bushOff = 5.0 * S * .31;

    if (withGround) {
      bx(R, 'gravel-yard', 'YARD-1', 0, 0, Z0, 41, .1, 29 + (nLn - 1) * DZ, {flat: true});
      bx(R, 'access-road', 'ROAD-W', -13, .1, 3, 12, .02, 3, {flat: true});
      bx(R, 'access-road', 'ROAD-C', -9, .1, 7.8, 3, .02, 8, {flat: true});
      bx(R, 'access-road', 'ROAD-O', -19, 0, 3, 2, .02, 3, {flat: true});
      trench('TRENCH-1', -5, -1, 17.4, -1, .7);
      trench('TRENCH-2', -7.5, 7.4, -7.5, -3, .7);
      trench('TRENCH-3', -12.4, -3, -4.2, -3, .7);
      trench('TRENCH-4', -4.2, -3, -4.2, 7.4, .7);
      trench('TRENCH-5', 9.6, 6.9, 9.6, 8.2, .7);
    }
    if (withFence) perimeterFence(-19, 19, zNorth, 14, {side: 'W', c: 3, w: 4}, 6, railFence);

    // line gantry and masts with shield wires: one A-frame at each end of the beam and, with two bays, one between them
    const zg = nLn === 1 ? [BUS0[0] - 2.1, BUS0[2] + 2.1] : [BUS0[0] - 2.1 - DZ, (BUS0[0] - 2.1 + BUS0[2] + 2.1 - DZ) / 2, BUS0[2] + 2.1];
    zg.forEach((z, i) => aFrame(fr(XG, z, Math.PI / 2), `GANTRY-L${i + 1}`, HG, 1.0, 2.2));
    trussBeam(fr(XG, 0, Math.PI / 2), 'GANTRY-LB', zg[0] - .6, zg[zg.length - 1] + .6, HG, .9, nLn === 1 ? 4 : 7, .1);
    {
      const mz = zNorth + 1.3, ms = [[-3, mz], [8, mz], [18, mz]];
      ms.forEach(([x, z], i) => mast(`MAST-${i + 1}`, x, z, 15));
      wire('SW-1', [XG, HG + 2.0, zg[0]], [ms[0][0], 14.4, ms[0][1]], .5);
      wire('SW-2', [ms[0][0], 14.4, ms[0][1]], [ms[1][0], 14.4, ms[1][1]], .6);
      wire('SW-3', [ms[1][0], 14.4, ms[1][1]], [ms[2][0], 14.4, ms[2][1]], .6);
    }

    // line chain along x at the three phase z positions of each bay: arrester, CVT, disconnect, breaker, current transformer
    const bays = [];
    for (let b = 0; b < nLn; b++) {
      const ln = lanes(b), bn = `L${b + 1}`, zc = ln[1];
      const arr = arrSet(fr(xa, zc, 0), `ARR-${bn}`, P), cvt = cvtSet(fr(xc, zc, 0), `CVT-${bn}`, P), ds = dsSet(fr(xd, zc, 0), `DS-${bn}`, P);
      const cb = cbSet(fr(xb, zc, 0), `CB-${bn}`, P), ct = ctSet(fr(xt, zc, 0), `CT-${bn}`, P);
      bays.push({b, bn, ln, arr, cvt, ds, cb, ct});
    }
    // transformers, bays and blast walls
    const mvX0 = nTx === 2 ? 1 : -1.2, mvX1 = nTx === 2 ? 14 : 17.5;
    const txs = XT.map((x, i) => {
      const f = fr(x, ZT, 0), unit = `TX-T${i + 1}`;
      const t = powerTransformer(f, unit, P);
      txCentres.push(wp(f, 0, 2, 0));
      const d = dsSet(fr(x, ZDS, Math.PI / 2), `DS-T${i + 1}`, P);
      return {f, t, d, x, i};
    });
    for (let i = 0; i < nTx - 1; i++) fireWall(`FW-${i + 1}`, (XT[i] + XT[i + 1]) / 2, ZT + .2, 6.4, .5, 5.8, false);
    fireWall(`FW-${nTx}`, (XT[0] + XT[nTx - 1]) / 2, ZT + 4.3, XT[nTx - 1] - XT[0] + 8, .4, 5.4, true);   // rear wall: with the side walls it forms one open bay per transformer
    // buildings and duct bank
    building('CTRL-1', 'control-building', -12.5, 10.0, 0, 8, 4.5, 4.0, [-2, 2], [-2]);
    building('MVSG-1', 'switchgear-building', (mvX0 + mvX1) / 2, 10.0, 0, mvX1 - mvX0, 5, 4.4, [-4, 4], [-3.5, 0, 3.5]);
    const dx0 = mvX1, dx1 = 20.0, dzs = [9.1, 9.9, 10.7, 11.5];
    bx(R, 'duct-bank', 'DUCT-1', (dx0 + dx1) / 2, -2.4, 10.3, dx1 - dx0, 1.4, 3.0);
    dzs.forEach(z => pp(R, 'duct-bank', 'DUCT-1', [dx0 - .3, -1.7, z], [dx1, -1.7, z], .11, 8));
    bx(R, 'duct-bank', 'DUCT-1', dx1 - .8, 0, 10.3, 1.2, .25, 1.2);
    out.feederPoints = dzs.map(z => wp(R, dx1, -1.7, z));
    const mouth = wp(R, dx1, -1.7, 10.3);

    // rigid bus along x for each bay, then every conductor
    bays.forEach(({b, ln}) => ln.forEach((z, k) => {
      const unit = `BUS-M${b + 1}-${'ABC'[k]}`;
      pp(R, 'bus-tube', unit, [xs0, HLO, z], [busEnd[b], HLO, z], BR, 8);
      busSx[b].forEach(x => busSupport(unit, x, z, HLO, BR));
    }));
    bays.forEach(({b, bn, ln, arr, cvt, ds, cb, ct}) => {
      const tips = [];
      ln.forEach((z, ki) => {
        const f = fr(XG - .3, z, Math.PI / 2), unit = `STR-${bn}-${'ABC'[ki]}`;
        const tip = deadEnd(f, unit, HG - .45, discsL, RdL, pitchL, {unit: 'GANTRY-LB', up: .45, back: .3});
        tips.push(wp(f, tip[0], tip[1], tip[2]));
        const lu = `LINK-${bn}-${'ABC'[ki]}`, y6 = 5.6;
        rt(R, 'conductor', lu + 'j', [[XG - .3 - tip[2], tip[1], z], [XG - .3 - tip[2] + 2.0, HG - 1.3, z], [xa, HG - 1.8, z], [xa, y6, z]], .08, 6);
        rt(R, 'conductor', lu + 'a', [[xa, y6, z], [xa, arr.top, z]], .08, 6);
        rt(R, 'conductor', lu + 'r', [[xa, y6, z], [xd - dsHalf, y6, z], [xd - dsHalf, ds.top, z]], .08, 6);
        rt(R, 'conductor', lu + 'c', [[xc, y6, z], [xc, cvt.top + .1, z]], .08, 6);
        rt(R, 'conductor', lu + 'd', [[xd + dsHalf, ds.top, z], [xd + dsHalf, y6, z], [xb - bushOff, y6, z], [xb - bushOff, cb.top, z]], .08, 6);
        // the current transformer takes the line in at one terminal of its head and out at the other
        rt(R, 'conductor', lu + 'e', [[xb + bushOff, cb.top, z], [xb + bushOff, y6 + .6, z], [xt - .2, y6 + .6, z], [xt - .2, ct.top, z]], .08, 6);
        rt(R, 'conductor', lu + 'f', [[xt + .2, ct.top, z], [xt + .2, HLO, z]], .08, 6);
      });
      lineTips.push(...tips); lineBays.push(tips);
    });
    txs.forEach(({f, t, d, x, i}) => {
      const zN = ZDS - 2.15 * S, zS = ZDS + 2.15 * S, bus = lanes(busOf(i));
      [-1, 0, 1].forEach((k, ki) => {
        const px = x + k * P, lu = `LINK-T${i + 1}-${'ABC'[ki]}`, tube = bus[ki];
        rt(R, 'conductor', lu + 'a', [[px, d.top, zN], [px, 4.9, zN], [px, 4.9, tube], [px, HLO, tube]], .08, 6);
        const hv = f.L(t.hv[ki][0], t.hv[ki][2]);
        rt(R, 'conductor', lu + 'b', [[px, d.top, zS], [px, t.hv[ki][1], zS], [hv[0], t.hv[ki][1], hv[1]]], .08, 6);
      });
      // bus duct from the low-voltage bushings over the rear wall and down onto the MV building roof
      const roof = 4.4 + .25;
      bx(fr(x, ZT + 3.0, 0), 'conductor', `LINK-T${i + 1}-LV`, 0, t.lvY + .3, 0, 3.6, .7, 4.0);
      bx(fr(x, ZT + 5.0, 0), 'conductor', `LINK-T${i + 1}-LV`, 0, roof, 0, 3.6, t.lvY + 1.0 - roof, .8);
    });

    return {
      lineBays, lineTips, transformers: txCentres, control: wp(R, -12.5, 2, 10),
      feederExit: mouth
    };
  }

  const lay = HV ? layout500() : layout230();
  const result = {
    count,
    kv,
    footprint: {w: Math.ceil(K * (ext.x1 - ext.x0) - 1e-6), d: Math.ceil(K * (ext.z1 - ext.z0) - 1e-6)},   // plan size of everything built, rounded up to the metre
    lineEntry: lay.lineBays[0][1],                     // centre phase of the first line bay, at the string tip
    lineEntries: lay.lineTips,                         // every phase tip of every line bay (A, B, C per bay)
    lineBays: lay.lineBays,                            // the same, grouped by bay
    feederExit: lay.feederExit,
    feederPoints: HV ? lay.feedTips : out.feederPoints,
    transformers: lay.transformers,
    controlBuilding: lay.control,
    bounds: {min: lo.slice(), max: hi.slice()},
    center: [ox, 0, oz],
    lineDir: [-cs, -sn],                               // world (x, z) unit vector from the centre toward the line side
    feederDir: [cs, sn]                                // and toward the feeder side (duct bank at 230 kV, collector gantry at 500 kV)
  };
  if (!HV) result.feederExitSurface = [lay.feederExit[0], 0, lay.feederExit[2]];
  return result;
}

