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

  // Import the model constructor
  const { Live2DModel } = PIXI.live2d;

  //
  // 3. Create PIXI app
  //
  const app = new PIXI.Application({
    background: "#141b21",
    resizeTo: window,
  });

  // Pixi 7 fix — **required for animation**
  app.ticker.start();
  PIXI.Ticker.shared.start();

  document.body.appendChild(app.view);

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Wait until fully loaded
    model.once("loaded", () => {
      //
      // 🔹 SCALE + POSITION FIX (FULL BODY LEFT)
      //
      model.anchor.set(0.5, 1.0);  // center X, bottom Y

      // compute full original height for accurate scaling
      const fullHeight = model.internalModel.originalHeight || model.height;

      // scale so full body fits on screen
      const scaleFactor = (app.screen.height * 0.55) / fullHeight;
      model.scale.set(scaleFactor);

      // position: left side, feet touching bottom
      model.x = app.screen.width * 0.22;
      model.y = app.screen.height;

      //
      // END FIX
      //

      // Enable blinking
      model.internalModel.settings.eyeBlink = true;

      // Play idle motion
      if (model.motions && model.motions.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }

      // Force first render
      app.renderer.render(app.stage);
    });

    // Add model to stage
    app.stage.addChild(model);

    console.log("✅ Model loaded, scaled, positioned correctly!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
