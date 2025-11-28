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
    background: "#141b21",   // your page background color
    resizeTo: window,        // auto-resize on window change
  });

  // REQUIRED for Pixi 7 (fixes animations freezing)
  app.ticker.start();
  PIXI.Ticker.shared.start();

  document.body.appendChild(app.view);

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    //
    // 5. When model fully loads
    //
    model.once("loaded", () => {

      //
      // --- Anchor for full-body placement ---
      //
      model.anchor.set(0.5, 1.0);  // center X, bottom Y

      //
      // --- SCALE so full body fits screen ---
      //
      const targetHeight = app.screen.height * 0.95; // show 95% of height

      // Cubism correct model height
      const actualHeight =
        model.internalModel.originalHeight || model.height;

      const scaleFactor = targetHeight / actualHeight;
      model.scale.set(scaleFactor);

      //
      // --- POSITION model left side ---
      //
      model.x = app.screen.width * 0.28; // adjust left/right here
      model.y = app.screen.height;       // align feet to bottom

      //
      // --- Eye blink on ---
      //
      if (model.internalModel?.settings) {
        model.internalModel.settings.eyeBlink = true;
      }

      //
      // --- Idle motion ---
      //
      if (model.motions && model.motions.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        if (idleKeys.length > 0) {
          model.motion("Idle", idleKeys[0]);
        }
      }

      //
      // Force first render (fixes blank-on-load)
      //
      app.renderer.render(app.stage);
    });

    //
    // 6. Add model to stage
    //
    app.stage.addChild(model);

    console.log("✅ Model loaded, scaled, and positioned!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();

