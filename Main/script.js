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
    background: "#1099bb",
    resizeTo: window,
  });

  document.body.appendChild(app.view);
  
  app.ticker.start();;

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH =
    "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Anchor at center (for scaling and positioning)
    model.anchor.set(0.5);

    // Scale model to fit the height of the screen (adjust as needed)
    const scaleFactor = app.screen.height / model.height * 0.9; // 90% of screen height
    model.scale.set(scaleFactor);

    // Offset to the left (20% from the left edge)
    model.x = app.screen.width * 0.4; 
    // Vertically center
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Play idle motion if available
    if (model.motions && model.motions.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
      model.motion("Idle", randomKey);
    }

    console.log("✅ Model loaded, scaled, and positioned!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
