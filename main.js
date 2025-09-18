function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  } else {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  }
}

// Apply saved theme on load
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

document.addEventListener("DOMContentLoaded", () => {
  console.log('DOMContentLoaded fired');
  loadTaskStatus();
  updateDashboardCounts();
  startAutoRefresh();
});

function startAutoRefresh() {
  setInterval(() => {
    loadTaskStatus();
    updateDashboardCounts();
  }, 30000); // Refresh every 30 seconds
}

async function login(username, password) {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch("http://localhost:8000/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });
    if (!res.ok) {
      alert("Login failed");
      return false;
    }
    const data = await res.json();
    localStorage.setItem("authToken", data.access_token);
    return true;
  } catch (err) {
    console.error("Login error:", err);
    alert("Login error: Network error. Please ensure the backend is running on localhost:8000.");
    return false;
  }
}

async function loadTeamMembers() {
  try {
    console.log("Loading team members...");
    const res = await fetch("http://localhost:8000/teams");
    if (!res.ok) {
      console.error("Failed to fetch team members:", res.status, res.statusText);
      alert("Failed to load team members: " + res.statusText + ". Please ensure the backend is running on localhost:8000.");
      return;
    }
    const members = await res.json();
    console.log("Team members fetched:", members);
    if (!Array.isArray(members) || members.length === 0) {
      console.warn("No team members found");
      alert("No team members found");
      return;
    }
    const options = members.map(member => ({ value: member.name, label: member.name }));
    console.log("Options for Choices:", options);
    teamChoices.setChoices(options, 'value', 'label', true);
    console.log("Choices set successfully");
  } catch (err) {
    console.error("Error loading team members:", err);
    alert("Error loading team members: Network error. Please ensure the backend is running on localhost:8000.");
  }
}

async function loadTaskStatus() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch("http://localhost:8000/tasks", { headers });
    if (!res.ok) {
      console.error("Failed to fetch tasks");
      alert("Failed to load task status. Please ensure the backend is running on localhost:8000.");
      return;
    }
    const tasks = await res.json();
    console.log('All tasks:', tasks);

    const container = document.getElementById("taskStatusBody");
    container.innerHTML = "";

    // Create Kanban container
    const kanbanContainer = document.createElement("div");
    kanbanContainer.className = "kanban-container";

    // Get unique teams
    const uniqueTeams = [...new Set(tasks.map(task => task.assign || "Unassigned"))];

    // Group tasks by team
    const tasksByTeam = tasks.reduce((groups, task) => {
      const team = task.assign || "Unassigned";
      if (!groups[team]) groups[team] = [];
      groups[team].push(task);
      return groups;
    }, {});

    // Create columns for each team
    uniqueTeams.forEach(team => {
      const column = document.createElement("div");
      column.className = "kanban-column";
      column.innerHTML = `
        <h3 style="color: #3b82f6">
          <i class="fas fa-users"></i>
          ${team}
          <span class="task-count">${tasksByTeam[team]?.length || 0}</span>
        </h3>
      `;

      // Add tasks to this column
      const tasksInTeam = tasksByTeam[team] || [];
      tasksInTeam.forEach(task => {
        const taskCard = document.createElement("div");
        taskCard.className = "kanban-task-card";
        taskCard.innerHTML = `
          <div class="task-card-header">
            <h4 class="task-card-title">${task.taskname}</h4>
            <span class="task-status">${task.status || "Waiting"}</span>
          </div>
          <div class="task-card-details">
            <div class="task-card-detail">
              <i class="fas fa-calendar-alt"></i>
              <span>${task.startdate || "No start date"}</span>
            </div>
            <div class="task-card-detail">
              <i class="fas fa-calendar-check"></i>
              <span>${task.enddate || "No end date"}</span>
            </div>
          </div>
        `;
        column.appendChild(taskCard);
      });

      kanbanContainer.appendChild(column);
    });

    container.appendChild(kanbanContainer);
  } catch (err) {
    console.error("Error loading task status:", err);
    alert("Error loading task status: Network error. Please ensure the backend is running on localhost:8000.");
  }
}

async function updateDashboardCounts() {
  try {
    const token = localStorage.getItem('authToken');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    const res = await fetch("http://localhost:8000/tasks", { headers });
    if (!res.ok) {
      console.error("Failed to fetch tasks");
      alert("Failed to load dashboard data. Please ensure the backend is running on localhost:8000.");
      return;
    }
    const tasks = await res.json();

    // Calculate counts for all tasks
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const completed = tasks.filter(t => t.status === "Done").length;
    const review = tasks.filter(t => t.status === "Review").length;

    // Update dashboard UI
    document.getElementById("db-total").textContent = total;
    document.getElementById("db-inprogress").textContent = inProgress;
    document.getElementById("db-completed").textContent = completed;
    document.getElementById("db-review").textContent = review;

    // Charts are now on a separate page, so do not update them here

  } catch (err) {
    console.error("Error updating dashboard counts:", err);
    alert("Error loading dashboard data. Please check the console for details and ensure the backend is running.");
  }
}


