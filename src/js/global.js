(() => {
  const constants = {
    offsetP1: { x: -1500, y: 0 },
    offsetP2: { x: 0, y: -400 },
    offsetP3: { x: 1500, y: 0 },
  };
  const state = {
    currentValue: 0,
    previousValue: 0,
    min: 0,
    max: 100,
    $p1: null,
    $p2: null,
    $p3: null,
    $input: null,
  };

  window.onbeforeunload = () => {
    window.scrollTo(0, 0);
  };

  window.onload = () => {
    setupAutoscroll();
    setupTransformAnimations();
  };

  function setupTransformAnimations() {
    const elementsToTransform = document.querySelectorAll('[data-animate-mode="transform"]');
    if (!elementsToTransform || !elementsToTransform.length) return;

    elementsToTransform.forEach((element) => {
      const {
        animateMode,
        animateScrollContainer,
        animatePositionStart = "",
        animatePositionEnd = "",
        animateEasing,
        debug,
      } = element.dataset;
      if (animateMode !== "transform") return;
      if (!animateScrollContainer) return;

      const containerNode = document.getElementById(String(animateScrollContainer).replace(/^\$/, ""));
      if (!containerNode) {
        console.warn(`container node not found for id: "$${animateScrollContainer}""`);
        return;
      }

      const [startX = 0, startY = 0] = parseCoordinates(animatePositionStart);
      const [endX = 0, endY = 0] = parseCoordinates(animatePositionEnd);

      if (debug && debug !== "false") {
        console.log(`DEBUG nodeId=${element.id}`, { startX, startY, endX, endY });
      }

      if (!startX && !startY && !endX && !endY) return;

      const easingFn = easing[animateEasing] || undefined;

      useAnimateTransform(
        element,
        containerNode,
        { x: startX, y: startY },
        { x: endX, y: endY },
        {
          easingFn,
          debug: Boolean(debug && debug !== "false"),
        }
      );
    });
  }

  function setupAutoscroll() {
    let timestampPrevious = 0;
    let currentScrollY = 0;
    const scrollSpeed = 7;
    function autoScroll(timestamp = 0) {
      if (timestamp === timestampPrevious) return;
      currentScrollY += scrollSpeed;
      window.scroll(0, currentScrollY);
      timestampPrevious = timestamp;
      window.requestAnimationFrame(autoScroll);
    }

    document.addEventListener("keyup", (e) => {
      const key = parseKeyCode(e);
      if (e.shiftKey && e.ctrlKey && (key === "Enter" || key === 13)) {
        console.log("STARTING AUTO SCROLL");
        window.requestAnimationFrame(autoScroll);
      }
    });
  }

  function parseKeyCode(event) {
    if (event.key !== undefined) {
      return event.key;
    }
    if (event.code !== undefined) {
      return event.code;
    }
    if (event.keyIdentifier !== undefined) {
      return event.keyIdentifier;
    }
    if (event.keyCode !== undefined) {
      return event.keyCode;
    }
    return null;
  }

  function parseCoordinates(coordinates = "") {
    const coordinateStripReg = /[{}\[\]\(\)]/g;
    const [x = 0, y = 0] = String(coordinates)
      .replace(coordinateStripReg, "")
      .split(",")
      .map((v) => Number(v));
    return [x || 0, y || 0];
  }
})();
