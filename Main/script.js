(async () => {

  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI NOT LOADED");
    return;
  }

  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) {
    console.error("❌ pixi-live2d-display NOT LOADED");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  // PIXI app
  const app = new PIXI.Application({
    background: "#1099bb",
    resizeTo: window,
    autoStart: true,
  });

  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);
    Application.registerPlugin(TickerPlugin);
    Live2DModel.registerTicker(Ticker);

    // Add to stage immediately (safe)
    app.stage.addChild(model);

    //
    // REAL FIX: only run placement AFTER full model load
    //
    model.on("modelLoaded", () => {
      
      // Center anchor
      model.anchor.set(0.1);

      // Proper scale (NOW correct, since model.width/height exist)
      const scaleFactor = (app.screen.height / model.height) * 0.1;
      model.scale.set(scaleFactor);

      // Left offset (40% from left)
      model.x = app.screen.width * 0.1;
      model.y = app.screen.height / 4;

    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Play idle motion if available
    if (model.motions && model.motions.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
      model.motion("Idle", randomKey);
    }

    console.log("✅ Model loaded, scaled, and positioned!");

    //
    // FIX #2 — force redraw every frame (prevents stuck-on-first-frame issue)
    //
    app.ticker.add(() => {
      app.renderer.render(app.stage);
    });

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();
