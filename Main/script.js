(async () => {
  // Make PIXI accessible for the plugin
  window.PIXI = PIXI;

  // Create the PIXI application
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb
  });

  // Add the canvas to the document
  document.body.appendChild(app.view);

  // Load the Live2D plugin
  const { Live2DModel } = PIXI.live2d;

  try {
    // ✅ Use full GitHub Pages URL to the model
    const model = await Live2DModel.from(
      'https://jugendjohn.github.io/pixi-live2d/asset/haru_greeter_pro_jp/model.json'
    );

    // Center the model
    model.anchor.set(0.5);
    model.x = app.screen.width / 2;
    model.y = app.screen.height / 2;
    model.scale.set(0.5);

    // Add to the stage
    app.stage.addChild(model);

    // Simple idle animation
    app.ticker.add(() => {
      model.rotation = Math.sin(Date.now() * 0.001) * 0.02;
    });
  } catch (err) {
    console.error('❌ Failed to load Live2D model:', err);
  }
})();
