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
    this.debugUI = document.createElement("div");
    this.debugUI.id = "debugUI";
    document.body.appendChild(this.debugUI);
  },
  remove: function () {
    this.targetElement.removeEventListener("touchstart", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchend", this.emitGestureEvent);
    this.targetElement.removeEventListener("touchmove", this.emitGestureEvent);
  },
  emitGestureEvent(event) {
    const currentState = this.getTouchState(event);
    const previousState = this.internalState.previousState;

    const gestureContinues =
      previousState &&
      currentState &&
      currentState.touchCount == previousState.touchCount;
    const gestureEnded = previousState && !gestureContinues;
    const gestureStarted = currentState && !gestureContinues;

    // Update debug UI
    this.updateDebugUI(event.type, currentState);

    if (gestureEnded) {
      const eventName =
        this.getEventPrefix(previousState.touchCount) + "fingerend";
      this.el.emit(eventName, previousState);
      this.internalState.previousState = null;
    }

    if (gestureStarted) {
      currentState.startTime = performance.now();
      currentState.startPosition = currentState.position;
      currentState.startSpread = currentState.spread;
      const eventName =
        this.getEventPrefix(currentState.touchCount) + "fingerstart";
      this.el.emit(eventName, currentState);
      this.internalState.previousState = currentState;
    }

    if (gestureContinues) {
      const eventDetail = {
        positionChange: {
          x: currentState.position.x - previousState.position.x,
          y: currentState.position.y - previousState.position.y,
        },
      };

      if (currentState.spread) {
        eventDetail.spreadChange = currentState.spread - previousState.spread;
      }

      // Update state with new data
      Object.assign(previousState, currentState);

      // Add state data to event detail
      Object.assign(eventDetail, previousState);

      const eventName =
        this.getEventPrefix(currentState.touchCount) + "fingermove";
      console.log("Emitting gesture event:", eventName, eventDetail);
      this.el.emit(eventName, eventDetail);
    }
  },
  getTouchState: function (event) {
    if (event.touches.length === 0) {
      return null;
    }

    // Convert touches to an array
    const touches = [];
    for (let i = 0; i < event.touches.length; i++) {
      touches.push(event.touches[i]);
    }

    const touchState = {
      touchCount: touches.length,
    };

    // Calculate center of all current touches
    const centerPositionRawX =
      touches.reduce((sum, touch) => sum + touch.clientX, 0) / touches.length;
    const centerPositionRawY =
      touches.reduce((sum, touch) => sum + touch.clientY, 0) / touches.length;

    touchState.positionRaw = {
      x: centerPositionRawX,
      y: centerPositionRawY,
    };

    // Scale touch position and spread by average of window dimensions
    const screenScale = 2 / (window.innerWidth + window.innerHeight);

    touchState.position = {
      x: centerPositionRawX * screenScale,
      y: centerPositionRawY * screenScale,
    };

    // Calculate average spread of touches from the center point
    if (touches.length >= 2) {
      const spread =
        touches.reduce((sum, touch) => {
          return (
            sum +
            Math.sqrt(
              Math.pow(centerPositionRawX - touch.clientX, 2) +
                Math.pow(centerPositionRawY - touch.clientY, 2)
            )
          );
        }, 0) / touches.length;

      touchState.spread = spread * screenScale;
    }

    return touchState;
  },
  getEventPrefix(touchCount) {
    const numberNames = ["one", "two", "three", "many"];
    return numberNames[Math.min(touchCount, 4) - 1];
  },
  updateDebugUI(eventType, touchState) {
    if (!touchState) {
      this.debugUI.innerHTML = "No touches detected";
      return;
    }

    let debugInfo = `
        Event: ${eventType}<br>
        Touch count: ${touchState.touchCount}<br>
        Position: (${touchState.position.x.toFixed(
          2
        )}, ${touchState.position.y.toFixed(2)})<br>
        Raw position: (${touchState.positionRaw.x.toFixed(
          2
        )}, ${touchState.positionRaw.y.toFixed(2)})<br>
      `;

    if (touchState.spread) {
      debugInfo += `Spread: ${touchState.spread.toFixed(2)}<br>`;
    }

    this.debugUI.innerHTML = debugInfo;
  },
});
