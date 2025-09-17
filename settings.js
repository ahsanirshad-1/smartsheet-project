document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("themeSelect");

  // Apply saved theme on load
  const savedTheme = localStorage.getItem("theme") || "dark";
  applyTheme(savedTheme);
  themeSelect.value = savedTheme;

  themeSelect.addEventListener("change", (e) => {
    const selectedTheme = e.target.value;
    applyTheme(selectedTheme);
    localStorage.setItem("theme", selectedTheme);
  });

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    } else {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    }
  }
});
