// auth.js - Authentication utilities with JWT, Hashing, AES

// Simulated secret key for JWT (in real app, this should be on server)
const JWT_SECRET = 'task-manager-secret-key';

// AES key for encrypting sensitive data
const AES_KEY = 'task-manager-aes-key';

// Function to hash password using SHA256
function hashPassword(password) {
  return CryptoJS.SHA256(password).toString();
}

// Function to encrypt data using AES
function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), AES_KEY).toString();
}

// Function to decrypt data using AES
function decryptData(encryptedData) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, AES_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Function to generate JWT-like token (simulated)
function generateToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET).toString();
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Function to verify token (simulated)
function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const signature = CryptoJS.HmacSHA256(`${parts[0]}.${parts[1]}`, JWT_SECRET).toString();
  if (signature !== parts[2]) return null;
  return JSON.parse(atob(parts[1]));
}

// Function to get stored users (simulated database)
function getUsers() {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

// Function to save users
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

// Function to login
async function login(username, password) {
  try {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const res = await fetch('http://localhost:8000/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('authToken', data.access_token);
      return { success: true, token: data.access_token };
    } else {
      const error = await res.json();
      return { success: false, message: error.detail || 'Login failed' };
    }
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, message: 'Network error' };
  }
}

// Helper function to extract string message from error detail
function extractErrorMessage(detail) {
  if (!detail) return 'Registration failed';
  if (typeof detail === 'string') return detail;
  if (typeof detail === 'object') {
    // If object, try to extract messages from keys
    if (Array.isArray(detail)) {
      return detail.map(d => extractErrorMessage(d)).join(', ');
    } else {
      return Object.values(detail).map(v => extractErrorMessage(v)).join(', ');
    }
  }
  return 'Registration failed';
}

// Function to signup
async function signup(username, email, password) {
  try {
    const res = await fetch('http://localhost:8000/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (res.ok) {
      const data = await res.json();
      // After registration, automatically login to get token
      const loginResult = await login(username, password);
      if (loginResult.success) {
        return { success: true, token: loginResult.token };
      } else {
        return { success: true, message: 'Account created but login failed' };
      }
    } else {
      const error = await res.json();
      return { success: false, message: extractErrorMessage(error.detail) };
    }
  } catch (err) {
    console.error('Signup error:', err);
    return { success: false, message: 'Network error' };
  }
}

// Function to logout
function logout() {
  localStorage.removeItem('authToken');
  window.location.href = 'login.html';
}

// Function to check if logged in
function isLoggedIn() {
  const token = localStorage.getItem('authToken');
  if (!token) return false;
  const payload = verifyToken(token);
  return payload && payload.exp > Date.now() / 1000; // Assuming exp in payload
}

// Function to get current user
function getCurrentUser() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  return verifyToken(token);
}

// Event listeners for forms
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      console.log('Attempting login with:', username);
      const result = await login(username, password);
      console.log('Login result:', result);
      const messageDiv = document.getElementById('message');
      if (result.success) {
        messageDiv.textContent = 'Login successful!';
        messageDiv.style.color = 'green';
        setTimeout(() => window.location.href = 'index.html', 1000);
      } else {
        messageDiv.textContent = result.message;
        messageDiv.style.color = 'red';
      }
    });
  }

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      if (password !== confirmPassword) {
        document.getElementById('message').textContent = 'Passwords do not match';
        document.getElementById('message').style.color = 'red';
        return;
      }
      const result = await signup(username, email, password);
      const messageDiv = document.getElementById('message');
      if (result.success) {
        messageDiv.textContent = 'Account created successfully!';
        messageDiv.style.color = 'green';
        setTimeout(() => window.location.href = 'index.html', 1000);
      } else {
        // Ensure message is string
        const errorMessage = typeof result.message === 'object' ? JSON.stringify(result.message) : result.message;
        messageDiv.textContent = errorMessage;
        messageDiv.style.color = 'red';
      }
    });
  }
});
