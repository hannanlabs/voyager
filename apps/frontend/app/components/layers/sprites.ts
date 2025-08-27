import type { Map } from "mapbox-gl";

export function addAirplaneIcon(map: Map): void {
  if (!map.hasImage("airplane-icon")) {
    const size = 48;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context is not available");
    }

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 3;

    // Draw airplane body
    ctx.beginPath();
    ctx.moveTo(size / 2, 6);
    ctx.lineTo(size / 2 - 4, size / 2 - 2);
    ctx.lineTo(size / 2 - 3, size - 8);
    ctx.lineTo(size / 2, size - 4);
    ctx.lineTo(size / 2 + 3, size - 8);
    ctx.lineTo(size / 2 + 4, size / 2 - 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw left wing
    ctx.beginPath();
    ctx.moveTo(size / 2 - 4, size / 2 - 2);
    ctx.lineTo(size / 2 - 18, size / 2 + 4);
    ctx.lineTo(size / 2 - 12, size / 2 + 10);
    ctx.lineTo(size / 2 - 3, size / 2 + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw right wing
    ctx.beginPath();
    ctx.moveTo(size / 2 + 4, size / 2 - 2);
    ctx.lineTo(size / 2 + 18, size / 2 + 4);
    ctx.lineTo(size / 2 + 12, size / 2 + 10);
    ctx.lineTo(size / 2 + 3, size / 2 + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw left tail
    ctx.beginPath();
    ctx.moveTo(size / 2 - 3, size - 8);
    ctx.lineTo(size / 2 - 8, size - 6);
    ctx.lineTo(size / 2 - 6, size - 4);
    ctx.lineTo(size / 2 - 1, size - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw right tail
    ctx.beginPath();
    ctx.moveTo(size / 2 + 3, size - 8);
    ctx.lineTo(size / 2 + 8, size - 6);
    ctx.lineTo(size / 2 + 6, size - 4);
    ctx.lineTo(size / 2 + 1, size - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const imageData = ctx.getImageData(0, 0, size, size);
    map.addImage("airplane-icon", imageData, { sdf: true });
  }
}
