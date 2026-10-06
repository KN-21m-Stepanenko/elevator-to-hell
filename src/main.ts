import { Color3, Color4, Engine, Scene } from "@babylonjs/core";
import { CONFIG } from "./config";
import { Elevator } from "./elevator/Elevator";
import { buildWorld } from "./levels/World";
import { spawnNpcs } from "./npc/Npc";
import { Player } from "./player/Player";
import { Hud } from "./ui/Hud";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const engine = new Engine(canvas, false, { stencil: false }); // без сглаживания — как в Quake
engine.setHardwareScalingLevel(CONFIG.render.pixelScale);    // низкое разрешение, пиксели крупнее

const scene = new Scene(engine);
scene.collisionsEnabled = true;
scene.clearColor = new Color4(0.02, 0.02, 0.03, 1);
scene.fogMode = Scene.FOGMODE_EXP2;
scene.fogDensity = CONFIG.render.fogDensity;
scene.fogColor = new Color3(0.03, 0.03, 0.04);

const world = buildWorld(scene);
const npcs = spawnNpcs(scene, world.cabin.root);
const player = new Player(scene, canvas, world.spawn, world.spawnYaw);
const hud = new Hud();
const elevator = new Elevator(scene, world.cabin, world.landing, player, npcs, (t) => hud.toast(t));

hud.setPaused(true);
hud.onStart(() => player.requestLock());
player.onLockChange = (locked) => hud.setPaused(!locked);
player.onInteract = () => {
  const key = elevator.pickKey();
  if (key !== null) elevator.press(key);
};

scene.onBeforeRenderObservable.add(() => {
  const dt = Math.min(engine.getDeltaTime() / 1000, 0.05);
  elevator.update(dt); // лифт двигаем до игрока, чтобы игрок ехал вместе с кабиной
  player.update(dt);
  const key = player.locked ? elevator.pickKey() : null;
  hud.setHint(key === null ? null : key === "stop" ? "E — аварийная остановка" : `E — этаж ${key}`);
});
engine.runRenderLoop(() => scene.render());
window.addEventListener("resize", () => engine.resize());
