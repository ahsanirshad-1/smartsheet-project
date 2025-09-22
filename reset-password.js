// reset-password.js - Handle reset password functionality

document.addEventListener('DOMContentLoaded', () => {
  // Handle show password toggles
  const showNewPassword = document.getElementById('showNewPassword');
  const showConfirmPassword = document.getElementById('showConfirmPassword');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  if (showNewPassword) {
    showNewPassword.addEventListener('change', () => {
      newPasswordInput.type = showNewPassword.checked ? 'text' : 'password';
    });
  }

  if (showConfirmPassword) {
    showConfirmPassword.addEventListener('change', () => {
      confirmPasswordInput.type = showConfirmPassword.checked ? 'text' : 'password';
    });
  }

  const resetPasswordForm = document.getElementById('resetPasswordForm');
  if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = newPasswordInput.value;
      const confirmPassword = confirmPasswordInput.value;
      const messageDiv = document.getElementById('message');

      if (newPassword !== confirmPassword) {
        messageDiv.textContent = 'Passwords do not match';
        messageDiv.style.color = 'red';
        return;
      }

      // Get token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (!token) {
        messageDiv.textContent = 'Invalid reset link';
        messageDiv.style.color = 'red';
        return;
      }

      try {
        const res = await fetch('http://localhost:8000/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, new_password: newPassword })
        });

        const data = await res.json();
        if (res.ok) {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'green';
          // Redirect to login after success
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          messageDiv.textContent = data.detail || 'Failed to reset password';
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        console.error('Reset password error:', err);
        messageDiv.textContent = 'Network error';
        messageDiv.style.color = 'red';
      }
    });
  }
});
