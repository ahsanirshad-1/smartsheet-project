const API_URL = "http://localhost:8000";

async function loadTeams() {
  try {
    const res = await fetch(`${API_URL}/teams`);
    const members = await res.json();

    const tbody = document.getElementById("teamBody");
    tbody.innerHTML = "";

    for (const member of members) {
      const totalLeaves = await getTotalLeaves(member.name);
      const todayPresence = await getTodayPresence(member.name);

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.team}</td>
        <td>${totalLeaves}</td>
        <td>${todayPresence}</td>
        <td>
          <button class="action-btn action-edit" onclick="editMember(this)" title="Edit"><i class="fas fa-pencil-alt"></i></button>
          <button class="action-btn action-delete" onclick="deleteMember(this)" title="Delete"><i class="fas fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error("Error loading teams:", err);
  }
}

// Get Total Leaves for a Member
async function getTotalLeaves(memberName) {
  try {
    const res = await fetch(`${API_URL}/leaves/${memberName}`);
    const leaves = await res.json();
    return leaves.length;
  } catch (err) {
    console.error("Error getting total leaves:", err);
    return 0;
  }
}

// Get Today's Presence for a Member
async function getTodayPresence(memberName) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(`${API_URL}/presence/${memberName}?date=${today}`);
    const presenceRecords = await res.json();

    if (presenceRecords.length > 0) {
      const status = presenceRecords[0].status;
      return status === 'present' ? '✅ Present' : '❌ Absent';
    }
    return '⏳ Not Marked';
  } catch (err) {
    console.error("Error getting today presence:", err);
    return '⏳ Not Marked';
  }
}

async function deleteMember(button) {
  const tr = button.closest("tr");
  if (!tr) return;

  const name = tr.children[0].textContent;

  if (!confirm("Are you sure you want to delete this member?")) return;

  try {
    const res = await fetch(`${API_URL}/teams/${encodeURIComponent(name)}`, { method: "DELETE" });
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
  const tr = button.closest("tr");
  if (!tr) return;

  const name = tr.children[0].textContent;
  const email = tr.children[1].textContent;
  const team = tr.children[2].textContent;

  document.getElementById("editName").value = name;
  document.getElementById("editEmail").value = email;
  document.getElementById("editTeam").value = team;

  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";

  // Clear the URL parameter when closing the modal
  const url = new URL(window.location);
  url.searchParams.delete('edit');
  window.history.replaceState({}, document.title, url.pathname);
}

async function handleEditSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("editName").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const team = document.getElementById("editTeam").value.trim();

  const updatedMember = {
    name: name,
    email: email,
    team: team
  };

  try {
    const res = await fetch(`${API_URL}/teams/${encodeURIComponent(name)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMember)
    });

    if (res.ok) {
      showToast("✅ Member updated");
      closeEditModal();
      loadTeams();
    } else {
      showToast("❌ Failed to update member");
    }
  } catch (err) {
    console.error("Error updating member:", err);
    showToast("⚠️ Server error");
  }
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("editForm").addEventListener("submit", handleEditSubmit);

  // Check if we should auto-open edit modal for a specific member
  const urlParams = new URLSearchParams(window.location.search);
  const editMemberName = urlParams.get('edit');

  if (editMemberName) {
    // Load teams first, then open edit modal for the specific member
    loadTeams().then(() => {
      // Find the member and populate the edit form
      fetch(`${API_URL}/teams`)
        .then(res => res.json())
        .then(members => {
          const member = members.find(m => m.name === editMemberName);
          if (member) {
            document.getElementById("editName").value = member.name;
            document.getElementById("editEmail").value = member.email;
            document.getElementById("editTeam").value = member.team;
            document.getElementById("editModal").style.display = "flex";
          } else {
            showToast("❌ Member not found");
          }
        })
        .catch(err => {
          console.error("Error fetching member for editing:", err);
          showToast("❌ Error loading member for editing");
        });
    });
  } else {
    loadTeams();
  }
});
