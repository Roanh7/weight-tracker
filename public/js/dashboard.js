document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  
  if (!token) {
      window.location.href = 'login.html';
      return;
  }
  
  // Set current date
  const currentDateElement = document.getElementById('current-date');
  const today = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  currentDateElement.textContent = today.toLocaleDateString(undefined, options);
  
  // Fetch user data
  fetchUserData();
  
  // Initialize weight and calorie modals
  initializeModals();
  
  // Generate calendar for current month
  generateCalendar(today.getFullYear(), today.getMonth());
  
  // Set up month navigation
  document.getElementById('prev-month').addEventListener('click', function() {
      const currentMonthText = document.getElementById('current-month').textContent;
      const [month, year] = currentMonthText.split(' ');
      const date = new Date(`${month} 1, ${year}`);
      date.setMonth(date.getMonth() - 1);
      generateCalendar(date.getFullYear(), date.getMonth());
  });
  
  document.getElementById('next-month').addEventListener('click', function() {
      const currentMonthText = document.getElementById('current-month').textContent;
      const [month, year] = currentMonthText.split(' ');
      const date = new Date(`${month} 1, ${year}`);
      date.setMonth(date.getMonth() + 1);
      generateCalendar(date.getFullYear(), date.getMonth());
  });
});

// Fetch user data from the backend
function fetchUserData() {
  const token = localStorage.getItem('token');
  
  // Fetch user profile
  fetch('/api/users/profile', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Set user name
          document.getElementById('user-name').textContent = data.user.name;
          
          // Set calorie goal
          document.getElementById('calorie-goal').textContent = data.user.calorieGoal;
          
          // Fetch today's weight data
          fetchTodayWeight();
          
          // Fetch today's calorie data
          fetchTodayCalories();
          
          // Initialize weight chart
          initializeWeightChart();
      } else {
          console.error('Failed to fetch user data');
          // If error is due to authentication, redirect to login
          if (data.message === 'Unauthorized') {
              localStorage.removeItem('token');
              window.location.href = 'login.html';
          }
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

// Fetch today's weight data
function fetchTodayWeight() {
  const token = localStorage.getItem('token');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  fetch(`/api/weights/date/${today}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.weight) {
          document.getElementById('current-weight').textContent = data.weight.value;
      } else {
          // If no weight entry for today, show last recorded weight
          fetchLastWeight();
      }
  })
  .catch(error => {
      console.error('Error:', error);
      // If error, try to get last weight
      fetchLastWeight();
  });
}

// Fetch the last recorded weight
function fetchLastWeight() {
  const token = localStorage.getItem('token');
  
  fetch('/api/weights/latest', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.weight) {
          document.getElementById('current-weight').textContent = data.weight.value;
      } else {
          // If no weights at all, show initial weight from registration
          const initialWeight = localStorage.getItem('initialWeight');
          if (initialWeight) {
              document.getElementById('current-weight').textContent = initialWeight;
          } else {
              document.getElementById('current-weight').textContent = "Not set";
          }
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

// Fetch today's calorie data
function fetchTodayCalories() {
  const token = localStorage.getItem('token');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  fetch(`/api/calories/date/${today}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.calories) {
          document.getElementById('current-calories').textContent = data.calories.value;
      } else {
          document.getElementById('current-calories').textContent = "0";
      }
  })
  .catch(error => {
      console.error('Error:', error);
      document.getElementById('current-calories').textContent = "0";
  });
}

// Initialize the weight chart
function initializeWeightChart() {
  const token = localStorage.getItem('token');
  
  fetch('/api/weights/recent', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.weights) {
          const ctx = document.getElementById('weight-chart').getContext('2d');
          
          // Prepare data for chart
          const labels = data.weights.map(w => new Date(w.date).toLocaleDateString());
          const values = data.weights.map(w => w.value);
          
          new Chart(ctx, {
              type: 'line',
              data: {
                  labels: labels,
                  datasets: [{
                      label: 'Weight (kg)',
                      data: values,
                      backgroundColor: 'rgba(52, 152, 219, 0.2)',
                      borderColor: 'rgba(52, 152, 219, 1)',
                      borderWidth: 2,
                      tension: 0.4
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                      y: {
                          beginAtZero: false
                      }
                  }
              }
          });
      } else {
          // If no weight data, show empty chart
          const ctx = document.getElementById('weight-chart').getContext('2d');
          
          new Chart(ctx, {
              type: 'line',
              data: {
                  labels: [],
                  datasets: [{
                      label: 'Weight (kg)',
                      data: [],
                      backgroundColor: 'rgba(52, 152, 219, 0.2)',
                      borderColor: 'rgba(52, 152, 219, 1)',
                      borderWidth: 2
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                      y: {
                          beginAtZero: false
                      }
                  }
              }
          });
      }
  })
  .catch(error => {
      console.error('Error:', error);
  });
}

// Initialize weight and calorie modals
function initializeModals() {
  const weightModal = document.getElementById('weight-modal');
  const caloriesModal = document.getElementById('calories-modal');
  const logWeightBtn = document.getElementById('log-weight-btn');
  const logCaloriesBtn = document.getElementById('log-calories-btn');
  const closeBtns = document.querySelectorAll('.close');
  
  // Open weight modal
  logWeightBtn.addEventListener('click', function() {
      weightModal.style.display = 'block';
  });
  
  // Open calories modal
  logCaloriesBtn.addEventListener('click', function() {
      caloriesModal.style.display = 'block';
  });
  
  // Close modals
  closeBtns.forEach(btn => {
      btn.addEventListener('click', function() {
          weightModal.style.display = 'none';
          caloriesModal.style.display = 'none';
      });
  });
  
  // Close modals when clicked outside
  window.addEventListener('click', function(event) {
      if (event.target === weightModal) {
          weightModal.style.display = 'none';
      }
      if (event.target === caloriesModal) {
          caloriesModal.style.display = 'none';
      }
  });
  
  // Weight form submission
  const weightForm = document.getElementById('weight-form');
  weightForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const weightValue = document.getElementById('weight-input').value;
      const token = localStorage.getItem('token');
      
      fetch('/api/weights', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
              value: weightValue,
              date: new Date().toISOString().split('T')[0] // Today's date
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Update weight display
              document.getElementById('current-weight').textContent = weightValue;
              
              // Close modal
              weightModal.style.display = 'none';
              
              // Reset form
              weightForm.reset();
              
              // Refresh weight chart
              initializeWeightChart();
              
              // Refresh calendar
              const today = new Date();
              generateCalendar(today.getFullYear(), today.getMonth());
          } else {
              alert(data.message || 'Failed to log weight');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
  
  // Calories form submission
  const caloriesForm = document.getElementById('calories-form');
  caloriesForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const caloriesValue = document.getElementById('calories-input').value;
      const token = localStorage.getItem('token');
      
      fetch('/api/calories', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
              value: caloriesValue,
              date: new Date().toISOString().split('T')[0] // Today's date
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Update calories display
              document.getElementById('current-calories').textContent = caloriesValue;
              
              // Close modal
              caloriesModal.style.display = 'none';
              
              // Reset form
              caloriesForm.reset();
              
              // Refresh calendar
              const today = new Date();
              generateCalendar(today.getFullYear(), today.getMonth());
          } else {
              alert(data.message || 'Failed to log calories');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
}

// Generate calendar for a given month
function generateCalendar(year, month) {
  const token = localStorage.getItem('token');
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Update month display
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  document.getElementById('current-month').textContent = `${monthNames[month]} ${year}`;
  
  // Create calendar header (Sun, Mon, etc.)
  const calendarContainer = document.getElementById('calendar-container');
  calendarContainer.innerHTML = '';
  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const calendarHeader = document.createElement('div');
  calendarHeader.className = 'calendar-header';
  
  daysOfWeek.forEach(day => {
      const dayElement = document.createElement('div');
      dayElement.textContent = day;
      calendarHeader.appendChild(dayElement);
  });
  
  calendarContainer.appendChild(calendarHeader);
  
  // Create calendar days
  const calendarGrid = document.createElement('div');
  calendarGrid.className = 'calendar';
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty-day';
      calendarGrid.appendChild(emptyDay);
  }
  
  // Fetch weight and calorie data for the month
  fetch(`/api/users/monthly-data?year=${year}&month=${month + 1}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          const weightData = data.weights || {};
          const calorieData = data.calories || {};
          
          // Add days of the month
          for (let day = 1; day <= daysInMonth; day++) {
              const dayElement = document.createElement('div');
              dayElement.className = 'calendar-day';
              
              // Check if this is today
              const currentDate = new Date();
              if (currentDate.getFullYear() === year && 
                  currentDate.getMonth() === month && 
                  currentDate.getDate() === day) {
                  dayElement.classList.add('current-day');
              }
              
              // Add day number
              const dayNumber = document.createElement('div');
              dayNumber.className = 'day-number';
              dayNumber.textContent = day;
              dayElement.appendChild(dayNumber);
              
              // Format date to match API data format (YYYY-MM-DD)
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              // Add weight data if available
              if (weightData[dateStr]) {
                  const weightInfo = document.createElement('div');
                  weightInfo.className = 'day-weight';
                  weightInfo.textContent = `${weightData[dateStr]} kg`;
                  dayElement.appendChild(weightInfo);
              }
              
              // Add calorie data if available
              if (calorieData[dateStr]) {
                  const calorieInfo = document.createElement('div');
                  calorieInfo.className = 'day-calories';
                  calorieInfo.textContent = `${calorieData[dateStr]} cal`;
                  dayElement.appendChild(calorieInfo);
              }
              
              calendarGrid.appendChild(dayElement);
          }
          
          calendarContainer.appendChild(calendarGrid);
      } else {
          console.error('Failed to fetch monthly data');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      
      // Even if there's an error, still display the calendar days
      for (let day = 1; day <= daysInMonth; day++) {
          const dayElement = document.createElement('div');
          dayElement.className = 'calendar-day';
          
          // Check if this is today
          const currentDate = new Date();
          if (currentDate.getFullYear() === year && 
              currentDate.getMonth() === month && 
              currentDate.getDate() === day) {
              dayElement.classList.add('current-day');
          }
          
          // Add day number
          const dayNumber = document.createElement('div');
          dayNumber.className = 'day-number';
          dayNumber.textContent = day;
          dayElement.appendChild(dayNumber);
          
          calendarGrid.appendChild(dayElement);
      }
      
      calendarContainer.appendChild(calendarGrid);
  });
}