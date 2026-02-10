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

  // Canvas behind UI, allow clicks
  app.view.style.position = "fixed";
  app.view.style.top = "0";
  app.view.style.left = "0";
  app.view.style.width = "100vw";
  app.view.style.height = "100vh";
  app.view.style.pointerEvents = "none"; 
  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const live2dModel = await Live2DModel.from(MODEL_PATH);

    // =================================================
    // Placement & scale
    // =================================================
    live2dModel.anchor.set(0.5);
    const scaleFactor = (app.screen.height / live2dModel.height) * 0.9;
    live2dModel.scale.set(scaleFactor);
    live2dModel.x = app.screen.width * 0.25;
    live2dModel.y = app.screen.height / 2;

    live2dModel.eventMode = "static"; 
    live2dModel.cursor = "pointer";

    app.stage.addChild(live2dModel);

    live2dModel.internalModel.settings.eyeBlink = true;
    const live2dCore = live2dModel.internalModel.coreModel;

    // Expose globally (name alignment ONLY)
    window.live2dModel = live2dModel;
    window.live2dCore = live2dCore;

    console.log("✅ Model loaded");

    // =================================================
    // Interaction: Head / Body / Drag
    // =================================================
    let dragging = false;
    let dragX = 0, dragY = 0;

    const stopDrag = () => { dragging = false; dragX = 0; dragY = 0; };

    live2dModel.on("pointerdown", e => {
      const x = e.data.global.x;
      const y = e.data.global.y;

      dragging = true;

      // Head click: random expression
      if (live2dModel.hitTest("Head", x, y)) {
        const expressions =
          live2dModel.internalModel.motionManager?.expressionManager?._motions;

        if (expressions && expressions.size > 0) {
          const keys = [...expressions.keys()];
          const key = keys[Math.floor(Math.random() * keys.length)];
          live2dModel.expression(key);
        }
        return;
      }

      // Body click: random TapBody motion
      if (live2dModel.hitTest("Body", x, y)) {
        const tapMotions = live2dModel.motions?.TapBody;
        if (tapMotions && tapMotions.length > 0) {
          const motion = tapMotions[Math.floor(Math.random() * tapMotions.length)];
          live2dModel.motion(
            "TapBody",
            motion.File,
            { fadeIn: motion.FadeInTime || 0.5, fadeOut: motion.FadeOutTime || 0.5 }
          );
        }
        return;
      }
    });

    live2dModel.on("pointermove", e => {
      const x = e.data.global.x;
      const y = e.data.global.y;

      if (!dragging) {
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
    // Ticker: body/eye follow
    // =================================================
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      const dx = dragging ? dragX : 0;
      const dy = dragging ? dragY : 0;

      live2dCore.setParameterValueById("ParamAngleX", dx * 30);
      live2dCore.setParameterValueById("ParamAngleY", dy * 30);
      live2dCore.setParameterValueById("ParamAngleZ", dx * dy * -30);
      live2dCore.setParameterValueById("ParamBodyAngleX", dx * 10);
      live2dCore.setParameterValueById("ParamEyeBallX", dx);
      live2dCore.setParameterValueById("ParamEyeBallY", dy);

      live2dModel.update(1);
      app.renderer.render(app.stage);
    });
    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
