const archive = document.getElementById("archive");
const archiveSlot = document.getElementById("archiveSlot");
const activeCard = document.getElementById("activeCard");
const advanceButton = document.getElementById("advanceButton");
const resetButton = document.getElementById("resetButton");
const steps = window.workflowSteps || [];
const pageCache = new Map();
let activeIndex = -1;
let renderRequest = 0;

function stepHash(step) {
  return `#step-${step.number}`;
}

function indexFromHash() {
  const match = window.location.hash.match(/^#step-(\d{2})$/);
  if (!match) return 0;
  const index = steps.findIndex((step) => step.number === match[1]);
  return index >= 0 ? index : 0;
}

function renderArchive() {
  archive.classList.add("has-card");
  archiveSlot.innerHTML = steps.map((step, index) => {
    const currentClass = index === activeIndex ? " is-current" : "";
    const ariaCurrent = index === activeIndex ? ` aria-current="step"` : "";
    return `<button class="archive-card${currentClass}" type="button" data-step-index="${index}"${ariaCurrent}><b>${step.number}</b><span>${step.title}</span></button>`;
  }).join("");
}

async function loadStep(step) {
  if (!pageCache.has(step.path)) {
    pageCache.set(step.path, fetch(step.path).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load ${step.path}: ${response.status}`);
      }
      return response.text();
    }).catch((error) => {
      pageCache.delete(step.path);
      throw error;
    }));
  }
  return pageCache.get(step.path);
}

function prefetchStep(index) {
  if (index < 0 || index >= steps.length) return;
  void loadStep(steps[index]).catch(() => {});
}

async function showStep(index, { animate = true } = {}) {
  if (index < 0 || index >= steps.length) return;
  const request = ++renderRequest;
  const step = steps[index];
  activeIndex = index;
  activeCard.classList.remove("is-lifting", "is-entering");
  activeCard.classList.toggle("is-wide", Boolean(step.wide));
  activeCard.setAttribute("aria-busy", "true");
  activeCard.innerHTML = `<div class="load-state"><b>正在加载步骤 ${step.number}</b><span>${step.title}</span></div>`;
  advanceButton.textContent = activeIndex >= steps.length - 1 ? "已到最新" : "下一步";
  advanceButton.disabled = true;
  renderArchive();

  try {
    const html = await loadStep(step);
    if (request !== renderRequest) return;
    activeCard.innerHTML = html;
    activeCard.setAttribute("aria-busy", "false");
    activeCard.classList.toggle("is-entering", animate);
    advanceButton.disabled = activeIndex >= steps.length - 1;
    document.title = `${step.number} · ${step.title} | 银行欺诈告警审计工作流`;
    prefetchStep(activeIndex + 1);
  } catch (error) {
    if (request !== renderRequest) return;
    activeCard.setAttribute("aria-busy", "false");
    activeCard.innerHTML = `<div class="load-state is-error" role="alert"><b>步骤加载失败</b><span>请检查网络后重试。</span><button class="control" type="button" data-retry-step>重试</button></div>`;
    console.error(error);
  }

  if (animate && request === renderRequest) {
    window.setTimeout(() => activeCard.classList.remove("is-entering"), 580);
  }
}

function navigateTo(index, { replace = false } = {}) {
  if (index < 0 || index >= steps.length) return;
  const hash = stepHash(steps[index]);
  if (replace) {
    window.history.replaceState(null, "", hash);
    void showStep(index, { animate: false });
  } else if (window.location.hash === hash) {
    void showStep(index);
  } else {
    window.location.hash = hash;
  }
}

function advanceStep() {
  if (activeCard.classList.contains("is-lifting")) return;
  if (activeIndex >= steps.length - 1) return;
  const currentIndex = activeIndex;
  activeCard.classList.add("is-lifting");
  advanceButton.disabled = true;
  window.setTimeout(() => navigateTo(currentIndex + 1), 700);
}

renderArchive();
navigateTo(indexFromHash(), { replace: !window.location.hash.match(/^#step-\d{2}$/) });
advanceButton.addEventListener("click", advanceStep);
resetButton.addEventListener("click", () => navigateTo(0));
archiveSlot.addEventListener("click", (event) => {
  const button = event.target.closest("[data-step-index]");
  if (!button) return;
  navigateTo(Number(button.dataset.stepIndex));
});
activeCard.addEventListener("click", (event) => {
  if (event.target.closest("[data-retry-step]")) {
    void showStep(activeIndex, { animate: false });
  }
});
window.addEventListener("hashchange", () => void showStep(indexFromHash()));
