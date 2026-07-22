document.addEventListener("DOMContentLoaded", () => {
  const stickyColors = [
    "#FFF78A",
    "#FFC0D9",
    "#BFF6C3",
    "#80B9AD",
    "#C3ACD0",
    "#FFD9B7",
    "#A0E9FF",
    "#FFABAB",
    "#FFDA76",
    "#E4A5FF",
  ];

  const currentBgColor =
    stickyColors[Math.floor(Math.random() * stickyColors.length)];
  document.getElementById("stickyNoteCard").style.backgroundColor =
    currentBgColor;

  const canvas = document.getElementById("noteCanvas");
  const ctx = canvas.getContext("2d");
  const canvasWrapper = document.getElementById("canvasWrapper");
  const eraserCursor = document.getElementById("eraserCursor");

  const btnPencil = document.getElementById("btnPencil");
  const btnEraser = document.getElementById("btnEraser");
  const eraserPopup = document.getElementById("eraserPopup");
  const btnUndo = document.getElementById("btnUndo");
  const btnRedo = document.getElementById("btnRedo");
  const btnSubmit = document.getElementById("btnSubmit");
  const inputUsername = document.getElementById("inputUsername");

  const eraserSizeInput = document.getElementById("eraserSize");
  const eraserSizeVal = document.getElementById("eraserSizeVal");

  let isDrawing = false;
  let mode = "pencil";
  let pencilSize = 4;
  let eraserSize = 20;

  let points = [];
  let undoStack = [];
  let redoStack = [];
  const MAX_HISTORY = 20;

  let dpr = window.devicePixelRatio || 1;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const size = canvasWrapper.clientHeight || 500;

    canvasWrapper.style.width = `${size}px`;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.scale(dpr, dpr);

    if (undoStack.length > 0) {
      ctx.putImageData(undoStack[undoStack.length - 1], 0, 0);
    }
  }

  resizeCanvas();
  saveState();

  window.addEventListener("resize", resizeCanvas);

  // Close Keyboard saat tekan Enter di iPad
  inputUsername.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputUsername.blur();
    }
  });

  // Drawing Logic
  function saveState() {
    if (undoStack.length >= MAX_HISTORY) undoStack.shift();
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = [];
  }

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function drawDot(pos) {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#000000";
      ctx.arc(pos.x, pos.y, pencilSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.arc(pos.x, pos.y, eraserSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function startDrawing(e) {
    isDrawing = true;
    hideEraserPopup();
    const pos = getPos(e);

    points = [pos];
    drawDot(pos);

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (mode === "pencil") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = pencilSize;
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = eraserSize;
    }
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getPos(e);
    points.push(pos);

    if (points.length < 3) {
      const b = points[0];
      ctx.beginPath();
      ctx.arc(
        b.x,
        b.y,
        (mode === "pencil" ? pencilSize : eraserSize) / 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    const lastIdx = points.length - 2;
    ctx.quadraticCurveTo(
      points[lastIdx].x,
      points[lastIdx].y,
      points[lastIdx + 1].x,
      points[lastIdx + 1].y,
    );
    ctx.stroke();
  }

  function stopDrawing() {
    if (isDrawing) {
      isDrawing = false;
      points = [];
      saveState();
    }
  }

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", (e) => {
    draw(e);
    updateEraserPreview(e);
  });
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseleave", () => {
    stopDrawing();
    eraserCursor.style.display = "none";
  });

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startDrawing(e);
  });
  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    draw(e);
  });
  canvas.addEventListener("touchend", stopDrawing);

  function updateEraserPreview(e) {
    if (mode !== "eraser") {
      eraserCursor.style.display = "none";
      return;
    }
    const rect = canvasWrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    if (
      mouseX >= 0 &&
      mouseX <= rect.width &&
      mouseY >= 0 &&
      mouseY <= rect.height
    ) {
      eraserCursor.style.width = `${eraserSize}px`;
      eraserCursor.style.height = `${eraserSize}px`;
      eraserCursor.style.left = `${mouseX}px`;
      eraserCursor.style.top = `${mouseY}px`;
      eraserCursor.style.display = "block";
    } else {
      eraserCursor.style.display = "none";
    }
  }

  btnPencil.addEventListener("click", () => {
    mode = "pencil";
    btnPencil.classList.add("btn-dark", "active");
    btnPencil.classList.remove("btn-outline-dark");
    btnEraser.classList.add("btn-outline-dark");
    btnEraser.classList.remove("btn-dark", "active");
    eraserCursor.style.display = "none";
    hideEraserPopup();
  });

  function setEraserMode() {
    mode = "eraser";
    btnEraser.classList.add("btn-dark", "active");
    btnEraser.classList.remove("btn-outline-dark");
    btnPencil.classList.add("btn-outline-dark");
    btnPencil.classList.remove("btn-dark", "active");
  }

  let pressTimer = null;
  let isLongPress = false;

  function showEraserPopup() {
    eraserPopup.style.display = "flex";
  }
  function hideEraserPopup() {
    eraserPopup.style.display = "none";
  }

  const startPress = () => {
    isLongPress = false;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      setEraserMode();
      showEraserPopup();
    }, 350);
  };

  const endPress = (e) => {
    clearTimeout(pressTimer);
    if (!isLongPress) {
      setEraserMode();
      if (eraserPopup.style.display === "flex") hideEraserPopup();
      else if (e.type === "click") showEraserPopup();
    }
  };

  btnEraser.addEventListener("mousedown", startPress);
  btnEraser.addEventListener("mouseup", endPress);
  btnEraser.addEventListener("touchstart", startPress);
  btnEraser.addEventListener("touchend", endPress);

  eraserPopup.addEventListener("click", (e) => e.stopPropagation());

  eraserSizeInput.addEventListener("input", (e) => {
    eraserSize = parseInt(e.target.value);
    eraserSizeVal.textContent = `${eraserSize} px`;
  });

  document.addEventListener("click", (e) => {
    if (!btnEraser.contains(e.target) && !eraserPopup.contains(e.target)) {
      hideEraserPopup();
    }
  });

  btnUndo.addEventListener("click", () => {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      const prevState = undoStack[undoStack.length - 1];
      ctx.putImageData(prevState, 0, 0);
    }
  });

  btnRedo.addEventListener("click", () => {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      undoStack.push(nextState);
      ctx.putImageData(nextState, 0, 0);
    }
  });

  // Submit Handler
  btnSubmit.addEventListener("click", async () => {
    const username = inputUsername.value.trim();

    if (!username) {
      Swal.fire({
        icon: "warning",
        title: "Nama Wajib Diisi!",
        text: "Silakan isi nama pembuat sebelum menyimpan sticky note.",
        confirmButtonColor: "#212529",
      });
      inputUsername.focus();
      return;
    }

    if (username.length > 10) {
      Swal.fire({
        icon: "error",
        title: "Nama Terlalu Panjang!",
        text: "Nama pembuat maksimal terdiri dari 10 karakter.",
        confirmButtonColor: "#212529",
      });
      inputUsername.focus();
      return;
    }

    const TARGET_SIZE = 512;
    const shadowPadding = 40;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = TARGET_SIZE;
    exportCanvas.height = TARGET_SIZE;
    const exportCtx = exportCanvas.getContext("2d");

    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = "high";

    const cardSize = TARGET_SIZE - shadowPadding * 2;
    const x = shadowPadding;
    const y = shadowPadding;

    exportCtx.save();
    exportCtx.shadowColor = "rgba(0, 0, 0, 0.18)";
    exportCtx.shadowBlur = 25;
    exportCtx.shadowOffsetX = 0;
    exportCtx.shadowOffsetY = 12;
    exportCtx.fillStyle = currentBgColor;
    exportCtx.fillRect(x, y, cardSize, cardSize);
    exportCtx.restore();

    exportCtx.save();
    exportCtx.shadowColor = "rgba(0, 0, 0, 0.28)";
    exportCtx.shadowBlur = 12;
    exportCtx.shadowOffsetX = -2;
    exportCtx.shadowOffsetY = 10;
    exportCtx.fillStyle = currentBgColor;
    exportCtx.fillRect(x, y, cardSize, cardSize);
    exportCtx.restore();

    exportCtx.fillStyle = currentBgColor;
    exportCtx.fillRect(x, y, cardSize, cardSize);

    exportCtx.drawImage(canvas, x, y, cardSize, cardSize);

    const finalDataURL = exportCanvas.toDataURL("image/png");

    Swal.fire({
      title: "Menyimpan Sticky Note...",
      text: "Sedang memproses gambar (512x512)...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const response = await fetch("/api/save-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: finalDataURL,
          username: username,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Berhasil Disimpan!",
          text: `File tersimpan: ${result.filename}`,
          confirmButtonText: "Buat Baru",
          confirmButtonColor: "#212529",
        }).then(() => {
          window.location.reload();
        });
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: err.message || "Terjadi kesalahan pada server.",
      });
    }
  });
});
