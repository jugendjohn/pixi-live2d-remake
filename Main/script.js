const ttsInput = document.getElementById("tts-input");
const ttsButton = document.getElementById("tts-button");
const ttsOutput = document.getElementById("tts-output");

let voices = [];
speechSynthesis.onvoiceschanged = () => {
  voices = speechSynthesis.getVoices();
};

function getFemaleVoice() {
  return voices.find(v =>
    /female|zira|samantha|victoria|susan/i.test(v.name)
  );
}

function setExpression(name) {
  const model = window.live2dModel;
  if (!model?.internalModel?.expressionManager) return;
  try { model.internalModel.expressionManager.setExpression(name); } catch {}
}

function playMotion(group, index = 0, priority = 2) {
  const model = window.live2dModel;
  if (!model?.internalModel?.motionManager) return;
  try { model.internalModel.motionManager.startMotion(group, index, priority); } catch {}
}

function analyzeExpression(text) {
  const t = text.toLowerCase();
  if (t.includes("thank") || t.includes("welcome")) return "F02";
  if (t.includes("warning") || t.includes("important")) return "F04";
  if (t.includes("why") || t.includes("how")) return "F05";
  if (t.includes("!") || t.includes("wow")) return "F06";
  if (t.includes("sorry") || t.includes("unfortunately")) return "F07";
  return "F01";
}

ttsButton.addEventListener("click", () => {
  const text = ttsInput.value.trim();
  if (!text) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = getFemaleVoice() || null;
  utterance.pitch = 1;
  utterance.rate = 1;

  // Word output
  const words = text.split(/\s+/);
  ttsOutput.textContent = "";
  let wordIndex = 0;
  const wordTimer = setInterval(() => {
    if (wordIndex >= words.length) return clearInterval(wordTimer);
    ttsOutput.textContent += words[wordIndex] + " ";
    wordIndex++;
  }, 150);

  utterance.onstart = () => {
    const core = window.live2dCore;
    if (!core) return;

    const expr = analyzeExpression(text);
    setExpression(expr);

    playMotion("Idle", Math.random() > 0.5 ? 1 : 0);

    const gestureTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * 4);
      playMotion("TapBody", idx, 3);
    }, 2800);
    utterance._gestureTimer = gestureTimer;

    // Lip sync
    let currentWord = 0, elapsed = 0;
    const wordDuration = 300;
    const lipTicker = new PIXI.Ticker();
    lipTicker.add(delta => {
      elapsed += delta * 16.67;
      const mouth = (elapsed % wordDuration) < (wordDuration/2) ? 1 : 0.2;
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

  utterance.onend = () => {
    clearInterval(wordTimer);
    if (utterance._gestureTimer) clearInterval(utterance._gestureTimer);
    setExpression("F01");
    playMotion("Idle", 0);
  };

  speechSynthesis.speak(utterance);
  ttsInput.value = "";
});
