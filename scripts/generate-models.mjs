/**
 * Genera modelos GLB procedurales (escala real en metros) para el probador 3D / AR.
 * Uso: node scripts/generate-models.mjs
 */
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// --- Polyfill mínimo de FileReader para exportar GLB en Node -----------------
class NodeFileReader {
  constructor() {
    this.result = null;
    this.onload = null;
    this.onloadend = null;
    this.onerror = null;
  }
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(
      (buffer) => {
        this.result = buffer;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      },
      (error) => this.onerror?.(error),
    );
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(
      (buffer) => {
        this.result = `data:${blob.type || "application/octet-stream"};base64,${Buffer.from(buffer).toString("base64")}`;
        this.onload?.({ target: this });
        this.onloadend?.({ target: this });
      },
      (error) => this.onerror?.(error),
    );
  }
}
globalThis.FileReader = NodeFileReader;

const OUT = join(process.cwd(), "public", "models");
mkdirSync(OUT, { recursive: true });

function material(name, color, { roughness = 0.6, metalness = 0, opacity = 1, doubleSide = false } = {}) {
  return new THREE.MeshStandardMaterial({
    name,
    color: new THREE.Color(color),
    roughness,
    metalness,
    transparent: opacity < 1,
    opacity,
    side: doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
}

function part(geometry, mat, name) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.name = name;
  return mesh;
}

// --- Gafas ------------------------------------------------------------------
function lensOutline(w, h, squareness, { trapezoid = 0, droop = 0 } = {}, segments = 96) {
  const pts = [];
  const p = 2 / squareness;
  for (let i = 0; i < segments; i++) {
    const t = (i / segments) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    let x = Math.sign(c) * Math.abs(c) ** p * (w / 2);
    const y = Math.sign(s) * Math.abs(s) ** p * (h / 2);
    const v = y / (h / 2);
    x *= 1 - trapezoid * (1 - v) * 0.5;
    x += droop * (w / 2) * Math.max(0, -v);
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

const mirrorPts = (pts) => pts.map((p) => new THREE.Vector2(-p.x, p.y)).reverse();

function createSunglasses({ style, frameColor, lensColor, accentColor }) {
  const group = new THREE.Group();
  const isAviator = style === "aviator";
  group.name = isAviator ? "GafasAviador" : "GafasCarey";
  const w = isAviator ? 0.058 : 0.052;
  const h = isAviator ? 0.05 : 0.041;
  const gap = isAviator ? 0.016 : 0.018;
  const cx = gap / 2 + w / 2;
  const shapeOpts = isAviator ? { trapezoid: 0.18, droop: 0.12 } : { trapezoid: 0.14, droop: 0 };
  const sq = isAviator ? 2.3 : 3.6;

  const frameMat = isAviator
    ? material("Montura metálica", frameColor, { metalness: 1, roughness: 0.22 })
    : material("Montura acetato", frameColor, { roughness: 0.3 });
  const lensMat = material("Lente", lensColor, { roughness: 0.05, metalness: 0.35, opacity: 0.84, doubleSide: true });
  const accentMat = material("Detalles", accentColor, {
    metalness: isAviator ? 0 : 1,
    roughness: isAviator ? 0.5 : 0.25,
  });

  for (const side of [-1, 1]) {
    const lensGroup = new THREE.Group();
    lensGroup.position.set(side * cx, 0, 0);
    lensGroup.rotation.y = side * 0.07;
    const base = lensOutline(w, h, sq, shapeOpts);
    const pts = side > 0 ? base : mirrorPts(base);
    const lensGeo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), {
      depth: 0.0016,
      bevelEnabled: false,
      curveSegments: 1,
    });
    lensGeo.translate(0, 0, -0.0008);
    lensGroup.add(part(lensGeo, lensMat, "Lente"));

    if (isAviator) {
      const curve = new THREE.CatmullRomCurve3(
        pts.map((p) => new THREE.Vector3(p.x * 1.02, p.y * 1.02, 0)),
        true,
      );
      lensGroup.add(part(new THREE.TubeGeometry(curve, 160, 0.0012, 8, true), frameMat, "Aro"));
    } else {
      const border = 0.0065;
      const outerBase = lensOutline(w + border * 2, h + border * 2.2, sq, shapeOpts);
      const outer = side > 0 ? outerBase : mirrorPts(outerBase);
      const shape = new THREE.Shape(outer);
      shape.holes.push(new THREE.Path(pts));
      const frameGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.0045,
        bevelEnabled: true,
        bevelThickness: 0.0008,
        bevelSize: 0.0008,
        bevelSegments: 2,
        curveSegments: 1,
      });
      frameGeo.translate(0, 0, -0.00225);
      lensGroup.add(part(frameGeo, frameMat, "Marco"));
    }
    group.add(lensGroup);

    const outerX = side * (cx + w / 2 + (isAviator ? 0.0015 : 0.0065));
    const topY = h * (isAviator ? 0.3 : 0.32);
    const templeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(outerX, topY, -0.004),
      new THREE.Vector3(outerX + side * 0.004, topY, -0.03),
      new THREE.Vector3(outerX + side * 0.006, topY - 0.002, -0.1),
      new THREE.Vector3(outerX + side * 0.006, topY - 0.012, -0.128),
      new THREE.Vector3(outerX + side * 0.005, topY - 0.03, -0.142),
    ]);
    group.add(
      part(new THREE.TubeGeometry(templeCurve, 64, isAviator ? 0.0011 : 0.0022, 8, false), frameMat, "Varilla"),
    );

    const hinge = part(
      new THREE.BoxGeometry(0.006, isAviator ? 0.004 : 0.008, 0.008),
      isAviator ? frameMat : accentMat,
      "Bisagra",
    );
    hinge.position.set(outerX, topY, -0.004);
    group.add(hinge);

    if (isAviator) {
      const tipCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(outerX + side * 0.006, topY - 0.004, -0.112),
        new THREE.Vector3(outerX + side * 0.006, topY - 0.012, -0.128),
        new THREE.Vector3(outerX + side * 0.005, topY - 0.03, -0.142),
      ]);
      group.add(part(new THREE.TubeGeometry(tipCurve, 24, 0.0022, 8, false), accentMat, "Terminal"));
      const pad = part(
        new THREE.SphereGeometry(0.0045, 16, 12),
        material("Plaqueta", "#ece6da", { roughness: 0.2, opacity: 0.9 }),
        "Plaqueta",
      );
      pad.scale.set(0.6, 1, 0.35);
      pad.position.set(side * (gap / 2 + 0.002), -h * 0.12, -0.009);
      group.add(pad);
    }
  }

  if (isAviator) {
    const topBar = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-cx + w * 0.38, h * 0.46, 0),
      new THREE.Vector3(0, h * 0.5, 0.001),
      new THREE.Vector3(cx - w * 0.38, h * 0.46, 0),
    ]);
    group.add(part(new THREE.TubeGeometry(topBar, 48, 0.0011, 8, false), frameMat, "Barra superior"));
    const bridge = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-gap / 2 - 0.001, h * 0.28, 0),
      new THREE.Vector3(0, h * 0.34, 0.001),
      new THREE.Vector3(gap / 2 + 0.001, h * 0.28, 0),
    ]);
    group.add(part(new THREE.TubeGeometry(bridge, 32, 0.0012, 8, false), frameMat, "Puente"));
  } else {
    const bridge = part(new THREE.BoxGeometry(gap + 0.006, 0.0075, 0.0045), frameMat, "Puente");
    bridge.position.set(0, h * 0.24, 0);
    group.add(bridge);
    for (const s of [-1, 1]) {
      const stud = part(new THREE.CylinderGeometry(0.0012, 0.0012, 0.001, 12), accentMat, "Remache");
      stud.rotation.x = Math.PI / 2;
      stud.position.set(s * (cx + w / 2 + 0.002), h * 0.36, 0.0035);
      group.add(stud);
    }
  }
  return group;
}

// --- Bolso estructurado -----------------------------------------------------
function roundedTrapezoidShape(bottomW, topW, height, r) {
  const s = new THREE.Shape();
  const b = bottomW / 2;
  const t = topW / 2;
  const lerp = (a, c, k) => a + (c - a) * k;
  const k = r / height;
  s.moveTo(-b + r, 0);
  s.lineTo(b - r, 0);
  s.quadraticCurveTo(b, 0, lerp(b, t, k), r);
  s.lineTo(lerp(t, b, k), height - r);
  s.quadraticCurveTo(t, height, t - r, height);
  s.lineTo(-t + r, height);
  s.quadraticCurveTo(-t, height, -lerp(t, b, k), height - r);
  s.lineTo(-lerp(b, t, k), r);
  s.quadraticCurveTo(-b, 0, -b + r, 0);
  return s;
}

function createStructuredBag() {
  const g = new THREE.Group();
  g.name = "BolsoCuero";
  const leather = material("Cuero coñac", "#8a4a2a", { roughness: 0.5 });
  const leatherDark = material("Cuero solapa", "#743a20", { roughness: 0.45 });
  const handleMat = material("Asa", "#5f301b", { roughness: 0.4 });
  const gold = material("Herraje dorado", "#d4af37", { metalness: 1, roughness: 0.28 });
  const W = 0.28;
  const TW = 0.23;
  const H = 0.2;
  const D = 0.1;
  const bevel = 0.012;

  const bodyGeo = new THREE.ExtrudeGeometry(roundedTrapezoidShape(W, TW, H, 0.025), {
    depth: D,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.008,
    bevelSegments: 5,
    curveSegments: 18,
  });
  bodyGeo.translate(0, 0, -D / 2);
  g.add(part(bodyGeo, leather, "Cuerpo"));

  const fw = TW * 0.98;
  const top = H + 0.004;
  const bottom = H * 0.42;
  const flap = new THREE.Shape();
  flap.moveTo(-fw / 2, top);
  flap.lineTo(-fw / 2, bottom + 0.05);
  flap.quadraticCurveTo(-fw / 2, bottom, -fw / 2 + 0.05, bottom);
  flap.lineTo(fw / 2 - 0.05, bottom);
  flap.quadraticCurveTo(fw / 2, bottom, fw / 2, bottom + 0.05);
  flap.lineTo(fw / 2, top);
  flap.lineTo(-fw / 2, top);
  const flapGeo = new THREE.ExtrudeGeometry(flap, {
    depth: 0.003,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.0015,
    bevelSegments: 2,
    curveSegments: 16,
  });
  flapGeo.translate(0, 0, D / 2 + bevel + 0.0005);
  g.add(part(flapGeo, leatherDark, "Solapa"));

  const clasp = part(new THREE.BoxGeometry(0.034, 0.02, 0.006), gold, "Broche");
  clasp.position.set(0, bottom + 0.012, D / 2 + bevel + 0.006);
  g.add(clasp);
  const ring = part(new THREE.TorusGeometry(0.006, 0.0018, 10, 24), gold, "Giro");
  ring.position.set(0, bottom + 0.012, D / 2 + bevel + 0.0095);
  g.add(ring);

  const handle = part(new THREE.TorusGeometry(0.075, 0.0075, 16, 72, Math.PI), handleMat, "Asa");
  handle.position.set(0, H + 0.008, 0);
  handle.scale.set(1, 0.85, 1);
  g.add(handle);

  for (const s of [-1, 1]) {
    const anchor = part(new THREE.TorusGeometry(0.011, 0.0028, 10, 28), gold, "Argolla");
    anchor.position.set(s * 0.075, H + 0.01, 0);
    anchor.rotation.y = Math.PI / 2;
    g.add(anchor);
    for (const z of [-1, 1]) {
      const foot = part(new THREE.SphereGeometry(0.0055, 14, 10), gold, "Pata");
      foot.position.set(s * (W / 2 - 0.03), -0.006, z * (D / 2 - 0.01));
      g.add(foot);
    }
  }
  return g;
}

// --- Bolso bandolera media luna --------------------------------------------
function createCrossbodyBag() {
  const g = new THREE.Group();
  g.name = "BolsoBandolera";
  const leather = material("Cuero terracota", "#a8452f", { roughness: 0.55 });
  const strapMat = material("Correa", "#8e3a27", { roughness: 0.5 });
  const gold = material("Herraje dorado", "#d4af37", { metalness: 1, roughness: 0.3 });
  const W = 0.24;
  const H = 0.14;
  const D = 0.045;

  const s = new THREE.Shape();
  s.moveTo(-W / 2, 0);
  s.absellipse(0, 0, W / 2, H, Math.PI, Math.PI * 2, false, 0);
  s.lineTo(-W / 2, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: D,
    bevelEnabled: true,
    bevelThickness: 0.016,
    bevelSize: 0.01,
    bevelSegments: 6,
    curveSegments: 40,
  });
  geo.translate(0, H, -D / 2);
  g.add(part(geo, leather, "Cuerpo"));

  const zip = part(new THREE.BoxGeometry(W * 0.86, 0.003, 0.004), gold, "Cremallera");
  zip.position.set(0, H + 0.0105, 0);
  g.add(zip);
  const pull = part(new THREE.BoxGeometry(0.006, 0.018, 0.003), gold, "Tirador");
  pull.position.set(W * 0.38, H + 0.002, D / 2 + 0.018);
  g.add(pull);

  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + 0.006, H - 0.005, 0),
    new THREE.Vector3(-W / 2 - 0.02, H + 0.12, 0),
    new THREE.Vector3(-0.1, H + 0.42, 0),
    new THREE.Vector3(0, H + 0.48, 0),
    new THREE.Vector3(0.1, H + 0.42, 0),
    new THREE.Vector3(W / 2 + 0.02, H + 0.12, 0),
    new THREE.Vector3(W / 2 - 0.006, H - 0.005, 0),
  ]);
  g.add(part(new THREE.TubeGeometry(strapCurve, 160, 0.0055, 10, false), strapMat, "Correa"));
  for (const sx of [-1, 1]) {
    const ring = part(new THREE.TorusGeometry(0.01, 0.0025, 10, 24), gold, "Argolla");
    ring.position.set(sx * (W / 2 - 0.004), H + 0.004, 0);
    ring.rotation.y = Math.PI / 2;
    g.add(ring);
  }
  return g;
}

// --- Mochila wayuu ------------------------------------------------------------
function createWayuuBag() {
  const g = new THREE.Group();
  g.name = "MochilaWayuu";
  const palette = {
    rojo: "#b3322a",
    mostaza: "#e0a53a",
    turquesa: "#1f7a80",
    crema: "#f1e7d3",
    negro: "#262321",
    naranja: "#d8622c",
    fucsia: "#b8336a",
  };
  const mats = Object.fromEntries(
    Object.entries(palette).map(([k, c]) => [k, material(`Hilo ${k}`, c, { roughness: 0.92, doubleSide: true })]),
  );
  const H = 0.28;
  const r0 = 0.112;
  const r1 = 0.12;
  const radiusAt = (y) => r0 + (r1 - r0) * (y / H);
  const bands = [
    "negro", "rojo", "crema", "turquesa", "crema", "mostaza", "negro",
    "naranja", "negro", "mostaza", "crema", "turquesa", "crema", "rojo",
  ];
  const bandH = H / bands.length;
  bands.forEach((key, i) => {
    const y0 = i * bandH;
    const y1 = (i + 1) * bandH;
    const geo = new THREE.CylinderGeometry(radiusAt(y1), radiusAt(y0), bandH, 64, 1, true);
    const m = part(geo, mats[key], `Franja ${i + 1}`);
    m.position.y = y0 + bandH / 2;
    g.add(m);
  });

  const diamondBands = [
    [3, mats.mostaza],
    [7, mats.crema],
    [11, mats.fucsia],
  ];
  for (const [bandIndex, mat] of diamondBands) {
    const y = bandIndex * bandH + bandH / 2;
    const r = radiusAt(y) + 0.0015;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + (bandIndex % 2) * 0.17;
      const d = part(new THREE.OctahedronGeometry(0.0085, 0), mat, "Kanaas");
      d.scale.set(1, 1.2, 0.3);
      d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      d.rotation.y = Math.atan2(Math.cos(a), Math.sin(a));
      g.add(d);
    }
  }

  const base = part(new THREE.CircleGeometry(r0, 64), mats.negro, "Base");
  base.rotation.x = Math.PI / 2;
  g.add(base);
  for (const [ri, ro, m] of [
    [0.085, 0.095, mats.rojo],
    [0.045, 0.055, mats.mostaza],
  ]) {
    const ring = part(new THREE.RingGeometry(ri, ro, 64), m, "Base anillo");
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.0008;
    g.add(ring);
  }

  const rim = part(new THREE.TorusGeometry(r1, 0.006, 10, 72), mats.negro, "Borde");
  rim.rotation.x = Math.PI / 2;
  rim.position.y = H;
  g.add(rim);
  const cord = part(new THREE.TorusGeometry(r1 + 0.002, 0.0028, 8, 72), mats.rojo, "Cordón");
  cord.rotation.x = Math.PI / 2;
  cord.position.y = H - 0.018;
  g.add(cord);
  for (const sx of [-0.012, 0.012]) {
    const tail = part(new THREE.CylinderGeometry(0.0025, 0.0025, 0.09, 8), mats.rojo, "Cordón cola");
    tail.position.set(sx, H - 0.06, r1 + 0.006);
    g.add(tail);
    const pom = part(new THREE.SphereGeometry(0.009, 12, 10), mats.fucsia, "Pompón");
    pom.position.set(sx, H - 0.11, r1 + 0.006);
    g.add(pom);
  }

  const strapCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-r1 - 0.004, H - 0.03, 0),
    new THREE.Vector3(-r1 - 0.02, H + 0.12, 0),
    new THREE.Vector3(-0.1, H + 0.46, 0),
    new THREE.Vector3(0, H + 0.52, 0),
    new THREE.Vector3(0.1, H + 0.46, 0),
    new THREE.Vector3(r1 + 0.02, H + 0.12, 0),
    new THREE.Vector3(r1 + 0.004, H - 0.03, 0),
  ]);
  g.add(part(new THREE.TubeGeometry(strapCurve, 200, 0.009, 10, false), mats.mostaza, "Gaza"));
  const tasselMats = [mats.rojo, mats.turquesa, mats.mostaza];
  for (const sx of [-1, 1]) {
    tasselMats.forEach((m, i) => {
      const t = part(new THREE.CylinderGeometry(0.0035, 0.006, 0.07, 10), m, "Borla");
      t.position.set(sx * (r1 + 0.012), H - 0.07 - i * 0.004, (i - 1) * 0.012);
      g.add(t);
    });
  }
  return g;
}

// --- Sombrero aguadeño / panamá --------------------------------------------
function createPanamaHat() {
  const g = new THREE.Group();
  g.name = "SombreroAguadeno";
  const straw = material("Palma de iraca", "#d8c398", { roughness: 0.88, doubleSide: true });
  const band = material("Cinta", "#1e1c1a", { roughness: 0.65, doubleSide: true });
  const profile = [
    [0.185, 0.016], [0.178, 0.009], [0.16, 0.005], [0.13, 0.004], [0.11, 0.006], [0.101, 0.011],
    [0.1, 0.03], [0.098, 0.065], [0.094, 0.1], [0.087, 0.116], [0.072, 0.124], [0.052, 0.121],
    [0.032, 0.112], [0.014, 0.108], [0.0001, 0.107],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(part(new THREE.LatheGeometry(profile, 96), straw, "Copa y ala"));
  const bandProfile = [
    [0.1035, 0.012],
    [0.1028, 0.026],
    [0.1018, 0.04],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  g.add(part(new THREE.LatheGeometry(bandProfile, 96), band, "Cinta"));
  const bow = part(new THREE.BoxGeometry(0.004, 0.022, 0.03), band, "Moño");
  bow.position.set(0.104, 0.026, 0);
  g.add(bow);
  return g;
}

// --- Sombrero vueltiao -------------------------------------------------------
function createVueltiaoHat() {
  const g = new THREE.Group();
  g.name = "SombreroVueltiao";
  const negro = material("Caña flecha negra", "#1d1a17", { roughness: 0.85, doubleSide: true });
  const crudo = material("Caña flecha cruda", "#ebe0c5", { roughness: 0.9, doubleSide: true });
  const brimInner = 0.1;
  const brimOuter = 0.215;
  const brimY = (r) => {
    const k = (r - brimInner) / (brimOuter - brimInner);
    return 0.012 - 0.014 * k ** 1.6;
  };
  const brimPattern = [
    ["n", 0.006], ["c", 0.01], ["n", 0.004], ["c", 0.006], ["n", 0.012], ["c", 0.006], ["n", 0.004],
    ["c", 0.01], ["n", 0.008], ["c", 0.006], ["n", 0.004], ["c", 0.012], ["n", 0.006], ["c", 0.006], ["n", 0.015],
  ];
  let r = brimInner;
  brimPattern.forEach(([c, width], i) => {
    const ra = r;
    const rb = r + width;
    const mid = (ra + rb) / 2;
    const pts = [
      new THREE.Vector2(rb, brimY(rb)),
      new THREE.Vector2(mid, brimY(mid)),
      new THREE.Vector2(ra, brimY(ra)),
    ];
    g.add(part(new THREE.LatheGeometry(pts, 128), c === "n" ? negro : crudo, `Ala vuelta ${i + 1}`));
    r = rb;
  });

  const crownH = 0.11;
  const crownTopR = 0.084;
  const crownPattern = [
    ["n", 0.012], ["c", 0.016], ["n", 0.006], ["c", 0.012], ["n", 0.014],
    ["c", 0.012], ["n", 0.006], ["c", 0.016], ["n", 0.016],
  ];
  const baseY = brimY(brimInner);
  const crownR = (yy) => brimInner + (crownTopR - brimInner) * ((yy - baseY) / crownH);
  let y = baseY;
  crownPattern.forEach(([c, hh], i) => {
    const ya = y;
    const yb = y + hh;
    const pts = [new THREE.Vector2(crownR(ya), ya), new THREE.Vector2(crownR(yb), yb)];
    g.add(part(new THREE.LatheGeometry(pts, 128), c === "n" ? negro : crudo, `Copa vuelta ${i + 1}`));
    y = yb;
  });

  const topY = y;
  const topRings = [
    ["c", crownTopR, 0.06],
    ["n", 0.06, 0.035],
    ["c", 0.035, 0.0001],
  ];
  topRings.forEach(([c, ra, rb], i) => {
    const pts = [
      new THREE.Vector2(ra, topY + 0.004 * (1 - ra / crownTopR)),
      new THREE.Vector2(rb, topY + 0.004 * (1 - rb / crownTopR)),
    ];
    g.add(part(new THREE.LatheGeometry(pts, 128), c === "n" ? negro : crudo, `Plato ${i + 1}`));
  });

  const trim = part(new THREE.TorusGeometry(brimOuter, 0.0022, 8, 160), negro, "Ribete");
  trim.rotation.x = Math.PI / 2;
  trim.position.y = brimY(brimOuter);
  g.add(trim);
  return g;
}

// --- Exportación ----------------------------------------------------------------
// Instancia nueva por modelo: reutilizar un GLTFExporter entre parseAsync
// corruptía las cabeceras (longitudes basura) en los .glb generados.
const models = [
  ["gafas-aviador.glb", () => createSunglasses({ style: "aviator", frameColor: "#c9a24a", lensColor: "#2f3d2c", accentColor: "#1b1a18" })],
  ["gafas-carey.glb", () => createSunglasses({ style: "wayfarer", frameColor: "#5b3a22", lensColor: "#3a2a1e", accentColor: "#c0c0c0" })],
  ["bolso-cuero.glb", createStructuredBag],
  ["bolso-bandolera.glb", createCrossbodyBag],
  ["mochila-wayuu.glb", createWayuuBag],
  ["sombrero-panama.glb", createPanamaHat],
  ["sombrero-vueltiao.glb", createVueltiaoHat],
];

for (const [file, build] of models) {
  const object = build();
  object.updateMatrixWorld(true);
  const glb = await new GLTFExporter().parseAsync(object, { binary: true });
  const target = join(OUT, file);
  writeFileSync(target, Buffer.from(glb));
  console.log(`✓ ${file} — ${(statSync(target).size / 1024).toFixed(1)} KB`);
}
