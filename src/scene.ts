import * as THREE from 'three';
import { webglAvailable } from './webgl';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Theme } from './images';

/**
 * The hero product: a thin aluminium display on a bent-sheet stand, built from rounded boxes
 * (no downloaded models). The screen is the app's 2880 px capture, mipmapped with maximum
 * anisotropy. Rendering happens only when scroll, pointer, size or theme change, never in an
 * idle loop, and stops offscreen, in hidden tabs and once the HTML screen has taken over.
 *
 * Framing matches the CSS device in hero.ts: at `rise` 1 the screen is centred at the same
 * pixel width, and at `dolly` 1 it covers the viewport exactly, like object-fit: cover.
 */
export interface Framing { vw: number; vh: number; imgW: number; startDy: number; cover: number }
export interface HeroScene {
  setState(rise: number, dolly: number, active: boolean): void;
  setFraming(framing: Framing): void;
  setTheme(theme: Theme): void;
  dispose(): void;
}

const SCREEN_W = 16, SCREEN_H = 10, BEZEL = .22, DEPTH = .4;
const FOV = 30, T = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const metals: Record<Theme, { color: number; roughness: number; shadow: number; exposure: number }> = {
  light: { color: 0xdcdce0, roughness: .28, shadow: .3, exposure: 1 },
  dark: { color: 0x7a7a80, roughness: .32, shadow: .7, exposure: 1.1 },
};

// A soft round shadow and a diagonal glass sheen, drawn once on small canvases.
function gradientTexture(draw: (context: CanvasRenderingContext2D, size: number) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  draw(canvas.getContext('2d')!, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function createHeroScene(host: HTMLElement, textureUrl: (theme: Theme) => string, initialTheme: Theme): Promise<HeroScene> {
  if (!webglAvailable()) throw new Error('WebGL is unavailable');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, .04).texture;
  room.dispose(); pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 200);

  // Decoded off the main thread (ImageBitmap, already flipped), then uploaded once with
  // mipmaps before the first frame so scrolling never waits on it.
  const loader = new THREE.ImageBitmapLoader().setOptions({ imageOrientation: 'flipY' });
  const loadScreen = async (theme: Theme) => {
    const bitmap = await loader.loadAsync(textureUrl(theme));
    const texture = new THREE.Texture(bitmap);
    texture.flipY = false;
    texture.needsUpdate = true;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    renderer.initTexture(texture);
    return texture;
  };
  let theme = initialTheme;
  let screenTexture = await loadScreen(theme).catch(error => { renderer.dispose(); throw error; });

  const metal = new THREE.MeshPhysicalMaterial({ metalness: 1, clearcoat: .25, clearcoatRoughness: .4 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x050506, roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .04 });
  // The screen sits a hair in front of the black glass; a polygon offset keeps it winning the depth
  // test on phones' lower-precision depth buffers (otherwise one triangle can lose to the glass).
  const screenMaterial = new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 });
  const sheenTexture = gradientTexture((context, size) => {
    const gradient = context.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, 'rgba(255,255,255,0)'); gradient.addColorStop(.42, 'rgba(255,255,255,.0)');
    gradient.addColorStop(.5, 'rgba(255,255,255,.55)'); gradient.addColorStop(.62, 'rgba(255,255,255,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  });
  const sheenMaterial = new THREE.MeshBasicMaterial({ map: sheenTexture, transparent: true, opacity: .07, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const shadowTexture = gradientTexture((context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,1)'); gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });

  // The display: aluminium shell, black glass front, the screen just above the glass.
  const model = new THREE.Group();
  const shell = new THREE.Mesh(new RoundedBoxGeometry(SCREEN_W + BEZEL * 2 + .14, SCREEN_H + BEZEL * 2 + .14, DEPTH, 6, .34), metal);
  shell.position.z = -DEPTH / 2 + .01;
  const glass = new THREE.Mesh(new RoundedBoxGeometry(SCREEN_W + BEZEL * 2, SCREEN_H + BEZEL * 2, .04, 4, .28), glassMaterial);
  glass.position.z = .02;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMaterial);
  screen.position.z = .045;
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W + BEZEL * 2, SCREEN_H + BEZEL * 2), sheenMaterial);
  sheen.position.z = .05;
  // The stand: a hinge block, a neck leaning back and a flat foot.
  const hinge = new THREE.Mesh(new RoundedBoxGeometry(3.3, 1.2, .5, 3, .12), metal);
  hinge.position.set(0, -.7, -DEPTH - .1);
  const neck = new THREE.Mesh(new RoundedBoxGeometry(3.3, 8.4, .26, 4, .12), metal);
  neck.position.set(0, -4.85, -1.45);
  neck.rotation.x = .22;
  const foot = new THREE.Mesh(new RoundedBoxGeometry(5.6, .24, 4.6, 4, .11), metal);
  foot.position.set(0, -9.05, -1.95);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(13, 8), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -9.18, -1.6);
  model.add(shell, glass, screen, sheen, hinge, neck, foot, shadow);
  scene.add(model);
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(-8, 12, 14);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(10, 3, -12);
  scene.add(key, rim);

  const applyTheme = () => {
    const look = metals[theme];
    metal.color.set(look.color);
    metal.roughness = look.roughness;
    shadowMaterial.opacity = look.shadow;
    renderer.toneMappingExposure = look.exposure;
  };
  applyTheme();

  // Compile the shaders in parallel where supported, so the first frame does not stall scrolling.
  await renderer.compileAsync(scene, camera).catch(() => undefined);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  let framing: Framing = { vw: 1, vh: 1, imgW: 1, startDy: 0, cover: 1 };
  let rise = 0, dolly = 0, active = true, lastFrame = false;
  let visible = true, frame = 0, disposed = false, contextLost = false;
  let pointerX = 0, pointerY = 0, lookX = 0, lookY = 0;

  function size() {
    if (disposed) return;
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  function draw() {
    frame = 0;
    if (!canDraw()) return;
    // Pointer response fades out as the camera moves in, so the handoff is exact.
    const weight = 1 - dolly;
    lookX += (pointerX * weight - lookX) * .12;
    lookY += (pointerY * weight - lookY) * .12;
    const midDistance = SCREEN_W * framing.vh / (framing.imgW * 2 * T);
    const distance = midDistance * (1 - dolly * (1 - 1 / framing.cover));
    const lift = (1 - rise) * framing.startDy * (2 * midDistance * T / framing.vh);
    camera.position.set(0, lift, distance);
    // A depth range just around the model (about 16 x 13 x 5 units) gives the depth buffer its full precision.
    const near = Math.max(.5, distance - 14), far = distance + 14;
    if (camera.near !== near || camera.far !== far) { camera.near = near; camera.far = far; camera.updateProjectionMatrix(); }
    camera.lookAt(0, lift, 0);
    const turn = 1 - rise;
    model.rotation.set(turn * .07 + lookY * .06, -turn * .62 + lookX * .1, turn * .02);
    sheenMaterial.opacity = .07 * (1 - dolly);
    renderer.render(scene, camera);
    if (!host.classList.contains('is-ready')) { host.classList.add('is-ready'); host.dataset.renderer = 'webgl'; }
    lastFrame = false;
    if (Math.abs(pointerX * weight - lookX) + Math.abs(pointerY * weight - lookY) > .0005) requestDraw();
  }
  // After the handoff one last frame is drawn, so the canvas under the HTML screen matches it.
  const canDraw = () => !disposed && !contextLost && visible && (active || lastFrame) && !document.hidden;
  function requestDraw() { if (!frame && canDraw()) frame = requestAnimationFrame(draw); }

  const resize = new ResizeObserver(size);
  resize.observe(host);
  const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; requestDraw(); });
  visibility.observe(host);
  const section = host.closest('section') || host;
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pointerX = event.clientX / innerWidth - .5;
    pointerY = event.clientY / innerHeight - .5;
    requestDraw();
  };
  const resetPointer = () => { pointerX = pointerY = 0; requestDraw(); };
  section.addEventListener('pointermove', pointer as EventListener);
  section.addEventListener('pointerleave', resetPointer);
  document.addEventListener('visibilitychange', requestDraw);
  const lost = (event: Event) => { event.preventDefault(); contextLost = true; host.classList.remove('is-ready'); host.dataset.renderer = 'fallback'; };
  const restored = () => { contextLost = false; requestDraw(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  renderer.domElement.addEventListener('webglcontextrestored', restored);

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize.disconnect(); visibility.disconnect();
    section.removeEventListener('pointermove', pointer as EventListener); section.removeEventListener('pointerleave', resetPointer);
    document.removeEventListener('visibilitychange', requestDraw);
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    renderer.domElement.removeEventListener('webglcontextrestored', restored);
    model.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
    [metal, glassMaterial, screenMaterial, sheenMaterial, shadowMaterial].forEach(material => material.dispose());
    (screenTexture.image as ImageBitmap).close?.();
    [screenTexture, sheenTexture, shadowTexture].forEach(texture => texture.dispose());
    scene.environment?.dispose(); renderer.dispose(); renderer.domElement.remove(); host.classList.remove('is-ready');
  };
  // Keep a BFCache-restored page usable; dispose on actual navigation or Vite replacement.
  window.addEventListener('pagehide', event => { if (!event.persisted) dispose(); });
  if (import.meta.hot) import.meta.hot.dispose(dispose);
  size();

  return {
    setState(nextRise, nextDolly, nextActive) {
      if (active && !nextActive) lastFrame = true;
      rise = nextRise; dolly = nextDolly; active = nextActive;
      requestDraw();
    },
    setFraming(next) { framing = next; requestDraw(); },
    setTheme(next) {
      if (next === theme || disposed) return;
      theme = next;
      applyTheme();
      requestDraw();
      void loadScreen(next).then(texture => {
        if (disposed || theme !== next) { (texture.image as ImageBitmap).close?.(); texture.dispose(); return; }
        (screenTexture.image as ImageBitmap).close?.();
        screenTexture.dispose();
        screenTexture = texture;
        screenMaterial.map = texture;
        screenMaterial.needsUpdate = true;
        requestDraw();
      }).catch(() => undefined);
    },
    dispose,
  };
}
