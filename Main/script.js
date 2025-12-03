(async () => {

  // 1. PIXI check
  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI NOT LOADED");
    return;
  }

  // 2. Live2D plugin check
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) {
    console.error("❌ pixi-live2d-display NOT LOADED");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  // 3. Create PIXI app
  const app = new PIXI.Application({
    background: "#1099bb",
    resizeTo: window,
    autoStart: true,
  });

  document.body.appendChild(app.view);

  // 4. Load MODEL3 JSON
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Center & scale
    model.anchor.set(0.5);
    const scaleFactor = app.screen.height / model.height * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);
    console.log("✅ Model loaded, scaled, and positioned!");

    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Play idle motion
    if (model.motions?.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      model.motion("Idle", idleKeys[0]);
    }

    // ============================================================
    // 5️⃣ Cursor tracking using pixi-live2d-remake API
    // ============================================================
    window.addEventListener("mousemove", (e) => {
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerX = app.screen.width * 0.25;
      const centerY = app.screen.height / 2;

      const nx = (mouseX - centerX) / (app.screen.width * 0.5); // normalized -1..1
      const ny = (mouseY - centerY) / (app.screen.height * 0.5);

      // Update Cubism 4 parameters correctly
      model.setParam("ParamAngleX", nx * 30);
      model.setParam("ParamAngleY", -ny * 30);
      model.setParam("ParamAngleZ", nx * ny * 10);

      model.setParam("ParamEyeBallX", nx);
      model.setParam("ParamEyeBallY", -ny);
    });

    // ============================================================
    // 6️⃣ Hit interactions
    // ============================================================
    model.interactive = true;
    model.cursor = "pointer";

    model.on("pointerdown", (event) => {
      const hitAreas = model.hitTest(event.data.global);

      if (hitAreas.includes("Head")) {
        model.addParam("ParamAngleZ", 10);
        model.addParam("ParamCheek", 1.0);
      }

      if (hitAreas.includes("Body")) {
        model.addParam("ParamBodyAngleX", 15);
      }

      // Play a random idle motion on click
      if (model.motions?.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }
    });

    // ============================================================
    // 7️⃣ Custom ticker
    // ============================================================
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      app.renderer.render(app.stage);
      model.update(delta);
    });
    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();
