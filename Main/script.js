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
  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);

    // ============================================================
    // Placement & scale
    // ============================================================
    model.anchor.set(0.5);
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    // Enable eye blink (Cubism internal)
    model.internalModel.settings.eyeBlink = true;

    const core = model.internalModel.coreModel;

    console.log("✅ Model loaded");

    // ============================================================
    // Interaction setup
    // ============================================================
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    let dragging = false;

    // ------------------------------------------------------------
    // Pointer DOWN (tap / drag start)
    // ------------------------------------------------------------
    app.stage.on("pointerdown", (e) => {
      const x = e.global.x;
      const y = e.global.y;

      dragging = true;

      // --- Cubism hit test ---
      if (model.hitTest("Head", x, y)) {
        console.log("[HIT] Head");
        model.setRandomExpression();
        return;
      }

      if (model.hitTest("Body", x, y)) {
        console.log("[HIT] Body");
        if (model.motions?.Idle) {
          const keys = Object.keys(model.motions.Idle);
          const key = keys[Math.floor(Math.random() * keys.length)];
          model.motion("Idle", key);
        }
      }
    });

    // ------------------------------------------------------------
    // Pointer MOVE (Cubism-style dragging)
    // ------------------------------------------------------------
    app.stage.on("pointermove", (e) => {
      if (!dragging) return;

      const x = e.global.x;
      const y = e.global.y;

      // Normalize to Cubism drag space (-1 ~ 1)
      const dx = (x - model.x) / (model.width * 0.5);
      const dy = (y - model.y) / (model.height * 0.5);

      model.setDragging(
        Math.max(-1, Math.min(1, dx)),
        Math.max(-1, Math.min(1, dy))
      );
    });

    // ------------------------------------------------------------
    // Pointer UP (drag end)
    // ------------------------------------------------------------
    const stopDrag = () => {
      dragging = false;
      model.setDragging(0, 0);
    };

    app.stage.on("pointerup", stopDrag);
    app.stage.on("pointerupoutside", stopDrag);

    // ============================================================
    // Cursor tracking (only when NOT dragging)
    // ============================================================
    let mouseX = model.x;
    let mouseY = model.y;

    window.addEventListener("mousemove", (e) => {
      if (dragging) return;

      const rect = app.view.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    // ============================================================
    // Ticker (Cubism-safe update loop)
    // ============================================================
    const ticker = new PIXI.Ticker();

    ticker.add((delta) => {
      // Cursor-based look (idle behavior)
      if (!dragging) {
        const dx = (mouseX - model.x) / (app.screen.width * 0.5);
        const dy = (mouseY - model.y) / (app.screen.height * 0.5);

        core.setParameterValueById("ParamAngleX", dx * 30);
        core.setParameterValueById("ParamAngleY", dy * 30);
        core.setParameterValueById("ParamAngleZ", dx * dy * 10);
        core.setParameterValueById("ParamEyeBallX", dx);
        core.setParameterValueById("ParamEyeBallY", dy);
      }

      model.update(delta);
      app.renderer.render(app.stage);
    });

    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
