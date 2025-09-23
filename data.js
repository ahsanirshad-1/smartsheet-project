// Dummy isLoggedIn function to prevent error, replace with real auth check
function isLoggedIn() {
  // Example: check if authToken exists in localStorage
  return !!localStorage.getItem("authToken");
}
// Check authentication on page load
// Temporarily disabled for testing
// if (!isLoggedIn()) {
//   window.location.href = "login.html";
// }

// Panel toggling
document.getElementById('notifications-link').addEventListener('click', function(e) {
  e.preventDefault();
  togglePanel('notifications-panel');
});

document.getElementById('settings-link').addEventListener('click', function(e) {
  e.preventDefault();
  togglePanel('settings-panel');
});

function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  const isVisible = panel.style.display === 'block';
  document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
  if (!isVisible) {
    panel.style.display = 'block';
  }
}

// Settings
document.getElementById('save-settings').addEventListener('click', function() {
  const theme = document.getElementById('theme-select').value;
  const notifications = document.getElementById('notifications-toggle').checked;
  const autoSave = document.getElementById('auto-save-toggle').checked;

  // Save settings (for demo, just log)
  console.log('Settings saved:', { theme, notifications, autoSave });
  alert('Settings saved!');
});
