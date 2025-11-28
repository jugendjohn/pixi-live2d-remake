(async () => {
  //
  // PIXI checks
  //
  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI NOT LOADED");
    return;
  }
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) {
    console.error("❌ pixi-live2d-display NOT LOADED");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  //
  // 3. Create PIXI app
  //
  const app = new PIXI.Application({
    background: "#141b21",
    resizeTo: window,
    antialias: true,
  });

  // Pixi 7 fix — required for Live2D motion updates
  app.ticker.start();
  PIXI.Ticker.shared.start();

  document.body.appendChild(app.view);

  // 🔥 FIX FOR NOT SHOWING UNTIL ZOOM — force correct canvas size
  app.renderer.resize(window.innerWidth, window.innerHeight);
  requestAnimationFrame(() => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  //
  // Load model
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.once("loaded", () => {
      //
      // Scale and placement (left-side full body)
      //
      model.anchor.set(0.5, 1.0); // middle-bottom

      const fullHeight =
        model.internalModel.originalHeight || model.height;

      const scaleFactor =
        (app.screen.height * 0.55) / fullHeight;

      model.scale.set(scaleFactor);

      model.x = app.screen.width * 0.22;
      model.y = app.screen.height;

      model.internalModel.settings.eyeBlink = true;

      if (model.motions && model.motions.Idle) {
        const idleKeys = Object.keys(model.motions.Idle);
        const randomKey =
          idleKeys[Math.floor(Math.random() * idleKeys.length)];
        model.motion("Idle", randomKey);
      }

      // Force initial draw
      app.renderer.render(app.stage);
    });

    app.stage.addChild(model);

    console.log("✅ Model loaded successfully!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
