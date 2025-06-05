document.addEventListener('DOMContentLoaded', function() {
  // Check which page we're on
  const currentPath = window.location.pathname;
  
  // Login form handling
  if (currentPath.includes('login.html')) {
      const loginForm = document.getElementById('login-form');
      
      if (loginForm) {
          loginForm.addEventListener('submit', function(e) {
              e.preventDefault();
              
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              
              // Simple validation
              if (!email || !password) {
                  showError('Please fill in all fields');
                  return;
              }
              
              // Send login request to backend
              fetch('/api/auth/login', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ email, password })
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      // Store token in localStorage
                      localStorage.setItem('token', data.token);
                      localStorage.setItem('userId', data.userId);
                      
                      // Redirect to dashboard
                      window.location.href = 'dashboard.html';
                  } else {
                      showError(data.message || 'Login failed');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  showError('An error occurred. Please try again.');
              });
          });
      }
  }
  
  // Register form handling
  if (currentPath.includes('register.html')) {
      const registerForm = document.getElementById('register-form');
      
      if (registerForm) {
          registerForm.addEventListener('submit', function(e) {
              e.preventDefault();
              
              const name = document.getElementById('name').value;
              const email = document.getElementById('email').value;
              const password = document.getElementById('password').value;
              const confirmPassword = document.getElementById('confirm-password').value;
              
              // Simple validation
              if (!name || !email || !password || !confirmPassword) {
                  showError('Please fill in all fields');
                  return;
              }
              
              if (password !== confirmPassword) {
                  showError('Passwords do not match');
                  return;
              }
              
              // Send register request to backend
              fetch('/api/auth/register', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ name, email, password })
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      // Store token in localStorage
                      localStorage.setItem('token', data.token);
                      localStorage.setItem('userId', data.userId);
                      
                      // Redirect to profile setup
                      window.location.href = 'profile-setup.html';
                  } else {
                      showError(data.message || 'Registration failed');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  showError('An error occurred. Please try again.');
              });
          });
      }
  }
  
  // Profile setup form handling
  if (currentPath.includes('profile-setup.html')) {
      const profileForm = document.getElementById('profile-setup-form');
      
      if (profileForm) {
          profileForm.addEventListener('submit', function(e) {
              e.preventDefault();
              
              const age = document.getElementById('age').value;
              const dob = document.getElementById('dob').value;
              const weight = document.getElementById('weight').value;
              const height = document.getElementById('height').value;
              const calorieGoal = document.getElementById('calorie-goal').value;
              
              // Simple validation
              if (!age || !dob || !weight || !height || !calorieGoal) {
                  showError('Please fill in all fields');
                  return;
              }
              
              // Get token from localStorage
              const token = localStorage.getItem('token');
              
              if (!token) {
                  window.location.href = 'login.html';
                  return;
              }
              
              // Send profile data to backend
              fetch('/api/users/profile', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ 
                      age, 
                      dateOfBirth: dob, 
                      weight, 
                      height, 
                      calorieGoal 
                  })
              })
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      // Store initial weight in localStorage for weight tracking
                      localStorage.setItem('initialWeight', weight);
                      
                      // Redirect to dashboard
                      window.location.href = 'dashboard.html';
                  } else {
                      showError(data.message || 'Profile setup failed');
                  }
              })
              .catch(error => {
                  console.error('Error:', error);
                  showError('An error occurred. Please try again.');
              });
          });
      }
  }
  
  // Logout functionality
  const logoutBtn = document.getElementById('logout-btn');
  
  if (logoutBtn) {
      logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          
          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          
          // Redirect to login
          window.location.href = 'login.html';
      });
  }
});

// Helper function to show error message
function showError(message) {
  // Check if error container exists, if not create it
  let errorContainer = document.querySelector('.error-message');
  
  if (!errorContainer) {
      errorContainer = document.createElement('div');
      errorContainer.className = 'error-message';
      
      const formContainer = document.querySelector('.form-container');
      formContainer.insertBefore(errorContainer, formContainer.firstChild);
  }
  
  errorContainer.textContent = message;
  errorContainer.style.display = 'block';
  
  // Hide error after 3 seconds
  setTimeout(() => {
      errorContainer.style.display = 'none';
  }, 3000);
}