const API_URL = "http://127.0.0.1:8000";

async function loadTeams() {
  try {
    const res = await fetch(`${API_URL}/team`);
    const members = await res.json();

    const tbody = document.getElementById("teamBody");
    tbody.innerHTML = "";

    members.forEach(member => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.team}</td>
        <td>
          <button class="action-btn action-edit" onclick="editMember(this)" title="Edit"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn action-delete" onclick="deleteMember(this)" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading teams:", err);
  }
}

async function deleteMember(button) {
  const tr = button.closest("tr");
  if (!tr) return;

  const name = tr.children[0].textContent;

  if (!confirm("Are you sure you want to delete this member?")) return;

  try {
    const res = await fetch(`${API_URL}/team/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) {
      showToast("🗑️ Member deleted");
      loadTeams();
    } else {
      showToast("❌ Failed to delete member");
    }
  } catch (err) {
    console.error("Error deleting member:", err);
    showToast("⚠️ Server error");
  }
}

function editMember(button) {
  // Implement edit if needed
  alert("Edit feature coming soon.");
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", loadTeams);
