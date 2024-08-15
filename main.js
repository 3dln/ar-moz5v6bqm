let bandFinalPosition;
let bandAnimation;
const torshxModel = document.querySelector("#torshx");
let debugUI;
let animationPlayed = false;

function logDebug(message) {
  console.log(message);
  // if (debugUI) {
  //   const logMessage = document.createElement("div");
  //   logMessage.textContent = message;
  //   debugUI.appendChild(logMessage);
  // }
}

AFRAME.registerComponent("gesture-detector", {
  schema: {
    enabled: { default: true },
  },
  init: function () {
    this.targetElement = this.el;
    this.internalState = {
      previousState: null,
    };
    this.emitGestureEvent = this.emitGestureEvent.bind(this);

    this.targetElement.addEventListener("touchstart", this.emitGestureEvent);
    this.targetElement.addEventListener("touchend", this.emitGestureEvent);
    this.targetElement.addEventListener("touchmove", this.emitGestureEvent);

    this.modelContainer = document.querySelector("#model-container");
    if (!this.modelContainer) {
      console.error("Could not find #model-container");
    }
  },
  remove: function () {
    this.targetElement.removeEventListener("touchstart", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchend", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchmove", this.emitGestureEvent);
  },
  emitGestureEvent(event) {
    console.log(event);
    const currentState = this.getTouchState(event);
    const previousState = this.internalState.previousState;

    const gestureContinues =
      previousState &&
      currentState &&
      currentState.touchCount == previousState.touchCount;

    if (gestureContinues) {
      const eventName = this.getEventPrefix(event) + "move";
      this.targetElement.emit(eventName, currentState);

      if (currentState.touchCount === 1 && currentState.type === "touchmove") {
        this.handleRotation(currentState, previousState);
      } else if (currentState.touchCount === 2) {
        this.handlePinch(currentState, previousState);
      }
    } else {
      const eventName = this.getEventPrefix(event) + currentState.touchCount;
      this.targetElement.emit(eventName, currentState);
    }

    this.internalState.previousState = currentState;
  },
  getEventPrefix(event) {
    if (event.type.indexOf("touch") === 0) {
      return "touch";
    }
    return "mouse";
  },
  getTouchState: function (event) {
    if (event.touches.length === 0) {
      return null;
    }

    const touches = Array.from(event.touches);

    const touchState = {
      touchCount: touches.length,
      type: event.type,
    };

    const centerPositionRawX =
      touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length;
    const centerPositionRawY =
      touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length;

    touchState.positionRaw = {
      x: centerPositionRawX,
      y: centerPositionRawY,
    };

    return touchState;
  },
  handleRotation: function (currentState, previousState) {
    if (this.modelContainer && previousState) {
      const rotationSensitivity = 0.005; // Adjust this value to control rotation speed
      const deltaX =   previousState.positionRaw.x - currentState.positionRaw.x;
      const deltaY = previousState.positionRaw.y - currentState.positionRaw.y;

      // Rotate around Y-axis (left/right swipe)
      this.modelContainer.object3D.rotation.y -= deltaX * rotationSensitivity;

      // Rotate around X-axis (up/down swipe)
      this.modelContainer.object3D.rotation.x -= deltaY * rotationSensitivity;

      // Clamp vertical rotation to avoid flipping
      this.modelContainer.object3D.rotation.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.modelContainer.object3D.rotation.x)
      );
    }
  },

  handlePinch: function (currentState, previousState) {
    if (this.modelContainer && previousState.spread !== undefined) {
      const scaleFactor = 0.01;
      const spreadChange = currentState.spread - previousState.spread;
      const scaleChange = 1 + spreadChange * scaleFactor;

      this.modelContainer.object3D.scale.multiplyScalar(scaleChange);
      console.log(`New scale: ${this.modelContainer.object3D.scale.x}`);
    }
  },
});

document.addEventListener("DOMContentLoaded", function () {
  function addGestureControls() {}
  debugUI = document.querySelector("#debugUI");

  function playHeadOpeningAnimation(el) {
    var mixer = el.components["animation-mixer"].mixer;
    if (mixer) {
      var clipAction = mixer.clipAction("ArmatureAction");
      if (clipAction) {
        logDebug("Playing ArmatureAction...");
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
              logDebug(
                "ArmatureAction finished. Starting BrainInside animation..."
              );
              animateBrainInside();
            }
          }
        );
      } else {
        logDebug("Error: ArmatureAction not found in the model");
      }
    } else {
      logDebug("Error: Mixer not found in animation-mixer component");
    }
  }

  function playAllAnimationsOnAnimatedAsset() {
    var animatedModel = document.querySelector("#bowser-model");
    if (!animatedModel.hasAttribute("animation-mixer")) {
      animatedModel.setAttribute("animation-mixer", "");
    }

    var mixer = animatedModel.components["animation-mixer"].mixer;
    if (mixer) {
      var animations = animatedModel.components["gltf-model"].model.animations;

      animations.forEach((clip) => {
        var action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.reset();
        action.play();
      });

      // Add a render loop to constantly update the band's position
      function renderLoop() {
        var brainInside = animatedModel.object3D.getObjectByName("BrainInside");
        if (brainInside && bandFinalPosition) {
          brainInside.position.copy(bandFinalPosition);
        }
        requestAnimationFrame(renderLoop);
      }
      renderLoop();
    } else {
      logDebug("Error: Mixer not found for animated-asset");
    }
  }

  function animateBrainInside() {
    var bowserModel = document.querySelector("#bowser-model");
    var brainInside = bowserModel.object3D.getObjectByName("BrainInside");

    if (brainInside) {
      logDebug("Animating BrainInside...");
      var initialY = brainInside.position.y;
      var startTime = Date.now();
      var duration = 1000;
      var animationDistance = 0.1;

      function animateUp() {
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
          logDebug(
            "BrainInside animation completed. Starting all animations..."
          );
          playAllAnimationsOnAnimatedAsset();
        }
      }

      animateUp();
      animationPlayed = true;
    } else {
      logDebug("Error: BrainInside object not found");
    }
  }
  function addAnimationAndPlay() {
    logDebug("Starting animations");
    var staticModel = document.querySelector("#static-model");
    var animatedModel = document.querySelector("#bowser-model");

    if (!staticModel || !animatedModel) {
      logDebug("Error: Models not found");
      return;
    }

    addGestureControls();
    startBandAnimation(animatedModel);

    if (!staticModel.hasAttribute("animation-mixer")) {
      logDebug("Adding animation-mixer attribute");
      staticModel.setAttribute("animation-mixer", {
        clip: "ArmatureAction",
        loop: "once",
        clampWhenFinished: true,
      });
    }

    staticModel.addEventListener("model-loaded", function modelLoadedHandler() {
      logDebug("Upper Head Model loaded");
      staticModel.removeEventListener("model-loaded", modelLoadedHandler);
      playHeadOpeningAnimation(staticModel);
    });

    if (staticModel.components["gltf-model"].model) {
      playHeadOpeningAnimation(staticModel);
    }
  }

  function startBandAnimation(animatedModel) {
    if (!animatedModel.hasAttribute("animation-mixer")) {
      animatedModel.setAttribute("animation-mixer", "");
    }

    var mixer = animatedModel.components["animation-mixer"].mixer;
    if (mixer) {
      var animations = animatedModel.components["gltf-model"].model.animations;
      bandAnimation = animations.find((clip) => clip.name === "Band");

      if (bandAnimation) {
        logDebug("Starting Band animation...");
        var action = mixer.clipAction(bandAnimation);
        action.setLoop(THREE.LoopRepeat);
        action.clampWhenFinished = false;
        action.reset();
        action.play();
      } else {
        logDebug("Error: Band animation not found");
      }
    } else {
      logDebug("Error: Mixer not found for animated-asset");
    }
  }

  const sceneEl = document.querySelector("a-scene");
  let arSystem;
  sceneEl.addEventListener("loaded", function () {
    arSystem = sceneEl.systems["mindar-image-system"];
  });

  sceneEl.addEventListener("arReady", (event) => {
    logDebug("AR is ready");
  });
  sceneEl.addEventListener("arError", (event) => {
    logDebug("AR failed to start");
  });

  const torshxModel = document.querySelector("#torshx");
  torshxModel.addEventListener("targetFound", (event) => {
    logDebug("TorshX found");
    if (!animationPlayed) addAnimationAndPlay();
  });

  // detect target lost
  torshxModel.addEventListener("targetLost", (event) => {
    logDebug("TorshX lost");
  });
});
