// ✅ Open & Close Form
function openForm() {
  document.getElementById("taskForm").style.display = "block";
}
function closeForm() {
  document.getElementById("taskForm").style.display = "none";
}

// ✅ Add Task Row to Table
function addTaskToTable(task) {
  const tbody = document.getElementById("taskBody");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${task.assign}</td>
    <td>${task.taskname}</td>
    <td>${new Date().toLocaleDateString()}</td>
    <td>${task.progressSelect}</td>
    <td>${task.startdate}</td>
    <td>${task.enddate}</td>
    <td>${task.progressSelect === "Waiting" ? "⏳ Yes" : "-"}</td>
    <td>${task.progressSelect === "Review" ? "📅 Required" : "-"}</td>
    <td><button class="delete-btn">❌</button></td>
  `;

  // ✅ Delete logic
  row.querySelector(".delete-btn").addEventListener("click", async () => {
    if (confirm(`Delete task: ${task.taskname}?`)) {
      try {
        let response = await fetch(`http://127.0.0.1:8000/delete_task/${task.taskname}`, {
          method: "DELETE",
        });

        let result = await response.json();
        console.log(result);

        row.remove(); // remove from UI
      } catch (err) {
        console.error("Error deleting task:", err);
        alert("❌ Failed to delete task!");
      }
    }
  });

  tbody.appendChild(row);
}

// ✅ Handle Form Submit
document.getElementById("smartsheetForm").addEventListener("submit", async function (e) {
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

    let result = await response.json();
    console.log("Save response:", result);

    // ✅ Add to table instantly
    addTaskToTable(task);

    document.getElementById("smartsheetForm").reset();
    closeForm();

  } catch (err) {
    console.error("Error saving task:", err);
    alert("❌ Failed to save task!");
  }
});

// ✅ Load Existing Tasks from MongoDB on Page Load
window.onload = async function () {
  try {
    let response = await fetch("http://127.0.0.1:8000/get_tasks/");
    let data = await response.json();
    console.log("Loaded tasks:", data);

    data.tasks.forEach(task => {
      addTaskToTable(task);
    });

  } catch (err) {
    console.error("Error loading tasks:", err);
  }
};
