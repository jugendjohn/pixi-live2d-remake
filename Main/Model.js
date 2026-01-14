(async () => {
  if (typeof PIXI === "undefined") return console.error("❌ PIXI NOT LOADED");
  if (!PIXI.live2d || !PIXI.live2d.Live2DModel)
    return console.error("❌ pixi-live2d-display NOT LOADED");

  const { Live2DModel } = PIXI.live2d;

  const app = new PIXI.Application({
    background: "#f4f3f2",
    resizeTo: window,
    autoStart: true,
  });

  // Insert canvas behind everything and allow clicks through
  app.view.style.position = "fixed";
  app.view.style.top = "0";
  app.view.style.left = "0";
  app.view.style.width = "100vw";
  app.view.style.height = "100vh";
  app.view.style.pointerEvents = "none"; // allow HTML buttons to be clickable
  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // ===============================
    // Placement & scale
    // ===============================
    model.anchor.set(0.5);
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    model.eventMode = "static"; // model reacts to clicks
    model.cursor = "pointer";

    app.stage.addChild(model);

    model.internalModel.settings.eyeBlink = true;
    const core = model.internalModel.coreModel;

    console.log("✅ Model loaded");

    // ============================================================
    // Interaction (drag + click on model only)
    // ============================================================
    let dragging = false;
    let dragX = 0;
    let dragY = 0;

    model.on("pointerdown", (e) => {
      const x = e.data.global.x;
      const y = e.data.global.y;
      dragging = true;

      // Head click: random expression
      if (model.hitTest("Head", x, y)) {
        const expressions =
          model.internalModel.motionManager?.expressionManager?._motions;
        if (expressions && expressions.size > 0) {
          const keys = [...expressions.keys()];
          model.expression(keys[Math.floor(Math.random() * keys.length)]);
        }
        return;
      }

      // Body click: idle motion
      if (model.hitTest("Body", x, y)) {
        if (model.motions?.Idle) {
          const keys = Object.keys(model.motions.Idle);
          model.motion("Idle", keys[Math.floor(Math.random() * keys.length)]);
        }
      }
    });

    model.on("pointermove", (e) => {
      const x = e.data.global.x;
      const y = e.data.global.y;

      if (!dragging) {
        model.focus(x, y);
        return;
      }

      dragX = (x - model.x) / (model.width * 0.5);
      dragY = (y - model.y) / (model.height * 0.5);
      dragX = Math.max(-1, Math.min(1, dragX));
      dragY = Math.max(-1, Math.min(1, dragY));
    });

    const stopDrag = () => {
      dragging = false;
      dragX = 0;
      dragY = 0;
    };

    model.on("pointerup", stopDrag);
    model.on("pointerupoutside", stopDrag);

    // ============================================================
    // Main Ticker (body follow / subtle motion)
    // ============================================================
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      const dx = dragging ? dragX : 0;
      const dy = dragging ? dragY : 0;

      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamAngleZ", dx * dy * -30);
      core.setParameterValueById("ParamBodyAngleX", dx * 10);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);

      model.update(1);
      app.renderer.render(app.stage);
    });
    ticker.start();

    // ============================================================
    // Expose core for TTS script
    // ============================================================
    window.live2dCore = core;

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
