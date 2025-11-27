console.log("WebCAD Engine ON");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Basic Mouse Drawing
let drawing = false;

canvas.addEventListener("mousedown", () => drawing = true);
canvas.addEventListener("mouseup", () => drawing = false);

canvas.addEventListener("mousemove", (event) => {
    if (!drawing) return;
    ctx.fillStyle = "white";
    ctx.fillRect(event.offsetX, event.offsetY, 2, 2);
});
