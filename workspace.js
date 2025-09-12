let allTasks = [];

async function loadTasks() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const [tasksRes, dailyRes] = await Promise.all([
      fetch("http://127.0.0.1:8000/tasks", { headers }),
      fetch("http://127.0.0.1:8000/daily", { headers })
    ]);

    const tasks = await tasksRes.json();
    const dailyTasks = await dailyRes.json();

    // Normalize daily tasks to match task structure
    const normalizedDaily = dailyTasks.map(task => ({
      taskname: task.name,
      assign: task.assign || "-",
      status: "Daily",
      startdate: task.date,
      enddate: task.date,
      isDaily: true
    }));

    allTasks = [...tasks, ...normalizedDaily];
    renderTasks(allTasks);
  } catch (err) {
    console.error("Error loading tasks:", err);
  }
}



function renderTasks(tasks) {
  const tbody = document.getElementById("taskBody");
  tbody.innerHTML = "";

  tasks.forEach(task => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${task.assign || "-"}</td>
      <td>${task.taskname}</td>
      <td>${task.startdate}</td>
      <td>${task.enddate}</td>
      <td>${task.status}</td>
      <td>
        <button class="action-btn action-edit" onclick="editTask(this)">Edit</button>
        <button class="action-btn action-delete" onclick="deleteTask(this)">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function deleteTask(button) {
  const tr = button.closest("tr");
  if (!tr) return;

  const taskName = tr.children[1].textContent;
  const task = allTasks.find(t => t.taskname === taskName);

  if (!confirm("Are you sure you want to delete this task?")) return;

  try {
    let endpoint = "http://127.0.0.1:8000/tasks";
    if (task && task.isDaily) {
      endpoint = "http://127.0.0.1:8000/daily";
    }
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${endpoint}/${encodeURIComponent(taskName)}`, { method: "DELETE", headers });
    if (res.ok) {
      showToast("🗑️ Task deleted");
      loadTasks();
    } else {
      showToast("❌ Failed to delete task");
    }
  } catch (err) {
    console.error("Error deleting task:", err);
    showToast("⚠️ Server error");
  }
}

function editTask(button) {
  const tr = button.closest("tr");
  if (!tr) return;

  const taskName = tr.children[1].textContent.trim();

  const task = allTasks.find(t => t.taskname.trim() === taskName);
  if (!task) return;

  document.getElementById("editTaskName").value = task.taskname;
  document.getElementById("editAssign").value = task.assign;
  document.getElementById("editStatus").value = task.status;
  document.getElementById("editStartDate").value = task.startdate;
  document.getElementById("editEndDate").value = task.enddate;

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const taskName = document.getElementById("editTaskName").value.trim();
  const task = allTasks.find(t => t.taskname.trim() === taskName);

  let updatedTask, endpoint;
  if (task && task.isDaily) {
    updatedTask = {
      name: taskName,
      assign: document.getElementById("editAssign").value,
      description: task.description || "",
      date: document.getElementById("editStartDate").value
    };
    endpoint = `http://127.0.0.1:8000/daily/${encodeURIComponent(taskName)}`;
  } else {
    updatedTask = {
      taskname: taskName,
      assign: document.getElementById("editAssign").value,
      status: document.getElementById("editStatus").value,
      startdate: document.getElementById("editStartDate").value,
      enddate: document.getElementById("editEndDate").value
    };
    endpoint = `http://127.0.0.1:8000/tasks/${encodeURIComponent(taskName)}`;
  }

  try {
    const token = localStorage.getItem('authToken');
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: JSON.stringify(updatedTask)
    });

    if (res.ok) {
      showToast("✅ Task updated");
      closeEditModal();
      loadTasks();
    } else {
      showToast("❌ Failed to update task");
    }
  } catch (err) {
    console.error("Error updating task:", err);
    showToast("⚠️ Server error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("editForm").addEventListener("submit", handleEditSubmit);
});

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", loadTasks);
