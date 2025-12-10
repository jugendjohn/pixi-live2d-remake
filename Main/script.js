(async () => {
  if (typeof PIXI === "undefined") return console.error("❌ PIXI NOT LOADED");
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel) return console.error("❌ pixi-live2d-display NOT LOADED");

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

    // Center & scale
    model.anchor.set(0.5);
    const scaleFactor = app.screen.height / model.height * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);
    console.log("✅ Model loaded, scaled, and positioned!");

    // Enable blinking
    model.internalModel.settings.eyeBlink = true;

    // Wait for coreModel to be ready
    const core = model.internalModel.coreModel;

    // ============================================================
    // Cursor tracking in ticker
    // ============================================================
    let mouseX = model.x, mouseY = model.y;
    window.addEventListener("mousemove", (e) => {
      const rect = app.view.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    // ============================================================
    // Hit interactions
    // ============================================================
    app.stage.eventMode = "static";
    app.stage.on("pointerdown", (e) => {
      const px = e.global.x;
      const py = e.global.y;

      const left = model.x - model.width / 2;
      const right = model.x + model.width / 2;
      const top = model.y - model.height / 2;
      const bottom = model.y + model.height / 2;

      if (px > left && px < right && py > top && py < bottom) {
        // Play random idle motion
        if (model.motions?.Idle) {
          const idleKeys = Object.keys(model.motions.Idle);
          const randomKey = idleKeys[Math.floor(Math.random() * idleKeys.length)];
          model.motion("Idle", randomKey);
        }
      }
    });

    // ============================================================
    // Custom ticker
    // ============================================================
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      // Head & eye movement
      const dx = (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = (mouseY - model.y) / (app.screen.height * 0.5);

      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamAngleZ", dx * dy * 10);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);

      app.renderer.render(app.stage);
      model.update(ticker.deltaMS / 16.6667); // pass delta time in approx frames
    });
    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
