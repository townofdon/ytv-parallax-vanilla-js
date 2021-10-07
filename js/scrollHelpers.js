// export const useScroll = (onScroll = (scrollY = 0, winHeight = 0) => {}) => {
//   // use a ref to avoid an infinite loop when passing `onScroll` to useEffect dependency array
//   const _onScroll = useRef(onScroll);
//   _onScroll.current = onScroll;

//   useEffect(() => {
//     let currentScrollY = window.pageYOffset || 0;
//     let currentWinHeight = window.innerHeight || 0;
//     let ticking = false;

//     const onNextFrame = () => {
//       if (ticking) return;

//       window.requestAnimationFrame(() => {
//         _onScroll.current(currentScrollY, currentWinHeight);
//         ticking = false;
//       });

//       ticking = true;
//     };

//     const onScroll = (e) => {
//       currentScrollY = window.pageYOffset || 0;
//       onNextFrame();
//     };

//     const onResize = (e) => {
//       currentWinHeight = window.innerHeight || 0;
//       onNextFrame();
//     };

//     window.addEventListener("resize", onResize);
//     document.addEventListener("scroll", onScroll);
//     return () => {
//       window.removeEventListener("resize", onResize);
//       document.removeEventListener("scroll", onScroll);
//     };
//   }, [_onScroll]);
// };

const useScroll = (onScroll = (scrollY = 0, winHeight = 0) => {}) => {
  let currentScrollY = window.pageYOffset || 0;
  let currentWinHeight = window.innerHeight || 0;
  let ticking = false;

  const onNextFrame = () => {
    if (ticking) return;

    window.requestAnimationFrame(() => {
      onScroll(currentScrollY, currentWinHeight);
      ticking = false;
    });

    ticking = true;
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

const rectStoreItemDefault = () => ({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  width: 0,
  height: 0,
  initialized: false,
});
const rectStore = {};

/**
 * Get the rect bounding box for a node excluding any transformations.
 * see: https://stackoverflow.com/questions/27745438/how-to-compute-getboundingclientrect-without-considering-transforms
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

const animationStoreDefaultItem = () => ({
  currentValue: 0,
  previousValue: 0,
  min: 0,
  max: 0,
  initalized: false,
});
const animationStore = {};
const useAnimateTransform = (
  $scrollTarget = null,
  $scrollSource = null,
  startPosition = { x: 0, y: 0 },
  endPosition = { x: 0, y: 0 },
  { easingFn = easing.easeInOutQuad, debug = false } = {}
) => {
  if (!$scrollTarget) throw new Error("scroll target is nil");
  if (!$scrollSource) throw new Error("scroll source is nil");
  if (!$scrollTarget.id) throw new Error("scroll target ID is nil");
  if (!$scrollSource.id) throw new Error("scroll source ID is nil");

  const { id } = $scrollTarget;

  if (!animationStore.id) {
    // initialize
    animationStore[id] = animationStoreDefaultItem();
  }

  if (!animationStore[id].initialized) {
    animationStore[id].initialized = true;
    // useRect($scrollSource, (rect) => {
    //   animationStore[id].min = Math.max(rect.top - window.innerHeight, 0);
    //   animationStore[id].max = rect.bottom;
    // });
    // useScroll((scrollY) => {
    //   animationStore[id].currentValue = scrollY;
    // });
    // setupAnimation($scrollTarget, animationStore[id], startPosition, endPosition, easingFn, debug);

    useAnimate(
      $scrollSource,
      (v, vI) => {
        if ($scrollTarget)
          // prettier-ignore
          transform(
            $scrollTarget,
            vI * startPosition.x + v * endPosition.x,
            vI * startPosition.y + v * endPosition.y
          );
      },
      easingFn
    );
  }
};

function useAnimate($scrollSource = null, onTick = (val, valInverse) => {}, ease = easing.easeInOutQuad) {
  const state = { currentScrollY: 0, prevScrollY: 0, min: 0, max: 999999999999 };

  useScroll((scrollY) => {
    state.currentScrollY = scrollY;
  });

  useRect($scrollSource, (rect) => {
    state.min = Math.max(rect.top - window.innerHeight, 0);
    state.max = rect.bottom || 1;
  });

  let timestampPrevious = 0;
  let initialized = false;
  function loop(timestamp) {
    if (timestamp === timestampPrevious) return;

    const { min = 0, max = 1 } = state;

    if (!initialized || state.currentScrollY !== state.prevScrollY) {
      initialized = true;

      const multiplier = (state.currentScrollY - min) / max;
      const mClamped = clampVal(multiplier, 0, 1);
      const mEased = ease(mClamped, 0, 1, 1);
      const mInverse = 1 - mEased;

      onTick(mEased, mInverse);

      state.prevScrollY = state.currentScrollY;
    }

    timestampPrevious = timestamp;
    window.requestAnimationFrame(loop);
  }
  window.requestAnimationFrame(loop);
}

function transform($elem = null, x = 0, y = 0) {
  if (!$elem) return;
  $elem.style.transform = `translate(${x}px, ${y}px)`;
}

function clampVal(num = 0, min = 0, max = 0) {
  return Math.max(min, Math.min(num, max));
}

window.useScroll = useScroll;
window.useRect = useRect;
window.useAnimate = useAnimate;
