(async () => {

  if (!PIXI) return console.error("❌ PIXI NOT LOADED");
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel)
    return console.error("❌ pixi-live2d-display NOT LOADED");

  const { Live2DModel } = PIXI.live2d;

  const app = new PIXI.Application({
    background: "#1099bb",
    resizeTo: window,
    autoStart: true,
  });

  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    model.anchor.set(0.5);

    const scaleFactor = app.screen.height / model.height * 0.9;
    model.scale.set(scaleFactor);

    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);
    console.log("✅ Model loaded (Cubism 4).");

    //
    // Cursor look-at behavior (Cubism 4)
    //
    window.addEventListener("mousemove", (e) => {
      const dx = (e.clientX - model.x) / app.screen.width;
      const dy = (e.clientY - model.y) / app.screen.height;

      const core = model.internalModel.coreModel;

      if (core) {
        core.setParameterValueById("ParamAngleX", dx * 30);
        core.setParameterValueById("ParamAngleY", dy * 30);
        core.setParameterValueById("ParamEyeBallX", dx);
        core.setParameterValueById("ParamEyeBallY", dy);
      }
    });

    //
    // Click interaction
    //
    model.interactive = true;
    model.cursor = "pointer";

    model.on("pointerdown", () => {
      if (model.motions?.Idle) {
        const keys = Object.keys(model.motions.Idle);
        model.motion("Idle", keys[Math.floor(Math.random() * keys.length)]);
      }
    });

    //
    // Manual ticker update
    //
    const ticker = new PIXI.Ticker();
    ticker.add((delta) => {
      app.renderer.render(app.stage);
      model.update(delta);
    });
    ticker.start();

  } catch (err) {
    console.error("❌ MODEL LOAD ERROR", err);
  }

})();
