(async () => {
  // Make PIXI globally accessible
  window.PIXI = PIXI;

  // Create PIXI Application
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    resizeTo: window
  });

  document.body.appendChild(app.view);

  // Load Live2DModel from the Haru folder
  const { Live2DModel } = PIXI.live2d;

  try {
    const model = await Live2DModel.from('../Samples/Resources/Haru/haru.model.json');
    
    // Center the model on the canvas
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height / 2;
    model.scale.set(0.5); // Adjust size if needed
    model.anchor.set(0.5, 0.5);

    app.stage.addChild(model);

    console.log('Haru model loaded successfully!');
  } catch (err) {
    console.error('Failed to load Haru model:', err);
  }
})();
