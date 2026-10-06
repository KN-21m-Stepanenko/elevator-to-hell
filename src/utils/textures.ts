import { Color3, DynamicTexture, Scene, StandardMaterial, Texture } from "@babylonjs/core";

export type Kind = "concrete" | "floor" | "metal" | "crate" | "ceiling";
const SIZE = 64;

/** Детерминированный генератор случайных чисел (mulberry32). */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Ctx = CanvasRenderingContext2D;
type Rnd = () => number;

function noise(c: Ctx, r: Rnd, base: number[], amp: number) {
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const n = (r() - 0.5) * amp;
      c.fillStyle = `rgb(${(base[0] + n) | 0},${(base[1] + n) | 0},${(base[2] + n) | 0})`;
      c.fillRect(x, y, 1, 1);
    }
}

const DRAW: Record<Kind, (c: Ctx, r: Rnd) => void> = {
  concrete: (c, r) => {
    noise(c, r, [74, 72, 66], 22);
    c.fillStyle = "#2a2926";
    c.fillRect(0, 0, SIZE, 2); c.fillRect(0, 0, 2, SIZE); c.fillRect(0, SIZE / 2, SIZE, 1);
  },
  floor: (c, r) => {
    noise(c, r, [52, 52, 56], 16);
    c.fillStyle = "#1c1c20";
    c.fillRect(0, 0, SIZE, 2); c.fillRect(0, 0, 2, SIZE);
    c.fillRect(0, SIZE / 2, SIZE, 1); c.fillRect(SIZE / 2, 0, 1, SIZE);
  },
  metal: (c, r) => {
    noise(c, r, [96, 102, 108], 14);
    c.fillStyle = "#3a3f44";
    c.fillRect(0, 0, SIZE, 3); c.fillRect(0, SIZE - 3, SIZE, 3);
    c.fillStyle = "#c8cdd2";
    for (const [x, y] of [[6, 6], [SIZE - 8, 6], [6, SIZE - 9], [SIZE - 8, SIZE - 9]]) c.fillRect(x, y, 2, 2);
  },
  crate: (c, r) => {
    noise(c, r, [118, 82, 44], 20);
    c.fillStyle = "#4a2f14";
    c.fillRect(0, 0, SIZE, 4); c.fillRect(0, SIZE - 4, SIZE, 4);
    c.fillRect(0, 0, 4, SIZE); c.fillRect(SIZE - 4, 0, 4, SIZE);
    for (let i = 0; i < SIZE; i++) c.fillRect(i, i, 3, 3);
  },
  ceiling: (c, r) => {
    noise(c, r, [70, 70, 78], 14);
    c.fillStyle = "#1e1e24";
    c.fillRect(0, 0, SIZE, 3); c.fillRect(0, 0, 3, SIZE);
    c.fillRect(0, SIZE / 2, SIZE, 2); c.fillRect(SIZE / 2, 0, 2, SIZE);
    c.fillStyle = "#9a9aa8"; // заклёпки на стыках панелей
    for (const [x, y] of [[8, 8], [SIZE / 2 + 6, 8], [8, SIZE / 2 + 6], [SIZE / 2 + 6, SIZE / 2 + 6]]) c.fillRect(x, y, 2, 2);
  },
};

/** По одному материалу на тип поверхности; текстуры без сглаживания (эффект Quake). */
export function createMaterials(scene: Scene): Record<Kind, StandardMaterial> {
  const out = {} as Record<Kind, StandardMaterial>;
  (Object.keys(DRAW) as Kind[]).forEach((kind, i) => {
    const tex = new DynamicTexture(`tex_${kind}`, { width: SIZE, height: SIZE }, scene, false, Texture.NEAREST_SAMPLINGMODE);
    DRAW[kind](tex.getContext() as unknown as Ctx, rng(1000 + i));
    // DynamicTexture по умолчанию CLAMP: без WRAP тайлинг не работает, текстура «размазывается».
    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.update();
    const mat = new StandardMaterial(`mat_${kind}`, scene);
    mat.diffuseTexture = tex;
    mat.specularColor = Color3.Black();
    out[kind] = mat;
  });
  return out;
}

/** Холст-текстура для табло и кнопок (без сглаживания). */
export function canvasTexture(scene: Scene, w: number, h: number) {
  const tex = new DynamicTexture("ui_tex", { width: w, height: h }, scene, false, Texture.NEAREST_SAMPLINGMODE);
  return { tex, ctx: tex.getContext() as unknown as CanvasRenderingContext2D };
}
