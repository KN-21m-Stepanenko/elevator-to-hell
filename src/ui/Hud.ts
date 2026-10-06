/** Экранный интерфейс: оверлей паузы, прицел, подсказка и сообщения (DOM поверх canvas). */
export class Hud {
  private overlay = document.getElementById("overlay") as HTMLElement;
  private crosshair = document.getElementById("crosshair") as HTMLElement;
  private hint = document.getElementById("hint") as HTMLElement;
  private toastEl = document.getElementById("toast") as HTMLElement;
  private timer = 0;

  setPaused(paused: boolean) {
    this.overlay.classList.toggle("hidden", !paused);
    this.crosshair.classList.toggle("hidden", paused);
  }

  onStart(cb: () => void) {
    this.overlay.addEventListener("click", cb);
  }

  setHint(text: string | null) {
    if (text === null) { this.hint.classList.add("hidden"); return; }
    this.hint.textContent = text;
    this.hint.classList.remove("hidden");
  }

  toast(text: string, ms = 3000) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove("hidden");
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.toastEl.classList.add("hidden"), ms);
  }
}
