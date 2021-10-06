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
  top: undefined,
  left: undefined,
  bottom: undefined,
  right: undefined,
  width: undefined,
  height: undefined,
  initialized: false,
});
const rectStore = {};

/**
 * Get the rect bounding box for a node excluding any transformations.
 * see: https://stackoverflow.com/questions/27745438/how-to-compute-getboundingclientrect-without-considering-transforms
 */
const useRect = (node) => {
  if (!node) throw new Error("nil node");
  if (!node.id) throw new Error("node must have an ID!!");

  const { id } = node;

  if (!rectStore.id) {
    // initialize
    rectStore[id] = rectStoreItemDefault();
  }

  const recalculate = () => {
    rectStore[id] = calcPosition(node);
    return rectStore[id];
  };

  if (!rectStore[id].initialized) {
    recalculate();
  }

  return [rectStore[id], recalculate];
};

const calcPosition = (node) => {
  if (!node)
    return {
      top: undefined,
      left: undefined,
      bottom: undefined,
      right: undefined,
      width: undefined,
      height: undefined,
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
const useAnimate = (
  $scrollTarget = null,
  $scrollSource = null,
  startPosition = { x: 0, y: 0 },
  endPosition = { x: 0, y: 0 }
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
    const [rect] = useRect($scrollSource);
    animationStore[id].min = rect.top;
    animationStore[id].max = rect.bottom;
    useScroll((scrollY) => {
      animationStore[id].currentValue = scrollY;
      // console.log(animationStore[id].currentValue, animationStore[id].previousValue);
    });
    setupAnimation($scrollTarget, animationStore[id], startPosition, endPosition);
  }

  // TODO:
  // - CALCULATE MIN/MAX FROM SCROLL SOURCE NODE RECT
  // - CALC RECT FOR SOURCE
  // - STORE MIN/MAX STATE, CURRENT/PREV VALUE FOR RECT
};

function setupAnimation(node = null, state = null, startPosition, endPosition) {
  if (!node) throw new Error("node is nil in setupAnimation()");
  if (!state) throw new Error("state is nil in setupAnimation()");

  let timestampPrevious = 0;
  function loop(timestamp) {
    if (timestamp === timestampPrevious) return;

    if (state.currentValue !== state.previousValue) {
      const { min, max } = state;
      const mul = (state.currentValue - min) / max;
      const mulEased = easing.easeInQuart(mul, 0, 1, 1);
      const mulInverse = min / max - mulEased + 1;

      if (node)
        transform(
          node,
          mulInverse * startPosition.x + mulEased * endPosition.x,
          mulInverse * startPosition.y + mulEased * endPosition.y
        );

      // if ($p1) transform($p1, mulEased * constants.offsetP1.x, mulEased * constants.offsetP1.y);
      // if ($p2) transform($p2, mulEased * constants.offsetP2.x, mulEased * constants.offsetP2.y);
      // if ($p3) transform($p3, mulEased * constants.offsetP3.x, mulEased * constants.offsetP3.y);

      state.previousValue = state.currentValue;
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

window.useScroll = useScroll;
window.useRect = useRect;
window.useAnimate = useAnimate;
