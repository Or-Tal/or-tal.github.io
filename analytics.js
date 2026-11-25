const analyticsTracker = document.querySelector("script[data-goatcounter]");
let pendingAnalytics = [];

function countAnalytics(hit) {
  if (location.hostname !== "or-tal.github.io") return;
  if (window.goatcounter?.count) window.goatcounter.count(hit);
  else pendingAnalytics?.push(hit);
}

analyticsTracker.addEventListener("load", () => {
  for (const hit of pendingAnalytics ?? []) countAnalytics(hit);
  pendingAnalytics = null;
}, {once: true});
analyticsTracker.addEventListener("error", () => { pendingAnalytics = null; }, {once: true});

function trackTabView(tab) {
  const titles = {about: "About", publications: "Publications", contact: "Contact"};
  countAnalytics({path: tab === "about" ? "/" : `/${tab}`, title: titles[tab]});
}

function analyticsSlug(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function trackSiteClick(event) {
  if (event.type === "auxclick" && event.button !== 1) return;
  const control = event.target.closest("a, button");
  if (!control) return;

  const publication = control.closest(".publication");
  if (publication && control.matches(".publication-links a, .publication-cite, .publication-explainer")) {
    const action = control.matches(".publication-cite") ? "Cite" :
      control.matches(".publication-explainer") ? "Watch Explainer" : control.textContent.trim();
    const paper = publication.querySelector(".publication-title").textContent.trim();
    countAnalytics({path: `publication/${analyticsSlug(action)}/${analyticsSlug(paper)}`, title: `${action} | ${paper}`, event: true, referrer: ""});
  } else if (control.matches(".nav a[download]")) {
    countAnalytics({path: "cv/download", title: "CV download click", event: true, referrer: ""});
  } else if (control.matches(".about-links a, .contact-email, .contact-socials a")) {
    const channel = control.protocol === "mailto:" ? "Email" : control.textContent.trim();
    countAnalytics({path: `contact/${analyticsSlug(channel)}`, title: `${channel} link click`, event: true, referrer: ""});
  }
}

document.addEventListener("click", trackSiteClick, {capture: true});
document.addEventListener("auxclick", trackSiteClick, {capture: true});
