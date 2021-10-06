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

  window.onload = () => {
    const elementsToTransform = document.querySelectorAll('[data-animate-mode="transform"]');
    console.log(elementsToTransform);

    const $p1 = document.getElementById("plx-text-1");
    const $p2 = document.getElementById("plx-text-2");
    const $p3 = document.getElementById("plx-text-3");
    const $section = document.getElementById("title-section");
    useAnimate($p1, $section, { x: 0, y: 0 }, { x: -1500, y: 0 });
    useAnimate($p2, $section, { x: 0, y: 0 }, { x: 0, y: -400 });
    useAnimate($p3, $section, { x: 0, y: 0 }, { x: 1500, y: 0 });
    // setupParallaxSlider();
    // setupParallaxText();
    // setupAnimation();
    // const [rect, reload] = useRect(document.getElementById("title-section"));
    // state.min = rect.top;
    // state.max =
  };

  function transform($elem = null, x = 0, y = 0) {
    if (!$elem) return;
    $elem.style.transform = `translate(${x}px, ${y}px)`;
  }

  function onRangeChange(ev) {
    if (!ev.target || !ev.target.value) return;
    state.currentValue = Number(ev.target.value);
  }

  function setupParallaxSlider() {
    const $input = (state.$input = document.getElementById("parallax-range-input"));
    if (!$input) return;

    state.currentValue = Number($input.getAttribute("value") || 0) || 0;
    state.min = Number($input.getAttribute("min") || 0) || 0;
    state.max = Number($input.getAttribute("max") || 100) || 100;
    $input.addEventListener("input", onRangeChange);
  }

  function setupParallaxText() {
    state.$p1 = document.getElementById("plx-text-1");
    state.$p2 = document.getElementById("plx-text-2");
    state.$p3 = document.getElementById("plx-text-3");
  }

  function setupAnimation() {
    let timestampPrevious = 0;
    function loop(timestamp) {
      if (timestamp === timestampPrevious) return;

      if (state.currentValue !== state.previousValue) {
        const { min, max, $p1, $p2, $p3 } = state;
        const mul = (state.currentValue - min) / max;
        const mulEased = easing.easeInQuart(mul, 0, 1, 1);
        const mulInverse = min / max - mulEased + 1;

        console.log(mulEased, mulInverse);

        if ($p1) transform($p1, mulEased * constants.offsetP1.x, mulEased * constants.offsetP1.y);
        if ($p2) transform($p2, mulEased * constants.offsetP2.x, mulEased * constants.offsetP2.y);
        if ($p3) transform($p3, mulEased * constants.offsetP3.x, mulEased * constants.offsetP3.y);

        state.previousValue = state.currentValue;
      }

      timestampPrevious = timestamp;
      window.requestAnimationFrame(loop);
    }
    window.requestAnimationFrame(loop);
  }
})();
