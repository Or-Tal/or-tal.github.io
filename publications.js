const viewport = document.querySelector(".publication-pages");
const groups = Array.from(viewport.querySelectorAll(".publication-list"));
const explainers = viewport.querySelectorAll(".publication-explainer");
const explainerDialog = document.querySelector("#explainer-dialog");
const explainerTitle = explainerDialog.querySelector("#explainer-title");
const explainerPlayer = explainerDialog.querySelector(".explainer-player");
const citationToast = document.querySelector(".citation-toast");
const controls = document.querySelectorAll("[data-publication-controls]");
const header = document.querySelector("header");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let currentPage = 0;
let slideAnimation;
let citationToastTimer;

async function copyCitation(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Support local previews and browsers that restrict the Clipboard API.
    const field = document.createElement("textarea");
    const previousFocus = document.activeElement;
    field.value = text;
    field.readOnly = true;
    field.className = "citation-copy-field";
    document.body.append(field);
    field.select();
    try {
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
      previousFocus.focus({preventScroll: true});
    }
  }
}

for (const button of viewport.querySelectorAll(".publication-cite")) {
  button.addEventListener("click", async () => {
    const citation = button.closest(".publication").querySelector(".publication-bibtex");
    const copied = await copyCitation(citation.content.textContent.trim());
    clearTimeout(citationToastTimer);
    citationToast.textContent = copied ? "Citation bibtex copied to clipboard" : "Couldn’t copy the BibTeX citation";
    citationToast.classList.add("is-visible");
    citationToastTimer = setTimeout(() => citationToast.classList.remove("is-visible"), 2000);
  });
}

for (const explainer of explainers) {
  explainer.addEventListener("click", () => {
    const frame = document.createElement("iframe");
    frame.title = explainer.dataset.playerTitle;
    frame.src = explainer.dataset.previewUrl;
    frame.allowFullscreen = true;
    explainerTitle.textContent = frame.title;
    explainerPlayer.replaceChildren(frame);
    explainerDialog.showModal();
  });
}

explainerDialog.addEventListener("close", () => {
  if (!explainerDialog.open) explainerPlayer.replaceChildren();
});
window.addEventListener("hashchange", () => {
  if (explainerDialog.open) explainerDialog.close();
});

function updatePagination() {
  groups.forEach((group, index) => { group.hidden = index !== currentPage; });
  for (const control of controls) {
    control.querySelector("[data-page-status]").textContent = `Page ${currentPage + 1} of ${groups.length}`;
    for (const button of control.querySelectorAll("[data-step]")) {
      const destination = currentPage + Number(button.dataset.step);
      button.setAttribute("aria-disabled", String(destination < 0 || destination >= groups.length));
    }
  }
}

function turnPage(step) {
  const destination = currentPage + step;
  if (destination < 0 || destination >= groups.length) return false;
  const wasInsideGroup = groups[currentPage].contains(document.activeElement);
  currentPage = destination;
  updatePagination();

  if (wasInsideGroup) viewport.focus({preventScroll: true});
  const activeControl = document.activeElement.closest("[data-publication-controls]");
  if (viewport.getBoundingClientRect().top < header.getBoundingClientRect().bottom) {
    if (activeControl === controls[1]) {
      controls[0].querySelector(`[data-step="${step}"]`).focus({preventScroll: true});
    }
    document.querySelector("#publications").scrollIntoView({block: "start"});
  }

  slideAnimation?.cancel();
  if (!reducedMotion.matches) {
    slideAnimation = groups[currentPage].animate(
      [{opacity: 0, transform: `translateX(${step * 14}px)`}, {opacity: 1, transform: "none"}],
      {duration: 180, easing: "ease-out"},
    );
  }
  return true;
}

if (groups.length > 1) {
  updatePagination();
  for (const control of controls) {
    control.hidden = false;
    for (const button of control.querySelectorAll("[data-step]")) {
      button.addEventListener("click", () => turnPage(Number(button.dataset.step)));
    }
  }

  viewport.tabIndex = 0;
  viewport.addEventListener("keydown", (event) => {
    if (event.target !== viewport || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    turnPage(event.key === "ArrowLeft" ? -1 : 1);
  });

}
