import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── DOM refs ──
const container = document.getElementById('pitch-container');
const resultEl = document.getElementById('result');
const resetBtn = document.getElementById('resetBtn');
const clearPassBtn = document.getElementById('clearPassBtn');

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

// Offside label
const offsideLabel = createOffsideLabel();
scene.add(offsideLabel);

function createOffsideLabel() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText('OFFSIDE LINE', 128, 24);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(8, 1.5, 1);
  return sprite;
}

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

  // Dashed line
  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(from.x, y, from.z),
    new THREE.Vector3(to.x, y, to.z),
  ]);
  const lineMat = new THREE.LineDashedMaterial({ color: 0xf39c12, dashSize: 0.6, gapSize: 0.4 });
  const line = new THREE.Line(lineGeo, lineMat);
  line.computeLineDistances();
  group.add(line);

  // Arrow head
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const angle = Math.atan2(dz, dx);
  const coneMat = new THREE.MeshBasicMaterial({ color: 0xf39c12 });
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.0, 8), coneMat);
  cone.position.set(to.x, y, to.z);
  cone.rotation.z = -Math.PI / 2;
  cone.rotation.y = -angle;
  // Fix order: rotate around local axes
  cone.rotation.order = 'YZX';
  group.add(cone);

  // Ball at midpoint
  const ballGeo = new THREE.SphereGeometry(0.35, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const ball = new THREE.Mesh(ballGeo, ballMat);
  ball.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2);
  ball.castShadow = true;
  group.add(ball);

  scene.add(group);
  passLineObj = { group, line, cone, ball };
}

function updatePassVisuals() {
  if (!passLineObj || !selectedPasser || !passTarget) return;
  const from = selectedPasser;
  const to = passTarget;
  const y = 1.2;

  // Update line
  const positions = new Float32Array([from.x, y, from.z, to.x, y, to.z]);
  passLineObj.line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  passLineObj.line.geometry.attributes.position.needsUpdate = true;
  passLineObj.line.computeLineDistances();

  // Update arrow
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const angle = Math.atan2(dz, dx);
  passLineObj.cone.position.set(to.x, y, to.z);
  passLineObj.cone.rotation.set(0, 0, 0);
  passLineObj.cone.rotation.order = 'YZX';
  passLineObj.cone.rotation.z = -Math.PI / 2;
  passLineObj.cone.rotation.y = -angle;

  // Update ball
  passLineObj.ball.position.set((from.x + to.x) / 2, y, (from.z + to.z) / 2);
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

function showResult(result) {
  if (!result) {
    resultEl.textContent = '';
    resultEl.className = '';
    return;
  }

  if (result.isOffside) {
    resultEl.textContent = 'OFFSIDE! The receiving player is beyond the last defender.';
    resultEl.className = 'offside';
  } else {
    let reason = '';
    if (!result.inOpponentHalf) {
      reason = 'Receiver is in their own half.';
    } else if (!result.ballBehindOffsideLine) {
      reason = 'Ball is already past the last defender.';
    } else if (!result.aheadOfBall) {
      reason = 'Receiver is behind the ball.';
    } else {
      reason = 'Receiver is behind the offside line.';
    }
    resultEl.textContent = `ONSIDE! ${reason}`;
    resultEl.className = 'onside';
  }
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
  showResult(null);
  updateOffsideLine();
});

clearPassBtn.addEventListener('click', () => {
  selectedPasser = null;
  passTarget = null;
  removePassVisuals();
  showResult(null);
  updateSelectionRings();
});

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
