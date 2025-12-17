(async () => {
  if (typeof PIXI === "undefined") return console.error("❌ PIXI NOT LOADED");
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

    // ===============================
    // Placement & scale
    // ===============================
    model.anchor.set(0.5);
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);
    model.internalModel.settings.eyeBlink = true;

    const core = model.internalModel.coreModel;

    // ============================================================
    // Drag + hit logic
    // ============================================================
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    let dragging = false;
    let dragX = 0;
    let dragY = 0;

    app.stage.on("pointerdown", (e) => {
      dragging = true;

      const x = e.global.x;
      const y = e.global.y;

      if (model.hitTest("Head", x, y)) {
        model.expression("F01"); // fallback expression
      }

      if (model.hitTest("Body", x, y) && model.motions?.Idle) {
        const keys = Object.keys(model.motions.Idle);
        model.motion("Idle", keys[Math.floor(Math.random() * keys.length)]);
      }
    });

    app.stage.on("pointermove", (e) => {
      if (!dragging) return;
      dragX = (e.global.x - model.x) / (model.width * 0.5);
      dragY = (e.global.y - model.y) / (model.height * 0.5);
      dragX = Math.max(-1, Math.min(1, dragX));
      dragY = Math.max(-1, Math.min(1, dragY));
    });

    const stopDrag = () => {
      dragging = false;
      dragX = 0;
      dragY = 0;
    };

    app.stage.on("pointerup", stopDrag);
    app.stage.on("pointerupoutside", stopDrag);

    // ============================================================
    // Cursor tracking
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
    // TTS + Lip Sync
    // ============================================================
    let speaking = false;
    let mouthOpen = 0;

    const speakBtn = document.getElementById("ttsSpeak");
    const textBox = document.getElementById("ttsText");

    speakBtn.onclick = () => {
      const text = textBox.value.trim();
      if (!text) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1;
      utter.pitch = 1.1;

      utter.onstart = () => (speaking = true);
      utter.onend = () => {
        speaking = false;
        mouthOpen = 0;
      };

      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    };

    // ============================================================
    // Ticker (animation)
    // ============================================================
    const ticker = new PIXI.Ticker();

    ticker.add((delta) => {
      const dx = dragging
        ? dragX
        : (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = dragging
        ? dragY
        : (mouseY - model.y) / (app.screen.height * 0.5);

      // Head & body
      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamAngleZ", dx * dy * -30);
      core.setParameterValueById("ParamBodyAngleX", dx * 10);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);

      // Lip sync (simple RMS simulation)
      if (speaking) {
        mouthOpen += (Math.random() * 0.6 - mouthOpen) * 0.5;
      } else {
        mouthOpen *= 0.8;
      }

      core.setParameterValueById("ParamMouthOpenY", mouthOpen);

      model.update(1);
      app.renderer.render(app.stage);
    });

    ticker.start();

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
