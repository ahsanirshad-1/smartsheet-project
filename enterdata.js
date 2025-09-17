// =============================
// ✅ API Base URL
// =============================
const API_BASE = "http://127.0.0.1:8000";

function getElementByIdIgnoreCase(id) {
  id = id.toLowerCase();
  const allElements = document.querySelectorAll("*[id]");
  for (const el of allElements) {
    if (el.id.toLowerCase() === id) return el;
  }
  return null;
}

// =============================
// ✅ Open / Close Modals
// =============================
function openTaskForm() {
  getElementByIdIgnoreCase("taskForm").style.display = "flex";
}
function closeTaskForm() {
  getElementByIdIgnoreCase("taskForm").style.display = "none";
}

function openTeamForm() {
  getElementByIdIgnoreCase("teamForm").style.display = "flex";
}
function closeTeamForm() {
  getElementByIdIgnoreCase("teamForm").style.display = "none";
}

// =============================
// ✅ Load Team Members into Dropdown + Table
// =============================
async function loadTeamMembers() {
  try {
    const res = await fetch(`${API_BASE}/teams`);
    const members = await res.json();

    const teamBody = getElementByIdIgnoreCase("teamBody");
    const assignSelect = getElementByIdIgnoreCase("assignSelect");

    teamBody.innerHTML = "";
    assignSelect.innerHTML = "";

    members.forEach(member => {
      // Add row to team table
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.team}</td>
      `;
      teamBody.appendChild(tr);

      // Add to assign dropdown
      const option = document.createElement("option");
      option.value = member.name;
      option.textContent = member.name;
      assignSelect.appendChild(option);
    });
  } catch (err) {
    console.error("⚠️ Failed to load team members:", err);
  }
}

// =============================
// ✅ Load Daily Tasks
// =============================
async function loadDailyTasks() {
  try {
    const res = await fetch(`${API_BASE}/tasks/daily`);
    const data = await res.json();

    renderTasks("today-tasks", data.today);
    renderTasks("tomorrow-tasks", data.tomorrow);
    renderTasks("upcoming-tasks", data.upcoming);
  } catch (err) {
    console.error("⚠️ Failed to load daily tasks:", err);
  }
}

function renderTasks(containerId, tasks) {
  const ul = getElementByIdIgnoreCase(containerId);
  if (!ul) return;

  ul.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${task.name}</strong> (${task.status})
      <br>
      ${task.start} → ${task.end}
      <br>
      <button onclick="deleteTask('${task.id}')">❌ Delete</button>
    `;
    ul.appendChild(li);
  });
}

// =============================
// ✅ Add Task
// =============================
document.getElementById("smartsheetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const task = {
    name: getElementByIdIgnoreCase("taskname").value,
    assign: getElementByIdIgnoreCase("assignSelect").value,
    status: getElementByIdIgnoreCase("progressSelect").value,
    start: getElementByIdIgnoreCase("startdate").value,
    end: getElementByIdIgnoreCase("enddate").value,
  };

  await fetch(`${API_BASE}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });

  closeTaskForm();
  loadDailyTasks();
});

// =============================
// ✅ Add Team Member
// =============================
document.getElementById("teamMemberForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const member = {
    name: getElementByIdIgnoreCase("memberName").value,
    email: getElementByIdIgnoreCase("memberEmail").value,
    team: getElementByIdIgnoreCase("memberTeam").value,
  };

  await fetch(`${API_BASE}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(member),
  });

  closeTeamForm();
  loadTeamMembers();
});

// =============================
// ✅ Delete Task
// =============================
async function deleteTask(taskId) {
  await fetch(`${API_BASE}/tasks/${taskId}`, { method: "DELETE" });
  loadDailyTasks();
}

// =============================
// ✅ Page Load
// =============================
document.addEventListener("DOMContentLoaded", () => {
  loadTeamMembers();
  loadDailyTasks();
});
