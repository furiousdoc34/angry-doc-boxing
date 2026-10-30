import * as THREE from 'three';
import { GLTFLoader } from './vendor/addons/GLTFLoader.js';
import * as SkeletonUtils from './vendor/addons/SkeletonUtils.js';
import { MeshoptDecoder } from './vendor/addons/meshopt_decoder.module.js';
import { ROSTER, ARCS, ARCHETYPES, COMBOS } from './fighters.js';

const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const hex = c => '#' + c.toString(16).padStart(6, '0');
const IS_MOBILE = matchMedia('(pointer:coarse)').matches;
const svg = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
const FLAG_PH = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'><rect width='60' height='15' fill='#0038a8'/><rect y='15' width='60' height='15' fill='#ce1126'/><path d='M0 0L26 15L0 30Z' fill='#fff'/><circle cx='9' cy='15' r='3.5' fill='#fcd116'/></svg>`);
const FLAG_W = svg(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'><rect width='60' height='30' fill='#222'/><circle cx='30' cy='15' r='9' fill='none' stroke='#ffd23f' stroke-width='3'/><path d='M21 15h18M30 6v18' stroke='#ffd23f' stroke-width='2'/></svg>`);

const SAVE = Object.assign({ prog: 0, coins: 150, seenArc: {}, stars: {}, owned: { glove_classic: 1, outfit_coat: 1 }, glove: 'glove_classic', outfit: 'outfit_coat', muted: false }, JSON.parse(localStorage.getItem('ad_save2') || '{}'));
const save = () => localStorage.setItem('ad_save2', JSON.stringify(SAVE));

const SHOP = [
  { id: 'glove_classic', kind: 'glove', name: 'Clinic Red', cost: 0, glove: 0xe01818 },
  { id: 'glove_neon', kind: 'glove', name: 'Neon Pulse', cost: 200, glove: 0x0a2a3a, gear: 'neon', glow: 0x00e5ff },
  { id: 'glove_spiked', kind: 'glove', name: 'Spiked Iron', cost: 350, glove: 0x555a60, gear: 'spiked' },
  { id: 'glove_mech', kind: 'glove', name: 'Mecha Fist', cost: 500, glove: 0x9aa4b0, gear: 'mech', glow: 0xff3d00 },
  { id: 'glove_gold', kind: 'glove', name: 'Golden Scalpel', cost: 800, glove: 0xd4af37, gear: 'mech', glow: 0xfff176 },
  { id: 'outfit_coat', kind: 'outfit', name: "Doctor's Coat", cost: 0, top: 'coat', topColor: 0xffffff },
  { id: 'outfit_scrubs', kind: 'outfit', name: 'Blue Scrubs', cost: 150, top: 'coat', topColor: 0x4fc3f7 },
  { id: 'outfit_neon', kind: 'outfit', name: 'Neon Lab Coat', cost: 400, top: 'coat', topColor: 0x1a1a2e, gear: 'neon' },
  { id: 'outfit_spiked', kind: 'outfit', name: 'Spiked Surgeon Armor', cost: 650, top: 'coat', topColor: 0x37474f, gear: 'spiked' },
];
function playerLook() {
  const g = SHOP.find(s => s.id === SAVE.glove) || SHOP[0], o = SHOP.find(s => s.id === SAVE.outfit) || SHOP[5];
  return { build: 'normal', height: 1.0, skin: 0xe0a878, hair: 'slick', hairColor: 0x1a1a1a, top: o.top, topColor: o.topColor, shorts: 0x1a3a8a, glove: g.glove, gloveGear: g.gear, gloveGlow: g.glow, gear: o.gear, acc: ['mirror', 'stethoscope'], sig: 0x00e5ff };
}
const PLAYER = { name: 'ANGRY DOC', nick: 'The Physical Therapist', emoji: '🩺' };

const Audio = {
  ctx: null, crowdGain: null, master: null,
  init() {
    if (this.ctx) { this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const c = this.ctx; this.master = c.createGain(); this.master.gain.value = SAVE.muted ? 0 : 0.8; this.master.connect(c.destination);
    const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.6;
    this.crowdGain = c.createGain(); this.crowdGain.gain.value = 0.05;
    src.connect(bp).connect(this.crowdGain).connect(this.master); src.start();
  },
  setMute(m) { SAVE.muted = m; save(); if (this.master) this.master.gain.value = m ? 0 : 0.8; },
  tone(f0, f1, dur, vol, type = 'sine', delay = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + delay; const o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noiseHit(dur, vol, freq = 1600, type = 'lowpass', delay = 0) {
    const c = this.ctx; if (!c) return; const t = c.currentTime + delay; const n = c.createBufferSource(); n.buffer = this.noise; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = c.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); n.connect(f).connect(g).connect(this.master); n.start(t, Math.random()); n.stop(t + dur + 0.02);
  },
  thud(p = 1, blocked = false) { this.tone(blocked ? 220 : 140 + 40 * p, 45, 0.2, 0.9 * Math.min(1.3, p)); this.noiseHit(0.09, 0.6 * p, blocked ? 3000 : 1600); },
  whoosh() { this.noiseHit(0.13, 0.22, 2200, 'bandpass'); },
  clink() { this.tone(1400, 900, 0.15, 0.25, 'triangle'); this.tone(2100, 1500, 0.12, 0.15, 'triangle'); },
  boom() { this.tone(90, 30, 0.9, 1.2); this.noiseHit(0.7, 0.9, 900); this.tone(1200, 200, 0.4, 0.2, 'sawtooth'); },
  charge() { this.tone(200, 1200, 0.8, 0.15, 'sawtooth'); },
  heal() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, f, 0.3, 0.15, 'triangle', i * 0.08)); },
  bell(times = 1) { for (let k = 0; k < times; k++) [1, 2.76, 5.4].forEach((m, i) => this.tone(830 * m, 830 * m * 0.99, 1.4, 0.25 / (i + 1), 'sine', k * 0.35)); },
  cheer(amt = 0.3) { if (!this.crowdGain) return; const t = this.ctx.currentTime, g = this.crowdGain.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0.05 + amt, t + 0.1); g.linearRampToValueAtTime(0.05, t + 1.6); },
};

// ---------- RENDERER / SCENE ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !IS_MOBILE || devicePixelRatio < 2, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, IS_MOBILE ? 1.5 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const BG = new THREE.Color(0x140c08); scene.background = BG; scene.fog = new THREE.Fog(0x140c08, 8, 20);
const camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 60);
const CAM_BASE = new THREE.Vector3(0.75, 2.8, 3.9), CAM_LOOK = new THREE.Vector3(0.05, 1.8, -0.9);
let baseFov = 52;
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h; baseFov = w / h < 1.4 ? 64 : 52; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const grad = (() => { const d = new Uint8Array([80, 160, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.needsUpdate = true; t.minFilter = t.magFilter = THREE.NearestFilter; return t; })();
const toon = (color, extra = {}) => new THREE.MeshToonMaterial({ color, gradientMap: grad, ...extra });
const arena = new THREE.Group(); scene.add(arena);
scene.add(new THREE.HemisphereLight(0xffd8b0, 0x2a1810, 1.0));
const key = new THREE.DirectionalLight(0xfff0dd, 1.6); key.position.set(2, 6, 4); scene.add(key);
const rimL = new THREE.DirectionalLight(0xff6a33, 1.6); rimL.position.set(-4, 3, -5); scene.add(rimL);
const rimR = new THREE.DirectionalLight(0x4477ff, 1.3); rimR.position.set(4, 2.5, -4); scene.add(rimR);
const spotL = new THREE.SpotLight(0xffe7c0, 40, 14, 0.55, 0.6, 1.4); spotL.position.set(0, 7, 0); spotL.target.position.set(0, 0, 0); arena.add(spotL, spotL.target);

function canvasTex(w, h, draw, rep) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); } return t; }
const brick = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#2b1610'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < 16; y++) for (let x = -1; x < 5; x++) { const l = 40 + Math.random() * 30; g.fillStyle = `rgb(${l + 70},${l * 0.6 + 10},${l * 0.4})`; g.fillRect(x * 64 + (y % 2) * 32 + 2, y * 16 + 2, 60, 12); }
  for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 30, 0, 7); g.fill(); }
  g.font = 'bold 34px Impact'; g.fillStyle = 'rgba(255,220,60,.5)'; g.save(); g.translate(30, 140); g.rotate(-0.15); g.fillText('TUTOK!', 0, 0); g.restore();
}, [4, 1.5]);
const wallMat = new THREE.MeshLambertMaterial({ map: brick });
const back = new THREE.Mesh(new THREE.PlaneGeometry(24, 8), wallMat); back.position.set(0, 4, -8); arena.add(back);
const sideL = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMat); sideL.rotation.y = Math.PI / 2; sideL.position.set(-8, 4, 0); arena.add(sideL);
const sideR = sideL.clone(); sideR.rotation.y = -Math.PI / 2; sideR.position.x = 8; arena.add(sideR);
const floorTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#3b2c22'; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .25})`; g.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 20, 2); } }, [6, 6]);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshLambertMaterial({ map: floorTex })); floor.rotation.x = -Math.PI / 2; arena.add(floor);
const ringBase = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 6), toon(0x8a1f1f)); ringBase.position.y = 0.12; arena.add(ringBase);
const canvasMat = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8d0bc'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(160,30,30,.5)'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 70, 0, 7); g.stroke(); g.font = 'bold 40px Impact'; g.fillStyle = 'rgba(160,30,30,.5)'; g.textAlign = 'center'; g.fillText('ANGRY DOC', 128, 142); for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(80,40,20,${Math.random() * .08})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 12, 0, 7); g.fill(); } });
const matTop = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 5.6), toon(0xffffff, { map: canvasMat })); matTop.rotation.x = -Math.PI / 2; matTop.position.y = 0.251; arena.add(matTop);
const ropeMat = toon(0xdd2222), postMat = toon(0x222222);
[[-2.9, -2.9], [2.9, -2.9], [-2.9, 2.9], [2.9, 2.9]].forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.6, 8), postMat); p.position.set(x, 1.0, z); arena.add(p); });
[0.8, 1.15, 1.5].forEach(y => [[0, -2.9, 0], [-2.9, 0, Math.PI / 2], [2.9, 0, Math.PI / 2]].forEach(([x, z, r]) => { const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 5.8, 6), ropeMat); rp.rotation.z = Math.PI / 2; rp.rotation.y = r; rp.position.set(x, y, z); arena.add(rp); }));
const haze = new THREE.Mesh(new THREE.ConeGeometry(3.2, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe0a0, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); haze.position.set(0, 3.6, -0.2); arena.add(haze);
function couch(x, z, ry, col) {
  const g = new THREE.Group(), m = toon(col);
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.9), m); base.position.y = 0.35; g.add(base);
  const bk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 0.25), m); bk.position.set(0, 0.8, -0.35); g.add(bk);
  [-1.2, 1.2].forEach(ax => { const a = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.65, 0.9), m); a.position.set(ax, 0.55, 0); g.add(a); });
  g.position.set(x, 0, z); g.rotation.y = ry; arena.add(g);
}
couch(-5, -6, 0.3, 0x5a3a7a); couch(5, -6, -0.3, 0x2f5a3a); couch(-6.5, -1, Math.PI / 2, 0x7a3a2a); couch(6.5, -1.5, -Math.PI / 2, 0x2a4a7a);
for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1, 10), toon(0x445566)); b.position.set(rnd(-7, 7), 0.5, rnd(-7.5, -6.5)); arena.add(b); }
[-3, 0, 3].forEach(x => { const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffcc66 })); l.position.set(x, 5.5, -1); arena.add(l); });
const crowd = [];
const crowdMats = [0, 1, 2, 3, 4, 5].map(i => new THREE.SpriteMaterial({ map: canvasTex(64, 96, (g) => {
  const cols = ['#e74', '#4ae', '#ec4', '#a5e', '#5c7', '#eee'], skins = ['#c8915f', '#a8703f', '#e0b080', '#8a5a30'];
  g.fillStyle = cols[i]; g.beginPath(); g.ellipse(32, 80, 26, 22, 0, 0, 7); g.fill();
  g.fillStyle = skins[i % 4]; g.beginPath(); g.arc(32, 38, 22, 0, 7); g.fill();
  g.fillStyle = '#111'; g.fillRect(22, 32, 5, 7); g.fillRect(37, 32, 5, 7); g.beginPath(); g.arc(32, 48, 7, 0, Math.PI); g.fill();
  g.fillStyle = skins[i % 4]; g.beginPath(); g.arc(8, 52, 7, 0, 7); g.arc(56, 52, 7, 0, 7); g.fill();
  if (i % 2) { g.fillStyle = '#222'; g.fillRect(12, 14, 40, 10); }
}), color: 0xaaaaaa }));
for (let row = 0; row < 3; row++) for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(crowdMats[(i + row) % 6]); s.position.set(-7 + i * 0.95 + rnd(-.2, .2), 0.9 + row * 0.35, -4.2 - row); s.scale.set(0.9, 1.35, 1); s.userData = { y: s.position.y, p: rnd(0, 6), sp: rnd(6, 10) }; arena.add(s); crowd.push(s); }
for (let side of [-1, 1]) for (let i = 0; i < 8; i++) { const s = new THREE.Sprite(crowdMats[i % 6]); s.position.set(side * (4.4 + (i % 2) * 0.9), 0.9, -3 + i * 0.7); s.scale.set(0.9, 1.35, 1); s.userData = { y: 0.9, p: rnd(0, 6), sp: rnd(6, 10) }; arena.add(s); crowd.push(s); }
let crowdHype = 0;

// ---------- PARTICLES ----------
const dotTex = canvasTex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
const blobTex = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,.6)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const parts = [];
for (let i = 0; i < 80; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.visible = false; scene.add(s); parts.push({ s, v: new THREE.Vector3(), life: 0 }); }
let partI = 0;
function emit(pos, n, color, speed = 2, size = 0.06, life = 0.6, grav = -6) {
  for (let i = 0; i < n; i++) { const p = parts[partI++ % parts.length]; p.s.visible = true; p.s.position.copy(pos); p.s.material.color.set(color); p.s.scale.setScalar(size * rnd(0.6, 1.4)); p.v.set(rnd(-1, 1), rnd(0, 1.2), rnd(-1, 1)).normalize().multiplyScalar(speed * rnd(0.5, 1)); p.life = p.max = life; p.g = grav; }
}
function updateParts(dt) { for (const p of parts) { if (p.life <= 0) continue; p.life -= dt; p.v.y += p.g * dt; p.s.position.addScaledVector(p.v, dt); p.s.material.opacity = p.life / p.max; if (p.life <= 0) p.s.visible = false; } }

// ---------- RIG (Quaternius UAL mannequin, CC0) ----------
let BASE = null, CLIPS = {}, RIG_S = 1;
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const outlineMat = new THREE.MeshBasicMaterial({ color: 0x0a0505, side: THREE.BackSide });
outlineMat.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * 0.011;'); };
const V = () => new THREE.Vector3();
const _a = V(), _b = V(), _c = V(), _d = V(), _e = V(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();

function propMesh(geo, color, opts = {}) {
  const m = new THREE.Mesh(geo, opts.mat || toon(color, opts.emissive ? { emissive: new THREE.Color(opts.emissive), emissiveIntensity: 1 } : {}));
  if (opts.outline !== false) { const o = new THREE.Mesh(geo, outlineMat); o.scale.setScalar(opts.ol || 1.1); m.add(o); }
  return m;
}
function attach(bone, mesh, worldPos, rot) { mesh.position.copy(worldPos); if (rot) mesh.rotation.set(...rot); scene.add(mesh); mesh.updateMatrixWorld(true); bone.attach(mesh); return mesh; }

function buildRig(look) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const model = SkeletonUtils.clone(BASE); const hs = look.height || 1; model.scale.setScalar(RIG_S * hs);
  body.add(model); root.updateMatrixWorld(true);
  const B = {}; const meshes = [];
  model.traverse(o => { if (o.isBone) B[o.name.replace('DEF-', '').replace(/(\d{3})$/, '.$1').replace(/([^.])([LR])$/, '$1.$2')] = o; if (o.isSkinnedMesh) meshes.push(o); });
  // outfit painted onto the mesh via vertex colors chosen from each vertex's dominant bone
  const top0 = look.top || 'none';
  const cSkin = new THREE.Color(look.skin), cTop = new THREE.Color(look.topColor ?? 0xffffff), cSh = new THREE.Color(look.shorts ?? 0x222222), cShoe = new THREE.Color(look.shoe ?? (look.gear === 'neon' ? 0x111111 : 0x262626));
  const longSl = ['coat', 'hoodie', 'jacket', 'barong'].includes(top0), shortSl = longSl || top0 === 'jersey';
  const pickCol = n => {
    if (/spine|shoulder/.test(n)) return top0 === 'none' ? cSkin : cTop;
    if (/upper_arm/.test(n)) return shortSl ? cTop : cSkin;
    if (/forearm/.test(n)) return longSl ? cTop : cSkin;
    if (/hips|thigh/.test(n)) return cSh;
    if (/foot|toe/.test(n)) return cShoe;
    return cSkin;
  };
  const bodyM = toon(0xffffff, { vertexColors: true });
  const jointMat = toon(0xdddddd, { vertexColors: true });
  for (const m of meshes) {
    const g = m.geometry.clone(), si = g.attributes.skinIndex, sw = g.attributes.skinWeight, n = si.count, col = new Float32Array(n * 3);
    const names = m.skeleton.bones.map(b => b.name);
    for (let i = 0; i < n; i++) {
      let bj = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; bj = si.getComponent(i, k); } }
      const c = pickCol(names[bj] || ''); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); m.geometry = g;
    m.material = m.material.name === 'M_Joints' ? jointMat : bodyM; m.frustumCulled = false;
    const o = new THREE.SkinnedMesh(g, outlineMat); o.bind(m.skeleton, m.bindMatrix); o.frustumCulled = false; m.parent.add(o); o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale);
  }
  const skinM = toon(look.skin);
  const wp = b => b.getWorldPosition(V());
  const head = wp(B.head), neck = wp(B.neck), hips = wp(B.hips), chest = wp(B['spine.003']), sp1 = wp(B['spine.001']);
  const R = RIG_S * hs, hr = 0.13 * R;
  const hc = head.clone().add(_a.set(0, hr * 0.9, 0));
  const build = look.build === 'heavy' ? 1.25 : look.build === 'slim' ? 0.9 : 1.05;
  const top = look.top || 'none', tc = look.topColor ?? 0xffffff;
  const gearEm = look.gear === 'neon' ? (look.sig || 0x00e5ff) : null;
  if (gearEm) attach(B.hips, propMesh(new THREE.TorusGeometry(0.135 * build * R, 0.012 * R, 6, 20), gearEm, { emissive: gearEm, outline: false }), hips.clone().add(_a.set(0, 0.06 * R, 0)), [Math.PI / 2, 0, 0]);
  const sleeve = () => {}; const _unusedSleeve = (col) => { for (const s of ['L', 'R']) { const sl = propMesh(new THREE.CylinderGeometry(0.06 * R, 0.055 * R, 0.25 * R, 10), col); const up = wp(B['upper_arm.' + s]), fo = wp(B['forearm.' + s]); attach(B['upper_arm.' + s], sl, up.clone().lerp(fo, 0.5), [0, 0, Math.PI / 2]); } };
  if (top === 'coat') {
    attach(B.hips, propMesh(new THREE.CylinderGeometry(0.2 * build * R, 0.24 * build * R, 0.42 * R, 16, 1, true), tc, { mat: toon(tc, { side: THREE.DoubleSide }) }), hips.clone().add(_a.set(0, -0.1 * R, -0.01 * R)));
    attach(B['spine.002'], propMesh(new THREE.BoxGeometry(0.1 * R, 0.4 * R, 0.02 * R), 0x222244, { outline: false }), sp1.clone().lerp(chest, 0.6).add(_a.set(0, 0, 0.2 * build * R)));
    const cross = propMesh(new THREE.BoxGeometry(0.16 * R, 0.05 * R, 0.02 * R), 0xe01818, { outline: false }); attach(B['spine.003'], cross, chest.clone().add(_a.set(0, -0.05 * R, -0.21 * build * R)));
    const c2 = new THREE.Mesh(cross.geometry, cross.material); c2.rotation.z = Math.PI / 2; cross.add(c2);
    sleeve(tc);
    if (look.gear === 'neon') attach(B.hips, propMesh(new THREE.TorusGeometry(0.27 * build * R, 0.012 * R, 6, 24), 0x00e5ff, { emissive: 0x00e5ff, outline: false }), hips.clone().add(_a.set(0, -0.42 * R, 0)), [Math.PI / 2, 0, 0]);
  } else if (top !== 'none') {
    if (!['tank', 'sando', 'vest'].includes(top)) sleeve(tc);
    if (top === 'hoodie') attach(B['spine.003'], propMesh(new THREE.TorusGeometry(0.13 * R, 0.05 * R, 8, 16), tc), neck.clone().add(_a.set(0, -0.02 * R, -0.05 * R)), [Math.PI / 2.4, 0, 0]);
    if (top === 'barong') attach(B['spine.002'], propMesh(new THREE.BoxGeometry(0.12 * R, 0.3 * R, 0.02 * R), 0xc8b88a, { outline: false }), sp1.clone().lerp(chest, 0.5).add(_a.set(0, 0, 0.19 * build * R)));
    if (top === 'jersey') attach(B['spine.002'], propMesh(new THREE.BoxGeometry(0.12 * R, 0.12 * R, 0.02 * R), 0xffffff, { outline: false }), sp1.clone().lerp(chest, 0.5).add(_a.set(0, 0, 0.19 * build * R)));
  }
  if (false) { const belly = propMesh(new THREE.SphereGeometry(0.19 * R, 12, 10), top === 'none' ? look.skin : tc); belly.scale.set(1.15, 1, 1); attach(B['spine.001'], belly, sp1.clone().add(_a.set(0, 0, 0.06 * R))); }
  if (look.gear === 'spiked') for (const s of ['L', 'R']) {
    const pad = propMesh(new THREE.SphereGeometry(0.09 * R, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0x444444); attach(B['upper_arm.' + s], pad, wp(B['upper_arm.' + s]).add(_a.set(0, 0.03 * R, 0)));
    for (let k = 0; k < 3; k++) { const sp = propMesh(new THREE.ConeGeometry(0.02 * R, 0.08 * R, 6), 0xcccccc, { outline: false }); sp.position.set((k - 1) * 0.04 * R, 0.08 * R, 0); pad.add(sp); }
  }
  // head
  const face = new THREE.Group(); attach(B.head, face, hc);
  const eyeW = toon(0xffffff), eyeB = new THREE.MeshBasicMaterial({ color: 0x111111 });
  [-1, 1].forEach(sx => {
    const e = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.24, 10, 8), eyeW); e.position.set(sx * hr * 0.38, hr * 0.1, hr * 0.82); e.scale.set(1, 1.15, 0.6); face.add(e);
    const p = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.12, 8, 6), eyeB); p.position.set(sx * hr * 0.36, hr * 0.08, hr * 0.97); face.add(p);
    const br = new THREE.Mesh(new THREE.BoxGeometry(hr * 0.42, hr * 0.1, hr * 0.1), eyeB); br.position.set(sx * hr * 0.38, hr * 0.42, hr * 0.88); br.rotation.z = sx * 0.4; face.add(br);
  });
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.2, 10, 8), new THREE.MeshBasicMaterial({ color: 0x5a1010 })); mouth.position.set(0, -hr * 0.42, hr * 0.85); mouth.scale.set(1.3, 0.3, 0.5); face.add(mouth);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.13, 8, 6), toon(new THREE.Color(look.skin).multiplyScalar(0.9).getHex())); nose.position.set(0, -hr * 0.1, hr * 1.0); face.add(nose);
  [-1, 1].forEach(sx => { const ear = new THREE.Mesh(new THREE.SphereGeometry(hr * 0.2, 8, 6), skinM); ear.position.set(sx * hr * 0.98, 0, 0); ear.scale.set(0.5, 1, 0.8); face.add(ear); });
  const hcSet = look.hairColor ?? 0x111111, H = look.hair || 'buzz', hairM = toon(hcSet);
  const add = (geo, mat, pos, rot, scl) => { const m = new THREE.Mesh(geo, mat); if (pos) m.position.set(...pos.map(v => v * hr)); if (rot) m.rotation.set(...rot); if (scl) m.scale.set(...scl); face.add(m); return m; };
  const cap = (s = 1.07, cut = 0.45) => add(new THREE.SphereGeometry(hr * s, 16, 10, 0, Math.PI * 2, 0, Math.PI * cut), hairM, null, [-0.25, 0, 0]);
  if (H === 'buzz') cap(1.03, 0.4);
  else if (H === 'slick') { cap(1.08, 0.48); add(new THREE.SphereGeometry(hr * 0.35, 8, 6), hairM, [0.2, 0.85, 0.5]); }
  else if (H === 'mohawk') add(new THREE.BoxGeometry(hr * 0.3, hr * 0.6, hr * 1.6), hairM, [0, 1.05, 0]);
  else if (H === 'afro') add(new THREE.IcosahedronGeometry(hr * 1.45, 1), hairM, [0, 0.45, -0.2]);
  else if (H === 'long') { cap(1.1, 0.5); add(new THREE.BoxGeometry(hr * 1.9, hr * 1.4, hr * 0.5), hairM, [0, -0.3, -0.8]); }
  else if (H === 'ponytail') { cap(1.08, 0.48); add(new THREE.ConeGeometry(hr * 0.3, hr * 1.4, 8), hairM, [0, 0.1, -1.3], [-2.3, 0, 0]); }
  else if (H === 'spiky') { cap(1.05, 0.45); for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; add(new THREE.ConeGeometry(hr * 0.22, hr * 0.7, 6), hairM, [Math.cos(a) * 0.55, 0.95, Math.sin(a) * 0.55 - 0.1], [Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6]); } }
  else if (H === 'curly') { for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; add(new THREE.SphereGeometry(hr * 0.32, 8, 6), hairM, [Math.cos(a) * 0.7, 0.75 + (k % 2) * 0.15, Math.sin(a) * 0.7 - 0.15]); } }
  else if (H === 'idol') { cap(1.1, 0.5); add(new THREE.SphereGeometry(hr * 0.75, 10, 8), hairM, [-0.3, 0.55, 0.55], null, [1.2, 0.5, 0.6]); }
  else if (H === 'bun') { cap(1.06, 0.45); add(new THREE.SphereGeometry(hr * 0.42, 10, 8), hairM, [0, 1.05, -0.3]); }
  else if (H === 'white') add(new THREE.TorusGeometry(hr * 0.9, hr * 0.22, 8, 16, Math.PI * 1.2), hairM, [0, 0.2, -0.2], [0, Math.PI / 2, -0.3]);
  const acc = new Set(look.acc || []), metal = c => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: 0.2 });
  if (acc.has('mirror')) { add(new THREE.CylinderGeometry(hr * 0.32, hr * 0.32, hr * 0.06, 16), metal(0xffffff), [0, 0.78, 0.85], [Math.PI / 2 - 0.3, 0, 0]); add(new THREE.TorusGeometry(hr * 1.06, hr * 0.06, 6, 24), toon(0x222222), [0, 0.42, 0], [Math.PI / 2 - 0.35, 0, 0]); }
  if (acc.has('headband') || acc.has('bandana')) add(new THREE.TorusGeometry(hr * 1.02, hr * 0.12, 6, 24), toon(acc.has('bandana') ? 0xd32f2f : look.sig || 0xffffff), [0, 0.42, 0], [Math.PI / 2 - 0.2, 0, 0]);
  if (acc.has('shades')) add(new THREE.BoxGeometry(hr * 1.4, hr * 0.32, hr * 0.12), metal(0x111111), [0, 0.1, 1.02]);
  if (acc.has('glasses')) add(new THREE.TorusGeometry(hr * 0.22, hr * 0.04, 6, 14), toon(0x222222), [0.38, 0.1, 1.02]).clone && add(new THREE.TorusGeometry(hr * 0.22, hr * 0.04, 6, 14), toon(0x222222), [-0.38, 0.1, 1.02]);
  if (acc.has('cap')) { add(new THREE.SphereGeometry(hr * 1.1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.45), toon(look.sig || 0x1565c0), null, [-0.15, 0, 0]); add(new THREE.CylinderGeometry(hr * 0.7, hr * 0.7, hr * 0.06, 12, 1, false, 0, Math.PI), toon(look.sig || 0x1565c0), [0, 0.5, 0.6], [0, -Math.PI / 2, 0]); }
  if (acc.has('salakot')) add(new THREE.ConeGeometry(hr * 2.0, hr * 0.9, 16), toon(0xc8a060), [0, 1.25, 0]);
  if (acc.has('beard')) add(new THREE.SphereGeometry(hr * 0.55, 10, 8), toon(hcSet === 0xeeeeee ? 0xeeeeee : 0x2b1a10), [0, -0.65, 0.6], null, [1.2, 0.9, 0.7]);
  if (acc.has('mustache')) add(new THREE.BoxGeometry(hr * 0.75, hr * 0.12, hr * 0.12), toon(0x1a1a1a), [0, -0.28, 0.98]);
  if (acc.has('flower')) add(new THREE.IcosahedronGeometry(hr * 0.3, 0), toon(0xffffff), [0.85, 0.5, 0.3]);
  if (acc.has('earring')) add(new THREE.TorusGeometry(hr * 0.12, hr * 0.03, 6, 12), metal(0xffd700), [1.0, -0.3, 0]);
  if (acc.has('mask')) add(new THREE.BoxGeometry(hr * 1.5, hr * 0.35, hr * 0.2), toon(0x111111), [0, 0.12, 0.9]);
  if (acc.has('stethoscope')) { attach(B['spine.003'], propMesh(new THREE.TorusGeometry(0.12 * R, 0.012 * R, 6, 20, Math.PI * 1.3), 0x222222, { outline: false }), neck.clone().add(_a.set(0, -0.12 * R, 0.08 * R)), [1.2, 0, Math.PI * 1.15]); attach(B['spine.003'], propMesh(new THREE.CylinderGeometry(0.03 * R, 0.03 * R, 0.015 * R, 12), 0xc0c0c0, { outline: false }), chest.clone().add(_a.set(0.08 * R, -0.12 * R, 0.21 * build * R)), [Math.PI / 2, 0, 0]); }
  if (acc.has('chain')) attach(B['spine.003'], propMesh(new THREE.TorusGeometry(0.12 * R, 0.015 * R, 6, 20), 0, { mat: metal(0xffd700), outline: false }), neck.clone().add(_a.set(0, -0.1 * R, 0.05 * R)), [1.3, 0, 0]);
  if (acc.has('towel')) attach(B['spine.003'], propMesh(new THREE.TorusGeometry(0.14 * R, 0.04 * R, 6, 16), 0xffffff), neck.clone().add(_a.set(0, -0.04 * R, 0)), [Math.PI / 2, 0, 0]);
  if (acc.has('sash')) attach(B['spine.002'], propMesh(new THREE.TorusGeometry(0.22 * build * R, 0.03 * R, 6, 20), 0xd4af37, { outline: false }), sp1.clone().lerp(chest, 0.5), [Math.PI / 2, 0.6, 0]);
  if (acc.has('armband')) attach(B['upper_arm.R'], propMesh(new THREE.TorusGeometry(0.06 * R, 0.015 * R, 6, 14), 0xffffff, { outline: false }), wp(B['upper_arm.R']).add(_a.set(-0.12 * R, 0, 0)), [0, Math.PI / 2, 0]);
  if (acc.has('tattoo')) attach(B['upper_arm.L'], propMesh(new THREE.TorusGeometry(0.058 * R, 0.01 * R, 4, 14), 0x1a237e, { outline: false }), wp(B['upper_arm.L']).add(_a.set(0.14 * R, 0, 0)), [0, Math.PI / 2, 0]);
  if (acc.has('wings')) for (const sx of [-1, 1]) attach(B['spine.003'], propMesh(new THREE.ConeGeometry(0.06 * R, 0.3 * R, 4), 0xffffff), chest.clone().add(_a.set(sx * 0.15 * R, 0.08 * R, -0.2 * R)), [-0.4, 0, -sx * 1.0]);
  if (acc.has('cane')) attach(B.hips, propMesh(new THREE.TorusGeometry(0.08 * R, 0.012 * R, 6, 12, Math.PI), 0x8d6e63, { outline: false }), hips.clone().add(_a.set(0.2 * R, -0.02 * R, -0.1 * R)));
  // gloves
  const gColor = look.glove ?? 0xcc2222, gGear = look.gloveGear || look.gear || null;
  const gGlow = look.gloveGlow ?? (gGear === 'neon' ? (look.sig || 0x00e5ff) : gGear === 'mech' ? 0xff3d00 : null);
  const gloves = {}, gMats = [];
  for (const s of ['L', 'R']) {
    const hp = wp(B['hand.' + s]); const sx = Math.sign(hp.x) || 1;
    const mat = gGear === 'mech' ? new THREE.MeshStandardMaterial({ color: gColor, metalness: 0.85, roughness: 0.3, emissive: new THREE.Color(0) }) : toon(gColor, { emissive: new THREE.Color(0) });
    gMats.push(mat);
    const g = new THREE.Group(); const ball = propMesh(new THREE.SphereGeometry(0.11 * R, 16, 12), gColor, { mat, ol: 1.08 }); ball.scale.set(1.0, 0.95, 1.15); g.add(ball);
    const cuff = propMesh(new THREE.CylinderGeometry(0.07 * R, 0.075 * R, 0.08 * R, 12), 0, { mat: toon(gGear ? 0x222222 : 0xffffff) }); cuff.position.set(-sx * 0.1 * R, 0, 0); cuff.rotation.z = Math.PI / 2; g.add(cuff);
    if (gGear === 'spiked') for (let k = 0; k < 4; k++) { const sp = propMesh(new THREE.ConeGeometry(0.025 * R, 0.08 * R, 6), 0xdddddd, { outline: false }); sp.position.set(0, (k - 1.5) * 0.045 * R, 0.12 * R); sp.rotation.x = Math.PI / 2; g.add(sp); }
    if (gGlow) { const ring = propMesh(new THREE.TorusGeometry(0.075 * R, 0.012 * R, 6, 16), gGlow, { emissive: gGlow, outline: false }); ring.position.set(-sx * 0.07 * R, 0, 0); ring.rotation.y = Math.PI / 2; g.add(ring); const emb = propMesh(new THREE.CircleGeometry(0.035 * R, 6), gGlow, { emissive: gGlow, outline: false }); emb.position.set(0, 0.105 * R, 0); emb.rotation.x = -Math.PI / 2; g.add(emb); }
    attach(B['hand.' + s], g, hp.clone().add(_a.set(sx * 0.06 * R, 0, 0.02 * R)));
    gloves[s] = g;
  }
  B.head.scale.setScalar(1.7); B.neck.scale.setScalar(1.05); B['hand.L'].scale.setScalar(1.25); B['hand.R'].scale.setScalar(1.25);
  if (look.build === 'heavy') { B['spine.001'].scale.set(1.25, 1, 1.25); B['spine.002'].scale.set(1.0, 1, 1.0); } else if (look.build === 'slim') B['spine.002'].scale.set(0.92, 1, 0.92);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.position.y = 0.01; root.add(blob);
  const trails = {};
  for (const s of ['L', 'R']) { trails[s] = []; for (let k = 0; k < 6; k++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: gGlow || look.sig || 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); sp.scale.setScalar(0.35 - k * 0.04); scene.add(sp); trails[s].push(sp); } }
  const mixer = new THREE.AnimationMixer(model); const acts = {};
  for (const n in CLIPS) { const a = mixer.clipAction(CLIPS[n]); acts[n] = a; if (!/Loop/.test(n)) { a.setLoop(THREE.LoopOnce); a.clampWhenFinished = true; } }
  acts.Idle_Loop.play();
  root.userData = { body, model, B, gloves, gMats, mixer, acts, face, mouth, blob, trails, cur: 'Idle_Loop', hr };
  return root;
}
function playAnim(u, name, fade = 0.15) {
  if (!u.acts[name] || (u.cur === name && !/Hit/.test(name))) return; const next = u.acts[name], prev = u.acts[u.cur];
  next.reset().setEffectiveWeight(1).play(); if (prev && prev !== next) next.crossFadeFrom(prev, fade, false); u.cur = name;
}
function aimBone(bone, childWorld, desiredWorld) {
  const bp = bone.getWorldPosition(_c); _d.subVectors(childWorld, bp).normalize(); _e.subVectors(desiredWorld, bp).normalize();
  _q.setFromUnitVectors(_d, _e); bone.getWorldQuaternion(_q2); _q.multiply(_q2); bone.parent.getWorldQuaternion(_q2).invert(); bone.quaternion.copy(_q2.multiply(_q)); bone.updateMatrixWorld(true);
}
const _S = V(), _E = V(), _H = V(), _T = V(), _dir = V(), _pole = V(), _elb = V();
function solveArm(up, fore, hand, target, pole, w) {
  up.getWorldPosition(_S); fore.getWorldPosition(_E); hand.getWorldPosition(_H);
  const l1 = _S.distanceTo(_E), l2 = _E.distanceTo(_H);
  _T.copy(target); if (w < 1) _T.lerp(_H, 1 - w);
  _dir.subVectors(_T, _S); const dist = clamp(_dir.length(), 0.05, (l1 + l2) * 0.999); _dir.normalize();
  _T.copy(_S).addScaledVector(_dir, dist);
  const a = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  _pole.subVectors(pole, _S); _pole.addScaledVector(_dir, -_pole.dot(_dir)).normalize();
  _elb.copy(_S).addScaledVector(_dir, a).addScaledVector(_pole, h);
  aimBone(up, _E, _elb); fore.getWorldPosition(_E); hand.getWorldPosition(_H); aimBone(fore, _H, _T);
}

// ---------- FIGHTER ----------
const PUNCH = { jab: { w: 0.07, a: 0.09, r: 0.14, d: 5, s: 6 }, hookL: { w: 0.15, a: 0.12, r: 0.24, d: 10, s: 11 }, hookR: { w: 0.15, a: 0.12, r: 0.24, d: 10, s: 11 }, upper: { w: 0.2, a: 0.12, r: 0.3, d: 14, s: 15 }, feint: { w: 0.3, a: 0.05, r: 0.15, d: 0, s: 0 } };
const boneSide = t => t === 'L' ? 'R' : 'L'; // pose target side (-X) -> anatomical bone side
const gloveOf = type => type === 'hookL' ? 'L' : 'R';
class Fighter {
  constructor(def, isPlayer) {
    this.def = def; this.isPlayer = isPlayer; this.look = isPlayer ? playerLook() : def.look;
    this.mesh = buildRig(this.look); scene.add(this.mesh);
    this.maxHp = isPlayer ? 160 + Math.min(90, SAVE.prog * 1.2) : def.stats.hp; this.tL = V(); this.tR = V(); this.reset(true);
  }
  reset(full) {
    if (full) { this.hp = this.maxHp; this.hyper = 0; this.knockdowns = 0; this.dealt = 0; this.landed = 0; }
    this.st = 100; this.action = null; this.t = 0; this.blocking = false; this.dodge = 0; this.dodgeT = 0; this.stun = 0; this.retreat = 0;
    this.speedDown = 0; this.down = false; this.flash = 0; this.offX = 0; this.hitBack = 0; this.squash = { L: 0, R: 0 }; this.ikW = 1; this.pose = null; this.yell = 0; this.noIK = false;
    playAnim(this.mesh.userData, 'Idle_Loop', 0.2);
  }
  get speedMul() { return (this.speedDown > 0 ? 0.65 : 1) * (this.st < 20 ? 0.7 : 1); }
  update(dt, time) {
    const u = this.mesh.userData;
    if (this.speedDown > 0) this.speedDown -= dt; if (this.stun > 0) this.stun -= dt; if (this.flash > 0) this.flash -= dt;
    this.st = clamp(this.st + dt * (this.action ? 4 : this.blocking ? 7 : 14), 0, 100);
    if (this.dodgeT > 0) { this.dodgeT -= dt; if (this.dodgeT <= 0) this.dodge = 0; }
    u.mixer.update(dt);
    let L = [-0.21, 1.6, 0.42], R = [0.21, 1.56, 0.45];
    if (this.blocking) { L = [-0.11, 1.95, 0.4]; R = [0.11, 1.95, 0.4]; }
    const bob = Math.sin(time * 5 + (this.isPlayer ? 0 : 1.7)) * 0.03; let leanX = 0, leanZ = 0, active = false;
    if (this.action) {
      const a = this.action, p = a.p, ph = this.t;
      const ext = ph < p.w ? 0 : ph < p.w + p.a ? 1 : Math.max(0, 1 - (ph - p.w - p.a) / p.r);
      const wind = ph < p.w ? Math.min(1, ph / Math.min(p.w, 0.25)) : 0; active = ph >= p.w && ph < p.w + p.a + p.r * 0.5;
      if (a.type === 'jab') { R = [lerp(0.2, 0.04, ext), 1.9, lerp(0.4, 1.15, ext) - wind * 0.15]; leanZ = ext * 0.12; }
      else if (a.type === 'hookL') { L = [lerp(-0.2, -0.65, wind) + ext * 0.62, 1.95, lerp(0.38, 0.95, ext) - wind * 0.1]; leanX = wind * -0.25 + ext * 0.3; }
      else if (a.type === 'hookR') { R = [lerp(0.2, 0.65, wind) - ext * 0.62, 1.95, lerp(0.4, 0.95, ext) - wind * 0.1]; leanX = wind * 0.25 - ext * 0.3; }
      else if (a.type === 'upper') { R = [lerp(0.2, 0.12, ext), lerp(1.84, 1.35, wind) + ext * 0.75, lerp(0.4, 0.9, ext)]; leanZ = -wind * 0.15 + ext * 0.15; }
      else if (a.type === 'feint') { R = [0.3, 1.75, 0.3 + wind * 0.2]; leanX = 0.1 * wind; }
      else if (a.type === 'special') { R = [lerp(0.45, 0.04, ext), 1.9, lerp(-0.1, 1.25, ext)]; leanZ = ext * 0.2; }
    }
    if (this.pose) { const P = this.pose(time); if (P.L) L = P.L; if (P.R) R = P.R; }
    this.offX = lerp(this.offX, this.dodge * 0.6, Math.min(1, dt * 18));
    this.hitBack = lerp(this.hitBack, 0, Math.min(1, dt * 8));
    u.body.position.set(this.offX, this.down ? 0 : bob, -this.hitBack - this.retreat);
    const lean = this.down ? 0 : 1;
    u.body.rotation.z = lerp(u.body.rotation.z, (-this.dodge * 0.3 + leanX * 0.25) * lean, Math.min(1, dt * 15));
    u.body.rotation.x = lerp(u.body.rotation.x, (leanZ - this.hitBack * 0.4) * lean, Math.min(1, dt * 10));
    u.body.rotation.y = lerp(u.body.rotation.y, leanX * 0.8 * lean, Math.min(1, dt * 10));
    this.ikW = lerp(this.ikW, this.down || this.noIK ? 0 : 1, Math.min(1, dt * 8));
    this.mesh.updateMatrixWorld(true);
    this.tL.lerp(_a.set(L[0], L[1], L[2]), Math.min(1, dt * 22)); this.tR.lerp(_b.set(R[0], R[1], R[2]), Math.min(1, dt * 22));
    if (this.ikW > 0.01) {
      const B = u.B;
      solveArm(B['upper_arm.R'], B['forearm.R'], B['hand.R'], u.body.localToWorld(V().copy(this.tL)), u.body.localToWorld(V().set(-0.8, 1.0, 0.0)), this.ikW);
      solveArm(B['upper_arm.L'], B['forearm.L'], B['hand.L'], u.body.localToWorld(V().copy(this.tR)), u.body.localToWorld(V().set(0.8, 1.0, 0.0)), this.ikW);
    }
    for (const s of ['L', 'R']) { this.squash[s] = Math.max(0, this.squash[s] - dt * 6); const k = this.squash[s]; u.gloves[boneSide(s)].scale.set(1 + k * 0.35, 1 + k * 0.35, 1 - k * 0.45); }
    const tele = !this.isPlayer && this.action && this.t < this.action.p.w && this.action.type !== 'special';
    const glowAmt = tele ? 0.5 + 0.5 * Math.sin(time * 40) : 0;
    const telBone = this.action ? boneSide(gloveOf(this.action.type)) : 'L';
    if (!cine || cine.att !== this) for (const s of ['L', 'R']) { const m = u.gMats[s === 'L' ? 0 : 1]; m.emissive.setRGB(this.flash > 0 ? 0.6 : 0, this.flash > 0 ? 0.1 : 0, 0); if (tele && s === telBone) m.emissive.setRGB(glowAmt, glowAmt * 0.35, 0); }
    for (const s of ['L', 'R']) {
      const tr = u.trails[s]; const gp = u.gloves[s].getWorldPosition(_d);
      for (let k = tr.length - 1; k > 0; k--) tr[k].position.lerp(tr[k - 1].position, Math.min(1, dt * 30));
      tr[0].position.copy(gp);
      const on = active && (this.action.type === 'special' || boneSide(gloveOf(this.action.type)) === s);
      tr.forEach((sp, k) => sp.material.opacity = lerp(sp.material.opacity, on ? 0.55 * (1 - k / tr.length) : 0, Math.min(1, dt * 20)));
    }
    this.yell = Math.max(0, this.yell - dt * 1.5); const y = Math.max(this.yell, this.action && this.t >= this.action.p.w && this.t < this.action.p.w + this.action.p.a ? 0.6 : 0);
    u.mouth.scale.set(1.3 - Math.min(1, y) * 0.2, 0.3 + Math.min(1.5, y) * 1.2, 0.5);
    u.blob.position.x = this.offX;
  }
  headWorld() { return this.mesh.userData.face.getWorldPosition(V()); }
}

// ---------- GAME STATE ----------
const ROUND_TIME = 60, ROUNDS = 3, HPX = 1013;
let player, enemy, cur = null, state = 'loading', round = 1, timer = ROUND_TIME, paused = false, shake = 0, hitstop = 0, camPunch = 0;
let ai = { s: 'idle', t: 1 }, cine = null, comboQ = [], blockHeld = false;
const keys = {};
const fmt = n => Math.max(0, Math.round(n)).toLocaleString('en-US');
function AIP() { const A = ARCHETYPES[cur.archetype]; return A.switch && enemy.hp < enemy.maxHp * 0.5 ? ARCHETYPES.swarmer : A; }
function disposeFighter(f) { scene.remove(f.mesh); for (const s of ['L', 'R']) f.mesh.userData.trails[s].forEach(sp => scene.remove(sp)); }
function startFight(def) {
  cur = def; Audio.init(); hideDemo();
  if (player) disposeFighter(player); if (enemy) disposeFighter(enemy);
  player = new Fighter(null, true); player.mesh.position.set(-0.6, 0.25, 0.85); player.mesh.rotation.y = Math.PI - 0.32;
  enemy = new Fighter(def, false); enemy.mesh.position.set(0, 0.25, -0.9);
  round = 1; cine = null;
  $('pName').textContent = PLAYER.name; $('pFlag').style.backgroundImage = FLAG_PH; $('pAv').textContent = PLAYER.emoji; $('pAv').style.background = '#c22';
  const intl = def.arc >= 7 && !/^(Kuya|Ate|Mang|Aling|Tito|Tita|Lolo|Kid|Big|Little|Señor|Bossing|Pare|Mare|Doc|Sir|Coach|Idol|Master|Batang)\b/.test(def.name) && !def.boss;
  $('eName').textContent = def.name.toUpperCase(); $('eFlag').style.backgroundImage = intl ? FLAG_W : FLAG_PH; $('eAv').textContent = def.look.emoji; $('eAv').style.background = hex(def.look.topColor ?? 0x444444);
  $('menu').classList.add('hidden'); $('hud').classList.remove('hidden'); hideHud(false);
  beginRound();
}
function beginRound() {
  state = 'intro'; timer = ROUND_TIME; $('roundT').textContent = `ROUND ${round}`;
  player.reset(false); enemy.reset(false); ai = { s: 'idle', t: 1.2 }; comboQ = [];
  slam(`ROUND ${round}`, 'cyan', 1.1); setTimeout(() => { if (state === 'intro') { slam('FIGHT!', 'gold', 0.7); Audio.bell(1); Audio.cheer(0.3); state = 'fight'; } }, 1200);
}
let bannerTO;
function slam(txt, cls, dur) { const b = $('banner'); b.className = ''; void b.offsetWidth; b.textContent = txt; b.className = 'show ' + (cls || ''); clearTimeout(bannerTO); bannerTO = setTimeout(() => b.classList.remove('show'), dur * 1000); }

// ---------- FX ----------
const fx = $('fx');
function toScreen(v) { const p = v.clone().project(camera); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; }
function spawn(cls, html, x, y, life = 1000) { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; e.style.left = x + 'px'; e.style.top = y + 'px'; fx.appendChild(e); setTimeout(() => e.remove(), life); return e; }
function dmgNum(t, n, kind) { const [x, y] = toScreen(t.headWorld()); spawn('dmg ' + (kind || ''), kind === 'blk' ? 'BLOCK ' + fmt(n * HPX) : fmt(n * HPX), x + rnd(-40, 40), y + rnd(-30, 10), 900); }
function burst(t, size = 1, col) { const [x, y] = toScreen(t.headWorld()); const b = spawn('burst', '', x + rnd(-25, 25), y + rnd(-15, 25), 400); b.style.width = b.style.height = 120 * size + 'px'; if (col) b.style.background = `radial-gradient(#fff 0,${col} 45%,#ff7b00 80%)`; }
function callout(txt, cls, yOff = 0.3) { spawn('callout ' + cls, txt, innerWidth / 2 + rnd(-30, 30), innerHeight * yOff, 1000); }
function sweat(t, n = 8) { emit(t.headWorld(), n, 0xbfe8ff, 2.2, 0.06, 0.7); }
function sparks(t, col = 0xffd23f, n = 10) { emit(t.headWorld(), n, col, 3.5, 0.09, 0.35, 0); }
function flashScreen(col = 'rgba(255,0,0,.25)', ms = 200) { const f = spawn('', '', 0, 0, ms); f.style.cssText = `position:absolute;inset:0;background:${col}`; }
function hideHud(h) { ['bL', 'bR', 'bBlock', 'bHyper', 'hint'].forEach(id => $(id).style.visibility = h ? 'hidden' : ''); }

// ---------- COMBAT ----------
const arcBonus = () => 1 + 0.13 * (cur ? cur.arc : 0);
function playerPunch(type) {
  if (state !== 'fight' || player.down) return;
  if (player.action || player.stun > 0 || player.blocking) { player.queued = type; return; }
  const p = PUNCH[type], sm = player.speedMul;
  player.action = { type, p: { w: p.w / sm, a: p.a / sm, r: p.r / sm, d: p.d, s: p.s }, hit: false }; player.t = 0;
  player.weak = player.st < 20; player.st = Math.max(0, player.st - p.s); Audio.whoosh();
}
function playerDodge(dir) {
  if (state !== 'fight' || player.down) return;
  if (player.action && player.t > player.action.p.w) return;
  player.action = null; player.dodge = dir; player.dodgeT = 0.42 / (player.speedDown > 0 ? 0.8 : 1); player.st = Math.max(0, player.st - 4);
}
function hitReact(f, type, heavy) { const u = f.mesh.userData; playAnim(u, type === 'upper' || type === 'jab' ? 'Hit_Head' : 'Hit_Chest', 0.06); clearTimeout(f._hr); f._hr = setTimeout(() => { if (!f.down) playAnim(u, 'Idle_Loop', 0.3); }, heavy ? 600 : 380); }
function resolvePlayerHit(a) {
  const e = enemy, type = a.type; let dmg = a.p.d * (player.weak ? 0.45 : 1) * rnd(0.9, 1.1) * arcBonus();
  if (e.dodge !== 0) { callout('MISS', 'b', 0.42); return; }
  player.squash[gloveOf(type)] = 1;
  if (e.blocking) {
    if (type === 'upper') { dmg *= 0.6; e.blocking = false; ai = { s: 'idle', t: 0.6 }; callout('GUARD BREAK!', 'y', 0.38); }
    else { const d = Math.max(1, dmg * 0.15); e.hp -= d; e.st -= 6; dmgNum(e, d, 'blk'); Audio.thud(0.5, true); e.hitBack = 0.08; if (ARCHETYPES[cur.archetype].counter && Math.random() < 0.55) { comboQ = [['jab', .35], ['upper', .4]]; ai = { s: 'combo', t: 0.05 }; } return; }
  }
  let kind = '', counter = false;
  if (e.action && e.t < e.action.p.w && e.action.type !== 'special') { counter = true; dmg *= 1.7; e.action = null; comboQ = []; e.stun = 0.7; ai = { s: 'stun', t: 0.7 }; callout('COUNTER HIT!', 'g big', 0.3); shake = Math.max(shake, 0.3); player.hyper += 10; if (type === 'upper' && Math.random() < 0.6) { e.speedDown = 4; callout('SPEED DOWN', 'b', 0.5); } }
  if (Math.random() < (counter ? 0.35 : 0.12)) { dmg *= 1.5; kind = 'crit'; callout('CRITICAL HIT!', 'r big', 0.22); shake = Math.max(shake, 0.35); }
  e.hp -= dmg; player.dealt += dmg; player.landed++; player.hyper = clamp(player.hyper + dmg / arcBonus() * 0.6, 0, 100); e.hyper = clamp(e.hyper + dmg / arcBonus() * 0.35, 0, 100);
  e.streak = (e.streak || 0) + 1; if (e.streak >= 3 && Math.random() < 0.5 + AIP().guard) { e.streak = 0; e.action = null; comboQ = []; ai = { s: 'guard', t: rnd(0.7, 1.3) }; }
  e.flash = 0.12; e.hitBack = type === 'jab' ? 0.12 : 0.28; if (e.action && !counter && type !== 'jab' && e.action.type !== 'special') { e.action = null; comboQ = []; ai = { s: 'idle', t: 0.4 }; }
  const heavy = kind || counter || type !== 'jab'; hitReact(e, type, heavy);
  dmgNum(e, dmg, kind); burst(e, kind || counter ? 1.4 : type === 'jab' ? 0.7 : 1); sweat(e, heavy ? 10 : 4); if (heavy) sparks(e);
  Audio.thud(heavy ? 1.2 : 0.7); if (heavy) { shake = Math.max(shake, 0.18); hitstop = 0.06; camPunch = Math.max(camPunch, kind ? 1 : 0.6); Audio.cheer(0.25); crowdHype = 1; }
  if (e.hp <= 0) knockdown(e);
}
function enemyAttack(type, windMul = 1, mult = 1) {
  const A = AIP(), tier = cur.id / 99;
  const base = lerp(0.95, 0.5, tier) * A.wind / Math.max(0.6, cur.stats.speed) * windMul;
  const p = PUNCH[type]; enemy.action = { type, p: { w: Math.max(0.2, base), a: 0.1, r: 0.28, d: p.d * 1.1 * cur.stats.power * mult, s: 0 } }; enemy.t = 0;
}
function resolveEnemyHit(a) {
  if (a.type === 'feint') return;
  const p = player; enemy.squash[gloveOf(a.type)] = 1;
  if (p.dodge !== 0) {
    const goodDir = a.type === 'hookL' ? p.dodge === 1 : a.type === 'hookR' ? p.dodge === -1 : true;
    if (goodDir || Math.random() < 0.5) { callout('DODGE!', 'b', 0.45); p.hyper = clamp(p.hyper + 6, 0, 100); enemy.st -= 8; return; }
  }
  let dmg = a.p.d * rnd(0.9, 1.1);
  if (p.blocking) { const d = Math.max(1, dmg * 0.2); p.hp -= d; p.st = Math.max(0, p.st - 8); dmgNum(p, d, 'blk'); Audio.thud(0.5, true); shake = 0.06; if (p.st <= 0) { p.blocking = false; p.stun = 0.6; callout('GUARD CRUSHED', 'y', 0.5); } return; }
  let kind = ''; if (Math.random() < 0.1) { dmg *= 1.5; kind = 'crit'; }
  if (p.action && p.t < p.action.p.w) { dmg *= 1.4; p.action = null; callout('COUNTERED!', 'y', 0.55); }
  p.hp -= dmg; enemy.dealt += dmg; enemy.landed++; p.hyper = clamp(p.hyper + dmg * 0.3, 0, 100); enemy.hyper = clamp(enemy.hyper + dmg * 0.5, 0, 100);
  p.flash = 0.12; p.hitBack = 0.22; p.stun = 0.25; p.action = null; hitReact(p, a.type, true);
  if (a.type === 'upper' && Math.random() < 0.5) { p.speedDown = 5; callout('SPEED DOWN', 'b', 0.6); }
  dmgNum(p, dmg, kind); burst(p, 0.9); sweat(p, 8); Audio.thud(1); shake = Math.max(shake, 0.25); camPunch = 0.5; flashScreen();
  if (p.hp <= 0) knockdown(p);
}
function knockdown(f) {
  f.hp = 0; f.down = true; f.action = null; f.blocking = false; comboQ = []; state = 'down'; f.knockdowns++;
  playAnim(f.mesh.userData, 'Death01', 0.2); Audio.cheer(0.7); shake = 0.5; slam('DOWN!', 'gold', 1.2);
  const getsUp = f.knockdowns < 3 && Math.random() < (f.isPlayer ? 0.95 : 0.85 - (f.knockdowns - 1) * 0.35);
  let n = 0; const iv = setInterval(() => {
    if (state !== 'down') { clearInterval(iv); return; }
    n++; slam(String(n), 'gold', 0.6); Audio.thud(0.3, true);
    if (getsUp && n >= 4 + f.knockdowns) { clearInterval(iv); f.down = false; playAnim(f.mesh.userData, 'Idle_Loop', 0.5); f.hp = f.maxHp * (0.4 - f.knockdowns * 0.1); f.st = 60; state = 'fight'; slam('FIGHT!', 'gold', 0.6); ai = { s: 'retreat', t: 1 }; }
    else if (n >= 10) { clearInterval(iv); endMatch(f === enemy, f.knockdowns >= 3 ? 'T.K.O.' : 'K.O.'); }
  }, 650);
}
function endMatch(win, how) {
  state = 'over'; Audio.bell(3); Audio.cheer(0.8); slam(how, 'gold', 2.2);
  const w = win ? player : enemy; w.action = null; w.pose = t => ({ L: [-0.25, 2.55 + Math.sin(t * 8) * 0.1, 0.1], R: [0.25, 2.55 + Math.cos(t * 8) * 0.1, 0.1] });
  setTimeout(() => { if (state === 'over') { w.pose = null; w.noIK = true; playAnim(w.mesh.userData, 'Dance_Loop', 0.4); } }, 1300);
  const coins = win ? 40 + cur.arc * 12 + (cur.boss ? 120 : 0) + (how === 'K.O.' ? 20 : 0) : 10;
  if (win) { if (cur.id === SAVE.prog) SAVE.prog = Math.min(ROSTER.length, cur.id + 1); SAVE.stars[cur.id] = Math.max(SAVE.stars[cur.id] || 0, how === 'DECISION' ? 1 : how === 'T.K.O.' ? 2 : 3); }
  SAVE.coins += coins; save();
  setTimeout(() => showResult(win, how, coins), 3400);
}
function endRound() {
  Audio.bell(2); state = 'break';
  if (round >= ROUNDS) { const ps = player.dealt + player.hp * 0.3 + (enemy.knockdowns - player.knockdowns) * 30, es = enemy.dealt + enemy.hp * 0.3; endMatch(ps >= es, 'DECISION'); return; }
  slam('BREAK TIME', 'gold', 1.4); round++;
  setTimeout(showBreak, 1500);
}
function showBreak() {
  const b = $('break'); b.classList.remove('hidden');
  const eCol = hex(cur.look.topColor ?? 0x444444);
  b.innerHTML = `<div class="btitle">BREAK TIME</div><div class="stools"><div class="stool"><div class="sav" style="background:#c22">${PLAYER.emoji}</div><div class="seat"></div><b>ANGRY DOC</b><small id="bPh">HP ${fmt(player.hp * HPX)}</small></div>
   <div class="cd" id="bCd">5</div><div class="stool"><div class="sav" style="background:${eCol}">${cur.look.emoji}</div><div class="seat"></div><b>${cur.name.toUpperCase()}</b><small>HP ${fmt(enemy.hp * HPX)}</small></div></div>
   <div class="bbtns"><button class="btn bb" id="bHM">⚡ HYPER MAX<br><small>60 🪙</small></button><button class="btn bb" id="bRH">✚ RECOVER HP & CURE INJURY<br><small>90 🪙</small></button></div><div class="coins">🪙 <span id="bCoins">${SAVE.coins}</span></div>`;
  const buy = (cost, fn, id) => { if (SAVE.coins < cost) { $(id).classList.add('no'); return; } SAVE.coins -= cost; save(); $('bCoins').textContent = SAVE.coins; $(id).disabled = true; fn(); };
  $('bHM').onclick = () => buy(60, () => { player.hyper = 100; Audio.charge(); flashScreen('rgba(0,229,255,.35)', 400); }, 'bHM');
  $('bRH').onclick = () => buy(90, () => { player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.3); player.speedDown = 0; Audio.heal(); b.classList.add('heal'); emit(player.headWorld().add(_a.set(0, -0.8, 0)), 30, 0xffe23a, 1.5, 0.12, 1.2, 1.5); $('bPh').textContent = 'HP ' + fmt(player.hp * HPX); }, 'bRH');
  let n = 5; const iv = setInterval(() => { n--; const c = $('bCd'); if (c) c.textContent = n; if (n <= 0) { clearInterval(iv); b.classList.add('hidden'); b.classList.remove('heal'); player.hp = Math.min(player.maxHp, player.hp + 8); enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.05); beginRound(); } }, 1000);
}

// ---------- ULTIMATE CINEMATIC ----------
const cineEl = $('cine'), cineBg = $('cineBg');
const cbC = document.createElement('canvas'); cbC.width = 512; cbC.height = 288; const cbG = cbC.getContext('2d');
const cineTex = new THREE.CanvasTexture(cbC); cineTex.colorSpace = THREE.SRGBColorSpace;
function drawCineBg(phase, t, col) {
  const g = cbG, w = 512, h = 288, cx = w / 2, cy = h * 0.48;
  const rg = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.7);
  if (phase === 1) { rg.addColorStop(0, '#fff3a0'); rg.addColorStop(0.3, '#ff7a00'); rg.addColorStop(0.7, '#a00000'); rg.addColorStop(1, '#200000'); }
  else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.25, col); rg.addColorStop(1, '#080010'); }
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.save(); g.translate(cx, cy); g.rotate(t * (phase === 1 ? 0.6 : 2.5));
  const n = phase === 1 ? 18 : 48; g.fillStyle = phase === 1 ? 'rgba(255,230,120,.35)' : 'rgba(255,255,255,.55)';
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + Math.sin(i * 7.3) * 0.05, a2 = a + (phase === 1 ? 0.09 : 0.025); const r0 = phase === 1 ? 0 : 60 + (i * 37 % 50); g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 600, Math.sin(a) * 600); g.lineTo(Math.cos(a2) * 600, Math.sin(a2) * 600); g.closePath(); g.fill(); }
  g.restore(); cineTex.needsUpdate = true;
}
function startCine(att, def, spec) {
  if (cine || state !== 'fight') return;
  att.action = null; def.action = null; att.blocking = def.blocking = false; comboQ = [];
  cine = { t: 0, att, def, spec, phase: -1, dealt: false }; state = 'cine';
  const css = hex(spec.color);
  cineEl.classList.remove('hidden'); cineEl.style.setProperty('--sig', css); cineBg.style.setProperty('--sig', css);
  cineEl.innerHTML = `<div class="cfade"></div><div class="cname"><small>${att.isPlayer ? 'HYPER' : 'RAGE'} · ${att.isPlayer ? 'ANGRY DOC' : cur.name.toUpperCase()}</small>${spec.name}</div><div class="ctap">▶▶ Tap to fast-forward</div>`;
  Audio.charge(); hideHud(true);
}
cineEl.addEventListener('pointerdown', () => { if (cine && cine.t < 2.7) cine.t = 2.7; });
function setPhase(p) {
  if (!cine || cine.phase === p) return; cine.phase = p; cineEl.dataset.phase = p; cineBg.dataset.phase = p;
  const world = p === 0 || p >= 4; arena.visible = world; scene.background = world ? BG : cineTex; scene.fog.far = world ? 20 : 1000;
  cine.def.mesh.visible = !(p === 1 || p === 2); cineBg.classList.toggle('on', p >= 1 && p <= 3);
  if (p === 1) Audio.cheer(0.4); if (p === 2) { Audio.clink(); setTimeout(() => Audio.clink(), 250); } if (p === 3) Audio.charge();
}
function updateCine(dt) {
  const c = cine; c.t += dt; const t = c.t, a = c.att, d = c.def, u = a.mesh.userData;
  const head = a.headWorld(), fwd = V().set(0, 0, 1).applyQuaternion(a.mesh.quaternion), right = V().set(1, 0, 0).applyQuaternion(a.mesh.quaternion);
  const col = new THREE.Color(c.spec.color);
  if (c.phase >= 1 && c.phase <= 3) drawCineBg(c.phase, t, hex(c.spec.color));
  if (t < 0.35) setPhase(0);
  else if (t < 1.3) { setPhase(1); a.yell = 2.5; a.pose = () => ({ L: [-0.32, 1.55, 0.25], R: [0.32, 1.55, 0.25] }); camera.position.copy(head).addScaledVector(fwd, 0.95 - (t - 0.35) * 0.3).addScaledVector(right, 0.1); camera.lookAt(head); camera.fov = 40; }
  else if (t < 1.9) { setPhase(2); const k = Math.abs(Math.sin((t - 1.3) * 10)); a.pose = () => ({ L: [-0.03 - k * 0.12, 1.85, 0.6], R: [0.03 + k * 0.12, 1.85, 0.6] }); const gp = u.body.localToWorld(V().set(0, 1.85, 0.6)); camera.position.copy(gp).addScaledVector(fwd, 1.6).addScaledVector(right, 0.35).add(_a.set(0, 0.12, 0)); camera.lookAt(gp); camera.fov = 45; u.gMats.forEach(m => m.emissive.copy(col).multiplyScalar(k * 0.6)); }
  else if (t < 2.7) { setPhase(3); a.yell = 2; a.pose = () => ({ R: [0.48, 1.95, -0.2], L: [-0.15, 1.9, 0.45] }); const k = (t - 1.9) / 0.8; const p = a.mesh.position.clone().add(_a.set(0, 1.9, 0)); camera.position.copy(p).addScaledVector(right, -1.7 + k * 0.4).addScaledVector(fwd, 0.7).add(_b.set(0, 0.15, 0)); camera.lookAt(p.clone().addScaledVector(fwd, 0.4)); camera.fov = 50; u.gMats.forEach(m => m.emissive.copy(col).multiplyScalar(0.5 + k)); if (Math.random() < 0.6) emit(u.gloves.L.getWorldPosition(V()), 2, c.spec.color, 1.5, 0.14, 0.4, 0); }
  else if (t < 3.7) {
    setPhase(4); a.pose = null;
    if (!c.dealt) {
      c.dealt = true; a.action = { type: 'special', p: { w: 0.01, a: 0.25, r: 0.4, d: 0 }, hit: true }; a.t = 0.01;
      let dmg = c.spec.dmg; if (d.isPlayer && (blockHeld || keys['s'])) { dmg *= 0.6; callout('BRACED!', 'b', 0.6); }
      d.hp -= dmg; a.dealt += dmg; d.hitBack = 0.6; d.flash = 0.3; hitReact(d, 'upper', true);
      shake = 0.9; camPunch = 1.6; hitstop = 0.15; Audio.boom(); Audio.cheer(0.9); crowdHype = 1.5; flashScreen('rgba(255,255,255,.95)', 260);
      setTimeout(() => { const [x, y] = toScreen(d.headWorld()); spawn('dmg mega', fmt(dmg * HPX), x, y - 20, 1600); spawn('bolt', '', x, y, 600); burst(d, 3, hex(c.spec.color)); }, 30);
      sparks(d, c.spec.color, 30); sweat(d, 20);
    }
    u.gMats.forEach(m => m.emissive.copy(col).multiplyScalar(Math.max(0, 1 - (t - 2.7) * 2)));
    const p = a.mesh.position.clone().lerp(d.mesh.position, 0.5).add(_a.set(0, 1.9, 0)); camera.position.copy(p).addScaledVector(right, 2.3).addScaledVector(fwd, 0.3).add(_b.set(0, 0.3, 0)); camera.lookAt(p); camera.fov = baseFov + 6;
  } else {
    cineEl.classList.add('hidden'); cineBg.classList.remove('on'); arena.visible = true; scene.background = BG; scene.fog.far = 20; d.mesh.visible = true; a.pose = null; u.gMats.forEach(m => m.emissive.set(0));
    camera.fov = baseFov; cine = null; state = 'fight'; hideHud(false); ai = { s: 'retreat', t: 0.8 }; camera.updateProjectionMatrix(); if (d.hp <= 0) knockdown(d);
    return;
  }
  camera.updateProjectionMatrix();
}
function startHyper() {
  if (state !== 'fight' || player.hyper < 100 || player.down || cine) return; player.hyper = 0;
  startCine(player, enemy, { name: "DOCTOR'S ORDERS", color: 0x00e5ff, dmg: 34 + cur.arc * 6 });
}

// ---------- AI ----------
function updateAI(dt) {
  const e = enemy; if (e.down || cine) return;
  if (e.hyper >= 100 && !e.action && player.stun <= 0) { e.hyper = 0; startCine(e, player, { name: cur.rage.toUpperCase(), color: cur.look.sig ?? 0xff3d00, dmg: 14 + cur.stats.power * 16 }); return; }
  if (e.action) return;
  const A = AIP(); ai.t -= dt;
  e.retreat = lerp(e.retreat || 0, ai.s === 'retreat' ? 0.5 : 0, Math.min(1, dt * 4));
  if (player.action && player.t < 0.03 && e.dodge === 0 && ai.s !== 'stun' && Math.random() < A.dodge) { e.dodge = Math.random() < 0.5 ? -1 : 1; e.dodgeT = 0.4; }
  e.blocking = ai.s === 'guard';
  if (ai.t > 0) return;
  if (comboQ.length) { const [type, wm] = comboQ.shift(); enemyAttack(type, wm, 0.85); ai = { s: 'combo', t: 0.02 }; return; }
  if (ai.s === 'stun') { ai = { s: 'guard', t: 0.5 }; return; }
  const r = Math.random(), lowHp = e.hp / e.maxHp < 0.3;
  if (e.st < 25 || (lowHp && r < A.retreat + 0.1)) { ai = { s: 'retreat', t: 1.1 }; return; }
  if (r < A.guard) { ai = { s: 'guard', t: rnd(0.7, 1.4) }; return; }
  if (r < A.guard + A.combo) {
    const name = cur.combos[Math.floor(Math.random() * cur.combos.length)]; comboQ = COMBOS[name].map(s => [...s]);
    callout(name.toUpperCase() + '!', 'o', 0.18); e.st -= 6 * comboQ.length; const [type, wm] = comboQ.shift(); enemyAttack(type, wm); ai = { s: 'combo', t: 0 }; return;
  }
  ai = { s: 'idle', t: rnd(...A.idle) };
  enemyAttack(Math.random() < A.feint ? 'feint' : A.pref[Math.floor(Math.random() * A.pref.length)]); e.st -= 8;
}
function stepAction(f, dt, onHit) {
  if (!f.action) return; f.t += dt; const p = f.action.p;
  if (!f.action.hit && f.t >= p.w) { f.action.hit = true; onHit(f.action); }
  if (f.action && f.t >= p.w + p.a + p.r) { f.action = null; if (f.isPlayer && f.queued) { const q = f.queued; f.queued = null; playerPunch(q); } }
}

// ---------- INPUT ----------
let gStart = null;
canvas.addEventListener('pointerdown', e => { Audio.init(); gStart = { x: e.clientX, y: e.clientY }; });
canvas.addEventListener('pointerup', e => {
  if (!gStart) return; const dx = e.clientX - gStart.x, dy = e.clientY - gStart.y; gStart = null;
  if (Math.hypot(dx, dy) < 28) playerPunch('jab'); else if (-dy > Math.abs(dx) * 0.8) playerPunch('upper'); else if (Math.abs(dx) > Math.abs(dy)) playerPunch(dx < 0 ? 'hookL' : 'hookR'); else playerPunch('jab');
});
function holdBtn(id, down, up) { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); Audio.init(); b.classList.add('on'); down(); }); const u = () => { b.classList.remove('on'); up && up(); }; b.addEventListener('pointerup', u); b.addEventListener('pointerleave', u); b.addEventListener('pointercancel', u); }
holdBtn('bL', () => playerDodge(-1)); holdBtn('bR', () => playerDodge(1));
holdBtn('bBlock', () => blockHeld = true, () => blockHeld = false); holdBtn('bHyper', startHyper);
addEventListener('keydown', e => {
  if (e.repeat) return; const k = e.key.toLowerCase(); keys[k] = true; Audio.init();
  if (cine && (k === ' ' || k === 'enter')) { e.preventDefault(); if (cine.t < 2.7) cine.t = 2.7; return; }
  if (k === 'a' || k === 'arrowleft') playerDodge(-1); if (k === 'd' || k === 'arrowright') playerDodge(1);
  if (k === 'j') playerPunch('jab'); if (k === 'k') playerPunch('hookL'); if (k === 'l') playerPunch('hookR'); if (k === 'i') playerPunch('upper');
  if (k === ' ') { e.preventDefault(); startHyper(); } if (k === 'p' || k === 'escape') togglePause(); if (k === 'm') toggleMute();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
$('pauseBtn').onclick = togglePause;
function toggleMute() { Audio.setMute(!SAVE.muted); $('muteBtn').textContent = SAVE.muted ? '🔇' : '🔊'; }
$('muteBtn').onclick = toggleMute; $('muteBtn').textContent = SAVE.muted ? '🔇' : '🔊';
function togglePause() {
  if (!['fight', 'intro'].includes(state) && !paused) return; paused = !paused;
  if (paused) showMenu(`<h1>PAUSED</h1><br><button class="btn" id="mRes">RESUME</button><button class="btn sec" id="mQuit">QUIT TO CHAPTER</button>`, { mRes: togglePause, mQuit: () => { paused = false; showArc(cur.arc); } });
  else $('menu').classList.add('hidden');
}

// ---------- MENUS ----------
function showMenu(html, handlers) { const m = $('menu'); m.innerHTML = html; m.classList.remove('hidden'); m.scrollTop = 0; for (const id in handlers) { const el = $(id); if (el) el.onclick = () => { Audio.init(); handlers[id](); }; } }
const coinBar = () => `<div class="coins top">🪙 ${SAVE.coins}</div>`;
function toMenu() { $('hud').classList.add('hidden'); $('break').classList.add('hidden'); state = 'menu'; showDemo(); }
const avBg = f => hex(f.look.topColor ?? 0x444444);
function showTitle() {
  toMenu();
  showMenu(`${coinBar()}<h1>ANGRY DOC</h1><h2>UNDERGROUND KNOCKOUT</h2><p>100 fighters. 10 chapters. One physical therapist with a mean right hand.</p><br>
  <div><button class="btn" id="mStory">STORY MODE</button></div><div><button class="btn sec" id="mGal">FIGHTERS</button><button class="btn sec" id="mShop">GEAR SHOP</button><button class="btn sec" id="mHow">HOW TO PLAY</button></div>
  <p style="font-size:11px;opacity:.6">Progress: ${SAVE.prog}/${ROSTER.length} fighters defeated</p>`, { mStory: showStory, mGal: showGallery, mShop: showShop, mHow: showHow });
}
function showHow() {
  showMenu(`<h1>HOW TO PLAY</h1><p><b>Touch:</b> TAP = Jab · SWIPE ←/→ = Hook · SWIPE ↑ = Uppercut · ◀ ▶ = Dodge · hold 🛡 = Block · HYPER (left side) when full.</p>
  <p><b>Keys:</b> J jab · K / L hooks · I uppercut · A / D dodge · hold S block · SPACE hyper / fast-forward · P pause · M mute.</p>
  <p>When the opponent's glove <b style="color:#f80">glows orange</b> he's winding up — hit him then for a <b style="color:#4f4">COUNTER HIT</b>, or dodge away from the hook. Combo names are called out. Uppercuts break guard. Under 20% stamina you're weak and slow.</p>
  <p>When the opponent's green RAGE meter fills he fires his ultimate automatically — hold BLOCK to brace. In the break, spend coins on Hyper Max or Recover HP. 3 knockdowns = TKO, a 10-count = KO, otherwise a decision.</p><br><button class="btn" id="mBack">BACK</button>`, { mBack: showTitle });
}
function showStory() {
  toMenu();
  const cards = ARCS.map((a, i) => { const open = SAVE.prog >= i * 10, done = clamp(SAVE.prog - i * 10, 0, 10), boss = ROSTER[i * 10 + 9];
    return `<div class="card arc ${open ? '' : 'locked'}" id="arc${i}"><div class="big">${open ? (done >= 10 ? '🏆' : '🥊') : '🔒'}</div><b>CH.${i + 1} ${a.name}</b><small>${open ? done + '/10 · Boss: ' + boss.name : 'Defeat the previous boss'}</small></div>`; }).join('');
  const h = { mBack: showTitle }; ARCS.forEach((_, i) => { if (SAVE.prog >= i * 10) h['arc' + i] = () => SAVE.seenArc[i] ? showArc(i) : showChapter(i); });
  showMenu(`${coinBar()}<h1 style="font-size:36px">STORY MODE</h1><div class="ladder">${cards}</div><br><button class="btn sec" id="mBack">BACK</button>`, h);
}
function showChapter(i) {
  toMenu(); const a = ARCS[i]; SAVE.seenArc[i] = 1; save(); const boss = ROSTER[i * 10 + 9];
  showMenu(`<div class="chapter"><small>CHAPTER ${i + 1}</small><h1>${a.name}</h1><p class="tw" id="tw"></p><p class="quote" style="opacity:.8">${boss.name}: “${boss.pre}”</p><br><button class="btn" id="mGo">CONTINUE</button></div>`, { mGo: () => showArc(i) });
  const el = $('tw'); let k = 0; const iv = setInterval(() => { if (!el.isConnected) return clearInterval(iv); el.textContent = a.intro.slice(0, ++k); if (k >= a.intro.length) clearInterval(iv); }, 18);
}
function showArc(i) {
  toMenu(); const a = ARCS[i], list = ROSTER.slice(i * 10, i * 10 + 10);
  const cards = list.map(f => { const open = f.id <= SAVE.prog, st = SAVE.stars[f.id] || 0;
    return `<div class="card fc ${open ? '' : 'locked'} ${f.boss ? 'boss' : ''}" id="ft${f.id}"><div class="av2" style="background:${open ? avBg(f) : '#333'}">${open ? f.look.emoji : '?'}</div><b>${open ? f.name : '???'}</b><small>${open ? f.archetype : ''}${f.boss ? ' · BOSS' : ''}</small><div class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div></div>`; }).join('');
  const h = { mBack: showStory, mCh: () => showChapter(i) }; list.forEach(f => { if (f.id <= SAVE.prog) h['ft' + f.id] = () => showPreFight(f); });
  showMenu(`${coinBar()}<h1 style="font-size:30px">CH.${i + 1} ${a.name}</h1><div class="ladder small">${cards}</div><br><button class="btn sec" id="mBack">BACK</button><button class="btn sec" id="mCh">REPLAY CUTSCENE</button>`, h);
}
function statBars(f) { const s = f.stats, row = (n, v, m) => `<div class="sr"><span>${n}</span><i style="width:${clamp(v / m, 0.05, 1) * 100}%"></i></div>`; return row('HP', s.hp, 450) + row('POW', s.power, 1.7) + row('SPD', s.speed, 2) + row('DEF', s.defense, 0.6) + row('STA', s.stamina, 150); }
function showPreFight(f) {
  showMenu(`<div class="vs"><div class="vsl"><div class="av2 xl" style="background:#c22">🩺</div><b>ANGRY DOC</b><small>${PLAYER.nick}</small></div><div class="vsx">VS</div>
   <div class="vsl"><div class="av2 xl" style="background:${avBg(f)}">${f.look.emoji}</div><b>${f.name}</b><small>"${f.nick}"</small></div></div>
   <p class="intro">${f.intro}</p><p class="quote">“${f.pre}”</p>
   <div class="info"><div>${statBars(f)}</div><div class="cmb"><b>${f.archetype.toUpperCase()}</b> · Lv ${f.level}<br>Combos: ${f.combos.join(', ')}<br>Rage: <span style="color:${hex(f.look.sig)}">${f.rage}</span></div></div>
   <button class="btn" id="mF">FIGHT!</button><button class="btn sec" id="mB">BACK</button>`, { mF: () => startFight(f), mB: () => showArc(f.arc) });
}
function showGallery() {
  toMenu();
  const cards = ROSTER.map(f => f.id <= SAVE.prog
    ? `<div class="card gc ${f.boss ? 'boss' : ''}"><div class="av2" style="background:${avBg(f)}">${f.look.emoji}</div><b>#${f.id + 1} ${f.name}</b><small>"${f.nick}"<br>${f.archetype} · Lv ${f.level}${f.look.gear ? ' · ' + f.look.gear + ' gear' : ''}</small>${statBars(f)}<small class="cm">${f.combos.join(' / ')}<br>Rage: ${f.rage}</small></div>`
    : `<div class="card gc locked"><div class="av2" style="background:#222">?</div><b>#${f.id + 1} ???</b><small>${ARCS[f.arc].name}</small></div>`).join('');
  showMenu(`<h1 style="font-size:32px">FIGHTERS</h1><h2>${Math.min(SAVE.prog + 1, 100)}/100 unlocked</h2><div class="ladder gal">${cards}</div><br><button class="btn sec" id="mBack">BACK</button>`, { mBack: showTitle });
}
function showShop() {
  toMenu();
  const cards = SHOP.map(s => { const own = SAVE.owned[s.id], eq = SAVE.glove === s.id || SAVE.outfit === s.id;
    return `<div class="card sc ${eq ? 'eq' : ''}"><div class="av2" style="background:${hex(s.glove ?? s.topColor)};${s.glow ? `box-shadow:0 0 14px ${hex(s.glow)}` : ''}">${s.kind === 'glove' ? '🥊' : '🥼'}</div><b>${s.name}</b><small>${s.kind}${s.gear ? ' · ' + s.gear : ''}</small>
     <button class="btn mini" id="sh_${s.id}">${eq ? 'EQUIPPED' : own ? 'EQUIP' : s.cost + ' 🪙'}</button></div>`; }).join('');
  const h = { mBack: showTitle };
  SHOP.forEach(s => h['sh_' + s.id] = () => { if (!SAVE.owned[s.id]) { if (SAVE.coins < s.cost) return; SAVE.coins -= s.cost; SAVE.owned[s.id] = 1; } SAVE[s.kind] = s.id; save(); refreshDemo(); showShop(); });
  showMenu(`${coinBar()}<h1 style="font-size:32px">GEAR SHOP</h1><h2>Cosmetic gloves & outfits for the Doc</h2><div class="ladder small">${cards}</div><br><button class="btn sec" id="mBack">BACK</button>`, h);
}
function showResult(win, how, coins) {
  $('hud').classList.add('hidden'); state = 'menu';
  const next = win && cur.id + 1 < ROSTER.length ? ROSTER[cur.id + 1] : null, arcDone = win && cur.boss;
  const h = { mAgain: () => startFight(cur), mLad: () => showArc(cur.arc) };
  if (next) h.mNext = () => (arcDone ? showChapter(next.arc) : showPreFight(next));
  showMenu(`<h1>${win ? 'YOU WIN!' : 'YOU LOSE'}</h1><h2>${how}</h2><p class="quote">${cur.name}: “${win ? cur.post : 'Go back to your clinic, Doc!'}”</p>
   <p>Damage dealt: ${fmt(player.dealt * HPX)} · Punches landed: ${player.landed} · Damage taken: ${fmt(enemy.dealt * HPX)} · +${coins} 🪙</p>
   ${arcDone ? `<p style="color:#ffd23f">🏆 CHAPTER ${cur.arc + 1} COMPLETE! ${cur.arc === 9 ? 'YOU ARE THE WORLD UNDERGROUND CHAMPION!' : ''}</p>` : ''}<br>
   ${next ? `<button class="btn" id="mNext">${arcDone ? 'NEXT CHAPTER' : 'NEXT FIGHT'}</button>` : ''}<button class="btn ${next ? 'sec' : ''}" id="mAgain">REMATCH</button><button class="btn sec" id="mLad">CHAPTER</button>`, h);
}

// ---------- HUD ----------
function setBar(id, frac) { $(id).style.width = clamp(frac, 0, 1) * 100 + '%'; }
function hud() {
  setBar('pHp', player.hp / player.maxHp); setBar('pHpLag', player.hp / player.maxHp); setBar('eHp', enemy.hp / enemy.maxHp); setBar('eHpLag', enemy.hp / enemy.maxHp);
  $('pHpN').textContent = fmt(player.hp * HPX); $('eHpN').textContent = fmt(enemy.hp * HPX);
  setBar('pSt', player.st / 100); setBar('eSt', enemy.st / 100);
  $('pStT').textContent = Math.round(player.st) + '%'; $('eStT').textContent = Math.round(Math.max(0, enemy.st)) + '%';
  $('pSt').parentElement.classList.toggle('low', player.st < 20); $('eSt').parentElement.classList.toggle('low', enemy.st < 20);
  $('pHyRing').style.background = `conic-gradient(#2ef ${player.hyper}%,#223 0%)`; $('eHyRing').style.background = `conic-gradient(#3f6 ${enemy.hyper}%,#223 0%)`;
  $('pHyRing').classList.toggle('full', player.hyper >= 100); $('bHyper').classList.toggle('ready', player.hyper >= 100); $('bHyper').style.setProperty('--p', player.hyper + '%');
  $('timer').textContent = String(Math.ceil(Math.max(0, timer))).padStart(2, '0');
  $('pDeb').textContent = player.speedDown > 0 ? '▼ SPEED DOWN' : player.st < 20 ? '▼ EXHAUSTED' : '';
  $('eDeb').textContent = enemy.speedDown > 0 ? 'SPEED DOWN ▼' : enemy.st < 20 ? 'EXHAUSTED ▼' : '';
}

// ---------- MENU BACKDROP ----------
let demo = [];
function showDemo() { if (!demo.length) refreshDemo(); demo.forEach(d => d.mesh.visible = true); if (player) player.mesh.visible = enemy.mesh.visible = false; }
function hideDemo() { demo.forEach(d => d.mesh.visible = false); }
function refreshDemo() {
  demo.forEach(disposeFighter); demo = [];
  const a = new Fighter(null, true); a.mesh.position.set(-0.75, 0.25, 0.2); a.mesh.rotation.y = 0.5;
  const b = new Fighter(ROSTER[Math.min(SAVE.prog, 99)], false); b.mesh.position.set(0.85, 0.25, -0.6); b.mesh.rotation.y = -0.5; demo = [a, b];
}

// ---------- LOOP ----------
const clock = new THREE.Clock(); let time = 0, fpsAcc = 0, fpsN = 0, idleA = 0; window.__fps = 0;
function loop() {
  requestAnimationFrame(loop);
  let dt = Math.min(clock.getDelta(), 0.05); fpsAcc += dt; fpsN++; if (fpsAcc > 1) { window.__fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
  if (paused || state === 'loading') { renderer.render(scene, camera); return; }
  time += dt; if (hitstop > 0) { hitstop -= dt; dt *= 0.15; }
  crowdHype = Math.max(0, crowdHype - dt * 0.8);
  for (const s of crowd) s.position.y = s.userData.y + Math.abs(Math.sin(time * s.userData.sp * (0.5 + crowdHype * 0.6) + s.userData.p)) * (0.05 + crowdHype * 0.2);
  updateParts(dt);
  if (state === 'menu' && !player?.mesh.visible) {
    demo.forEach(d => d.update(dt, time)); idleA += dt * 0.15; camera.position.set(Math.sin(idleA) * 3.6, 2.5, Math.cos(idleA) * 3.6); camera.lookAt(0, 1.6, -0.2); camera.fov = baseFov; camera.updateProjectionMatrix();
  } else if (player && enemy) {
    if (state === 'fight') {
      timer -= dt; if (timer <= 0) { timer = 0; endRound(); }
      player.blocking = (blockHeld || keys['s'] || keys['arrowdown']) && !player.action && player.stun <= 0 && player.dodge === 0;
      stepAction(player, dt, resolvePlayerHit);
      if (state === 'fight') { updateAI(dt); stepAction(enemy, dt * (enemy.speedDown > 0 ? 0.7 : 1), resolveEnemyHit); }
    } else if (state === 'cine') { stepAction(cine.att, dt, () => {}); }
    player.update(dt, time); enemy.update(dt, time); hud();
    if (state === 'cine') updateCine(dt);
    else {
      camPunch = Math.max(0, camPunch - dt * 3);
      const t = _a.copy(CAM_BASE); t.x += player.offX * 0.5; t.z -= camPunch * 0.45; camera.position.lerp(t, Math.min(1, dt * 8));
      camera.lookAt(CAM_LOOK.x + enemy.offX * 0.3, CAM_LOOK.y, CAM_LOOK.z); camera.fov = lerp(camera.fov, baseFov - camPunch * 6, Math.min(1, dt * 10)); camera.updateProjectionMatrix();
    }
    if (shake > 0) { shake -= dt; camera.position.x += rnd(-1, 1) * shake * 0.25; camera.position.y += rnd(-1, 1) * shake * 0.25; }
  }
  if (window.__dbgCam) { const d = window.__dbgCam; camera.position.set(...d.p); camera.lookAt(...d.t); camera.fov = d.fov || 40; camera.updateProjectionMatrix(); }
  renderer.render(scene, camera);
}
window.__game = { get state() { return state; }, start: i => startFight(ROSTER[i]), get player() { return player; }, get enemy() { return enemy; }, roster: ROSTER, save: SAVE, endRound: () => { timer = 0.01; }, rage: () => { enemy.hyper = 100; }, showGallery, showStory };
loop();
loader.load('models/boxer.glb', g => {
  BASE = g.scene; g.animations.forEach(a => CLIPS[a.name] = a);
  for (const n in CLIPS) CLIPS[n].tracks = CLIPS[n].tracks.filter(t => !/\.scale$/.test(t.name) && (n === 'Death01' || !/(root|hips)\.position/.test(t.name)));
  BASE.updateMatrixWorld(true); let ua = null; BASE.traverse(o => { if (/upper_arm\.?L$/.test(o.name)) ua = o; });
  RIG_S = 1.66 / ua.getWorldPosition(V()).y;
  $('loading').remove(); state = 'menu'; showTitle();
}, ev => { if (ev.total) $('loading').textContent = 'Loading fighters… ' + Math.round(ev.loaded / ev.total * 100) + '%'; }, err => { $('loading').textContent = 'Failed to load model: ' + (err.message || err); console.error(err); });
