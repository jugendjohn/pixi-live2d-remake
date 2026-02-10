(async () => {
  if (typeof PIXI === "undefined") {
    console.error("❌ PIXI not loaded");
    return;
  }

  if (!PIXI.live2d?.Live2DModel) {
    console.error("❌ pixi-live2d-display not loaded");
    return;
  }

  const { Live2DModel } = PIXI.live2d;

  // =================================================
  // PIXI APP
  // =================================================
  const app = new PIXI.Application({
    background: "#f4f3f2",
    resizeTo: window,
    autoStart: true,
  });

  // Canvas behind UI
  app.view.style.position = "fixed";
  app.view.style.inset = "0";
  app.view.style.pointerEvents = "none";
  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    // =================================================
    // LOAD MODEL
    // =================================================
    const live2dModel = await Live2DModel.from(MODEL_PATH);

    // Placement & scale
    live2dModel.anchor.set(0.5);
    const scale = (app.screen.height / live2dModel.height) * 0.9;
    live2dModel.scale.set(scale);
    live2dModel.x = app.screen.width * 0.25;
    live2dModel.y = app.screen.height / 2;

    live2dModel.eventMode = "static";
    live2dModel.cursor = "pointer";

    app.stage.addChild(live2dModel);

    // =================================================
    // INTERNAL REFERENCES (shared with model.js)
    // =================================================
    const internalModel = live2dModel.internalModel;
    const coreModel = internalModel.coreModel;

    internalModel.settings.eyeBlink = true;

    // Expose globals (IMPORTANT)
    window.live2dModel = live2dModel;
    window.live2dCore = coreModel;
    window.pixiApp = app;

    console.log("✅ Live2D model ready");

    // =================================================
    // INTERACTION STATE
    // =================================================
    let isDragging = false;
    let dragX = 0;
    let dragY = 0;

    const stopDrag = () => {
      isDragging = false;
      dragX = 0;
      dragY = 0;
    };

    // =================================================
    // POINTER EVENTS
    // =================================================
    live2dModel.on("pointerdown", (e) => {
      const { x, y } = e.data.global;
      isDragging = true;

      // Head → random expression (F01–F08)
      if (live2dModel.hitTest("Head", x, y)) {
        const exprMgr = internalModel.expressionManager;
        const expressions = exprMgr?._expressions;

        if (expressions && expressions.size > 0) {
          const keys = [...expressions.keys()];
          const pick = keys[Math.floor(Math.random() * keys.length)];
          exprMgr.setExpression(pick);
        }
        return;
      }

      // Body → random TapBody gesture
      if (live2dModel.hitTest("Body", x, y)) {
        const motions =
          internalModel.motionManager?._motions?.TapBody;

        if (motions && motions.length > 0) {
          const index = Math.floor(Math.random() * motions.length);
          internalModel.motionManager.startMotion(
            "TapBody",
            index,
            3
          );
        }
        return;
      }
    });

    live2dModel.on("pointermove", (e) => {
      const { x, y } = e.data.global;

      if (!isDragging) {
        live2dModel.focus(x, y);
        return;
      }

      dragX = (x - live2dModel.x) / (live2dModel.width * 0.5);
      dragY = (y - live2dModel.y) / (live2dModel.height * 0.5);

      dragX = Math.max(-1, Math.min(1, dragX));
      dragY = Math.max(-1, Math.min(1, dragY));
    });

    live2dModel.on("pointerup", stopDrag);
    live2dModel.on("pointerupoutside", stopDrag);

    // =================================================
    // TICKER – BODY / EYE FOLLOW
    // =================================================
    const ticker = new PIXI.Ticker();

    ticker.add(() => {
      const dx = isDragging ? dragX : 0;
      const dy = isDragging ? dragY : 0;

      coreModel.setParameterValueById("ParamAngleX", dx * 30);
      coreModel.setParameterValueById("ParamAngleY", dy * 30);
      coreModel.setParameterValueById("ParamAngleZ", dx * dy * -30);
      coreModel.setParameterValueById("ParamBodyAngleX", dx * 10);
      coreModel.setParameterValueById("ParamEyeBallX", dx);
      coreModel.setParameterValueById("ParamEyeBallY", dy);

      live2dModel.update(1);
      app.renderer.render(app.stage);
    });

    ticker.start();

  } catch (err) {
    console.error("❌ Live2D load failed:", err);
  }
})();
