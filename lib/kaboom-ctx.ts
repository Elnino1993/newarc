import kaboom from "kaboom"

export function initKaboom(canvas: HTMLCanvasElement) {
  return kaboom({
    global: false,
    touchToMouse: true,
    canvas,
    debug: false,
  })
}
