const API_URL = "http://localhost:8000";

async function loadTeamMembers() {
  try {
    const res = await fetch(`${API_URL}/teams`);
    const members = await res.json();

    const tbody = document.getElementById("teamBody");
    tbody.innerHTML = "";

    const today = new Date().toISOString().split("T")[0];

    for (const member of members) {
      // Get leave count for this member
      const leaveRes = await fetch(`${API_URL}/leaves?member_name=${encodeURIComponent(member.name)}&status=approved`);
      const leaves = await leaveRes.json();
      const totalLeaves = leaves.length;

      // Get today's presence for this member
      const presenceRes = await fetch(`${API_URL}/presence?member_name=${encodeURIComponent(member.name)}&date=${today}`);
      const presenceData = await presenceRes.json();
      const todayPresence = presenceData.length > 0 ? presenceData[0].status : 'Not marked';

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${member.name}</td>
        <td>${member.email}</td>
        <td>${member.team}</td>
        <td>${totalLeaves}</td>
        <td><span class="status-${todayPresence.toLowerCase().replace(' ', '-')}">${todayPresence}</span></td>
        <td>
          <button class="action-btn action-view" onclick="viewMemberDetails('${member.name}')" title="View Details"><i class="fas fa-eye"></i></button>
          <button class="action-btn action-edit" onclick="editMember('${member.name}')" title="Edit"><i class="fas fa-pencil-alt"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  } catch (err) {
    console.error("Error loading team members:", err);
  }
}

function openLeaveModal() {
  document.getElementById("leaveModal").style.display = "flex";
  document.getElementById("leaveForm").reset();
}

function closeLeaveModal() {
  document.getElementById("leaveModal").style.display = "none";
}

function openPresenceModal() {
  document.getElementById("presenceModal").style.display = "flex";
  document.getElementById("presenceForm").reset();
  document.getElementById("presenceDate").value = new Date().toISOString().split("T")[0];
}

function closePresenceModal() {
  document.getElementById("presenceModal").style.display = "none";
}

async function handleLeaveSubmit(e) {
  e.preventDefault();

  const memberName = document.getElementById("leaveMemberName").value.trim();
  const startDate = document.getElementById("leaveStartDate").value;
  const endDate = document.getElementById("leaveEndDate").value;
  const reason = document.getElementById("leaveReason").value.trim();

  const leaveData = {
    member_name: memberName,
    start_date: startDate,
    end_date: endDate,
    reason: reason,
    status: "pending",
    requested_by: "current_user" // This should be the logged-in user
  };

  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/leaves`, {
      method: "POST",
      headers,
      body: JSON.stringify(leaveData)
    });

    if (res.ok) {
      showToast("✅ Leave request submitted");
      closeLeaveModal();
      loadTeamMembers();
    } else {
      showToast("❌ Failed to submit leave request");
    }
  } catch (err) {
    console.error("Error submitting leave request:", err);
    showToast("⚠️ Server error");
  }
}

async function handlePresenceSubmit(e) {
  e.preventDefault();

  const memberName = document.getElementById("presenceMemberName").value.trim();
  const date = document.getElementById("presenceDate").value;
  const status = document.getElementById("presenceStatus").value;

  const presenceData = {
    member_name: memberName,
    date: date,
    status: status
  };

  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/presence`, {
      method: "POST",
      headers,
      body: JSON.stringify(presenceData)
    });

    if (res.ok) {
      showToast("✅ Presence marked successfully");
      closePresenceModal();
      loadTeamMembers();
    } else {
      showToast("❌ Failed to mark presence");
    }
  } catch (err) {
    console.error("Error marking presence:", err);
    showToast("⚠️ Server error");
  }
}

async function handleEditPresenceSubmit(e) {
  e.preventDefault();

  const memberName = document.getElementById("editPresenceMemberName").value.trim();
  const date = document.getElementById("editPresenceDate").value;
  const status = document.getElementById("editPresenceStatus").value;

  const presenceData = {
    member_name: memberName,
    date: date,
    status: status
  };

  try {
    const token = localStorage.getItem('authToken');
    const headers = {
      "Content-Type": "application/json"
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // First check if presence record exists
    const checkRes = await fetch(`${API_URL}/presence?member_name=${encodeURIComponent(memberName)}&date=${date}`);
    const existingRecords = await checkRes.json();

    let method = "POST";
    if (existingRecords.length > 0) {
      method = "PUT";
    }

    const res = await fetch(`${API_URL}/presence`, {
      method: method,
      headers,
      body: JSON.stringify(presenceData)
    });

    if (res.ok) {
      showToast("✅ Presence updated successfully");
      closeEditPresenceModal();
      loadTeamMembers();
    } else {
      showToast("❌ Failed to update presence");
    }
  } catch (err) {
    console.error("Error updating presence:", err);
    showToast("⚠️ Server error");
  }
}

async function viewMemberDetails(memberName) {
  try {
    // Fetch member details from teams API
    const membersRes = await fetch(`${API_URL}/teams`);
    const members = await membersRes.json();
    const member = members.find(m => m.name === memberName);

    if (!member) {
      showToast("❌ Member not found");
      return;
    }

    // Fetch leave history
    const leavesRes = await fetch(`${API_URL}/leaves?member_name=${encodeURIComponent(memberName)}`);
    const leaves = await leavesRes.json();

    // Fetch presence history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const presenceRes = await fetch(`${API_URL}/presence?member_name=${encodeURIComponent(memberName)}&start_date=${thirtyDaysAgo.toISOString().split('T')[0]}`);
    const presenceData = await presenceRes.json();

    // Update modal content
    document.getElementById("memberDetailsTitle").textContent = `${memberName}'s Details`;
    document.getElementById("memberName").textContent = member.name;
    document.getElementById("memberEmail").textContent = `Email: ${member.email}`;
    document.getElementById("memberTeam").textContent = `Team: ${member.team}`;

    // Update stats
    const totalLeaves = leaves.length;
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
    const approvedLeaves = leaves.filter(l => l.status === 'approved').length;

    document.getElementById("totalLeaves").textContent = totalLeaves;
    document.getElementById("pendingLeaves").textContent = pendingLeaves;
    document.getElementById("approvedLeaves").textContent = approvedLeaves;

    // Populate leave history
    const leaveHistoryEl = document.getElementById("leaveHistory");
    leaveHistoryEl.innerHTML = "";
    if (leaves.length === 0) {
      leaveHistoryEl.innerHTML = "<p>No leave history found.</p>";
    } else {
      leaves.forEach(leave => {
        const leaveItem = document.createElement("div");
        leaveItem.className = "history-item";
        leaveItem.innerHTML = `
          <div class="history-date">${new Date(leave.start_date).toLocaleDateString()} - ${new Date(leave.end_date).toLocaleDateString()}</div>
          <div class="history-reason">${leave.reason}</div>
          <div class="history-status status-${leave.status}">${leave.status.toUpperCase()}</div>
        `;
        leaveHistoryEl.appendChild(leaveItem);
      });
    }

    // Populate presence history
    const presenceHistoryEl = document.getElementById("presenceHistory");
    presenceHistoryEl.innerHTML = "";
    if (presenceData.length === 0) {
      presenceHistoryEl.innerHTML = "<p>No presence history found.</p>";
    } else {
      presenceData.forEach(presence => {
        const presenceItem = document.createElement("div");
        presenceItem.className = "history-item";
        presenceItem.innerHTML = `
          <div class="history-date">${new Date(presence.date).toLocaleDateString()}</div>
          <div class="history-status status-${presence.status}">${presence.status.toUpperCase()}</div>
        `;
        presenceHistoryEl.appendChild(presenceItem);
      });
    }

    // Show modal
    document.getElementById("memberDetailsModal").style.display = "flex";
  } catch (err) {
    console.error("Error loading member details:", err);
    showToast("❌ Error loading member details");
  }
}

function closeMemberDetailsModal() {
  document.getElementById("memberDetailsModal").style.display = "none";
}

function editMember(memberName) {
  // Open edit presence modal for the member
  openEditPresenceModal(memberName);
}

function openEditPresenceModal(memberName) {
  // Set today's date
  const today = new Date().toISOString().split("T")[0];

  // Populate the modal with member info
  document.getElementById("editPresenceMemberName").value = memberName;
  document.getElementById("editPresenceDate").value = today;

  // Fetch current presence status for today
  fetch(`${API_URL}/presence?member_name=${encodeURIComponent(memberName)}&date=${today}`)
    .then(res => res.json())
    .then(presenceData => {
      if (presenceData.length > 0) {
        const currentStatus = presenceData[0].status;
        const statusDisplay = document.getElementById("currentPresenceStatus");
        statusDisplay.textContent = currentStatus.toUpperCase();
        statusDisplay.className = `status-display status-${currentStatus}`;

        // Set the dropdown to current status
        document.getElementById("editPresenceStatus").value = currentStatus;
      } else {
        const statusDisplay = document.getElementById("currentPresenceStatus");
        statusDisplay.textContent = "NOT MARKED";
        statusDisplay.className = "status-display status-not-marked";

        // Default to present if not marked
        document.getElementById("editPresenceStatus").value = "present";
      }
    })
    .catch(err => {
      console.error("Error fetching current presence:", err);
      showToast("❌ Error loading current presence status");
    });

  // Show the modal
  document.getElementById("editPresenceModal").style.display = "flex";
}

function closeEditPresenceModal() {
  document.getElementById("editPresenceModal").style.display = "none";
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.className = "toast";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("leaveForm").addEventListener("submit", handleLeaveSubmit);
  document.getElementById("presenceForm").addEventListener("submit", handlePresenceSubmit);
  document.getElementById("editPresenceForm").addEventListener("submit", handleEditPresenceSubmit);
  loadTeamMembers();
});
