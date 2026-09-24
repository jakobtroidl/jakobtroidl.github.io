// Easter egg: hovering the profile photo makes science emojis rain down the
// empty margins left and right of the page content. Desktop only.
(function () {
  const EMOJIS = ["🧠", "🔬", "💻", "🐟", "🪰", "🐁"];
  const SPAWN_INTERVAL_MS = 90;
  const MAX_DROPS = 80;
  const MIN_GUTTER_PX = 80; // skip a side if its margin is narrower than this
  const MIN_SIZE_PX = 14;
  const MAX_SIZE_PX = 24;

  // desktop with a real mouse only; also respect reduced-motion preferences
  const enabled = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 992px) and (prefers-reduced-motion: no-preference)");

  const trigger = document.querySelector(".profile img");
  const content = document.querySelector('.container[role="main"]');
  if (!trigger || !content) return;

  let layer = null;
  let timer = null;
  let drops = 0;

  function getLayer() {
    if (!layer) {
      layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:1020";
      document.body.appendChild(layer);
    }
    return layer;
  }

  // the empty space on each side of the content column, as [left, right] x-ranges
  function gutters() {
    const rect = content.getBoundingClientRect();
    const sides = [
      [0, rect.left],
      [rect.right, window.innerWidth],
    ];
    return sides.filter(([a, b]) => b - a >= MIN_GUTTER_PX);
  }

  function spawn() {
    if (drops >= MAX_DROPS) return;
    const sides = gutters();
    if (!sides.length) return;

    const [left, right] = sides[Math.floor(Math.random() * sides.length)];
    const size = MIN_SIZE_PX + Math.random() * (MAX_SIZE_PX - MIN_SIZE_PX);
    const duration = 3500 + Math.random() * 3000;
    const sway = (Math.random() - 0.5) * 60;
    const spin = (Math.random() - 0.5) * 540;
    // keep the whole path (drift + rotated bounding box) inside the margin
    const pad = size * 0.25;
    const minX = left + pad + Math.max(0, -sway);
    const maxX = right - size - pad - Math.max(0, sway);
    if (maxX <= minX) return;
    const x = minX + Math.random() * (maxX - minX);

    const drop = document.createElement("span");
    drop.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    drop.style.cssText = `position:absolute;top:0;left:${x}px;font-size:${size}px;line-height:1;will-change:transform,opacity`;
    getLayer().appendChild(drop);
    drops++;

    const fall = window.innerHeight + 2 * size;
    drop
      .animate(
        [
          { transform: `translate(0, ${-size}px) rotate(0deg)`, opacity: 0 },
          { opacity: 1, offset: 0.08 },
          { transform: `translate(${sway / 2}px, ${fall * 0.5}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${sway}px, ${fall}px) rotate(${spin}deg)`, opacity: 0.2 },
        ],
        { duration, easing: "cubic-bezier(0.35, 0, 0.65, 1)" }
      )
      .finished.then(() => {
        drop.remove();
        drops--;
      });
  }

  function start() {
    if (!enabled.matches || timer) return;
    spawn();
    timer = setInterval(spawn, SPAWN_INTERVAL_MS);
  }

  function stop() {
    // drops already in the air keep falling; we just stop adding new ones
    clearInterval(timer);
    timer = null;
  }

  trigger.addEventListener("mouseenter", start);
  trigger.addEventListener("mouseleave", stop);
  enabled.addEventListener("change", stop);
})();
