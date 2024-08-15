document.addEventListener("DOMContentLoaded", function () {
  const sceneEl = document.querySelector("a-scene");
  let arSystem;

  sceneEl.addEventListener("loaded", function () {
    arSystem = sceneEl.systems["mindar-image-system"];
  });

  sceneEl.addEventListener("arReady", (event) => {
    console.log("AR is ready");
  });

  sceneEl.addEventListener("arError", (event) => {
    console.log("AR failed to start");
  });

  const torshxModel = document.querySelector("#torshx");
  torshxModel.addEventListener("targetFound", (event) => {
    console.log("TorshX found");
    if (!AnimationController.animationPlayed)
      AnimationController.addAnimationAndPlay();
  });

  torshxModel.addEventListener("targetLost", (event) => {
    console.log("TorshX lost");
  });

  function checkComponentInitialization() {
    const modelContainer = document.querySelector("#model-container");
    console.log("Model container:", modelContainer);
    console.log(
      "gesture-handler component:",
      modelContainer.components["gesture-handler"]
    );
  }

  sceneEl.addEventListener("loaded", checkComponentInitialization);
});
