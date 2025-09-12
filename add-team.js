document.getElementById("teamForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const member = {
    name: document.getElementById("memberName").value,
    email: document.getElementById("memberEmail").value,
    team: document.getElementById("memberTeam").value,
  };

  try {
    const res = await fetch("http://127.0.0.1:8000/team", {
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
