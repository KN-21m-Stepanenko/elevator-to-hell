import { Vector3 } from "@babylonjs/core";

/** Единый конфиг игры: все числа и тайминги настраиваются здесь. */
export const CONFIG = {
  render: { pixelScale: 3, fov: 1.2, fogDensity: 0.015 },
  player: {
    moveSpeed: 6,            // м/с
    mouseSensitivity: 0.0022, // рад на пиксель
    maxPitch: 1.5,
    eyeHeight: 1.6,
    ellipsoid: new Vector3(0.4, 0.9, 0.4), // «капсула» коллизий игрока
    gravity: 9.8,
  },
  level: { tile: 2, wallHeight: 4, wallThickness: 0.4, halfX: 10, halfZ: 8 },
  elevator: {
    cabinSize: 5, cabinHeight: 3, doorWidth: 2.4, floorHeight: 5,
    floors: [-1, 0, 1, 2, 3, 4], startFloor: 0,
    speed: 3,      // м/с
    doorTime: 1.2, // с на открытие/закрытие
    reach: 3.5,    // дальность нажатия кнопок, м
    weightLimit: 500, playerWeight: 80, npcWeight: [60, 100], npcCount: [3, 5],
  },
};
