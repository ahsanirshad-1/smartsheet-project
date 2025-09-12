// =============================
// 📊 Dashboard Script (main.js)
// =============================

// Backend API base URL
const API_URL = "http://127.0.0.1:8000";

// Function to fetch tasks and update dashboard
async function loadDashboard() {
  try {
    const token = localStorage.getItem('authToken');
    const [tasksRes, dailyRes] = await Promise.all([
      fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }),
      fetch(`${API_URL}/daily`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    ]);

    const tasks = await tasksRes.json();
    const dailyTasks = await dailyRes.json();

    // Combine tasks
    const allTasks = [...tasks, ...dailyTasks.map(t => ({ ...t, status: "Daily" }))];

    // Count tasks by status
    let total = allTasks.length;
    let inProgress = allTasks.filter(t => t.status === "In Progress").length;
    let completed = allTasks.filter(t => t.status === "Done" || t.status === "Completed").length;
    let review = allTasks.filter(t => t.status === "Review").length;

    // Update UI
    document.getElementById("db-total").textContent = total;
    document.getElementById("db-inprogress").textContent = inProgress;
    document.getElementById("db-completed").textContent = completed;
    document.getElementById("db-review").textContent = review;

  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
  }
}

// Run on page load
document.addEventListener("DOMContentLoaded", loadDashboard);
