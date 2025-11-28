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
    background: 0x1099bb,
    resizeTo: window,
    autoStart: true, // ensures ticker runs
  });

  document.body.appendChild(app.view);

  //
  // 4. Ensure tickers are running (required for Live2D animation)
  //
  app.ticker.start();
  PIXI.Ticker.shared.start();

  // Optional: force redraw each frame (extra safety for UMD builds)
  app.ticker.add(() => {
    app.renderer.render(app.stage);
  });

  //
  // 5. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Add model to stage immediately
    app.stage.addChild(model);

    // Wait until all textures are fully loaded
    model.once('loaded', () => {

      // Anchor at center
      model.anchor.set(0.5);

      // Function to scale and position model
      const resizeModel = () => {
        const scaleFactor = (app.screen.height / model.height) * 0.9;
        model.scale.set(scaleFactor);
        model.x = app.screen.width * 0.4; // slightly left
        model.y = app.screen.height / 2;  // vertically centered
      };

      // Initial positioning
      resizeModel();

      // Update position/scale on window resize
      window.addEventListener('resize', resizeModel);

      // Enable eye blinking
      model.internalModel.settings.eyeBlink = true;

      // Play idle motion if available
      if (model.motions?.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }

      // Force initial render
      app.renderer.render(app.stage);
    });

    console.log("✅ Model loaded, scaled, and positioned!");
    
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();

