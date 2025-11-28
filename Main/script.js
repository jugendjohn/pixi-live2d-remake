(async () => {
  // Create PIXI app
  const app = new PIXI.Application({
    view: document.getElementById("canvas"),
    autoStart: true,
    resizeTo: window,                // Auto-resize the canvas
    backgroundColor: 0x141b21,
    antialias: true,
    powerPreference: "high-performance"
  });

  // Force update every frame
  app.ticker.maxFPS = 60;
  app.ticker.minFPS = 30;

  // Ensure Live2D plugin is available
  const { Live2DModel } = PIXI.live2d;

  // Load model
  const model = await Live2DModel.from("./haru_greeter_t03.model3.json");

  app.stage.addChild(model);

  // -----------------------------------------------------
  //  FULL BODY LEFT-SIDE PLACEMENT
  // -----------------------------------------------------

  function positionModel() {
    const scale = window.innerHeight / model.height * 0.9;   // full-body scaling

    model.scale.set(scale);

    model.anchor.set(0.5, 1);    // centered horizontally, bottom aligned
    model.x = window.innerWidth * 0.28;  // left side offset
    model.y = window.innerHeight * 1.02; // just slightly below bottom to show full legs
  }

  positionModel();

  // Reposition on window resize
  window.addEventListener("resize", () => {
    positionModel();
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  // -----------------------------------------------------
  //  FIX: FORCE RENDER EVERY FRAME TO PREVENT "STUCK FRAME"
  // -----------------------------------------------------
  app.ticker.add(() => {
    app.renderer.render(app.stage);
  });

})();
