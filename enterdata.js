// =============================
// ✅ Modal Functions
// =============================
function openForm() {
  document.getElementById("taskForm").style.display = "flex";
}
function closeForm() {
  document.getElementById("taskForm").style.display = "none";
}

// =============================
// ✅ Add Task Row to Table
// =============================
function addTaskToTable(task) {
  const tbody = document.getElementById("taskBody");
  const row = tbody.insertRow();
  row.innerHTML = `
    <td>${task.assign}</td>
    <td>${task.taskname}</td>
    <td>${task.startdate} → ${task.enddate}</td>
    <td>${task.progressSelect}</td>
    <td>${task.startdate}</td>
    <td>${task.enddate}</td>
    <td>${task.progressSelect === "Waiting" ? "⏳ Yes" : "-"}</td>
    <td>${task.progressSelect === "Review" ? "📅 Required" : "-"}</td>
  `;

  updateCounts(task.progressSelect);
  addTaskToDailyCheckin(task); // ✅ also show in daily check-in
}

// =============================
// ✅ Handle Task Submission
// =============================
document.getElementById("smartsheetForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const task = {
    taskname: document.getElementById("taskname").value,
    assign: document.getElementById("assign").value,
    progressSelect: document.getElementById("progressSelect").value,
    startdate: document.getElementById("startdate").value,
    enddate: document.getElementById("enddate").value,
  };

  try {
    let response = await fetch("http://127.0.0.1:8000/add_task/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(task),
    });

    if (!response.ok) throw new Error("❌ Failed to save task");

    let result = await response.json();
    console.log("✅ Saved on backend:", result);

    addTaskToTable(result.task); // use saved version from backend

    document.getElementById("smartsheetForm").reset();
    closeForm();

  } catch (err) {
    console.error("❌ Error saving task:", err);
    alert("❌ Failed to save task to backend!");
  }
});

// =============================
// ✅ Load Tasks from Backend
// =============================
window.onload = async function () {
  try {
    let response = await fetch("http://127.0.0.1:8000/get_tasks/");
    if (!response.ok) throw new Error("❌ Failed to fetch tasks");
    
    let data = await response.json();
    console.log("📥 Loaded tasks:", data);

    if (data.tasks && Array.isArray(data.tasks)) {
      data.tasks.forEach(task => addTaskToTable(task));
    }
  } catch (err) {
    console.error("❌ Error loading tasks:", err);
  }
};

// =============================
// ✅ Dashboard + Summary Counters
// =============================
let totalTasks = 0;
let inProgress = 0;
let completed = 0;
let review = 0;

function updateCounts(status) {
  totalTasks++;
  if (status === "In Progress") inProgress++;
  if (status === "Done") completed++;
  if (status === "Review") review++;

  document.getElementById("db-total").innerText = totalTasks;
  document.getElementById("db-inprogress").innerText = inProgress;
  document.getElementById("db-completed").innerText = completed;
  document.getElementById("db-review").innerText = review;
}

// =============================
// ✅ Daily Check-in
// =============================
function addTaskToDailyCheckin(task) {
  const today = new Date().toISOString().split("T")[0];
  const taskDate = task.startdate;

  let listElement;
  if (taskDate === today) {
    listElement = document.getElementById("today-tasks");
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(new Date().getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (taskDate === tomorrowStr) {
      listElement = document.getElementById("tomorrow-tasks");
    } else {
      listElement = document.getElementById("upcoming-tasks");
    }
  }

  const li = document.createElement("li");
  li.textContent = `${task.taskname} (${task.assign}) - ${task.progressSelect}`;
  listElement.appendChild(li);
}
