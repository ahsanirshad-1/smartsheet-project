const API_URL = "http://localhost:8000";



// Open / Close Modal
function openDailyForm() {
  document.getElementById("formTitle").textContent = "Add Daily Task";
  document.getElementById("submitBtn").textContent = "Save";
  document.getElementById("editingTaskName").value = "";
  document.getElementById("dailyTaskForm").reset();
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
      li.innerHTML = `
        <span>${task.name} (Assigned to: ${task.assign || 'Unassigned'}) - ${task.date}</span>
        <div class="task-actions">
          <button onclick="markDone('${task.name}')" title="Mark as Done"><i class="fas fa-check"></i></button>
          <button onclick="editDailyTask('${task.name}', '${task.assign}', '${task.description}', '${task.date}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button onclick="deleteDailyTask('${task.name}')" title="Delete"><i class="fas fa-trash"></i></button>
        </div>
      `;

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
    const res = await fetch(`${API_URL}/teams`);
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

// Add/Edit Daily Task
document.getElementById("dailyTaskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const taskName = document.getElementById("dailyTaskName").value;
  const assign = document.getElementById("dailyTaskAssign").value;
  const description = document.getElementById("dailyTaskDesc").value;
  const date = document.getElementById("dailyTaskDate").value;

  const editingName = document.getElementById("editingTaskName").value;

  const taskData = {
    name: taskName,
    assign: assign,
    description: description,
    date: date
  };

  const token = localStorage.getItem('authToken');
  const headers = { "Content-Type": "application/json" };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let method = "POST";
  let url = `${API_URL}/daily`;
  let successMsg = "Task is saved";
  let errorMsg = "❌ Failed to add daily task";

  if (editingName) {
    method = "PUT";
    url = `${API_URL}/daily/${encodeURIComponent(editingName)}`;
    successMsg = "Task updated";
    errorMsg = "❌ Failed to update daily task";
  }

  const res = await fetch(url, {
    method: method,
    headers,
    body: JSON.stringify(taskData)
  });

  if (res.ok) {
    showToast(successMsg);
  } else {
    showToast(errorMsg);
  }

  closeDailyForm();
  loadDailyTasks();
});

document.addEventListener("DOMContentLoaded", () => {
  loadDailyTasks();
  loadMembers();
});

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Edit Daily Task
function editDailyTask(name, assign, description, date) {
  document.getElementById("formTitle").textContent = "Edit Daily Task";
  document.getElementById("submitBtn").textContent = "Update";
  document.getElementById("editingTaskName").value = name;
  document.getElementById("dailyTaskName").value = name;
  document.getElementById("dailyTaskAssign").value = assign;
  document.getElementById("dailyTaskDesc").value = description;
  document.getElementById("dailyTaskDate").value = date;
  document.getElementById("dailyForm").style.display = "flex";
}

// Delete Daily Task
async function deleteDailyTask(name) {
  if (!confirm(`Are you sure you want to delete the task "${name}"?`)) {
    return;
  }
  const token = localStorage.getItem('authToken');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/daily/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers
  });
  if (res.ok) {
    showToast("Task deleted");
    loadDailyTasks();
  } else {
    showToast("❌ Failed to delete task");
  }
}

// Mark Daily Task as Done (delete task)
async function markDone(name) {
  const token = localStorage.getItem('authToken');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}/daily/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers
  });
  if (res.ok) {
    showToast("Task marked as done and removed");
    loadDailyTasks();
  } else {
    showToast("❌ Failed to mark task as done");
  }
}
