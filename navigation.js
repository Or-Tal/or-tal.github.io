const panelsContainer = document.querySelector(".site-panels");
const panelLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
const panels = panelLinks.map(link => document.getElementById(link.hash.slice(1)));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentPanel;
let panelTransition;
let touchStart;
let sidewaysDistance = 0;
let wheelHandled = false;
let wheelTimer;

function showPanel(animate = false) {
  const index = panelLinks.findIndex(link => link.hash === location.hash);
  const nextPanel = panels[index < 0 ? 0 : index];
  if (nextPanel === currentPanel) return;

  panelTransition?.finish();
  const previousPanel = currentPanel;
  const focusWasInPanel = previousPanel?.contains(document.activeElement);
  const shouldSlide = animate && previousPanel && !prefersReducedMotion.matches && typeof nextPanel.animate === "function";
  currentPanel = nextPanel;

  panels.forEach((panel, panelIndex) => {
    const active = panel === nextPanel;
    const link = panelLinks[panelIndex];
    panel.hidden = !active && !(shouldSlide && panel === previousPanel);
    panel.inert = !active;
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (focusWasInPanel) panelLinks[panels.indexOf(nextPanel)].focus({preventScroll: true});
  if (animate) window.scrollTo({top: 0, behavior: "instant"});
  if (!shouldSlide) return;

  panelsContainer.classList.add("is-sliding");
  const direction = panels.indexOf(nextPanel) > panels.indexOf(previousPanel) ? 1 : -1;
  const timing = {duration: 250, easing: "cubic-bezier(.25,.7,.3,1)"};
  const exit = previousPanel.animate(
    [{transform: "translateX(0)", opacity: 1}, {transform: `translateX(${-direction * 100}%)`, opacity: 0}],
    timing,
  );
  const enter = nextPanel.animate(
    [{transform: `translateX(${direction * 100}%)`, opacity: 0}, {transform: "translateX(0)", opacity: 1}],
    timing,
  );
  const finish = () => {
    previousPanel.hidden = true;
    exit.cancel();
    enter.cancel();
    panelsContainer.classList.remove("is-sliding");
    panelTransition = undefined;
  };
  panelTransition = {finish};
  enter.onfinish = finish;
}

function navigateToPanel(link) {
  if (location.hash !== link.hash) history.pushState(null, "", link.hash);
  showPanel(true);
}

function navigateSideways(step, target) {
  if (target.closest(".publication-pages") && turnPage(step)) return;
  const nextLink = panelLinks[panels.indexOf(currentPanel) + step];
  if (nextLink) navigateToPanel(nextLink);
}

panelsContainer.addEventListener("pointerdown", event => {
  if (event.pointerType !== "touch") return;
  touchStart = event.isPrimary
    ? {id: event.pointerId, x: event.clientX, y: event.clientY, target: event.target}
    : null;
});

panelsContainer.addEventListener("pointercancel", () => { touchStart = null; });
panelsContainer.addEventListener("pointerup", event => {
  if (touchStart?.id !== event.pointerId) return;
  const {x, y, target} = touchStart;
  touchStart = null;
  const dx = event.clientX - x;
  const dy = event.clientY - y;
  if (Math.abs(dx) >= 55 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
    navigateSideways(dx < 0 ? 1 : -1, target);
  }
});

panelsContainer.addEventListener("wheel", event => {
  if (event.ctrlKey || Math.abs(event.deltaX) <= 1.5 * Math.abs(event.deltaY)) return;
  event.preventDefault();
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    sidewaysDistance = 0;
    wheelHandled = false;
  }, 180);
  if (wheelHandled) return;

  const units = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? panelsContainer.clientWidth : 1;
  sidewaysDistance += event.deltaX * units;
  if (Math.abs(sidewaysDistance) >= 55) {
    wheelHandled = true;
    navigateSideways(Math.sign(sidewaysDistance), event.target);
  }
}, {passive: false});

history.scrollRestoration = "manual";
for (const link of panelLinks) {
  link.addEventListener("click", event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigateToPanel(link);
  });
}
window.addEventListener("popstate", () => showPanel(true));
window.addEventListener("hashchange", () => showPanel(true));
showPanel();
