import { Color3, HemisphericLight, PointLight, Scene, Vector3 } from "@babylonjs/core";
import { CONFIG } from "../config";
import { createCabin } from "../elevator/CabinShell";
import { Door } from "../elevator/Door";
import { createMaterials, Kind } from "../utils/textures";
import { addBox, Mats } from "./builders";

/** Комната этажа: холл и стена с проёмом лифта. Возвращает дверь шахты этого этажа. */
function buildRoom(scene: Scene, mats: Mats, floor: number, props: boolean): Door {
  const { halfX: hx, halfZ: hz, wallHeight: H, wallThickness: T } = CONFIG.level;
  const { doorWidth: dw, cabinHeight: dh, floorHeight } = CONFIG.elevator;
  const y0 = floor * floorHeight;
  const add = (k: Kind, n: string, s: number[], p: number[]) => addBox(scene, mats, k, `${n}_${floor}`, s, [p[0], p[1] + y0, p[2]]);
  const outer = 2 * (hx + T);

  // Пол и потолок заходят под стены, чтобы не было щелей.
  add("floor", "floor", [outer, 0.3, 2 * hz + 2 * T], [0, -0.15, 0]);
  add("ceiling", "ceiling", [outer, 0.3, 2 * hz + 2 * T], [0, H + 0.15, 0]);
  add("concrete", "wall_s", [outer, H, T], [0, H / 2, -(hz + T / 2)]);
  add("concrete", "wall_w", [T, H, 2 * hz], [-(hx + T / 2), H / 2, 0]);
  add("concrete", "wall_e", [T, H, 2 * hz], [hx + T / 2, H / 2, 0]);

  // Север: стена с проёмом под двери лифта.
  const sideW = hx + T - dw / 2;
  const sideX = dw / 2 + sideW / 2;
  add("concrete", "wall_n_l", [sideW, H, T], [-sideX, H / 2, hz + T / 2]);
  add("concrete", "wall_n_r", [sideW, H, T], [sideX, H / 2, hz + T / 2]);
  add("concrete", "wall_n_top", [dw, H - dh, T], [0, dh + (H - dh) / 2, hz + T / 2]);

  if (props) {
    add("concrete", "pillar_a", [1, H, 1], [-5, H / 2, -2]);
    add("concrete", "pillar_b", [1, H, 1], [5, H / 2, -2]);
    add("crate", "crate_a", [1.2, 1.2, 1.2], [7.5, 0.6, -5.5]);
    add("crate", "crate_b", [1.2, 1.2, 1.2], [8.8, 0.6, -5.5]);
    add("crate", "crate_c", [1.2, 1.2, 1.2], [8.1, 1.8, -5.5]);
  }

  // Дверь шахты: открыта только когда кабина стоит на этом этаже.
  const door = new Door(scene, mats, `landing_${floor}`, [0, y0, hz - 0.04], dw, dh);
  door.setInstant(floor === CONFIG.elevator.startFloor);
  return door;
}

/** Весь уровень: комнаты этажей 0–4 (1–4 пока заглушки до этапа 4), кабина, свет. */
export function buildWorld(scene: Scene) {
  const mats = createMaterials(scene);
  const { halfZ: hz, wallThickness: T } = CONFIG.level;
  const landing = new Map<number, Door>();
  for (const f of [0, 1, 2, 3, 4]) landing.set(f, buildRoom(scene, mats, f, f === 0));

  // Свет: тусклый общий + две лампы у 0 этажа (вместе с лампой кабины — 4 источника).
  const hemi = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  hemi.intensity = 0.4;
  hemi.groundColor = new Color3(0.05, 0.05, 0.07);
  const lampA = new PointLight("lamp_a", new Vector3(0, 3.5, -3), scene);
  lampA.diffuse = new Color3(1, 0.7, 0.4); lampA.intensity = 0.9; lampA.range = 16;
  const lampB = new PointLight("lamp_b", new Vector3(0, 3.5, 5), scene);
  lampB.diffuse = new Color3(1, 0.85, 0.7); lampB.intensity = 0.7; lampB.range = 12;

  // Кабина стоит сразу за северной стеной: стенка (0.2) + половина кабины.
  const cabin = createCabin(scene, mats, new Vector3(0, 0, hz + T + 0.2 + CONFIG.elevator.cabinSize / 2));
  return { mats, cabin, landing, spawn: new Vector3(0, 0, 0), spawnYaw: 0 };
}
