// ===============================
// TTS + Word Output + Lip Sync
// ===============================
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

  // ===============================
  // Word-count based lip sync
  // ===============================
  utterance.onstart = () => {
    const core = window.live2dCore;
    if (!core) return console.warn("❌ Live2D core not ready");

    let currentWord = 0;
    const wordDuration = 300; // ms per word
    let elapsed = 0;

    const simTicker = new PIXI.Ticker();
    simTicker.add((deltaTime) => {
      elapsed += deltaTime * 16.67; // approx ms per tick

      const cycleTime = elapsed % wordDuration;
      const half = wordDuration / 2;
      const mouth = cycleTime < half ? 1.0 : 0.2; // open then close
      core.setParameterValueById("ParamMouthOpenY", mouth);

      if (elapsed >= (currentWord + 1) * wordDuration) {
        currentWord++;
        if (currentWord >= words.length) {
          simTicker.stop();
          // smooth mouth close
          let t = 0;
          const closeTicker = new PIXI.Ticker();
          closeTicker.add(() => {
            t += 0.1;
            const v = Math.max(0, 0.2 * (1 - t));
            core.setParameterValueById("ParamMouthOpenY", v);
            if (t >= 1) closeTicker.stop();
          });
          closeTicker.start();
        }
      }
    });
    simTicker.start();
  };

  utterance.onend = () => {
    clearInterval(wordTimer);
  };

  speechSynthesis.speak(utterance);
});
