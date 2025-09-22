// forgot-password.js - Handle forgot password functionality

document.addEventListener('DOMContentLoaded', () => {
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      console.log('Forgot password request for:', email);

      try {
        const res = await fetch('http://localhost:8000/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        const messageDiv = document.getElementById('message');
        if (res.ok) {
          messageDiv.textContent = data.message;
          messageDiv.style.color = 'green';
        } else {
          messageDiv.textContent = data.detail || 'Failed to send reset email';
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        console.error('Forgot password error:', err);
        const messageDiv = document.getElementById('message');
        messageDiv.textContent = 'Network error';
        messageDiv.style.color = 'red';
      }
    });
  }
});
