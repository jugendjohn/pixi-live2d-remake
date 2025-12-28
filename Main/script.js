// ============================================================
// TTS + SIMULATED LIP SYNC + WORD OUTPUT
// ============================================================
const ttsPanel = document.getElementById("tts-panel");
const ttsInput = document.getElementById("tts-input");
const ttsButton = document.getElementById("tts-button");
const ttsOutput = document.getElementById("tts-output");

let speaking = false;
let mouthValue = 0;

ttsButton.addEventListener("click", () => {
  const text = ttsInput.value.trim();
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = 1;
  utterance.rate = 1;

  // Female voice selection
  const voices = speechSynthesis.getVoices();
  const femaleVoice = voices.find(v =>
    /female|zira|samantha|victoria|susan/i.test(v.name)
  );
  if (femaleVoice) utterance.voice = femaleVoice;

  // -------- WORD OUTPUT --------
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

  utterance.onstart = () => speaking = true;
  utterance.onend = () => {
    speaking = false;
    mouthValue = 0;
    core.setParameterValueById("ParamMouthOpenY", 0);
    clearInterval(wordTimer);
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
});

// ============================================================
// LIP SYNC TICK (SIMULATED)
// ============================================================
app.ticker.add(() => {
  if (speaking) {
    mouthValue += (Math.random() * 0.8 - mouthValue) * 0.35;
    mouthValue = Math.max(0, Math.min(1, mouthValue));
    core.setParameterValueById("ParamMouthOpenY", mouthValue);
  }

  // ============================================================
  // Update TTS Panel Position (Right of Model)
  // ============================================================
  const modelScreenX = model.x;
  const modelScreenY = model.y;

  ttsPanel.style.left = `${modelScreenX + model.width * model.scale.x + 20}px`;
  ttsPanel.style.top = `${modelScreenY - ttsPanel.offsetHeight / 2}px`;
});
