document.addEventListener("DOMContentLoaded", () => {
  loadTeamMembers();
  loadTaskStatus();
  updateDashboardCounts();

  document.getElementById("teamFilter").addEventListener("change", () => {
    loadTaskStatus();
    updateDashboardCounts();
  });
});

async function loadTeamMembers() {
  try {
    const res = await fetch("http://127.0.0.1:8000/team");
    if (!res.ok) {
      console.error("Failed to fetch team members");
      return;
    }
    const members = await res.json();
    const select = document.getElementById("teamFilter");

    members.forEach(member => {
      const option = document.createElement("option");
      option.value = member.name;
      option.textContent = member.name;
      select.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading team members:", err);
  }
}

async function loadTaskStatus() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch("http://127.0.0.1:8000/tasks", { headers });
    if (!res.ok) {
      console.error("Failed to fetch tasks");
      return;
    }
    const tasks = await res.json();

    const filterMember = document.getElementById("teamFilter").value;

    // Filter tasks by selected team member if any
    const filteredTasks = filterMember ? tasks.filter(t => t.assign === filterMember) : tasks;

    // Group tasks by status
    const statusGroups = filteredTasks.reduce((groups, task) => {
      const status = task.status || "Unknown";
      if (!groups[status]) groups[status] = [];
      groups[status].push(task);
      return groups;
    }, {});

    const container = document.getElementById("taskStatusBody");
    container.innerHTML = "";

    for (const [status, tasks] of Object.entries(statusGroups)) {
      const card = document.createElement("div");
      card.className = "task-card";

      const title = document.createElement("h3");
      title.textContent = status;
      card.appendChild(title);

      tasks.forEach(task => {
        const p = document.createElement("p");
        p.textContent = `${task.taskname} (Assigned to: ${task.assign || "-"})`;
        card.appendChild(p);
      });

      container.appendChild(card);
    }
  } catch (err) {
    console.error("Error loading task status:", err);
  }
}

async function updateDashboardCounts() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch("http://127.0.0.1:8000/tasks", { headers });
    if (!res.ok) {
      console.error("Failed to fetch tasks");
      return;
    }
    const tasks = await res.json();

    const filterMember = document.getElementById("teamFilter").value;

    // Filter tasks by selected team member if any
    const filteredTasks = filterMember ? tasks.filter(t => t.assign === filterMember) : tasks;

    // Calculate counts
    const total = filteredTasks.length;
    const inProgress = filteredTasks.filter(t => t.status === "In Progress").length;
    const completed = filteredTasks.filter(t => t.status === "Done").length;
    const review = filteredTasks.filter(t => t.status === "Review").length;

    // Update dashboard UI
    document.getElementById("db-total").textContent = total;
    document.getElementById("db-inprogress").textContent = inProgress;
    document.getElementById("db-completed").textContent = completed;
    document.getElementById("db-review").textContent = review;
  } catch (err) {
    console.error("Error updating dashboard counts:", err);
  }
}
