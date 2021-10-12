(() => {
  /**
   * Helper to fire scroll/resize events
   * @param {Function} onScroll
   */
  const useScroll = (onScroll = (scrollY = 0, winHeight = 0) => {}) => {
    let currentScrollY = window.pageYOffset || 0;
    let currentWinHeight = window.innerHeight || 0;
    let ticking = false;

    const onNextFrame = () => {
      if (ticking) return;
      onScroll(currentScrollY, currentWinHeight);

      // window.requestAnimationFrame(() => {
      //   onScroll(currentScrollY, currentWinHeight);
      //   ticking = false;
      // });

      // ticking = true;
    };

    const onScrollEvent = (e) => {
      currentScrollY = window.pageYOffset || 0;
      onNextFrame();
    };

    const onResize = (e) => {
      currentWinHeight = window.innerHeight || 0;
      onNextFrame();
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("scroll", onScrollEvent);
  };

  const rectStore = {};
  const rectStoreItemDefault = () => ({
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    width: 0,
    height: 0,
    initialized: false,
  });

  /**
   * Helper function that fires off a callback with box dimensions for an HTML node
   * @param {HTMLElement} node
   * @param {Function} callback
   */
  const useRect = (node, callback = (rect) => {}) => {
    if (!node) throw new Error("nil node");
    if (!node.id) throw new Error("node must have an ID!!");

    const { id } = node;

    if (!rectStore.id) {
      // initialize
      rectStore[id] = rectStoreItemDefault();
    }

    const onCalculate = () => {
      rectStore[id] = calcPosition(node);
      callback(rectStore[id]);
    };

    if (!rectStore[id].initialized) {
      rectStore[id].initialized = true;
      onCalculate();
    }

    window.addEventListener("resize", onCalculate);
  };

  /**
   * Get the rect bounding box for a node excluding any transformations.
   * see: https://stackoverflow.com/questions/27745438/how-to-compute-getboundingclientrect-without-considering-transforms
   */
  const calcPosition = (node) => {
    if (!node)
      return {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
      };

    // const style = getComputedStyle(node);
    // if (!style || !style.transform) return node.getBoundingClientRect();

    let el = node;
    let offsetLeft = 0;
    let offsetTop = 0;

    do {
      offsetLeft += el.offsetLeft;
      offsetTop += el.offsetTop;

      el = el.offsetParent;
    } while (el);

    return {
      top: offsetTop,
      left: offsetLeft,
      bottom: offsetTop + node.offsetHeight,
      right: offsetLeft + node.offsetWidth,
      width: node.offsetHeight,
      height: node.offsetWidth,
      initialized: true,
    };
  };

  const animationStore = {};

  const useAnimateTransform = (
    $scrollTarget = null,
    $scrollSource = null,
    startPosition = { x: 0, y: 0 },
    endPosition = { x: 0, y: 0 },
    { easingFn = Easing.linear, debug = false } = {}
  ) => {
    _useOnInit($scrollTarget, () => {
      // ANIMATE TRANSFORM
      _useAnimationTick($scrollSource, ({ y = 0, min = 0, max = 1 }) => {
        const [m, mInverse] = _getMultipliers(y, min, max, easingFn);

        _transform(
          $scrollTarget,
          mInverse * startPosition.x + m * endPosition.x,
          mInverse * startPosition.y + m * endPosition.y
        );

        if (debug) {
          console.log($scrollSource.id, "multipliers:", m, "min/max/current=", min, max, y);
        }
      });
    });
  };

  const useAnimateOpacity = (
    $scrollTarget = null,
    $scrollSource = null,
    startOpacity = 1,
    endOpacity = 1,
    { easingFn = Easing.linear, debug = false } = {}
  ) => {
    _useOnInit($scrollTarget, () => {
      // ANIMATE OPACITY
      _useAnimationTick($scrollSource, ({ y = 0, min = 0, max = 1 }) => {
        const [m, mInverse] = _getMultipliers(y, min, max, easingFn);

        _setOpacity($scrollTarget, mInverse * startOpacity + m * endOpacity);

        if (debug) {
          console.log($scrollSource.id, "multipliers:", m, "min/max/current=", min, max, y);
        }
      });
    });
  };

  function useAnimateRotate(
    $scrollTarget = null,
    $scrollSource = null,
    startRotation = 0,
    endRotation = 0,
    { easingFn = Easing.linear, debug = false } = {}
  ) {
    _useOnInit($scrollTarget, () => {
      _useAnimationTick($scrollSource, ({ y = 0, min = 0, max = 1 }) => {
        const [m, mInverse] = _getMultipliers(y, min, max, easingFn);
        const rotation = mInverse * startRotation + m * endRotation;

        _rotate($scrollTarget, rotation);

        if (debug) {
          console.log($scrollTarget.id, $scrollSource.id, "rotation:", rotation, "min/max/y=", min, max, y);
        }
      });
    });
  }

  function useAnimateBlur(
    $scrollTarget = null,
    $scrollSource = null,
    startBlur = 0,
    endBlur = 0,
    { easingFn = Easing.linear, debug = false } = {}
  ) {
    _useOnInit($scrollTarget, () => {
      _useAnimationTick($scrollSource, ({ y = 0, min = 0, max = 1 }) => {
        const [m, mInverse] = _getMultipliers(y, min, max, easingFn);
        const blurPx = mInverse * startBlur + m * endBlur;

        _blur($scrollTarget, blurPx);

        if (debug) {
          console.log($scrollTarget.id, $scrollSource.id, "blurPx:", blurPx, "min/max/y=", min, max, y);
        }
      });
    });
  }

  function useAnimateShowHide($scrollTarget = null, $scrollSource = null, { debug = false, offset = 0 } = {}) {
    _useOnInit($scrollTarget, () => {
      _useAnimationTick($scrollSource, ({ y = 0, min = 0, max = 1 }) => {
        let isInView = 0;

        if (y >= min - offset && y <= max + offset) {
          isInView = 1;
        }

        _setVisibility($scrollTarget, isInView > 0);

        if (debug) {
          console.log($scrollTarget.id, $scrollSource.id, "isInView:", isInView, "min/max/y=", min, max, y);
        }
      });
    });
  }

  /**
   * Ensure that animation initialization for a particular html element only happens once
   * @param {HTMLElement} $scrollTarget
   * @param {Function} onInit
   */
  function _useOnInit($scrollTarget = null, onInit = () => {}) {
    if (!$scrollTarget) throw new Error("scroll target is nil");
    if (!$scrollTarget.id) throw new Error("scroll target ID is nil");

    const { id } = $scrollTarget;

    // set store defaults
    if (!animationStore.id) {
      animationStore[id] = {
        initalized: false,
      };
    }

    if (!animationStore[id].initialized) {
      animationStore[id].initialized = true;
      onInit();
    } else {
      console.warn(`element "#${id}" has already been initialized - did you accidentally use the same ID name twice?`);
    }
  }

  /**
   * Helper to invoke an animation once per frame (every ~16 milliseconds)
   * @param {HTMLElement} $scrollSource - the HTML node that the scroll area is based on
   * @param {Function} onTick - the function that fires every frame
   */
  function _useAnimationTick($scrollSource = null, onTick = ({ y = 0, min = 0, max = 1 } = {}) => {}) {
    if (!$scrollSource) throw new Error("scroll source is nil");
    if (!$scrollSource.id) throw new Error("scroll source ID is nil");

    const state = {
      currentScrollY: 0,
      prevScrollY: 0,
      min: 0,
      max: 999999999999,
      currentWinHeight: 0,
      prevWinHeight: 0,
    };
    let timestampPrevious = 0;
    let initialized = false;

    useScroll((scrollY, winHeight) => {
      state.currentScrollY = scrollY;
      state.currentWinHeight = winHeight;
    });

    useRect($scrollSource, (rect) => {
      state.min = Math.max(rect.top - window.innerHeight, 0);
      state.max = Math.min(document.body.scrollHeight - window.innerHeight, rect.bottom);
    });

    function loop(timestamp) {
      if (timestamp === timestampPrevious) return;

      const { min = 0, max = 1 } = state;

      if (
        // IF NOT INITIALIZED, MAKE SURE WE FIRE AN INITIAL TICK
        !initialized ||
        // OR, CHECK IF THE SCROLL POSITION CHANGED
        state.currentScrollY !== state.prevScrollY ||
        // OR, CHECK IF THE WIN HEIGHT CHANGED
        state.currentWinHeight !== state.prevWinHeight
      ) {
        initialized = true;

        // THE MAGIC HAPPENS HERE - TICK ONE FRAME IN THE ANIMATION
        onTick({ y: state.currentScrollY, min, max });

        state.prevScrollY = state.currentScrollY;
        state.prevWinHeight = state.currentWinHeight;
      }

      timestampPrevious = timestamp;
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  }

  function _getMultipliers(y = 0, min = 0, max = 1, easingFn = (v) => v, clamp = true) {
    const multiplier = (y - min) / (max - min);
    const mClamped = clamp ? _clampVal(multiplier, 0, 1) : multiplier;
    const mEased = easingFn(mClamped, 0, 1, 1);
    const mInverse = 1 - mEased;
    return [mEased, mInverse];
  }

  function _transform($elem = null, x = 0, y = 0) {
    if (!$elem) return;
    $elem.style.transform = `translate(${x}px, ${y}px)`;
  }

  function _setOpacity($elem = null, opacity = 1) {
    if (!$elem) return;
    $elem.style.opacity = opacity;
  }

  function _rotate($elem = null, degrees = 0) {
    if (!$elem) return;
    $elem.style.transform = `rotate(${degrees}deg)`;
  }

  function _blur($elem = null, pixels = 0) {
    if (!$elem) return;
    $elem.style.filter = `blur(${pixels}px)`;
  }

  function _setVisibility($elem = null, visible = undefined) {
    if (!$elem) return;
    // ONLY SET IF VALUE IS `true` OR `false`
    if (Boolean(visible) !== visible) return;

    if (visible) {
      $elem.style.visibility = "visible";
      $elem.style.top = 999999;
    } else {
      $elem.style.visibility = "hidden";
      $elem.style.top = 0;
    }
  }

  function _clampVal(num = 0, min = 0, max = 0) {
    return Math.max(min, Math.min(num, max));
  }

  window.useScroll = useScroll;
  window.useRect = useRect;
  window.useAnimateTransform = useAnimateTransform;
  window.useAnimateOpacity = useAnimateOpacity;
  window.useAnimateRotate = useAnimateRotate;
  window.useAnimateBlur = useAnimateBlur;
  window.useAnimateShowHide = useAnimateShowHide;
})();
