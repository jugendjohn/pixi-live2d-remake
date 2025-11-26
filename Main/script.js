(async () => {
  // Check PIXI
  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI NOT LOADED");
    return;
  }

  // Check Live2D plugin
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) {
    console.error("❌ pixi-live2d-display NOT LOADED");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  // Create PIXI app
  const app = new PIXI.Application({
    background: "#141b21",
    resizeTo: window,
    antialias: true
  });

  document.body.appendChild(app.view);

  // Model path
  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.anchor.set(0.5);

    // Scale according to screen height
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);

    // Offset left
    model.x = app.screen.width * 0.40;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    console.log("✅ Model loaded!");

    // Let PIXI handle frame updates automatically — NO manual update needed
    app.ticker.add(() => {
      // THIS EMPTY TICKER ENSURES PIXI RUNS — DO NOT REMOVE
    });

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
