const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;

canvas.addEventListener("mousedown", () => { drawing = true });
canvas.addEventListener("mouseup", () => { drawing = false });

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    ctx.fillStyle = "white";
    ctx.fillRect(e.offsetX, e.offsetY, 2, 2);
});
