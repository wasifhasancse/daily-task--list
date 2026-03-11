const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskPriority = document.getElementById("taskPriority");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateMessage = document.getElementById("emptyStateMessage");
const summaryBadge = document.getElementById("summaryBadge");
const todayDate = document.getElementById("todayDate");
const filterAllBtn = document.getElementById("filterAllBtn");
const filterPendingBtn = document.getElementById("filterPendingBtn");
const filterCompletedBtn = document.getElementById("filterCompletedBtn");
const taskListContainer = document.getElementById("taskListContainer");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const hintsModal = document.getElementById("hintsModal");
const quickAddFromHints = document.getElementById("quickAddFromHints");

const tasks = [];
let activeFilter = "all";
const STORAGE_KEY = "daily-task-board-v1";

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatToday(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function updateFilterButtons() {
  [filterAllBtn, filterPendingBtn, filterCompletedBtn].forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("bg-gradient-to-r", isActive);
    button.classList.toggle("from-violet-500", isActive);
    button.classList.toggle("to-purple-500", isActive);
    button.classList.toggle("text-white", isActive);
    button.classList.toggle("shadow-sm", isActive);
    button.classList.toggle("font-semibold", isActive);
    button.classList.toggle("bg-transparent", !isActive);
    button.classList.toggle("text-white/90", !isActive);
    button.classList.toggle("shadow-none", !isActive);
  });
}

function getFilteredTasks() {
  if (activeFilter === "pending") {
    return tasks.filter((task) => !task.completed);
  }

  if (activeFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function updateSummary() {
  const completedCount = tasks.filter((task) => task.completed).length;
  const pendingCount = tasks.length - completedCount;
  summaryBadge.textContent = `${tasks.length} tasks | ${pendingCount} pending | ${completedCount} completed`;
  clearCompletedBtn.disabled = completedCount === 0;
}

function getPriorityBadge(priority) {
  if (priority === "high") {
    return {
      label: "High Priority",
      className: "border-rose-200 bg-rose-100 text-rose-700",
    };
  }

  if (priority === "low") {
    return {
      label: "Low Priority",
      className: "border-sky-200 bg-sky-100 text-sky-700",
    };
  }

  return {
    label: "Medium Priority",
    className: "border-amber-200 bg-amber-100 text-amber-700",
  };
}

function updateEmptyState(filteredTasks) {
  if (filteredTasks.length > 0) {
    emptyState.classList.add("hidden");
    return;
  }

  emptyState.classList.remove("hidden");

  if (tasks.length === 0) {
    emptyStateTitle.textContent = "No tasks yet";
    emptyStateMessage.textContent = "Add a task to start your day plan.";
    return;
  }

  if (activeFilter === "pending") {
    emptyStateTitle.textContent = "No pending tasks";
    emptyStateMessage.textContent =
      "Great job. Everything is completed for now.";
    return;
  }

  if (activeFilter === "completed") {
    emptyStateTitle.textContent = "No completed tasks yet";
    emptyStateMessage.textContent = "Finish a task to see your progress here.";
    return;
  }

  emptyStateTitle.textContent = "No tasks match this view";
  emptyStateMessage.textContent = "Try another filter or add a new task.";
}

function saveState() {
  const payload = {
    activeFilter,
    tasks: tasks.map((task) => ({
      ...task,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    })),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return;
  }

  try {
    const parsed = JSON.parse(rawValue);
    const savedTasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    tasks.length = 0;
    tasks.push(
      ...savedTasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority || "medium",
        completed: Boolean(task.completed),
        createdAt: new Date(task.createdAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : null,
      })),
    );

    if (["all", "pending", "completed"].includes(parsed.activeFilter)) {
      activeFilter = parsed.activeFilter;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderTasks() {
  taskListContainer.style.maxHeight = "";
  taskList.innerHTML = "";
  const filteredTasks = getFilteredTasks();

  filteredTasks.forEach((task, index) => {
    const priorityBadge = getPriorityBadge(task.priority);
    const item = document.createElement("li");
    item.className = `card border bg-white shadow-sm transition-all duration-300 ${task.completed ? "border-slate-200 bg-slate-100/80" : "border-slate-200"}`;
    item.innerHTML = `
          <div class="card-body gap-2 p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex min-w-0 items-start gap-3">
                <input class="checkbox checkbox-success mt-1" type="checkbox" ${task.completed ? "checked" : ""} aria-label="Mark task as completed" data-action="toggle" data-id="${task.id}">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Task #${index + 1}</p>
                  <h3 class="break-words text-base font-bold text-slate-700 sm:text-lg ${task.completed ? "line-through opacity-60" : ""}">${task.title}</h3>
                  <span class="badge badge-sm mt-2 ${priorityBadge.className}">${priorityBadge.label}</span>
                  ${task.completed ? `<span class="badge badge-sm mt-2 gap-1 border-violet-200 bg-violet-100 text-violet-700"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>Completed</span>` : ""}
                </div>
              </div>
              <button class="btn btn-sm border-slate-200 bg-white text-slate-500 shadow-none hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500" type="button" data-action="remove" data-id="${task.id}" title="Remove this task">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M3 6h18"></path>
                  <path d="M8 6V4h8v2"></path>
                  <path d="M19 6l-1 14H6L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                </svg>
                Remove
              </button>
            </div>
            <div class="grid gap-1 text-xs text-slate-500 sm:grid-cols-2 sm:text-sm">
              <p class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg><span class="font-semibold">Created:</span> ${formatDate(task.createdAt)}</p>
              <p class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg><span class="font-semibold">Completed:</span> ${task.completedAt ? formatDate(task.completedAt) : "Not completed yet"}</p>
            </div>
          </div>
        `;
    taskList.appendChild(item);
  });

  updateEmptyState(filteredTasks);
  updateSummary();
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    priority: taskPriority.value,
    completed: false,
    createdAt: new Date(),
    completedAt: null,
  });

  taskInput.value = "";
  taskPriority.value = "medium";
  taskInput.focus();
  saveState();
  renderTasks();
});

taskList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action='remove']");
  if (!button) {
    return;
  }

  const taskId = button.dataset.id;
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index !== -1) {
    tasks.splice(index, 1);
    saveState();
    renderTasks();
  }
});

taskList.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-action='toggle']");
  if (!checkbox) {
    return;
  }

  const taskId = checkbox.dataset.id;
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) {
    return;
  }

  task.completed = checkbox.checked;
  task.completedAt = checkbox.checked ? new Date() : null;
  saveState();
  renderTasks();
});

[filterAllBtn, filterPendingBtn, filterCompletedBtn].forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    saveState();
    updateFilterButtons();
    renderTasks();
  });
});

clearCompletedBtn.addEventListener("click", () => {
  const activeTasks = tasks.filter((task) => !task.completed);
  tasks.length = 0;
  tasks.push(...activeTasks);
  saveState();
  renderTasks();
});

quickAddFromHints.addEventListener("click", () => {
  hintsModal.close();
  taskInput.focus();
});

loadState();
todayDate.textContent = formatToday(new Date());
updateFilterButtons();
renderTasks();
