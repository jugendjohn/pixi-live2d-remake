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
    resizeTo: window, // auto-resize
  });

  // Pixi 7 fix: start ticker
  app.ticker.start();
  PIXI.Ticker.shared.start();

  document.body.appendChild(app.view);

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.once("loaded", () => {
      model.anchor.set(0.5);

      const scaleFactor = (app.screen.height / model.height) * 0.9;
      model.scale.set(scaleFactor);

      model.x = app.screen.width * 0.4;
      model.y = app.screen.height / 2;

      model.internalModel.settings.eyeBlink = true;

      if (model.motions && model.motions.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }

      // Initial draw
      app.renderer.render(app.stage);
    });

    // Add model
    app.stage.addChild(model);

    //
    // 🔥 IMPORTANT: Manual update loop (Pixi v7 requirement)
    //
    app.ticker.add((delta) => {
      model.update(delta);   // <– REQUIRED so Live2D actually animates
    });

    console.log("✅ Model fully initialized");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
