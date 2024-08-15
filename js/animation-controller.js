const AnimationController = {
  bandFinalPosition: null,
  bandAnimation: null,
  animationPlayed: false,

  playHeadOpeningAnimation: function (el) {
    var mixer = el.components["animation-mixer"].mixer;
    if (mixer) {
      var clipAction = mixer.clipAction("ArmatureAction");
      if (clipAction) {
        console.log("Playing ArmatureAction...");
        clipAction.reset();
        clipAction.setLoop(THREE.LoopOnce);
        clipAction.clampWhenFinished = true;
        clipAction.play();

        el.addEventListener(
          "animation-finished",
          function animationFinishedHandler(event) {
            el.removeEventListener(
              "animation-finished",
              animationFinishedHandler
            );
            if (event.detail.action._clip.name === "ArmatureAction") {
              console.log(
                "ArmatureAction finished. Starting BrainInside animation..."
              );
              animateBrainInside();
            }
          }
        );
      } else {
        console.log("Error: ArmatureAction not found in the model");
      }
    } else {
      console.log("Error: Mixer not found in animation-mixer component");
    }
  },

  playAllAnimationsOnAnimatedAsset: function () {
    var animatedModel = document.querySelector("#bowser-model");
    if (!animatedModel.hasAttribute("animation-mixer")) {
      animatedModel.setAttribute("animation-mixer", "");
    }

    var mixer = animatedModel.components["animation-mixer"].mixer;
    if (mixer) {
      var animations = animatedModel.components["gltf-model"].model.animations;

      animations.forEach((clip) => {
        console.log(`Playing animation: ${clip.name}`);
        var action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.reset();
        action.play();
      });

      console.log("All animations started simultaneously.");

      // Add a render loop to constantly update the band's position
      function renderLoop() {
        var brainInside = animatedModel.object3D.getObjectByName("BrainInside");
        if (brainInside && bandFinalPosition) {
          brainInside.position.copy(bandFinalPosition);
        }
        requestAnimationFrame(renderLoop);
      }
      // renderLoop();
    } else {
      console.log("Error: Mixer not found for animated-asset");
    }
  },
  startBandAnimation: function (animatedModel) {
    if (!animatedModel.hasAttribute("animation-mixer")) {
      animatedModel.setAttribute("animation-mixer", "");
    }

    var mixer = animatedModel.components["animation-mixer"].mixer;
    if (mixer) {
      var animations = animatedModel.components["gltf-model"].model.animations;
      bandAnimation = animations.find((clip) => clip.name === "Band");

      if (bandAnimation) {
        console.log("Starting Band animation...");
        var action = mixer.clipAction(bandAnimation);
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.reset();
        action.play();
      } else {
        console.log("Error: Band animation not found");
      }
    } else {
      console.log("Error: Mixer not found for animated-asset");
    }
  },

  animateBrainInside: function () {
    var bowserModel = document.querySelector("#bowser-model");
    var brainInside = bowserModel.object3D.getObjectByName("BrainInside");

    if (brainInside) {
      console.log("Animating BrainInside...");
      var initialY = brainInside.position.y;
      var startTime = Date.now();
      var duration = 1000;
      var animationDistance = 0.1;

      function animateUp() {
        console.log("Moving it up...");
        var now = Date.now();
        var progress = (now - startTime) / duration;

        if (progress < 1) {
          brainInside.position.y = initialY + progress * animationDistance;
          requestAnimationFrame(animateUp);
        } else {
          bandFinalPosition = new THREE.Vector3(
            brainInside.position.x,
            initialY + animationDistance,
            brainInside.position.z
          );
          console.log(
            "BrainInside animation completed. Starting all animations..."
          );
          playAllAnimationsOnAnimatedAsset();
        }
      }

      animateUp();
      animationPlayed = true;
    } else {
      console.log("Error: BrainInside object not found");
    }
  },

  addAnimationAndPlay: function () {
    console.log("Starting animations");
    var staticModel = document.querySelector("#static-model");
    var animatedModel = document.querySelector("#bowser-model");

    if (!staticModel || !animatedModel) {
      console.log("Error: Models not found");
      return;
    }

    startBandAnimation(animatedModel);

    if (!staticModel.hasAttribute("animation-mixer")) {
      console.log("Adding animation-mixer attribute");
      staticModel.setAttribute("animation-mixer", {
        clip: "ArmatureAction",
        loop: "once",
        clampWhenFinished: true,
      });
    }

    staticModel.addEventListener("model-loaded", function modelLoadedHandler() {
      console.log("Upper Head Model loaded");
      staticModel.removeEventListener("model-loaded", modelLoadedHandler);
      playHeadOpeningAnimation(staticModel);
    });

    if (staticModel.components["gltf-model"].model) {
      playHeadOpeningAnimation(staticModel);
    }
  },
};
