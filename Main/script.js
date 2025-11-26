(async () => {
  // Make PIXI globally accessible
  window.PIXI = PIXI;

  // Create PIXI application
  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1099bb,
    resizeTo: window
  });

  document.body.appendChild(app.view);

  const { Live2DModel } = PIXI.live2d;

  try {
    // Load Haru model
    const model = await Live2DModel.from('../Samples/Resources/Haru/haru.model3.json');

    // Center model on canvas
    model.x = app.renderer.width / 2;
    model.y = app.renderer.height / 2;
    model.scale.set(0.5); // Adjust scale as needed
    model.anchor.set(0.5, 0.5);

    app.stage.addChild(model);

    console.log('Haru model loaded successfully!');

    // Optional: make model follow mouse
    window.addEventListener('mousemove', (e) => {
      const dx = e.clientX - app.renderer.width / 2;
      const dy = e.clientY - app.renderer.height / 2;
      model.rotation = dx * 0.0005; // slight rotation based on mouse X
      model.y = app.renderer.height / 2 + dy * 0.05; // slight vertical movement
    });

  } catch (err) {
    console.error('Failed to load Haru model:', err);
  }

})();
