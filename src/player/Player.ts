import { FreeCamera, Mesh, MeshBuilder, Ray, Scene, Vector3 } from "@babylonjs/core";
import { CONFIG } from "../config";

/** Игрок от первого лица: WASD + мышь (Pointer Lock), коллизии, гравитация. */
export class Player {
  readonly body: Mesh;
  readonly camera: FreeCamera;
  locked = false;
  onLockChange: (locked: boolean) => void = () => {};
  onInteract: () => void = () => {};      // клавиша E
  onToggleWeapon: () => void = () => {};  // клавиша Q
  onFire: () => void = () => {};          // ЛКМ

  private yaw: number;
  private pitch = 0;
  private keys = new Set<string>();

  constructor(scene: Scene, private canvas: HTMLCanvasElement, feet: Vector3, yaw = 0) {
    const P = CONFIG.player;
    this.yaw = yaw;

    // Невидимое тело с эллипсоидом коллизий; камера — его потомок на уровне глаз.
    this.body = MeshBuilder.CreateBox("player", { size: 0.2 }, scene);
    this.body.isVisible = false;
    this.body.ellipsoid = P.ellipsoid.clone();
    this.body.position.set(feet.x, feet.y + P.ellipsoid.y + 0.01, feet.z);

    this.camera = new FreeCamera("fpsCamera", new Vector3(0, P.eyeHeight - P.ellipsoid.y, 0), scene);
    this.camera.inputs.clear(); // управление реализовано здесь, а не стандартными инпутами
    this.camera.parent = this.body;
    this.camera.minZ = 0.05;
    this.camera.fov = CONFIG.render.fov;
    scene.activeCamera = this.camera;

    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (!e.repeat && this.locked) {
        if (e.code === "KeyE") this.onInteract();
        if (e.code === "KeyQ") this.onToggleWeapon();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());
    document.addEventListener("mousedown", (e) => { if (this.locked && e.button === 0) this.onFire(); });
    document.addEventListener("mousemove", (e) => {
      if (!this.locked) return;
      this.yaw += e.movementX * P.mouseSensitivity;
      this.pitch = Math.max(-P.maxPitch, Math.min(P.maxPitch, this.pitch + e.movementY * P.mouseSensitivity));
    });
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === this.canvas;
      if (!this.locked) this.keys.clear();
      this.onLockChange(this.locked);
    });
  }

  requestLock() {
    try {
      (this.canvas.requestPointerLock() as unknown as Promise<void> | undefined)?.catch(() => {});
    } catch {
      /* браузер может отклонить повторный запрос сразу после Esc */
    }
  }

  /** Сдвиг вертикального угла камеры (отдача). */
  addPitch(d: number) {
    const m = CONFIG.player.maxPitch;
    this.pitch = Math.max(-m, Math.min(m, this.pitch + d));
  }

  /** Луч из глаз по направлению взгляда (мировые координаты). */
  getEyeRay(length: number): Ray {
    const eye = this.body.position.add(new Vector3(0, CONFIG.player.eyeHeight - CONFIG.player.ellipsoid.y, 0));
    const cp = Math.cos(this.pitch);
    return new Ray(eye, new Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp), length);
  }

  /** dt — секунды с прошлого кадра. */
  update(dt: number) {
    const P = CONFIG.player;
    const down = (c: string) => (this.locked && this.keys.has(c) ? 1 : 0);
    const f = down("KeyW") - down("KeyS");
    const r = down("KeyD") - down("KeyA");
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let mx = sin * f + cos * r;
    let mz = cos * f - sin * r;
    const len = Math.hypot(mx, mz);
    if (len > 1) { mx /= len; mz /= len; } // по диагонали не быстрее

    this.body.moveWithCollisions(new Vector3(mx * P.moveSpeed * dt, -P.gravity * dt, mz * P.moveSpeed * dt));
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
