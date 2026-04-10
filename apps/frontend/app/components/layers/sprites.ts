import type { Map } from "mapbox-gl";

export function addAirplaneIcon(map: Map): void {
  if (!map.hasImage("airplane-icon")) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is not available");
    }

    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;

    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 2;

    ctx.fillStyle = "#ffffff";

    // Fuselage — tapered nose to tail
    ctx.beginPath();
    ctx.moveTo(cx, 6);
    ctx.quadraticCurveTo(cx + 4, 16, cx + 3, 30);
    ctx.lineTo(cx + 2, 50);
    ctx.lineTo(cx, 56);
    ctx.lineTo(cx - 2, 50);
    ctx.lineTo(cx - 3, 30);
    ctx.quadraticCurveTo(cx - 4, 16, cx, 6);
    ctx.closePath();
    ctx.fill();

    // Swept-back delta wings
    ctx.beginPath();
    ctx.moveTo(cx - 3, 26);
    ctx.lineTo(cx - 22, 36);
    ctx.lineTo(cx - 18, 38);
    ctx.lineTo(cx - 3, 34);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 3, 26);
    ctx.lineTo(cx + 22, 36);
    ctx.lineTo(cx + 18, 38);
    ctx.lineTo(cx + 3, 34);
    ctx.closePath();
    ctx.fill();

    // Horizontal stabilizer
    ctx.beginPath();
    ctx.moveTo(cx - 2, 48);
    ctx.lineTo(cx - 10, 52);
    ctx.lineTo(cx - 8, 54);
    ctx.lineTo(cx - 1, 51);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 2, 48);
    ctx.lineTo(cx + 10, 52);
    ctx.lineTo(cx + 8, 54);
    ctx.lineTo(cx + 1, 51);
    ctx.closePath();
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    const imageData = ctx.getImageData(0, 0, size, size);
    map.addImage("airplane-icon", imageData, { sdf: true });
  }
}
