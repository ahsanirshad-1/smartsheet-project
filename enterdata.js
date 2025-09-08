// ================================
// 📌 Modal Control
// ================================
function openForm() {
  document.getElementById("taskForm").style.display = "block";
}

function closeForm() {
  document.getElementById("taskForm").style.display = "none";
}

// ================================
// 📌 Load Tasks from FastAPI
// ================================
async function loadTasks() {
  try {
    const response = await fetch(" http://127.0.0.1:8000");

    // Clear all task columns but keep headers
    document.querySelectorAll(".column").forEach(col => {
      const header = col.querySelector("h2").outerHTML;
      col.innerHTML = header;
    });

    
    data.tasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task-card";
      taskDiv.innerHTML = `
        <h3>${task["Task Name"] || "Untitled Task"}</h3>
        <p>👤 ${task["Assign To"] || "Unassigned"}</p>
        <p>📅 ${task["Start Date"] || ""} → ${task["End Date"] || ""}</p>
      `;

      // Place into correct column based on Status
      const status = (task["Status"] || "backlog").toLowerCase();
      const column = document.getElementById(status);
      if (column) {
        column.appendChild(taskDiv);
      } else {
        // Default to backlog if unknown status
        document.getElementById("backlog").appendChild(taskDiv);
      }
    });

  } catch (error) {
    console.error("❌ Error loading tasks:", error);
  }
}

// ================================
// 📌 Add New Task
// ================================
document.getElementById("smartsheetForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const newTask = {
    name: document.getElementById("taskname").value,
    description: document.getElementById("assign").value,
    status: document.getElementById("progressSelect").value,
    start_date: document.getElementById("startdate").value,
    end_date: document.getElementById("enddate").value
  };

  try {
    await fetch("/api/tasks", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(newTask)
    });

    // Close form and reload tasks
    closeForm();
    loadTasks();

  } catch (error) {
    console.error("❌ Error adding task:", error);
  }
});

// ================================
// 📌 Initialize on Page Load
// ================================
window.onload = loadTasks;
