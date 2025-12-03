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
    // 5️⃣ Cursor tracking (Cubism 4)
    // ============================================================
    window.addEventListener("mousemove", (e) => {
      const rect = app.view.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const dx = (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = (mouseY - model.y) / (app.screen.height * 0.5);

      const core = model.internalModel.coreModel;

      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamAngleZ", dx * dy * 10);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);
    });

    // ============================================================
    // 6️⃣ Hit interaction (click → play idle)
    // ============================================================
    app.stage.interactive = true;
    app.stage.on("pointerdown", (e) => {
      const px = e.data.global.x;
      const py = e.data.global.y;

      const left = model.x - model.width / 2;
      const right = model.x + model.width / 2;
      const top = model.y - model.height / 2;
      const bottom = model.y + model.height / 2;

      if (px > left && px < right && py > top && py < bottom) {
        // Trigger idle motion
        if (model.motions?.Idle) {
          const idleKeys = Object.keys(model.motions.Idle);
          const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
          model.motion("Idle", randomKey);
        }
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
