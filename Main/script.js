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
    autoStart: true,   // ← FIX #1 (ensures ticker always runs)
  });

  document.body.appendChild(app.view);

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Anchor at center
    model.anchor.set(0.5);

    // Scale model to fit height of screen (same as your code)
    const scaleFactor = app.screen.height / model.height * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);
      console.log("✅ Model loaded, scaled, and positioned!");
    
    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Play idle motion if available
    if (model.motions && model.motions.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
      model.motion("Idle", randomKey);
    }
    
     // 5️⃣ Cursor tracking: make model look at cursor
    window.addEventListener('mousemove', (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Convert mouse position to normalized [-1, 1] for parameter
      const dx = (mouseX - model.x) / app.screen.width;
      const dy = (mouseY - model.y) / app.screen.height;

      // Set model parameters (these names may vary per model)
      if (model.internalModel) {
        model.internalModel.setParameterValueById('ParamAngleX', dx * 30); // rotate head left/right
        model.internalModel.setParameterValueById('ParamAngleY', dy * 20); // rotate head up/down
        model.internalModel.setParameterValueById('ParamEyeBallX', dx);   // move eyes
        model.internalModel.setParameterValueById('ParamEyeBallY', dy);
      }
    });

    // 6️⃣ Hit interactions: trigger idle motion on click
    model.interactive = true;
    model.cursor = "pointer";
    model.on('pointerdown', () => {
      if (model.motions?.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }
    });

    // Create a new ticker instance
    const ticker = new PIXI.Ticker();
    // Add a callback to render the stage and update the model
    ticker.add((delta) => {
      // Render the stage
      app.renderer.render(app.stage);
      // Update the model manually (optional if you want fine control)
      if (model && model.internalModel) {
        model.update(delta); // pass delta time
      }
    });
    // Start the ticker
    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();
