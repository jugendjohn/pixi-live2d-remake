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

  // Create app (NO resizeTo)
  const app = new PIXI.Application({
    background: "#141b21",
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  });

  document.body.appendChild(app.view);

  // Never let ticker sleep
  app.ticker.autoStart = true;
  app.ticker.start();
  app.ticker.maxFPS = 60;
  app.ticker.minFPS = 60;

  // Resize handler
  window.addEventListener("resize", () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.anchor.set(0.5);

    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);

    model.x = app.screen.width * 0.4;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    model.internalModel.settings.eyeBlink = true;

    if (model.motions && model.motions.Idle) {
      const idleKeys = Object.keys(model.motions.Idle);
      const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
      model.motion("Idle", randomKey);
    }

    // CORRECT UPDATE FUNCTION
    app.ticker.add((delta) => {
      model.update(delta);
    });

    console.log("✅ Model loaded, updating properly!");

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }

})();
