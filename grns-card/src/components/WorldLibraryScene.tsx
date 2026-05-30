import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { WorldLink } from "../content/world";

type LibraryItem = {
  link: WorldLink;
  index: number;
};

type WorldLibrarySceneProps = {
  columnCount: number;
  items: LibraryItem[];
  hoveredIndex: number | null;
};

const ROWS = 3;

const SHELF_TOPS = [0.9, -1.15, -3.2];
const textureCache = new Map<string, THREE.Texture>();

function assetPath(href: string) {
  return `${import.meta.env.BASE_URL}${href.replace(/^\.\//, "")}`;
}

function getTexture(href: string) {
  const src = assetPath(href);
  const cached = textureCache.get(src);
  if (cached) return cached;

  const texture = new THREE.TextureLoader().load(src);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(src, texture);
  return texture;
}

function addBox(
  group: THREE.Group,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  rotation: [number, number, number] = [0, 0, 0],
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function seededOffset(seed: number, scale = 1) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return (((value % 1) + 1) % 1) * scale;
}

function makeMaterial(color: number, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.02,
    roughness,
  });
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const material = child.material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else {
      material.dispose();
    }
  });
}

function addBookletStack({
  group,
  item,
  slot,
  baseX,
  baseY,
  hovered,
}: {
  group: THREE.Group;
  item: LibraryItem;
  slot: number;
  baseX: number;
  baseY: number;
  hovered: boolean;
}) {
  const isPrivate = item.link.private;
  const seed = item.index + slot * 7;
  const stack = new THREE.Group();
  const depth = 1.08 + (seed % 3) * 0.08;
  const width = 1.12 + (seed % 4) * 0.09;
  const layers = 5 + (seed % 6);
  const thickness = 0.055 + (seed % 3) * 0.008;
  const pull = hovered ? 0.46 : 0;
  const lift = hovered ? 0.12 : 0;
  const paperBase = isPrivate ? 0x9c8b70 : 0xc9ad78;
  const coverBase = isPrivate ? 0x8d8068 : 0xd1b982;
  const edgeMaterial = makeMaterial(isPrivate ? 0x4b4032 : 0x6f4f2b, 0.92);
  const threadMaterial = makeMaterial(isPrivate ? 0x1d1a15 : 0x342314, 0.76);
  const sealedBandMaterial = makeMaterial(0x8f2118, 0.52);

  stack.position.set(baseX, baseY + lift, pull + 0.1);
  stack.rotation.y = hovered ? -0.07 : (seededOffset(seed) - 0.5) * 0.04;
  stack.rotation.z = (seededOffset(seed + 4) - 0.5) * 0.045;

  for (let layer = 0; layer < layers; layer += 1) {
    const y = layer * thickness;
    const jitterX = (seededOffset(seed + layer) - 0.5) * 0.055;
    const jitterZ = (seededOffset(seed + layer + 11) - 0.5) * 0.045;
    const layerWidth = width + (seededOffset(seed + layer + 23) - 0.5) * 0.08;
    const layerDepth = depth + (seededOffset(seed + layer + 37) - 0.5) * 0.07;
    const paper = makeMaterial(paperBase + layer * 0x020100, 0.9);

    addBox(stack, [layerWidth, thickness * 0.74, layerDepth], [jitterX, y, jitterZ], paper);
    addBox(
      stack,
      [layerWidth * 0.98, thickness * 0.12, 0.022],
      [jitterX, y + thickness * 0.15, jitterZ + layerDepth / 2 + 0.014],
      edgeMaterial,
    );
    addBox(
      stack,
      [0.025, thickness * 0.8, layerDepth * 0.98],
      [jitterX - layerWidth / 2 - 0.014, y, jitterZ],
      edgeMaterial,
    );
  }

  const topY = layers * thickness + thickness * 0.08;
  const cover = makeMaterial(coverBase, isPrivate ? 0.96 : 0.88);
  addBox(stack, [width + 0.06, 0.035, depth + 0.04], [0, topY, 0], cover);
  addBox(stack, [0.06, 0.052, depth + 0.06], [-width / 2 - 0.05, topY - 0.004, 0], edgeMaterial);
  addBox(stack, [0.022, 0.06, depth + 0.02], [-width / 2 + 0.1, topY + 0.006, 0], threadMaterial);
  addBox(stack, [0.022, 0.06, depth + 0.02], [-width / 2 + 0.22, topY + 0.006, 0], threadMaterial);

  const labelMaterial = makeMaterial(isPrivate ? 0xb6a789 : 0xe8dcc4, 0.78);
  addBox(stack, [0.24, 0.015, depth * 0.72], [width * 0.18, topY + 0.027, -0.02], labelMaterial, [
    0,
    0,
    (seededOffset(seed + 42) - 0.5) * 0.06,
  ]);

  if (isPrivate) {
    addBox(stack, [width + 0.12, 0.025, 0.065], [0, topY + 0.05, 0], sealedBandMaterial);
    addBox(stack, [0.28, 0.08, 0.09], [0, topY + 0.1, depth * 0.18], sealedBandMaterial);
  }

  group.add(stack);
}

function addFillerStack(group: THREE.Group, x: number, y: number, seed: number) {
  const stack = new THREE.Group();
  const paperPalette = [0x806640, 0x725836, 0x8a7048, 0x6b5234, 0x7a603d];
  const coverPalette = [0x8c7148, 0x7c603d, 0x92764c, 0x6f5435, 0x80643f];
  const width = 0.52 + seededOffset(seed + 2, 0.25);
  const depth = 0.58 + seededOffset(seed + 3, 0.16);
  const layers = 3 + Math.floor(seededOffset(seed + 4, 5));
  const thickness = 0.046 + seededOffset(seed + 5, 0.012);
  const paper = makeMaterial(paperPalette[seed % paperPalette.length], 0.94);
  const cover = makeMaterial(coverPalette[(seed + 2) % coverPalette.length], 0.9);
  const edge = makeMaterial(0x3f2c1a, 0.96);
  const thread = makeMaterial(0x18110b, 0.82);
  const sealedBand = makeMaterial(0x0c0906, 0.74);

  stack.position.set(x, y - 0.02, -0.38 + seededOffset(seed + 9, 0.12));
  stack.rotation.y = (seededOffset(seed + 10) - 0.5) * 0.05;
  stack.rotation.z = (seededOffset(seed + 11) - 0.5) * 0.055;

  for (let layer = 0; layer < layers; layer += 1) {
    const layerWidth = width + (seededOffset(seed + layer + 20) - 0.5) * 0.08;
    const layerDepth = depth + (seededOffset(seed + layer + 30) - 0.5) * 0.06;
    addBox(stack, [layerWidth, thickness, layerDepth], [0, layer * thickness, 0], paper);
    addBox(stack, [layerWidth * 0.98, thickness * 0.12, 0.018], [0, layer * thickness, layerDepth / 2 + 0.012], edge);
  }

  const topY = layers * thickness + 0.02;
  addBox(stack, [width + 0.05, 0.026, depth + 0.04], [0, topY, 0], cover);
  addBox(stack, [width + 0.08, 0.018, 0.055], [0, topY + 0.034, 0], sealedBand);
  addBox(stack, [0.02, 0.04, depth], [-width / 2 + 0.08, topY + 0.018, 0], thread);
  addBox(stack, [0.02, 0.04, depth], [-width / 2 + 0.18, topY + 0.018, 0], thread);
  group.add(stack);
}

function addMapBundle(
  group: THREE.Group,
  item: LibraryItem,
  slot: number,
  baseX: number,
  baseY: number,
  hovered: boolean,
) {
  const paperMaterial = makeMaterial(0xded3b3, 0.88);
  const frameMaterial = makeMaterial(0x4d2f18, 0.84);
  const cordMaterial = makeMaterial(0x21150b, 0.72);
  const mapTexture = getTexture(item.link.href);
  const mapMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    map: mapTexture,
    toneMapped: false,
  });
  const stack = new THREE.Group();
  stack.position.set(baseX, baseY + 0.52 + (hovered ? 0.1 : 0), hovered ? 0.54 : 0.14);
  stack.rotation.x = -0.08;
  stack.rotation.y = hovered ? -0.09 : -0.04;
  stack.rotation.z = (seededOffset(item.index + slot) - 0.5) * 0.025;

  addBox(stack, [1.34, 0.98, 0.045], [0, 0, -0.03], paperMaterial);
  addBox(stack, [1.44, 0.055, 0.105], [0, 0.54, 0], frameMaterial);
  addBox(stack, [1.44, 0.055, 0.105], [0, -0.54, 0], frameMaterial);
  addBox(stack, [0.055, 1.04, 0.09], [-0.74, 0, 0], frameMaterial);
  addBox(stack, [0.055, 1.04, 0.09], [0.74, 0, 0], frameMaterial);
  addBox(stack, [0.025, 0.44, 0.045], [-0.66, 0.08, 0.04], cordMaterial);
  addBox(stack, [0.025, 0.44, 0.045], [0.66, 0.08, 0.04], cordMaterial);

  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.61), mapMaterial);
  mapMesh.position.set(0, 0, 0.036);
  mapMesh.receiveShadow = true;
  stack.add(mapMesh);

  const curlMaterial = makeMaterial(0xf3ebd6, 0.74);
  addBox(stack, [0.18, 0.018, 0.17], [0.5, -0.28, 0.065], curlMaterial, [0.18, 0.08, -0.34]);
  group.add(stack);
}

export function WorldLibraryScene({ columnCount, items, hoveredIndex }: WorldLibrarySceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const contentRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc29d62, 7, 18);

    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0.55, 10.2);
    camera.lookAt(0, -0.55, 0);

    const ambient = new THREE.HemisphereLight(0xfff0ca, 0x2b1a0e, 1.8);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffe0a8, 2.7);
    key.position.set(-4.8, 5.8, 5.2);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);

    const fill = new THREE.PointLight(0xfff3d0, 1.15, 12);
    fill.position.set(4.8, 2.4, 3.4);
    scene.add(fill);

    const content = new THREE.Group();
    scene.add(content);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    contentRef.current = content;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    };

    const animate = () => {
      frameRef.current = window.requestAnimationFrame(animate);
      const elapsed = performance.now() / 1000;
      content.rotation.y = Math.sin(elapsed * 0.18) * 0.018;
      renderer.render(scene, camera);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      });
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      contentRef.current = null;
    };
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    disposeObject(content);
    content.clear();

    const shelfMaterial = makeMaterial(0x8b5a32, 0.86);
    const darkWood = makeMaterial(0x4c2b16, 0.9);
    const backWood = makeMaterial(0x6f4425, 0.92);
    const mapColumnsByRow = new Map<number, Set<number>>();

    items.forEach((item, slot) => {
      if (item.link.kind !== "image") return;
      const row = Math.floor(slot / columnCount);
      const column = slot % columnCount;
      const columns = mapColumnsByRow.get(row) ?? new Set<number>();
      columns.add(column);
      mapColumnsByRow.set(row, columns);
    });

    addBox(content, [12.2, 6.5, 0.18], [0, -0.15, -0.64], backWood);
    addBox(content, [12.2, 0.24, 1.16], [0, 2.9, -0.04], darkWood);
    addBox(content, [12.2, 0.3, 1.18], [0, -3.55, -0.02], darkWood);

    for (let row = 0; row < ROWS; row += 1) {
      const y = SHELF_TOPS[row];
      addBox(content, [12.0, 0.2, 1.22], [0, y - 0.08, 0], shelfMaterial);
      addBox(content, [12.0, 0.06, 0.72], [0, y + 0.06, 0.28], darkWood);

      const itemGap = columnCount <= 2 ? 3.45 : 1.92;
      const firstX = -((columnCount - 1) * itemGap) / 2;
      const itemXs = Array.from({ length: columnCount }, (_, index) => firstX + index * itemGap);
      const mapXs = [...(mapColumnsByRow.get(row) ?? [])].map((column) => itemXs[column] ?? 0);
      const fillerXs = [
        firstX - itemGap * 0.55,
        ...itemXs.slice(0, -1).map((x, index) => (x + itemXs[index + 1]) / 2),
        firstX + (columnCount - 1) * itemGap + itemGap * 0.55,
      ].filter((x) => Math.abs(x) < 5.65 && mapXs.every((mapX) => Math.abs(x - mapX) > itemGap * 0.82));

      fillerXs.forEach((x, filler) => {
        const finalX = x + (seededOffset(row * 40 + filler) - 0.5) * 0.14;
        addFillerStack(content, finalX, y + 0.12, row * 100 + filler * 9);
      });
      if (columnCount >= 6) {
        [-5.25, 5.25].forEach((x, filler) => {
          if (mapXs.some((mapX) => Math.abs(x - mapX) <= itemGap * 0.82)) return;
          addFillerStack(content, x, y + 0.1, row * 120 + filler * 17 + 80);
        });
      }
    }

    items.forEach((item, slot) => {
      const itemGap = columnCount <= 2 ? 3.45 : 1.92;
      const row = Math.floor(slot / columnCount);
      const column = slot % columnCount;
      const firstX = -((columnCount - 1) * itemGap) / 2;
      const x = firstX + column * itemGap + (seededOffset(item.index + 5) - 0.5) * 0.14;
      const y = SHELF_TOPS[row] + 0.14;
      const hover = item.index === hoveredIndex;

      if (item.link.kind === "image") {
        addMapBundle(content, item, slot, column === columnCount - 1 ? x - 0.34 : x, y, hover);
        return;
      }
      addBookletStack({ group: content, item, slot, baseX: x, baseY: y, hovered: hover });
    });
  }, [columnCount, hoveredIndex, items]);

  return <canvas className="world-library-canvas" ref={canvasRef} aria-hidden="true" />;
}
