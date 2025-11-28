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
  });

  app.ticker.start();
  PIXI.Ticker.shared.start();

  document.body.appendChild(app.view);

  //
  // 4. Load model
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // 5️⃣ Register ticker for Live2D (Pixi v7)
    if (PIXI.Ticker && PIXI.Ticker.shared) {
      // Use the shared ticker to drive Live2D
      model.registerTicker(PIXI.Ticker.shared);
    }

    model.once('loaded', () => {
      model.anchor.set(0.5);
      const scaleFactor = (app.screen.height / model.height) * 0.9;
      model.scale.set(scaleFactor);
      model.x = app.screen.width * 0.4;
      model.y = app.screen.height / 2;

      // Enable blinking
      model.internalModel.settings.eyeBlink = true;

      // Play idle motion
      if (model.motions?.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }

      // Force initial render
      app.renderer.render(app.stage);
    });

    app.stage.addChild(model);
    console.log("✅ Model loaded and ticker registered!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
