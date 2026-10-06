import { Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, VertexBuffer } from "@babylonjs/core";
import { CONFIG } from "../config";
import type { Kind } from "../utils/textures";

export type Mats = Record<Kind, StandardMaterial>;

/**
 * Бокс с коллизиями. UV считаются по реальным координатам вершин (1 повтор = tile метров)
 * и выбираются по нормали грани, поэтому текстура не растягивается на любой грани и размере.
 */
export function addBox(
  scene: Scene, mats: Mats, kind: Kind, name: string,
  [w, h, d]: number[], [x, y, z]: number[], parent?: TransformNode,
): Mesh {
  const t = CONFIG.level.tile;
  const box = MeshBuilder.CreateBox(name, { width: w, height: h, depth: d }, scene);
  const pos = box.getVerticesData(VertexBuffer.PositionKind)!;
  const nor = box.getVerticesData(VertexBuffer.NormalKind)!;
  const uv: number[] = [];
  for (let i = 0; i < pos.length; i += 3) {
    const px = (pos[i] + x) / t, py = (pos[i + 1] + y) / t, pz = (pos[i + 2] + z) / t;
    if (Math.abs(nor[i]) > 0.5) uv.push(pz, py);          // грани ±x
    else if (Math.abs(nor[i + 1]) > 0.5) uv.push(px, pz); // верх и низ
    else uv.push(px, py);                                  // грани ±z
  }
  box.setVerticesData(VertexBuffer.UVKind, uv);
  box.position.set(x, y, z);
  box.material = mats[kind];
  box.checkCollisions = true;
  if (parent) box.parent = parent;
  return box;
}
