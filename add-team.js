const API_URL = "http://localhost:8000";

async function loadTeams() {
  try {
    const res = await fetch(`${API_URL}/teams`);
    if (!res.ok) {
      showToast("❌ Failed to load teams");
      return;
    }
    const members = await res.json();

    // Extract unique team names
    const teams = [...new Set(members.map(member => member.team))];

    const datalist = document.getElementById("teamList");
    datalist.innerHTML = "";

    teams.forEach(team => {
      const option = document.createElement("option");
      option.value = team;
      datalist.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading teams:", err);
    showToast("⚠️ Server error");
  }
}

document.getElementById("teamForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const member = {
    name: document.getElementById("memberName").value,
    email: document.getElementById("memberEmail").value,
    team: document.getElementById("memberTeam").value,
  };

  try {
    const res = await fetch(`${API_URL}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member)
    });

    if (res.ok) {
      showToast("✅ Team member added!");
      setTimeout(() => window.location.href = "teams.html", 1500);
    } else {
      showToast("❌ Failed to add member");
    }
  } catch (err) {
    console.error("Error:", err);
    showToast("⚠️ Server error");
  }
});

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", loadTeams);
