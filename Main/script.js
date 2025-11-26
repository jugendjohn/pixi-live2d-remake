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
    background: "#141b21",
    resizeTo: window,
  });

  document.body.appendChild(app.view);
  app.ticker.start();

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.anchor.set(0.5);

    // Scale model
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);

    // Position model
    model.x = app.screen.width * 0.4;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Play idle motion
    if (model.motions && model.motions.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
      model.motion("Idle", randomKey);
    }

    // Manual frame update
    app.ticker.add(() => {
      model.update(app.ticker.deltaMS);
      app.renderer.render(app.stage);
    });

    console.log("✅ Model loaded, scaled, and positioned!");

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();
