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

    console.log("✅ Model loaded");

    // ============================================================
    // Interaction
    // ============================================================
    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;

    let dragging = false;
    let dragX = 0;
    let dragY = 0;

    app.stage.on("pointerdown", (e) => {
      const x = e.global.x;
      const y = e.global.y;

      dragging = true;

      if (model.hitTest("Head", x, y)) {
        console.log("[HIT] Head");
        const expressions = model.internalModel.motionManager?.expressionManager?._motions;
        if (expressions && expressions.size > 0) {
          const keys = [...expressions.keys()];
          model.expression(keys[Math.floor(Math.random() * keys.length)]);
        }
        return;
      }

      if (model.hitTest("Body", x, y)) {
        console.log("[HIT] Body");
        if (model.motions?.Idle) {
          const keys = Object.keys(model.motions.Idle);
          model.motion("Idle", keys[Math.floor(Math.random() * keys.length)]);
        }
      }
    });

    app.stage.on("pointermove", (e) => {
      if (!dragging) return;
      const x = e.global.x;
      const y = e.global.y;

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

    app.stage.on("pointerup", stopDrag);
    app.stage.on("pointerupoutside", stopDrag);

    let mouseX = model.x;
    let mouseY = model.y;

    window.addEventListener("mousemove", (e) => {
      if (dragging) return;
      const rect = app.view.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    // ============================================================
    // Ticker (Cubism-style update)
    // ============================================================
    const ticker = new PIXI.Ticker();

    ticker.add(() => {
      const dx = dragging
        ? dragX
        : (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = dragging
        ? dragY
        : (mouseY - model.y) / (app.screen.height * 0.5);

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
    // TTS Functionality
    // ============================================================
    const ttsInput = document.getElementById("tts-input");
    const ttsButton = document.getElementById("tts-button");

    ttsButton.addEventListener("click", () => {
      const text = ttsInput.value.trim();
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1;
      utterance.rate = 1;

        // Select a female voice if available
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.toLowerCase().includes("female") || 
        voice.name.toLowerCase().includes("zira") || // fallback examples for common female voices
        voice.name.toLowerCase().includes("susan")
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        const lipTicker = new PIXI.Ticker();
        let direction = 1;

        lipTicker.add(() => {
          let value = core.getParameterValueById("ParamMouthOpenY") || 0;
          value += 0.05 * direction;
          if (value > 0.5 || value < 0) direction *= -1;

          core.setParameterValueById("ParamMouthOpenY", value);
          model.update(1);
          app.renderer.render(app.stage);
        });

        utterance.onend = () => lipTicker.stop();
        lipTicker.start();
      };

      speechSynthesis.speak(utterance);
    });

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
