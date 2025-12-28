(async () => {
  if (typeof PIXI === "undefined") return console.error("❌ PIXI NOT LOADED");
  if (!PIXI.live2d?.Live2DModel) return console.error("❌ pixi-live2d-display NOT LOADED");

  const { Live2DModel } = PIXI.live2d;

  // ---------------- PIXI APP ----------------
  const app = new PIXI.Application({
    background: "#f4f3f2",
    resizeTo: window,
    autoStart: true,
  });
  document.body.appendChild(app.view);

  const MODEL_PATH = "Samples/Resources/Haru/Haru.model3.json";

  try {
    const model = await Live2DModel.from(MODEL_PATH);
    const core = model.internalModel.coreModel;

    // ---------------- Placement & Scale ----------------
    model.anchor.set(0.5);
    const scaleFactor = (app.screen.height / model.height) * 0.9;
    model.scale.set(scaleFactor);
    model.x = app.screen.width * 0.25;
    model.y = app.screen.height / 2;

    app.stage.addChild(model);

    model.internalModel.settings.eyeBlink = true;
    console.log("✅ Model loaded");

    // ---------------- Cursor Tracking ----------------
    let mouseX = model.x;
    let mouseY = model.y;

    window.addEventListener("mousemove", (e) => {
      const rect = app.view.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    // ---------------- TTS + WORD OUTPUT ----------------
    const ttsInput = document.getElementById("tts-input");
    const ttsButton = document.getElementById("tts-button");
    const ttsOutput = document.getElementById("tts-output");

    let speaking = false;
    let mouthValue = 0;

    function getFemaleVoice() {
      const voices = speechSynthesis.getVoices();
      return voices.find(v => /female|zira|samantha|victoria|susan/i.test(v.name));
    }

    ttsButton.addEventListener("click", () => {
      const text = ttsInput.value.trim();
      if (!text) return;

      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1;
      utterance.rate = 1;

      const voice = getFemaleVoice();
      if (voice) utterance.voice = voice;

      // Word-by-word output
      const words = text.split(/\s+/);
      ttsOutput.textContent = "";
      let wordIndex = 0;
      const wordInterval = Math.max(150, 600 / words.length);

      const wordTimer = setInterval(() => {
        if (wordIndex >= words.length) {
          clearInterval(wordTimer);
          return;
        }
        ttsOutput.textContent += words[wordIndex] + " ";
        wordIndex++;
      }, wordInterval);

      utterance.onstart = () => {
        speaking = true;
      };

      utterance.onend = () => {
        speaking = false;
        mouthValue = 0;
        core.setParameterValueById("ParamMouthOpenY", 0);
        clearInterval(wordTimer);
      };

      speechSynthesis.speak(utterance);
    });

    speechSynthesis.onvoiceschanged = () => {};

    // ---------------- PIXI TICKER ----------------
    const ticker = new PIXI.Ticker();
    ticker.add(() => {
      // Head & eyes follow cursor
      const dx = (mouseX - model.x) / (app.screen.width * 0.5);
      const dy = (mouseY - model.y) / (app.screen.height * 0.5);

      core.setParameterValueById("ParamAngleX", dx * 30);
      core.setParameterValueById("ParamAngleY", dy * 30);
      core.setParameterValueById("ParamAngleZ", dx * dy * -30);
      core.setParameterValueById("ParamBodyAngleX", dx * 10);
      core.setParameterValueById("ParamEyeBallX", dx);
      core.setParameterValueById("ParamEyeBallY", dy);

      // Simulated lip-sync
      if (speaking) {
        mouthValue += (Math.random() * 0.8 - mouthValue) * 0.35;
        mouthValue = Math.max(0, Math.min(1, mouthValue));
        core.setParameterValueById("ParamMouthOpenY", mouthValue);
      }

      model.update(1);
      app.renderer.render(app.stage);
    });
    ticker.start();

  } catch (err) {
    console.error("❌ MODEL LOAD ERROR:", err);
  }
})();
