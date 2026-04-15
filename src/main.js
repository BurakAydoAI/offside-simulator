import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── DOM refs ──
const container = document.getElementById('pitch-container');
const resultEl = document.getElementById('result');
const resetBtn = document.getElementById('resetBtn');
const clearPassBtn = document.getElementById('clearPassBtn');
const randomBtn = document.getElementById('randomBtn');
const guessBtn = document.getElementById('guessBtn');
const guessPanel = document.getElementById('guessPanel');
const guessPrompt = document.getElementById('guessPrompt');
const guessOffsideBtn = document.getElementById('guessOffsideBtn');
const guessOnsideBtn = document.getElementById('guessOnsideBtn');
const revealBtn = document.getElementById('revealBtn');
const nextBtn = document.getElementById('nextBtn');
const guessScoreEl = document.getElementById('guessScore');
const langBtn = document.getElementById('langBtn');

// ── i18n ──
const I18N = {
  en: {
    title: 'Football Offside Simulator',
    howTo: '<strong>How to use:</strong> Drag players to position them on the pitch. Click an <span class="att-color">attacker</span> to select the passer, then click another <span class="att-color">attacker</span> to pass to.',
    resetBtn: 'Reset Positions',
    clearPassBtn: 'Clear Pass',
    randomBtn: 'Random Positions & Pass',
    guessModeOn: 'Guess Mode: ON',
    guessModeOff: 'Guess Mode: OFF',
    offsideBtn: 'OFFSIDE',
    onsideBtn: 'ONSIDE',
    revealBtn: 'Reveal',
    nextBtn: 'Next Round',
    promptIdle: 'Set up a pass, then guess!',
    promptRevealed: 'Revealed — set up the next pass when ready.',
    promptLocked: (g) => `Guess locked in: ${g}. Hit Reveal when everyone has guessed.`,
    promptReady: 'Pass is set — take your guess!',
    score: (c, t) => `Score: ${c} / ${t}`,
    offsideResult: 'OFFSIDE — the receiver is past the offside line.',
    onsideResult: (reason) => `ONSIDE — ${reason}`,
    reasonOwnHalf: 'the receiver is in their own half.',
    reasonBallPast: 'the ball is past the offside line.',
    reasonBehindBall: 'the receiver is behind the ball.',
    reasonBehindLine: 'the receiver is behind the offside line.',
    legendAttackers: 'Attackers (left to right)',
    legendDefenders: 'Defenders (right to left)',
    legendGoalkeepers: 'Goalkeepers',
    legendOffsideLine: 'Offside line',
    offsideLineLabel: 'OFFSIDE LINE',
    langToggle: 'Türkçe',
  },
  tr: {
    title: 'Futbol Ofsayt Simülatörü',
    howTo: '<strong>Nasıl kullanılır:</strong> Oyuncuları sahada konumlandırmak için sürükleyin. Pas veren oyuncuyu seçmek için bir <span class="att-color">hücumcuya</span>, pasın gideceği oyuncuyu seçmek için başka bir <span class="att-color">hücumcuya</span> tıklayın.',
    resetBtn: 'Konumları Sıfırla',
    clearPassBtn: 'Pası Temizle',
    randomBtn: 'Rastgele Konum ve Pas',
    guessModeOn: 'Tahmin Modu: AÇIK',
    guessModeOff: 'Tahmin Modu: KAPALI',
    offsideBtn: 'OFSAYT',
    onsideBtn: 'OFSAYT DEĞİL',
    revealBtn: 'Göster',
    nextBtn: 'Sonraki Tur',
    promptIdle: 'Bir pas ayarlayın, sonra tahmin edin!',
    promptRevealed: 'Gösterildi — hazır olduğunda sonraki pası ayarlayın.',
    promptLocked: (g) => `Tahmin kaydedildi: ${g}. Herkes tahmin ettikten sonra Göster\'e basın.`,
    promptReady: 'Pas ayarlandı — tahmininizi yapın!',
    score: (c, t) => `Skor: ${c} / ${t}`,
    offsideResult: 'OFSAYT — pası alan ofsayt çizgisinin önünde.',
    onsideResult: (reason) => `OFSAYT DEĞİL — ${reason}`,
    reasonOwnHalf: 'pası alan kendi sahasında.',
    reasonBallPast: 'top ofsayt çizgisinin önünde.',
    reasonBehindBall: 'pası alan topun arkasında.',
    reasonBehindLine: 'pası alan ofsayt çizgisinin arkasında.',
    legendAttackers: 'Hücumcular (soldan sağa)',
    legendDefenders: 'Savunmacılar (sağdan sola)',
    legendGoalkeepers: 'Kaleciler',
    legendOffsideLine: 'Ofsayt çizgisi',
    offsideLineLabel: 'OFSAYT ÇİZGİSİ',
    langToggle: 'English',
  },
};

let currentLang = 'en';
function t() { return I18N[currentLang]; }

// ── Constants ──
const PITCH_LENGTH = 90;
const PITCH_WIDTH = 56;
const HALF_L = PITCH_LENGTH / 2;
const HALF_W = PITCH_WIDTH / 2;
const HALFWAY_X = 0;
const PLAYER_RADIUS = 0.5;
const PLAYER_BODY_HEIGHT = 1.0;

// ── Scene setup ──
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
scene.fog = new THREE.Fog(0x1a1a2e, 80, 150);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1280, 720);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);
renderer.domElement.style.touchAction = 'none';

const camera = new THREE.PerspectiveCamera(50, 1280 / 720, 0.1, 500);
camera.position.set(0, 55, 45);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.maxPolarAngle = Math.PI / 2.15;
controls.minDistance = 20;
controls.maxDistance = 120;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.update();

// ── Lighting ──
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
dirLight.position.set(30, 50, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -60;
dirLight.shadow.camera.right = 60;
dirLight.shadow.camera.top = 40;
dirLight.shadow.camera.bottom = -40;
scene.add(dirLight);

// ── Pitch ──
function buildPitch() {
  const pitchGroup = new THREE.Group();

  // Ground
  const groundGeo = new THREE.PlaneGeometry(PITCH_LENGTH + 16, PITCH_WIDTH + 16);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1b6e34, roughness: 0.9 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  pitchGroup.add(ground);

  // Playing field
  const fieldGeo = new THREE.PlaneGeometry(PITCH_LENGTH, PITCH_WIDTH);
  const fieldMat = new THREE.MeshStandardMaterial({ color: 0x2d8a4e, roughness: 0.85 });
  const field = new THREE.Mesh(fieldGeo, fieldMat);
  field.rotation.x = -Math.PI / 2;
  field.position.y = 0.01;
  field.receiveShadow = true;
  pitchGroup.add(field);

  // Grass stripes
  const stripeW = PITCH_LENGTH / 10;
  for (let i = 0; i < 10; i += 2) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(stripeW, PITCH_WIDTH),
      new THREE.MeshStandardMaterial({ color: 0x339e55, roughness: 0.85 })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(-HALF_L + stripeW * i + stripeW / 2, 0.02, 0);
    stripe.receiveShadow = true;
    pitchGroup.add(stripe);
  }

  // Helper: line from points
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  function makeLine(points) {
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(p[0], 0.03, p[1])));
    const line = new THREE.Line(geo, lineMat.clone());
    pitchGroup.add(line);
    return line;
  }

  // Boundary
  makeLine([[-HALF_L, -HALF_W], [HALF_L, -HALF_W], [HALF_L, HALF_W], [-HALF_L, HALF_W], [-HALF_L, -HALF_W]]);

  // Halfway line
  makeLine([[0, -HALF_W], [0, HALF_W]]);

  // Center circle
  const circlePoints = [];
  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    circlePoints.push([Math.cos(angle) * 7, Math.sin(angle) * 7]);
  }
  makeLine(circlePoints);

  // Center dot
  const dotGeo = new THREE.CircleGeometry(0.4, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  dot.rotation.x = -Math.PI / 2;
  dot.position.y = 0.03;
  pitchGroup.add(dot);

  // Penalty areas (16.5m from goal line, 20.15m each side)
  const paDepth = 16.5;
  const paHalfW = 20;
  // Left
  makeLine([[-HALF_L, -paHalfW], [-HALF_L + paDepth, -paHalfW], [-HALF_L + paDepth, paHalfW], [-HALF_L, paHalfW]]);
  // Right
  makeLine([[HALF_L, -paHalfW], [HALF_L - paDepth, -paHalfW], [HALF_L - paDepth, paHalfW], [HALF_L, paHalfW]]);

  // Goal areas (5.5m from goal line, 9.15m each side)
  const gaDepth = 5.5;
  const gaHalfW = 9;
  // Left
  makeLine([[-HALF_L, -gaHalfW], [-HALF_L + gaDepth, -gaHalfW], [-HALF_L + gaDepth, gaHalfW], [-HALF_L, gaHalfW]]);
  // Right
  makeLine([[HALF_L, -gaHalfW], [HALF_L - gaDepth, -gaHalfW], [HALF_L - gaDepth, gaHalfW], [HALF_L, gaHalfW]]);

  // Goals (3D frames)
  const goalW = 7.32;
  const goalH = 2.44;
  const goalD = 2;
  function makeGoal(x, dir) {
    const goalGroup = new THREE.Group();
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 });
    const postRadius = 0.12;

    // Left post
    const post1 = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalH, 8), postMat);
    post1.position.set(x, goalH / 2, -goalW / 2);
    goalGroup.add(post1);

    // Right post
    const post2 = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalH, 8), postMat);
    post2.position.set(x, goalH / 2, goalW / 2);
    goalGroup.add(post2);

    // Crossbar
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalW, 8), postMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(x, goalH, 0);
    goalGroup.add(bar);

    // Net (semi-transparent)
    const netMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
    // Back
    const backNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalH), netMat);
    backNet.position.set(x + dir * goalD, goalH / 2, 0);
    goalGroup.add(backNet);
    // Top
    const topNet = new THREE.Mesh(new THREE.PlaneGeometry(goalW, goalD), netMat);
    topNet.rotation.x = Math.PI / 2;
    topNet.position.set(x + dir * goalD / 2, goalH, 0);
    goalGroup.add(topNet);

    pitchGroup.add(goalGroup);
  }
  makeGoal(-HALF_L, -1);
  makeGoal(HALF_L, 1);

  scene.add(pitchGroup);
}
buildPitch();

// ── Players ──
function createDefaultPlayers() {
  return [
    // Attacking team (red) - attacking towards +X
    { id: 'A-GK', x: -42, z: 0, team: 'attack', role: 'gk', label: 'GK' },
    { id: 'A1', x: -23, z: -14, team: 'attack', role: 'player', label: 'A1' },
    { id: 'A2', x: -18, z: 0, team: 'attack', role: 'player', label: 'A2' },
    { id: 'A3', x: -23, z: 14, team: 'attack', role: 'player', label: 'A3' },
    { id: 'A4', x: 2, z: -8, team: 'attack', role: 'player', label: 'A4' },
    { id: 'A5', x: 2, z: 8, team: 'attack', role: 'player', label: 'A5' },

    // Defending team (blue) - defending the +X goal
    { id: 'D-GK', x: 42, z: 0, team: 'defend', role: 'gk', label: 'GK' },
    { id: 'D1', x: 27, z: -16, team: 'defend', role: 'player', label: 'D1' },
    { id: 'D2', x: 24, z: -2, team: 'defend', role: 'player', label: 'D2' },
    { id: 'D3', x: 24, z: 12, team: 'defend', role: 'player', label: 'D3' },
    { id: 'D4', x: 12, z: 0, team: 'defend', role: 'player', label: 'D4' },
  ];
}

let players = createDefaultPlayers();
const playerMeshes = new Map(); // id -> { group, body, ring, label }
const draggableBodies = []; // array of body meshes for raycasting

function getPlayerColor(p) {
  if (p.role === 'gk') return 0xf1c40f;
  if (p.team === 'attack') return 0xe74c3c;
  return 0x3498db;
}

function createLabelSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 40px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Background pill
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  const tw = ctx.measureText(text).width + 24;
  const rx = (128 - tw) / 2;
  ctx.beginPath();
  ctx.roundRect(rx, 8, tw, 48, 12);
  ctx.fill();

  // Text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 64, 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3, 1.5, 1);
  return sprite;
}

function buildPlayerMesh(p) {
  const group = new THREE.Group();
  const color = getPlayerColor(p);

  // Body - capsule
  const bodyGeo = new THREE.CapsuleGeometry(PLAYER_RADIUS, PLAYER_BODY_HEIGHT, 8, 16);
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = PLAYER_RADIUS + PLAYER_BODY_HEIGHT / 2;
  body.castShadow = true;
  body.userData.playerId = p.id;
  group.add(body);

  // Selection ring (hidden by default)
  const ringGeo = new THREE.TorusGeometry(0.9, 0.08, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xf39c12 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  ring.visible = false;
  group.add(ring);

  // Label sprite
  const label = createLabelSprite(p.label, color);
  label.position.y = PLAYER_RADIUS + PLAYER_BODY_HEIGHT + 1.5;
  group.add(label);

  group.position.set(p.x, 0, p.z);
  scene.add(group);

  const entry = { group, body, ring, label, data: p };
  playerMeshes.set(p.id, entry);
  draggableBodies.push(body);

  return entry;
}

function buildAllPlayers() {
  players.forEach(p => buildPlayerMesh(p));
}

function syncMeshPositions() {
  players.forEach(p => {
    const entry = playerMeshes.get(p.id);
    if (entry) entry.group.position.set(p.x, 0, p.z);
  });
}

function removeAllPlayerMeshes() {
  playerMeshes.forEach(entry => {
    scene.remove(entry.group);
    entry.body.geometry.dispose();
    entry.body.material.dispose();
    entry.ring.geometry.dispose();
    entry.ring.material.dispose();
    entry.label.material.map.dispose();
    entry.label.material.dispose();
  });
  playerMeshes.clear();
  draggableBodies.length = 0;
}

buildAllPlayers();

// ── Offside Line ──
const offsideLineMat = new THREE.LineDashedMaterial({
  color: 0xf1c40f,
  dashSize: 1.0,
  gapSize: 0.6,
  linewidth: 1,
  transparent: true,
  opacity: 0.9,
});

const offsideLineGeo = new THREE.BufferGeometry();
const offsideLine = new THREE.Line(offsideLineGeo, offsideLineMat);
scene.add(offsideLine);

// Offside plane (translucent vertical wall)
const offsidePlaneMat = new THREE.MeshBasicMaterial({
  color: 0xf1c40f,
  transparent: true,
  opacity: 0.07,
  side: THREE.DoubleSide,
});
const offsidePlaneGeo = new THREE.PlaneGeometry(PITCH_WIDTH, 4);
const offsidePlane = new THREE.Mesh(offsidePlaneGeo, offsidePlaneMat);
offsidePlane.position.y = 2;
scene.add(offsidePlane);

// Offside label — canvas is kept around so we can redraw on language change
const offsideLabelCanvas = document.createElement('canvas');
offsideLabelCanvas.width = 256;
offsideLabelCanvas.height = 48;
const offsideLabelTexture = new THREE.CanvasTexture(offsideLabelCanvas);
offsideLabelTexture.minFilter = THREE.LinearFilter;
const offsideLabel = new THREE.Sprite(
  new THREE.SpriteMaterial({ map: offsideLabelTexture, transparent: true, depthTest: false })
);
offsideLabel.scale.set(8, 1.5, 1);
scene.add(offsideLabel);

function redrawOffsideLabel(text) {
  const ctx = offsideLabelCanvas.getContext('2d');
  ctx.clearRect(0, 0, offsideLabelCanvas.width, offsideLabelCanvas.height);
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(text, 128, 24);
  offsideLabelTexture.needsUpdate = true;
}
redrawOffsideLabel('OFFSIDE LINE');

function getOffsideLine() {
  const defenders = players.filter(p => p.team === 'defend');
  const sorted = defenders.map(p => p.x).sort((a, b) => b - a);
  return sorted.length >= 2 ? sorted[1] : sorted[0];
}

function updateOffsideLine() {
  const lineX = getOffsideLine();
  const positions = new Float32Array([
    lineX, 0.04, -HALF_W,
    lineX, 0.04, HALF_W,
  ]);
  offsideLineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  offsideLine.computeLineDistances();

  offsidePlane.position.set(lineX, 2, 0);
  offsidePlane.rotation.y = Math.PI / 2;

  offsideLabel.position.set(lineX, 4.5, -HALF_W - 1.5);
}
updateOffsideLine();

// ── Pass Line ──
let selectedPasser = null;
let passTarget = null;
let passLineObj = null;  // { line, arrow, ball }

function createPassVisuals(from, to) {
  removePassVisuals();

  const group = new THREE.Group();
  const y = 1.2;
  const PASS_COLOR = 0xf39c12;

  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dz, dx);

  // Dashed line from passer to receiver
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(from.x, y, from.z),
    new THREE.Vector3(to.x, y, to.z),
  ]);
  const lineMat = new THREE.LineDashedMaterial({ color: PASS_COLOR, dashSize: 0.6, gapSize: 0.4 });
  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  group.add(line);

  // Chevron arrows along the line — makes direction obvious at a glance
  const chevronMat = new THREE.MeshBasicMaterial({ color: PASS_COLOR });
  const chevronGeo = new THREE.ConeGeometry(0.28, 0.9, 6);
  const chevronSpacing = 3.0;
  const numChevrons = Math.max(1, Math.floor(dist / chevronSpacing) - 1);
  for (let i = 1; i <= numChevrons; i++) {
    const t = i / (numChevrons + 1); // skip endpoints
    const chevron = new THREE.Mesh(chevronGeo, chevronMat);
    chevron.position.set(from.x + dx * t, y, from.z + dz * t);
    chevron.rotation.order = 'YZX';
    chevron.rotation.z = -Math.PI / 2;
    chevron.rotation.y = -angle;
    group.add(chevron);
  }

  // Large arrowhead at the receiver
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 10), chevronMat);
  cone.position.set(to.x, y, to.z);
  cone.rotation.order = 'YZX';
  cone.rotation.z = -Math.PI / 2;
  cone.rotation.y = -angle;
  group.add(cone);

  // Ball at the passer's feet — "the ball starts here"
  const ballGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set(from.x, y, from.z);
  ball.castShadow = true;
  group.add(ball);

  // Pedestal ring at the passer so the origin reads even at a distance
  const pedestalGeo = new THREE.TorusGeometry(1.2, 0.12, 8, 32);
  const pedestalMat = new THREE.MeshBasicMaterial({ color: PASS_COLOR });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.rotation.x = -Math.PI / 2;
  pedestal.position.set(from.x, 0.06, from.z);
  group.add(pedestal);

  scene.add(group);
  passLineObj = { group };
}

function updatePassVisuals() {
  if (!passLineObj || !selectedPasser || !passTarget) return;
  // Rebuild — chevron count depends on distance, so a full rebuild is simpler
  // than tracking a variable-size array, and the scene is small enough.
  createPassVisuals(selectedPasser, passTarget);
}

function removePassVisuals() {
  if (!passLineObj) return;
  scene.remove(passLineObj.group);
  passLineObj.group.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  });
  passLineObj = null;
}

// ── Selection visuals ──
function updateSelectionRings() {
  playerMeshes.forEach(entry => {
    const p = entry.data;
    if (selectedPasser && p.id === selectedPasser.id) {
      entry.ring.visible = true;
      entry.ring.material.color.setHex(0xf39c12);
      entry.body.material.emissive.setHex(0xf39c12);
      entry.body.material.emissiveIntensity = 0.3;
    } else if (passTarget && p.id === passTarget.id) {
      entry.ring.visible = true;
      entry.ring.material.color.setHex(0xe74c3c);
      entry.body.material.emissive.setHex(0xe74c3c);
      entry.body.material.emissiveIntensity = 0.3;
    } else {
      entry.ring.visible = false;
      entry.body.material.emissive.setHex(0x000000);
      entry.body.material.emissiveIntensity = 0;
    }
  });
}

// ── Offside Logic (same as 2D) ──
function checkOffside() {
  if (!selectedPasser || !passTarget) return null;

  const offsideLineX = getOffsideLine();
  const ballX = selectedPasser.x;
  const receiverX = passTarget.x;

  const inOpponentHalf = receiverX > HALFWAY_X;
  const aheadOfOffsideLine = receiverX > offsideLineX;
  const aheadOfBall = receiverX > ballX;
  const ballBehindOffsideLine = ballX <= offsideLineX;

  const isOffside = inOpponentHalf && aheadOfOffsideLine && aheadOfBall && ballBehindOffsideLine;

  return { isOffside, inOpponentHalf, aheadOfOffsideLine, aheadOfBall, ballBehindOffsideLine };
}

// ── Guess Mode state ──
let guessMode = false;
let guessRevealed = false;
let userGuess = null; // 'offside' | 'onside' | null
let guessScore = { correct: 0, total: 0 };

function renderResult(result) {
  if (!result) {
    resultEl.textContent = '';
    resultEl.className = '';
    return;
  }

  const s = t();
  if (result.isOffside) {
    resultEl.textContent = s.offsideResult;
    resultEl.className = 'offside';
  } else {
    let reason;
    if (!result.inOpponentHalf) reason = s.reasonOwnHalf;
    else if (!result.ballBehindOffsideLine) reason = s.reasonBallPast;
    else if (!result.aheadOfBall) reason = s.reasonBehindBall;
    else reason = s.reasonBehindLine;
    resultEl.textContent = s.onsideResult(reason);
    resultEl.className = 'onside';
  }
}

function showResult(result) {
  if (guessMode && !guessRevealed) {
    // Hide the answer — guess is active, waiting for a guess/reveal
    resultEl.textContent = '';
    resultEl.className = '';
    updateGuessUI();
    return;
  }
  renderResult(result);
}

function updateGuessUI() {
  if (!guessMode) {
    guessPanel.classList.add('hidden');
    return;
  }
  guessPanel.classList.remove('hidden');

  const hasPass = !!(selectedPasser && passTarget);
  const canGuess = hasPass && !guessRevealed;

  guessOffsideBtn.disabled = !canGuess;
  guessOnsideBtn.disabled = !canGuess;
  revealBtn.disabled = !hasPass || guessRevealed;

  // Highlight which guess was made
  guessOffsideBtn.classList.toggle('selected', userGuess === 'offside');
  guessOnsideBtn.classList.toggle('selected', userGuess === 'onside');

  if (guessRevealed) {
    nextBtn.classList.remove('hidden');
  } else {
    nextBtn.classList.add('hidden');
  }

  const s = t();
  if (!hasPass) {
    guessPrompt.textContent = s.promptIdle;
  } else if (guessRevealed) {
    guessPrompt.textContent = s.promptRevealed;
  } else if (userGuess) {
    const label = userGuess === 'offside' ? s.offsideBtn : s.onsideBtn;
    guessPrompt.textContent = s.promptLocked(label);
  } else {
    guessPrompt.textContent = s.promptReady;
  }

  guessScoreEl.textContent = s.score(guessScore.correct, guessScore.total);
}

function reveal() {
  const result = checkOffside();
  if (!result) return;
  guessRevealed = true;

  if (userGuess !== null) {
    const actual = result.isOffside ? 'offside' : 'onside';
    guessScore.total += 1;
    if (userGuess === actual) guessScore.correct += 1;
  }

  renderResult(result);
  updateGuessUI();
}

function resetGuessRound() {
  guessRevealed = false;
  userGuess = null;
  updateGuessUI();
}

// ── Interaction ──
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const intersectPoint = new THREE.Vector3();

let dragObject = null;    // the body mesh being dragged
let dragPlayerData = null; // the player data object
let dragOffset = new THREE.Vector3();
let mouseDownPos = { x: 0, y: 0 };
let hasDragged = false;

function getPointerNDC(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  getPointerNDC(e);
  mouseDownPos.x = e.clientX;
  mouseDownPos.y = e.clientY;
  hasDragged = false;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(draggableBodies);

  if (hits.length > 0) {
    const hitMesh = hits[0].object;
    const pid = hitMesh.userData.playerId;
    const entry = playerMeshes.get(pid);
    if (entry) {
      dragObject = hitMesh;
      dragPlayerData = entry.data;
      controls.enabled = false;

      // Compute offset so drag feels anchored
      raycaster.ray.intersectPlane(groundPlane, intersectPoint);
      dragOffset.copy(entry.group.position).sub(intersectPoint);
    }
  }
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragObject) return;

  const dx = e.clientX - mouseDownPos.x;
  const dy = e.clientY - mouseDownPos.y;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged = true;

  getPointerNDC(e);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, intersectPoint);

  const newX = Math.max(-HALF_L, Math.min(HALF_L, intersectPoint.x + dragOffset.x));
  const newZ = Math.max(-HALF_W, Math.min(HALF_W, intersectPoint.z + dragOffset.z));

  dragPlayerData.x = newX;
  dragPlayerData.z = newZ;

  const entry = playerMeshes.get(dragPlayerData.id);
  entry.group.position.set(newX, 0, newZ);

  updateOffsideLine();

  if (passLineObj && selectedPasser && passTarget) {
    updatePassVisuals();
    showResult(checkOffside());
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  controls.enabled = true;

  if (!hasDragged && dragPlayerData) {
    const p = dragPlayerData;
    if (p.team === 'attack' && p.role !== 'gk') {
      if (!selectedPasser) {
        selectedPasser = p;
        passTarget = null;
        removePassVisuals();
        showResult(null);
      } else if (p.id === selectedPasser.id) {
        selectedPasser = null;
        passTarget = null;
        removePassVisuals();
        showResult(null);
      } else {
        passTarget = p;
        createPassVisuals(selectedPasser, passTarget);
        showResult(checkOffside());
      }
      updateSelectionRings();
    }
  }

  dragObject = null;
  dragPlayerData = null;
});

// ── Buttons ──
resetBtn.addEventListener('click', () => {
  removeAllPlayerMeshes();
  removePassVisuals();
  players = createDefaultPlayers();
  buildAllPlayers();
  selectedPasser = null;
  passTarget = null;
  resetGuessRound();
  showResult(null);
  updateOffsideLine();
});

clearPassBtn.addEventListener('click', () => {
  selectedPasser = null;
  passTarget = null;
  removePassVisuals();
  resetGuessRound();
  showResult(null);
  updateSelectionRings();
});

guessBtn.addEventListener('click', () => {
  guessMode = !guessMode;
  const s = t();
  guessBtn.textContent = guessMode ? s.guessModeOn : s.guessModeOff;
  guessBtn.classList.toggle('active', guessMode);
  resetGuessRound();
  // Re-render the result using the new visibility rules
  showResult(checkOffside());
});

// ── Random scenario ──
function randRange(min, max) {
  return min + Math.random() * (max - min);
}

function pickScenario() {
  // Weighted scenario archetypes — aim for a balanced mix of offside and onside outcomes
  const r = Math.random();
  if (r < 0.35) {
    // High defensive line — offside line sits near halfway
    return { defCenter: randRange(8, 18), defSpread: 5, attForwardBias: 0.5 };
  } else if (r < 0.7) {
    // Medium line
    return { defCenter: randRange(16, 26), defSpread: 7, attForwardBias: 0.45 };
  } else {
    // Deep defensive block
    return { defCenter: randRange(24, 34), defSpread: 8, attForwardBias: 0.35 };
  }
}

function randomizePositions() {
  const scenario = pickScenario();

  // Place defenders and GKs first so the offside line is known
  players.forEach(p => {
    if (p.role === 'gk') {
      p.x = p.team === 'attack' ? -HALF_L + 3 : HALF_L - 3;
      p.z = randRange(-3, 3);
    } else if (p.team === 'defend') {
      p.x = randRange(
        Math.max(2, scenario.defCenter - scenario.defSpread),
        Math.min(HALF_L - 4, scenario.defCenter + scenario.defSpread)
      );
      p.z = randRange(-HALF_W + 2, HALF_W - 2);
    }
  });

  // Now place attackers relative to the offside line
  const offsideX = getOffsideLine();
  const attackers = players.filter(p => p.team === 'attack' && p.role !== 'gk');
  attackers.forEach(p => {
    const ahead = Math.random() < scenario.attForwardBias;
    if (ahead) {
      // In front of the offside line (potentially offside position)
      p.x = randRange(Math.max(offsideX + 0.5, 1), HALF_L - 5);
    } else {
      // Behind the offside line — legal starting point
      p.x = randRange(-HALF_L + 12, Math.max(offsideX - 1, -HALF_L + 13));
    }
    p.z = randRange(-HALF_W + 2, HALF_W - 2);
  });

  syncMeshPositions();
  updateOffsideLine();
}

function randomPass() {
  const attackers = players.filter(p => p.team === 'attack' && p.role !== 'gk');
  if (attackers.length < 2) return;

  const rnd = (n) => Math.floor(Math.random() * n);
  const pickDifferent = (arr, not) => {
    let t;
    do { t = arr[rnd(arr.length)]; } while (t === not);
    return t;
  };

  const offsideX = getOffsideLine();
  const behindLine = attackers.filter(p => p.x <= offsideX);
  const aheadOfLine = attackers.filter(p => p.x > offsideX);

  // Pick a pass archetype. Weights are tuned for roughly balanced offside/onside.
  const r = Math.random();
  let passer = null, target = null;

  if (r < 0.35 && behindLine.length >= 1 && aheadOfLine.length >= 1) {
    // Classic through-ball: passer behind line, target ahead — often offside.
    passer = behindLine[rnd(behindLine.length)];
    target = aheadOfLine[rnd(aheadOfLine.length)];
  } else if (r < 0.55 && aheadOfLine.length >= 2) {
    // Ball already past the defense: passer ahead of line → "ballBehindOffsideLine" fails → always ONSIDE.
    passer = aheadOfLine[rnd(aheadOfLine.length)];
    target = pickDifferent(aheadOfLine, passer);
  } else if (r < 0.75) {
    // Backward / sideways pass: target at or behind passer → "aheadOfBall" fails → ONSIDE.
    passer = attackers[rnd(attackers.length)];
    const candidates = attackers.filter(a => a !== passer && a.x <= passer.x + 0.5);
    if (candidates.length > 0) {
      target = candidates[rnd(candidates.length)];
    }
  }

  // Fallback — any two different attackers (mixed outcomes)
  if (!passer || !target) {
    passer = attackers[rnd(attackers.length)];
    target = pickDifferent(attackers, passer);
  }

  selectedPasser = passer;
  passTarget = target;
  createPassVisuals(selectedPasser, passTarget);
  updateSelectionRings();
}

randomBtn.addEventListener('click', () => {
  randomizePositions();
  randomPass();
  resetGuessRound();
  showResult(checkOffside());
});

function makeGuess(guess) {
  if (!selectedPasser || !passTarget || guessRevealed) return;
  userGuess = guess;
  updateGuessUI();
}

guessOffsideBtn.addEventListener('click', () => makeGuess('offside'));
guessOnsideBtn.addEventListener('click', () => makeGuess('onside'));
revealBtn.addEventListener('click', () => reveal());
nextBtn.addEventListener('click', () => {
  selectedPasser = null;
  passTarget = null;
  removePassVisuals();
  resetGuessRound();
  showResult(null);
  updateSelectionRings();
});

// ── Language toggle ──
function applyLang() {
  const s = t();
  document.title = s.title;
  document.documentElement.lang = currentLang;
  document.getElementById('appTitle').textContent = s.title;
  document.getElementById('instructions').innerHTML = s.howTo;
  resetBtn.textContent = s.resetBtn;
  clearPassBtn.textContent = s.clearPassBtn;
  randomBtn.textContent = s.randomBtn;
  guessBtn.textContent = guessMode ? s.guessModeOn : s.guessModeOff;
  guessOffsideBtn.textContent = s.offsideBtn;
  guessOnsideBtn.textContent = s.onsideBtn;
  revealBtn.textContent = s.revealBtn;
  nextBtn.textContent = s.nextBtn;
  langBtn.textContent = s.langToggle;
  document.getElementById('legendAttackers').textContent = s.legendAttackers;
  document.getElementById('legendDefenders').textContent = s.legendDefenders;
  document.getElementById('legendGoalkeepers').textContent = s.legendGoalkeepers;
  document.getElementById('legendOffsideLine').textContent = s.legendOffsideLine;

  redrawOffsideLabel(s.offsideLineLabel);
  updateGuessUI();
  // Re-render the result banner if it's currently visible
  if (resultEl.textContent) {
    renderResult(checkOffside());
  }
}

langBtn.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'tr' : 'en';
  applyLang();
});

applyLang();

// ── Resize ──
window.addEventListener('resize', () => {
  const rect = container.getBoundingClientRect();
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.setSize(rect.width, rect.height);
});

// ── Render loop ──
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
