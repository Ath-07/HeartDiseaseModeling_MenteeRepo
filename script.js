"use strict";

const STORAGE_KEY = "heartlab-mentorship-tasks-v1";

const tabs = Array.from(document.querySelectorAll(".week-tab"));
const weekCards = Array.from(document.querySelectorAll("[data-week-card]"));
const taskInputs = Array.from(document.querySelectorAll("[data-task]"));
const completionCount = document.getElementById("completion-count");
const progressSteps = Array.from(document.querySelectorAll("[data-progress-step]"));
const copyButton = document.getElementById("copy-structure");
const copyStatus = document.getElementById("copy-status");
const repoTree = document.getElementById("repo-tree");

function readCompletedTasks() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    console.warn("Could not read saved mentorship tasks.", error);
    return {};
  }
}

function saveCompletedTasks() {
  const completed = {};
  taskInputs.forEach((input) => {
    if (input.checked) completed[input.dataset.task] = true;
  });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch (error) {
    console.warn("Could not save mentorship tasks.", error);
    copyStatus.textContent = "Your browser could not save this checklist. Try enabling local storage.";
  }
}

function updateProgress() {
  const done = taskInputs.filter((input) => input.checked).length;
  completionCount.textContent = `${done} / ${taskInputs.length}`;
  const currentWeek = Math.min(4, Math.floor(done / 3) + 1);
  progressSteps.forEach((step) => {
    const stepNumber = Number(step.dataset.progressStep);
    step.classList.toggle("is-complete", stepNumber < currentWeek || done === taskInputs.length);
    step.classList.toggle("is-current", stepNumber === currentWeek && done < taskInputs.length);
  });
}

function setActiveWeek(week) {
  tabs.forEach((tab) => {
    const active = tab.dataset.week === week;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  weekCards.forEach((card) => {
    card.hidden = week !== "all" && card.dataset.weekCard !== week;
  });
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("The browser did not allow copying to the clipboard.");
}

taskInputs.forEach((input) => {
  input.checked = Boolean(readCompletedTasks()[input.dataset.task]);
  input.addEventListener("change", () => {
    copyStatus.textContent = "";
    saveCompletedTasks();
    updateProgress();
  });
});

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => setActiveWeek(tab.dataset.week));
  tab.addEventListener("keydown", (event) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    tabs[nextIndex].focus();
    setActiveWeek(tabs[nextIndex].dataset.week);
  });
});

copyButton.addEventListener("click", async () => {
  const structure = repoTree.innerText.trim();
  copyStatus.textContent = "";
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(structure);
    } else {
      fallbackCopy(structure);
    }
    copyStatus.textContent = "Repository structure copied to your clipboard.";
  } catch (error) {
    console.error("Could not copy the repository structure.", error);
    copyStatus.textContent = "Could not copy automatically. Select the file tree and copy it manually.";
  }
});

setActiveWeek("all");
updateProgress();
