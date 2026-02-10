// ===============================
// TTS + Expression + Gesture + Lip Sync
// (Haru model compliant, no sounds)
// ===============================

const ttsInputEl = document.getElementById("tts-input");
const ttsButtonEl = document.getElementById("tts-button");
const ttsOutputEl = document.getElementById("tts-output");

let availableVoices = [];
speechSynthesis.onvoiceschanged = () => {
  availableVoices = speechSynthesis.getVoices();
};

function getFemaleVoice() {
  return availableVoices.find(v =>
    /female|zira|samantha|victoria|susan/i.test(v.name)
  );
}

// ===============================
// Live2D Helpers (Cubism 4)
// ===============================
function setExpression(expressionName) {
  const model = window.model;
  if (!model?.internalModel?.expressionManager) return;

  try {
    model.internalModel.expressionManager.setExpression(expressionName);
  } catch {
    console.warn("Expression not found:", expressionName);
  }
}

function playMotion(groupName, index = 0, priority = 2) {
  const model = window.model;
  if (!model?.internalModel?.motionManager) return;

  try {
    model.internalModel.motionManager.startMotion(groupName, index, priority);
  } catch {
    console.warn("Motion not found:", groupName, index);
  }
}

// ===============================
// Text → Expression Logic
// ===============================
function analyzeExpression(text) {
  const t = text.toLowerCase();

  if (t.includes("thank") || t.includes("welcome"))
    return "F02"; // happy

  if (t.includes("warning") || t.includes("important"))
    return "F04"; // serious

  if (t.includes("why") || t.includes("how"))
    return "F05"; // thinking

  if (t.includes("!") || t.includes("wow"))
    return "F06"; // surprised

  if (t.includes("sorry") || t.includes("unfortunately"))
    return "F07"; // sad

  return "F01"; // neutral
}

// ===============================
// TTS Button
// ===============================
ttsButtonEl.addEventListener("click", () => {
  const text = ttsInputEl.value.trim();
  if (!text) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 1;
  utterance.rate = 1;
  utterance.voice = getFemaleVoice() || null;

  // ===============================
  // Word output
  // ===============================
  const words = text.split(/\s+/);
  ttsOutputEl.textContent = "";
  let wordIndex = 0;

  const wordTimer = setInterval(() => {
    if (wordIndex >= words.length) return clearInterval(wordTimer);
    ttsOutputEl.textContent += words[wordIndex] + " ";
    wordIndex++;
  }, 150);

  // ===============================
  // On TTS start
  // ===============================
  utterance.onstart = () => {
    const core = window.live2dCore;
    if (!core) return console.warn("❌ Live2D core not ready");

    // Expression
    const expression = analyzeExpression(text);
    setExpression(expression);

    // Idle motion
    playMotion("Idle", Math.random() > 0.5 ? 1 : 0);

    // Random TapBody gestures during speech
    const gestureTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * 4);
      playMotion("TapBody", idx, 3);
    }, 2800);

    utterance._gestureTimer = gestureTimer;

    // ===============================
    // Lip Sync (ParamMouthOpenY only)
    // ===============================
    let currentWord = 0;
    const wordDuration = 300;
    let elapsed = 0;

    const lipTicker = new PIXI.Ticker();
    lipTicker.add((delta) => {
      elapsed += delta * 16.67;

      const cycle = elapsed % wordDuration;
      const mouth =
        cycle < wordDuration / 2 ? 1.0 : 0.2;

      core.setParameterValueById("ParamMouthOpenY", mouth);

      if (elapsed >= (currentWord + 1) * wordDuration) {
        currentWord++;
        if (currentWord >= words.length) {
          lipTicker.stop();
          core.setParameterValueById("ParamMouthOpenY", 0);
        }
      }
    });

    lipTicker.start();
  };

  // ===============================
  // On TTS end
  // ===============================
  utterance.onend = () => {
    clearInterval(wordTimer);

    if (utterance._gestureTimer)
      clearInterval(utterance._gestureTimer);

    setExpression("F01");
    playMotion("Idle", 0);
  };

  speechSynthesis.speak(utterance);
});
