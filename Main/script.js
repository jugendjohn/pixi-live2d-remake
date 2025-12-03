(async () => {

  //
  // 1. PIXI check
  //
  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI NOT LOADED");
    return;
  }

  //
  // 2. Live2D plugin check
  //
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) {
    console.error("❌ pixi-live2d-display NOT LOADED");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  //
  // 3. Create PIXI app
  //
  const app = new PIXI.Application({
    background: "#1099bb",
    resizeTo: window,
    autoStart: true,
  });

  document.body.appendChild(app.view);

  //
  // 4. Load MODEL3 JSON
  //
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

    // Enable blinking (Cubism 4)
    model.internalModel.settings.eyeBlink = true;

    // Idle motion
    if (model.motions?.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      model.motion("Idle", idleKeys[0]);
    }

    // ============================================================
    // 5️⃣ Cursor tracking — CUBISM 4 CORRECT VERSION
    // ============================================================
    window.addEventListener("mousemove", (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const dx = (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = (mouseY - model.y) / (app.screen.height * 0.5);

      const core = model.internalModel.coreModel; // ← correct Cubism 4 target

      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);
    });

    // ============================================================
    // 6️⃣ Hit interaction (click → play idle)
    // ============================================================
    model.interactive = true;
    model.cursor = "pointer";
    model.on("pointerdown", () => {
      if (model.motions?.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }
    });

    // ============================================================
    // 7️⃣ Custom ticker — updates model smoothly
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
