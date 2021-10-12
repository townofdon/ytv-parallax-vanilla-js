(() => {
  window.onbeforeunload = () => {
    window.scrollTo(0, 0);
  };

  window.onload = () => {
    setupAutoscroll();
    setupAnimations();
  };

  function setupAnimations() {
    const elementsToTransform = document.querySelectorAll("[data-animate-mode]");
    if (!elementsToTransform || !elementsToTransform.length) return;
    elementsToTransform.forEach((element) => {
      onSetupAnimationElement(element);
    });
  }

  function onSetupAnimationElement(element) {
    if (!element || !element.dataset) return;

    const mode = element.dataset.animateMode;
    const scrollSource = Node(element.dataset.animateScrollSource);
    const easingFn = ToEasing(element.dataset.animateEasing) || Easing.linear;
    const debug = Boolean(element.dataset.debug && element.dataset.debug !== "false");

    if (!scrollSource) return;
    if (!mode) return;

    // ANIMATE TRANSFORM
    if (mode === "transform") {
      const [startX = 0, startY = 0] = parseCoordinates(element.dataset.animateValueStart);
      const [endX = 0, endY = 0] = parseCoordinates(element.dataset.animateValueEnd);
      if (debug) console.log(`DEBUG TRANSFORM nodeId=${element.id}`, { startX, startY, endX, endY });
      useAnimateTransform(
        element,
        scrollSource,
        { x: startX, y: startY },
        { x: endX, y: endY },
        {
          easingFn,
          debug,
        }
      );
      return;
    }

    // ANIMATE OPACITY
    if (mode === "opacity") {
      const opacityStart = Number(element.dataset.animateValueStart);
      const opacityEnd = Number(element.dataset.animateValueEnd);
      if (debug) console.log(`DEBUG OPACITY nodeId=${element.id}`, { opacityStart, opacityEnd });
      useAnimateOpacity(element, scrollSource, opacityStart, opacityEnd, {
        easingFn,
        debug,
      });
      return;
    }

    // ANIMATE ROTATE
    if (mode === "rotate") {
      const rotationStart = Number(element.dataset.animateValueStart);
      const rotationEnd = Number(element.dataset.animateValueEnd);
      if (debug) console.log(`DEBUG ROTATE nodeId=${element.id}`, { rotationStart, rotationEnd });
      useAnimateRotate(element, scrollSource, rotationStart, rotationEnd, {
        easingFn,
        debug,
      });
      return;
    }

    // ANIMATE BLUR
    if (mode === "blur") {
      const blurStart = Number(element.dataset.animateValueStart);
      const blurEnd = Number(element.dataset.animateValueEnd);
      if (debug) console.log(`DEBUG BLUR nodeId=${element.id}`, { blurStart, blurEnd });
      useAnimateBlur(element, scrollSource, blurStart, blurEnd, {
        easingFn,
        debug,
      });
      return;
    }

    // ANIMATE SHOW/HIDE
    if (mode === "show") {
      const offset = Number(element.dataset.animateOffset || 0) || 0;
      useAnimateShowHide(element, scrollSource, {
        debug,
        offset,
      });
      return;
    }

    throw new Error(`Unsupported animation mode: "${mode}"`);
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

  /**
   * Given String coordinates like `"5,5"` or `"(5,5)"` return `[5, 5]`
   *
   * Note - also supports `vw` and `vh` as values relative to the viewport width/height
   *
   * E.g.:
   * ```
   * // assume window dimensions are 1000x1000
   * parseCoordinates('50vw, 100vh'); // >> `[500, 1000]`
   * ```
   *
   * @param {String} coordinates
   * @returns
   */
  function parseCoordinates(coordinates = "") {
    const coordinateStripReg = /[{}\[\]\(\)]/g;
    const [x = 0, y = 0] = String(coordinates)
      // FIRST, STRIP CHARS WE DON'T CARE ABOUT
      .replace(coordinateStripReg, "")
      // THEN, SPLIT CHAR ITEMS DELIMITED BY "," INTO AN ARRAY
      .split(",")
      // PARSE COORDINATE VALUE FROM STRING
      .map((v) => parseCoordinateValue(v));
    return [x || 0, y || 0];
  }

  /**
   * Given a numerical string (e.g. "5"), or a viewport width/height metric, return a number
   * @param {String} value
   * @returns Number
   */
  function parseCoordinateValue(value = "") {
    if (!value) return 0;

    // IF STRING CONTAINS "vw" AT THE END, THEN SET AS A PERCENTAGE OF THE VIEWPORT WIDTH
    if (/vw$/.test(String(value))) {
      const viewportWidthUnits = Number(String(value).replace("vw", "")) || 0;
      return (window.innerWidth * viewportWidthUnits) / 100;
    }

    // IF STRING CONTAINS "vh" AT THE END, THEN SET AS A PERCENTAGE OF THE VIEWPORT HEIGHT
    if (/vh$/.test(String(value))) {
      const viewportHeightUnits = Number(String(value).replace("vh", "")) || 0;
      return (window.innerHeight * viewportHeightUnits) / 100;
    }

    return Number(value) || 0;
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

  // "CAST" TO A NODE
  function Node(elementId) {
    if (!elementId) return null;
    return document.getElementById(String(elementId).replace(/^\$/, ""));
  }

  // "CAST" TO AN EASING FNC
  function ToEasing(easingFnName = "") {
    if (!easingFnName) return "";
    return window.Easing[easingFnName] || undefined;
  }
})();
