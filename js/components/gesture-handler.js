AFRAME.registerComponent("gesture-handler", {
  schema: {
    enabled: { default: true },
    rotationFactor: { default: 5 },
    minScale: { default: 0.3 },
    maxScale: { default: 8 },
  },
  init: function () {
    this.handleRotation = this.handleRotation.bind(this);
    this.handleScale = this.handleScale.bind(this);
    this.handleTargetFound = this.handleTargetFound.bind(this);
    this.handleTargetLost = this.handleTargetLost.bind(this);
    this.isVisible = false;
    this.initialScale = this.el.object3D.scale.clone();
    this.scaleFactor = 1;
    this.el.addEventListener("targetFound", this.handleTargetFound);
    this.el.addEventListener("targetLost", this.handleTargetLost);
    this.el.sceneEl.addEventListener("onefingermove", this.handleRotation);
    this.el.sceneEl.addEventListener("twofingermove", this.handleScale);
  },
  remove: function () {
    this.el.removeEventListener("targetFound", this.handleTargetFound);
    this.el.removeEventListener("targetLost", this.handleTargetLost);
    this.el.sceneEl.removeEventListener("onefingermove", this.handleRotation);
    this.el.sceneEl.removeEventListener("twofingermove", this.handleScale);
  },
  handleTargetFound: function () {
    this.isVisible = true;
    console.log("Target found");
  },
  handleTargetLost: function () {
    this.isVisible = false;
    console.log("Target lost");
  },
  handleRotation: function (event) {
    if (this.isVisible && this.data.enabled) {
      this.el.object3D.rotation.y +=
        event.detail.positionChange.x * this.data.rotationFactor;
      this.el.object3D.rotation.x +=
        event.detail.positionChange.y * this.data.rotationFactor;
      console.log("Rotation applied:", event.detail.positionChange);
    }
  },
  handleScale: function (event) {
    if (this.isVisible && this.data.enabled) {
      this.scaleFactor *=
        1 + event.detail.spreadChange / event.detail.startSpread;
      this.scaleFactor = Math.min(
        Math.max(this.scaleFactor, this.data.minScale),
        this.data.maxScale
      );
      this.el.object3D.scale.x =
        this.el.object3D.scale.y =
        this.el.object3D.scale.z =
          this.scaleFactor * this.initialScale.x;
      console.log("Scale applied:", this.scaleFactor);
    }
  },
});
