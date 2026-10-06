import { Color3, MeshBuilder, Scene, StandardMaterial, TransformNode } from "@babylonjs/core";
import { CONFIG } from "../config";

const rnd = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));

/** Пассажир. На этапе 2 — только модель и вес; поведение (паника) добавится на этапе 3. */
export class Npc {
  alive = true;
  inCabin = true;
  readonly root: TransformNode;

  constructor(scene: Scene, parent: TransformNode, readonly weight: number, pos: number[], yaw: number, color: Color3) {
    this.root = new TransformNode("npc", scene);
    this.root.parent = parent;
    this.root.position.set(pos[0], 0, pos[1]);
    this.root.rotation.y = yaw;
    const k = 0.85 + ((weight - 60) / 40) * 0.3; // полнее — шире
    this.root.scaling.set(k, 1, k);

    const mat = (c: Color3) => {
      const m = new StandardMaterial("npc_mat", scene);
      m.diffuseColor = c; m.specularColor = Color3.Black();
      return m;
    };
    const part = (n: string, w: number, h: number, d: number, y: number, c: Color3, collide: boolean) => {
      const b = MeshBuilder.CreateBox(n, { width: w, height: h, depth: d }, scene);
      b.parent = this.root; b.position.y = y; b.material = mat(c); b.checkCollisions = collide;
    };
    part("npc_legs", 0.4, 0.8, 0.28, 0.4, new Color3(0.12, 0.12, 0.16), true);
    part("npc_torso", 0.5, 0.6, 0.3, 1.1, color, true);
    part("npc_head", 0.26, 0.28, 0.26, 1.54, new Color3(0.75, 0.58, 0.45), false);
  }
}

const SLOTS = [[-1.7, 1.9], [0, 1.9], [1.7, 1.9], [-1.7, 0.5], [1.7, 0.5], [-1.7, -0.9], [0.9, 0.4]];
const COLORS = [new Color3(0.6, 0.15, 0.12), new Color3(0.15, 0.3, 0.55), new Color3(0.2, 0.45, 0.22), new Color3(0.55, 0.45, 0.15), new Color3(0.4, 0.4, 0.42)];

/** Расставляет 3–5 NPC со случайным весом по свободным местам в кабине. */
export function spawnNpcs(scene: Scene, cabin: TransformNode): Npc[] {
  const [minN, maxN] = CONFIG.elevator.npcCount;
  const [minW, maxW] = CONFIG.elevator.npcWeight;
  const slots = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, rnd(minN, maxN));
  return slots.map((p) => new Npc(scene, cabin, rnd(minW, maxW), p, Math.random() * Math.PI * 2, COLORS[rnd(0, COLORS.length - 1)]));
}
