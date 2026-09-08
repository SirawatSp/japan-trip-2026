import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ISSAIKYO_TERRAIN } from './issaikyo-terrain-data.js';

const terrainRoot = document.querySelector('#hike-terrain');
const viewer = document.querySelector('#terrain-viewer');
const canvas = document.querySelector('#hike-terrain-canvas');

const TRAIL = [
  { name: 'Jododaira', ja: '浄土平', lat: 37.7232, lng: 140.2542, kind: 'start' },
  { name: 'Sugadaira Junction', ja: '酸ヶ平分岐', lat: 37.7249, lng: 140.2439, kind: 'detail', labelOffset: [18, 18] },
  { name: 'Sugadaira Shelter', ja: '酸ヶ平避難小屋', lat: 37.72678, lng: 140.24131, labelOffset: [18, -10] },
  { name: 'Mt. Issaikyo · 1,949 m', ja: '一切経山', lat: 37.7358, lng: 140.2442, kind: 'summit' },
  { name: 'Sugadaira Shelter', ja: '酸ヶ平避難小屋', lat: 37.72678, lng: 140.24131 },
  { name: 'Kamanuma', ja: '鎌沼', lat: 37.7189, lng: 140.2352, labelOffset: [-22, -4] },
  { name: 'Ubagahara', ja: '姥ヶ原', lat: 37.7147, lng: 140.2412 },
  { name: 'Jododaira', ja: '浄土平', lat: 37.7232, lng: 140.2542, kind: 'start' },
];

const LABEL_POINTS = TRAIL.filter((point, index, points) =>
  index === points.findIndex((candidate) => candidate.lat === point.lat && candidate.lng === point.lng));

let miniMap = null;
let renderer = null;
let camera = null;
let controls = null;
let labelEntries = [];
let sceneVisible = true;

function initMiniMap() {
  if (miniMap || !window.L) return;

  miniMap = L.map('hike-terrain-map-2d', {
    scrollWheelZoom: false,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics & GIS User Community',
  }).addTo(miniMap);

  const route = L.polyline(TRAIL.map((point) => [point.lat, point.lng]), {
    color: '#79ef6a',
    weight: 5,
    opacity: .95,
    lineJoin: 'round',
  }).addTo(miniMap);

  LABEL_POINTS.forEach((point) => {
    L.circleMarker([point.lat, point.lng], {
      radius: point.kind === 'summit' ? 7 : 5,
      color: '#ffffff',
      weight: 2,
      fillColor: point.kind === 'summit' ? '#e08b35' : '#79ef6a',
      fillOpacity: 1,
    })
      .bindTooltip(point.name, { direction: 'top', className: 'hike-waypoint-label' })
      .addTo(miniMap);
  });

  miniMap.fitBounds(route.getBounds().pad(.18));
}

function activateView(view) {
  if (!viewer) return;
  viewer.dataset.view = view;
  viewer.querySelectorAll('[data-terrain-view]').forEach((button) => {
    const active = button.dataset.terrainView === view;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (view === '2d') {
    initMiniMap();
    requestAnimationFrame(() => miniMap && miniMap.invalidateSize());
  } else if (renderer) {
    resizeRenderer();
  }
}

function resizeRenderer() {
  if (!renderer || !camera || !viewer) return;
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function initTerrain() {
  if (!terrainRoot || !viewer || !canvas) return;

  const terrain = ISSAIKYO_TERRAIN;
  const minElevation = Math.min(...terrain.elevations);
  const maxElevation = Math.max(...terrain.elevations);
  const elevationScale = 1.6 / 1000;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x17251d);
  scene.fog = new THREE.FogExp2(0x17251d, .055);

  camera = new THREE.PerspectiveCamera(42, 1, .01, 40);
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.enablePan = false;
  controls.minDistance = 3.5;
  controls.maxDistance = 9.5;
  controls.minPolarAngle = .28;
  controls.maxPolarAngle = Math.PI / 2.08;
  controls.zoomToCursor = true;
  controls.target.set(-.15, .34, -.1);

  function resetView() {
    camera.position.set(3.45, 3.15, 4.65);
    controls.target.set(-.15, .34, -.1);
    controls.update();
  }
  resetView();

  const geometry = new THREE.PlaneGeometry(
    terrain.widthKm,
    terrain.depthKm,
    terrain.cols - 1,
    terrain.rows - 1,
  );
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = [];
  const lowColor = new THREE.Color(0x496b3e);
  const middleColor = new THREE.Color(0x80775a);
  const highColor = new THREE.Color(0xa99c84);

  terrain.elevations.forEach((elevation, index) => {
    positions.setY(index, (elevation - minElevation) * elevationScale);
    const t = (elevation - minElevation) / Math.max(1, maxElevation - minElevation);
    const color = t < .55
      ? lowColor.clone().lerp(middleColor, t / .55)
      : middleColor.clone().lerp(highColor, (t - .55) / .45);
    colors.push(color.r, color.g, color.b);
  });

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const terrainMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: .9,
    metalness: 0,
  });
  const terrainMesh = new THREE.Mesh(geometry, terrainMaterial);
  scene.add(terrainMesh);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(terrain.widthKm, .22, terrain.depthKm),
    new THREE.MeshStandardMaterial({ color: 0x111b15, roughness: 1 }),
  );
  base.position.y = -.12;
  scene.add(base);

  scene.add(new THREE.HemisphereLight(0xdde9e0, 0x2b241c, 1.35));
  const sun = new THREE.DirectionalLight(0xfff0d4, 2.5);
  sun.position.set(-3, 6, 4);
  scene.add(sun);

  function elevationAt(lat, lng) {
    const u = THREE.MathUtils.clamp(
      (lng - terrain.bounds.west) / (terrain.bounds.east - terrain.bounds.west),
      0,
      1,
    );
    const v = THREE.MathUtils.clamp(
      (terrain.bounds.north - lat) / (terrain.bounds.north - terrain.bounds.south),
      0,
      1,
    );
    const gridX = u * (terrain.cols - 1);
    const gridY = v * (terrain.rows - 1);
    const x0 = Math.floor(gridX);
    const y0 = Math.floor(gridY);
    const x1 = Math.min(x0 + 1, terrain.cols - 1);
    const y1 = Math.min(y0 + 1, terrain.rows - 1);
    const tx = gridX - x0;
    const ty = gridY - y0;
    const at = (row, col) => terrain.elevations[row * terrain.cols + col];
    const top = THREE.MathUtils.lerp(at(y0, x0), at(y0, x1), tx);
    const bottom = THREE.MathUtils.lerp(at(y1, x0), at(y1, x1), tx);
    return THREE.MathUtils.lerp(top, bottom, ty);
  }

  function worldPoint(lat, lng, lift = 0) {
    const u = (lng - terrain.bounds.west) / (terrain.bounds.east - terrain.bounds.west);
    const v = (terrain.bounds.north - lat) / (terrain.bounds.north - terrain.bounds.south);
    return new THREE.Vector3(
      (u - .5) * terrain.widthKm,
      (elevationAt(lat, lng) - minElevation) * elevationScale + lift,
      (v - .5) * terrain.depthKm,
    );
  }

  const denseRoute = [];
  for (let index = 0; index < TRAIL.length - 1; index += 1) {
    const start = TRAIL[index];
    const end = TRAIL[index + 1];
    const steps = 14;
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps;
      denseRoute.push(worldPoint(
        THREE.MathUtils.lerp(start.lat, end.lat, t),
        THREE.MathUtils.lerp(start.lng, end.lng, t),
        .055,
      ));
    }
  }
  denseRoute.push(worldPoint(TRAIL.at(-1).lat, TRAIL.at(-1).lng, .055));

  const routeCurve = new THREE.CatmullRomCurve3(denseRoute, false, 'centripetal', .1);
  const routeUnderlay = new THREE.Mesh(
    new THREE.TubeGeometry(routeCurve, 260, .034, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x102016 }),
  );
  scene.add(routeUnderlay);

  const visibleRouteCurve = new THREE.CatmullRomCurve3(
    denseRoute.map((point) => point.clone().add(new THREE.Vector3(0, .035, 0))),
    false,
    'centripetal',
    .1,
  );
  const routeLine = new THREE.Mesh(
    new THREE.TubeGeometry(visibleRouteCurve, 260, .026, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x79ef6a }),
  );
  scene.add(routeLine);

  const labelLayer = document.querySelector('#terrain-label-layer');
  LABEL_POINTS.forEach((point) => {
    const position = worldPoint(point.lat, point.lng, .08);
    const markerColor = point.kind === 'summit' ? 0xe08b35 : 0x79ef6a;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(point.kind === 'summit' ? .065 : .045, 18, 12),
      new THREE.MeshStandardMaterial({ color: markerColor, emissive: markerColor, emissiveIntensity: .22 }),
    );
    marker.position.copy(position);
    scene.add(marker);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(.009, .009, .12, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    stem.position.copy(position);
    stem.position.y -= .065;
    scene.add(stem);

    const label = document.createElement('span');
    label.className = 'terrain-label'
      + (point.kind === 'summit' ? ' is-summit' : '')
      + (point.kind === 'detail' ? ' is-detail' : '');
    label.innerHTML = '<strong>' + point.name + '<small>' + point.ja + '</small></strong>';
    labelLayer.appendChild(label);
    labelEntries.push({
      element: label,
      position: position.clone().add(new THREE.Vector3(0, .1, 0)),
      offset: point.labelOffset || [0, 0],
    });
  });

  const textureLoader = new THREE.TextureLoader();
  textureLoader.setCrossOrigin('anonymous');
  const bounds = terrain.bounds;
  const imageryUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export'
    + '?bbox=' + [bounds.west, bounds.south, bounds.east, bounds.north].join(',')
    + '&bboxSR=4326&imageSR=4326&size=1200,1140&format=jpg&f=image';
  const loading = document.querySelector('#terrain-loading');
  const sourceStatus = document.querySelector('#terrain-source-status');

  textureLoader.load(
    imageryUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      terrainMaterial.map = texture;
      terrainMaterial.vertexColors = false;
      terrainMaterial.color.set(0xffffff);
      terrainMaterial.needsUpdate = true;
      loading.hidden = true;
      sourceStatus.textContent = '3D พร้อม · DEM 90 m + ภาพดาวเทียม';
    },
    undefined,
    () => {
      loading.hidden = true;
      sourceStatus.textContent = '3D พร้อม · ใช้ relief color (โหลดภาพดาวเทียมไม่สำเร็จ)';
    },
  );

  function updateLabels() {
    const width = viewer.clientWidth;
    const height = viewer.clientHeight;
    labelEntries.forEach((entry) => {
      const projected = entry.position.clone().project(camera);
      const visible = projected.z > -1 && projected.z < 1;
      entry.element.hidden = !visible;
      if (!visible) return;
      entry.element.style.left = ((projected.x * .5 + .5) * width + entry.offset[0]) + 'px';
      entry.element.style.top = ((-.5 * projected.y + .5) * height + entry.offset[1]) + 'px';
    });
  }

  resizeRenderer();
  new ResizeObserver(resizeRenderer).observe(viewer);

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      ([entry]) => { sceneVisible = entry.isIntersecting; },
      { rootMargin: '180px' },
    );
    observer.observe(viewer);
  }

  renderer.setAnimationLoop(() => {
    if (!sceneVisible || document.hidden || viewer.dataset.view !== '3d') return;
    controls.update();
    updateLabels();
    renderer.render(scene, camera);
  });

  document.querySelector('#terrain-reset').addEventListener('click', resetView);
  document.querySelector('#show-hike-3d-btn').addEventListener('click', () => {
    activateView('3d');
    terrainRoot.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(resizeRenderer, 450);
  });
}

document.querySelectorAll('[data-terrain-view]').forEach((button) => {
  button.addEventListener('click', () => activateView(button.dataset.terrainView));
});

try {
  initTerrain();
} catch (error) {
  console.error('3D terrain could not start', error);
  const loading = document.querySelector('#terrain-loading');
  if (loading) loading.hidden = true;
  const status = document.querySelector('#terrain-source-status');
  if (status) status.textContent = 'อุปกรณ์นี้ไม่รองรับ WebGL · เปิดแผนที่ 2D แทน';
  activateView('2d');
}
