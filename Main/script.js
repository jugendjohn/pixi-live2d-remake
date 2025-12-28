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

    model.eventMode = "static";
    model.cursor = "pointer";

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
        const expressions =
          model.internalModel.motionManager?.expressionManager?._motions;
        if (expressions && expressions.size > 0) {
          const keys = [...expressions.keys()];
          model.expression(keys[Math.floor(Math.random() * keys.length)]);
        }
        return;
      }

      if (model.hitTest("Body", x, y)) {
        if (model.motions?.Idle) {
          const keys = Object.keys(model.motions.Idle);
          model.motion("Idle", keys[Math.floor(Math.random() * keys.length)]);
        }
      }
    });

    app.stage.on("pointermove", (e) => {
      const x = e.global.x;
      const y = e.global.y;

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

    app.stage.on("pointerup", stopDrag);
    app.stage.on("pointerupoutside", stopDrag);

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
    // TTS + Word Output + Lip Sync (Simplified & Female Voice Fix)
    // ============================================================
    const ttsInput = document.getElementById("tts-input");
    const ttsButton = document.getElementById("tts-button");
    const ttsOutput = document.getElementById("tts-output");

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Ensure voices are loaded before first TTS
    let voices = [];
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
    };

    function getFemaleVoice() {
      return voices.find(v =>
        /female|zira|samantha|victoria|susan/i.test(v.name)
      );
    }

    ttsButton.addEventListener("click", () => {
      const text = ttsInput.value.trim();
      if (!text) return;

      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1;
      utterance.rate = 1;
      utterance.voice = getFemaleVoice() || null;

      // Word output
      const words = text.split(/\s+/);
      ttsOutput.textContent = "";
      let wordIndex = 0;
      const wordTimer = setInterval(() => {
        if (wordIndex >= words.length) return clearInterval(wordTimer);
        ttsOutput.textContent += words[wordIndex] + " ";
        wordIndex++;
      }, 150);

      // Lip sync
      let lipSyncActive = false;
      utterance.onstart = () => {
        lipSyncActive = true;

        const lipTicker = new PIXI.Ticker();
        lipTicker.add(() => {
          if (!lipSyncActive) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          core.setParameterValueById("ParamMouthOpenY", Math.min(sum / dataArray.length / 80, 1));
        });
        lipTicker.start();

        utterance.onend = () => {
          lipSyncActive = false;
          core.setParameterValueById("ParamMouthOpenY", 0);
          clearInterval(wordTimer);
          lipTicker.stop();
        };
      };

      speechSynthesis.speak(utterance);
    });

  } catch (e) {
    console.error("❌ MODEL LOAD ERROR:", e);
  }
})();
