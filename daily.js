const API_URL = "http://127.0.0.1:8000";



// Open / Close Modal
function openDailyForm() {
  document.getElementById("dailyForm").style.display = "flex";
}
function closeDailyForm() {
  document.getElementById("dailyForm").style.display = "none";
}

// Load Daily Tasks
async function loadDailyTasks() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_URL}/daily`, { headers });
    const tasks = await res.json();

    // Clear old
    document.getElementById("today-tasks").innerHTML = "";
    document.getElementById("tomorrow-tasks").innerHTML = "";
    document.getElementById("upcoming-tasks").innerHTML = "";

    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

tasks.forEach(task => {
  const li = document.createElement("li");
  li.textContent = `${task.name} (Assigned to: ${task.assign || 'Unassigned'}) - ${task.date}`;

  if (task.date === today) {
    document.getElementById("today-tasks").appendChild(li);
  } else if (task.date === tomorrow) {
    document.getElementById("tomorrow-tasks").appendChild(li);
  } else {
    document.getElementById("upcoming-tasks").appendChild(li);
  }
});
  } catch (err) {
    console.error("Error loading daily tasks:", err);
  }
}

// Load Members for Assign Select
async function loadMembers() {
  try {
    const res = await fetch(`${API_URL}/team`);
    const members = await res.json();
    const select = document.getElementById("dailyTaskAssign");
    members.forEach(member => {
      const option = document.createElement("option");
      option.value = member.name;
      option.textContent = member.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading members:", err);
  }
}

// Add Daily Task
document.getElementById("dailyTaskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newTask = {
    name: document.getElementById("dailyTaskName").value,
    assign: document.getElementById("dailyTaskAssign").value,
    description: document.getElementById("dailyTaskDesc").value,
    date: document.getElementById("dailyTaskDate").value
  };

  const token = localStorage.getItem('authToken');
  const headers = { "Content-Type": "application/json" };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  await fetch(`${API_URL}/daily`, {
    method: "POST",
    headers,
    body: JSON.stringify(newTask)
  });

  closeDailyForm();
  loadDailyTasks();
});

document.addEventListener("DOMContentLoaded", () => {
  loadDailyTasks();
  loadMembers();
});
