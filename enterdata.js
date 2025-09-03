
// ✅ Your Smartsheet Info
const SHEET_ID = "PfPMx9VG8WqGpQ7wrjWMPPhVPMhjg5j42Q8c2R61"; 
const API_TOKEN = "YOUR_ACCESS_TOKEN_HERE"; // 🔑 Replace with your Smartsheet API Token

// ✅ Replace with your real Smartsheet Column IDs
const COL_TASKNAME = 1111111111111111;
const COL_ASSIGN   = 2222222222222222;
const COL_START    = 3333333333333333;
const COL_END      = 4444444444444444;
const COL_PROGRESS = 5555555555555555;

let tasks = [];
let editTask = null;

// 🎯 Open Modal
function openForm(task = null) {
  document.getElementById("taskModal").style.display = "block";

  if (task) {
    document.getElementById("taskname").value = task.name;
    document.getElementById("assign").value = task.assign;
    document.getElementById("progressSelect").value = task.status;
    document.getElementById("startdate").value = task.start;
    document.getElementById("enddate").value = task.end;
    editTask = task;
  } else {
    document.getElementById("smartsheetForm").reset();
    editTask = null;
  }
}

// 🎯 Close Modal
function closeForm() {
  document.getElementById("taskModal").style.display = "none";
  document.getElementById("smartsheetForm").reset();
  editTask = null;
}

// 🎯 Create Task Card
function createTaskCard(task) {
  const div = document.createElement("div");
  div.className = "task-card";
  div.innerHTML = `
    <h3>${task.name}</h3>
    <p>👤 ${task.assign}</p>
    <p>📅 ${task.start} ➝ ${task.end}</p>
    <button onclick="openForm(tasks.find(t => t.id === '${task.id}'))">✏️ Edit</button>
  `;
  return div;
}

// 🎯 Load tasks from Smartsheet
async function loadTasks() {
  const res = await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}`, {
    headers: { "Authorization": "Bearer " + API_TOKEN }
  });
  const data = await res.json();

  data.rows.forEach(row => {
    const task = {
      id: row.id,
      name: row.cells.find(c => c.columnId === COL_TASKNAME)?.value || "Untitled",
      assign: row.cells.find(c => c.columnId === COL_ASSIGN)?.value || "Unknown",
      start: row.cells.find(c => c.columnId === COL_START)?.value || "",
      end: row.cells.find(c => c.columnId === COL_END)?.value || "",
      status: row.cells.find(c => c.columnId === COL_PROGRESS)?.value?.toLowerCase() || "progress"
    };

    const card = createTaskCard(task);
    document.getElementById(task.status).appendChild(card);
    tasks.push(task);
  });
}

// 🎯 Save New Task to Smartsheet
async function saveTask(task) {
  const row = {
    toTop: true,
    cells: [
      { columnId: COL_TASKNAME, value: task.name },
      { columnId: COL_ASSIGN, value: task.assign },
      { columnId: COL_START, value: task.start },
      { columnId: COL_END, value: task.end },
      { columnId: COL_PROGRESS, value: task.status }
    ]
  };

  await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + API_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([row])
  });
}

// 🎯 Update Task in Smartsheet
async function updateTask(task) {
  const row = {
    id: task.id,
    cells: [
      { columnId: COL_TASKNAME, value: task.name },
      { columnId: COL_ASSIGN, value: task.assign },
      { columnId: COL_START, value: task.start },
      { columnId: COL_END, value: task.end },
      { columnId: COL_PROGRESS, value: task.status }
    ]
  };

  await fetch(`https://api.smartsheet.com/2.0/sheets/${SHEET_ID}/rows`, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + API_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify([row])
  });
}

// 🎯 Handle Form Submit
document.getElementById("smartsheetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const task = {
    id: editTask ? editTask.id : Date.now().toString(),
    name: document.getElementById("taskname").value,
    assign: document.getElementById("assign").value,
    start: document.getElementById("startdate").value,
    end: document.getElementById("enddate").value,
    status: document.getElementById("progressSelect").value
  };

  if (editTask) {
    // update UI
    document.querySelectorAll(".task-card").forEach(el => el.remove());
    tasks = [];
    await updateTask(task);
    await loadTasks();
  } else {
    await saveTask(task);
    const card = createTaskCard(task);
    document.getElementById(task.status).appendChild(card);
    tasks.push(task);
  }

  closeForm();
});

// 🎯 Load tasks on start
window.onload = loadTasks;

