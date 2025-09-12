function getElementByIdIgnoreCase(id) {
  id = id.toLowerCase();
  const allElements = document.querySelectorAll("*[id]");
  for (const el of allElements) {
    if (el.id.toLowerCase() === id) return el;
  }
  return null;
}

getElementByIdIgnoreCase("taskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const taskData = {
    taskname: getElementByIdIgnoreCase("taskName").value,
    assign: getElementByIdIgnoreCase("assign").value,
    status: getElementByIdIgnoreCase("status").value,
    startdate: getElementByIdIgnoreCase("startDate").value,
    enddate: getElementByIdIgnoreCase("endDate").value,
    sendReminder: document.getElementById("sendReminder").checked
  };

  // Fetch team members to get email for the assigned member
  try {
    const emailRes = await fetch("http://127.0.0.1:8000/team");
    if (!emailRes.ok) {
      showToast("❌ Failed to load teams for email");
      return;
    }
    const members = await emailRes.json();
    const member = members.find(m => m.name === taskData.assign);
    if (!member) {
      showToast("❌ Assigned member not found in teams");
      return;
    }
    taskData.email = member.email;
  } catch (err) {
    console.error("Error fetching teams:", err);
    showToast("⚠️ Error loading member email");
    return;
  }

  try {
    const token = localStorage.getItem('authToken');
    const headers = { "Content-Type": "application/json" };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch("http://127.0.0.1:8000/tasks", {
      method: "POST",
      headers,
      body: JSON.stringify(taskData)
    });

    if (res.ok) {
      showToast("Task is saved");
      setTimeout(() => window.location.href = "workspace.html", 1500);
    } else {
      const errorData = await res.json();
      console.error("Server validation error:", errorData);
      showToast("❌ Failed to add task: " + (errorData.detail || "Validation error"));
    }
  } catch (err) {
    console.error("Error:", err);
    showToast("⚠️ Server error");
  }
});

getElementByIdIgnoreCase("cancelBtn").addEventListener("click", () => {
  window.location.href = "workspace.html";
});

document.addEventListener("DOMContentLoaded", async () => {
  await loadMembers();
});

async function loadMembers() {
  try {
    const res = await fetch("http://127.0.0.1:8000/team");
    const members = await res.json();
    const select = getElementByIdIgnoreCase("assign");
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

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
