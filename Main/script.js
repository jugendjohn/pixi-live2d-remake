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

  //
  // 4. Load MODEL3 JSON
  //
  const MODEL_PATH =
    "../Samples/Resources/Haru/haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // Center and scale model
    model.anchor.set(0.5);
    model.scale.set(0.5);
    model.x = app.screen.width / 2;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    console.log("✅ Model loaded!");
  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
