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
  
  // Load frequently used foods
  loadFrequentFoods();
  
  // Set up event listeners for forms
  setupFormListeners();
});

// Fetch user data from the backend
function fetchUserData() {
  const token = localStorage.getItem('token');
  
  // Fetch user profile to get calorie goal
  fetch('/api/users/profile', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Set calorie goal
          document.getElementById('calorie-goal').textContent = data.user.calorieGoal;
          
          // Fetch today's weight and calories
          fetchTodayEntries();
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

// Fetch today's weight and calorie entries
function fetchTodayEntries() {
  const token = localStorage.getItem('token');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Fetch today's weight
  fetch(`/api/weights/date/${today}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.weight) {
          document.getElementById('today-weight').textContent = `${data.weight.value} kg`;
          
          // Pre-fill the weight input field
          document.getElementById('weight-input').value = data.weight.value;
      } else {
          document.getElementById('today-weight').textContent = 'Not entered';
      }
  })
  .catch(error => {
      console.error('Error fetching weight:', error);
      document.getElementById('today-weight').textContent = 'Not entered';
  });
  
  // Fetch today's calories
  fetch(`/api/calories/date/${today}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.calories) {
          document.getElementById('today-calories').textContent = data.calories.value;
          
          // Pre-fill the calories input field
          document.getElementById('calories-input').value = data.calories.value;
          
          // Update progress bar
          updateCalorieProgress(data.calories.value);
      } else {
          document.getElementById('today-calories').textContent = '0';
          updateCalorieProgress(0);
      }
  })
  .catch(error => {
      console.error('Error fetching calories:', error);
      document.getElementById('today-calories').textContent = '0';
      updateCalorieProgress(0);
  });
}

// Update calorie progress bar
function updateCalorieProgress(calories) {
  const calorieGoal = parseInt(document.getElementById('calorie-goal').textContent, 10);
  const progressBar = document.getElementById('calorie-progress-bar');
  
  // Calculate percentage (max 100%)
  let percentage = Math.min((calories / calorieGoal) * 100, 100);
  
  // Update progress bar width
  progressBar.style.width = `${percentage}%`;
  
  // Change color based on percentage
  if (percentage < 50) {
      progressBar.style.backgroundColor = '#27ae60'; // Green
  } else if (percentage < 75) {
      progressBar.style.backgroundColor = '#f39c12'; // Orange
  } else {
      progressBar.style.backgroundColor = '#e74c3c'; // Red
  }
}

// Load frequently used foods
function loadFrequentFoods() {
  const token = localStorage.getItem('token');
  
  fetch('/api/users/foods', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success && data.foods && data.foods.length > 0) {
          const foodList = document.getElementById('food-list');
          foodList.innerHTML = '';
          
          data.foods.forEach(food => {
              const foodItem = document.createElement('div');
              foodItem.className = 'food-item';
              
              const foodInfo = document.createElement('div');
              
              const foodName = document.createElement('div');
              foodName.className = 'food-name';
              foodName.textContent = food.name;
              
              const foodCalories = document.createElement('div');
              foodCalories.className = 'food-calories';
              foodCalories.textContent = `${food.calories} cal`;
              
              foodInfo.appendChild(foodName);
              foodInfo.appendChild(foodCalories);
              
              const addButton = document.createElement('button');
              addButton.className = 'add-food-button';
              addButton.textContent = '+';
              addButton.setAttribute('data-calories', food.calories);
              addButton.onclick = function() {
                  addFoodCalories(food.calories);
              };
              
              foodItem.appendChild(foodInfo);
              foodItem.appendChild(addButton);
              
              foodList.appendChild(foodItem);
          });
      } else {
          const foodList = document.getElementById('food-list');
          foodList.innerHTML = '<p>No frequent foods added yet. Add some below!</p>';
      }
  })
  .catch(error => {
      console.error('Error:', error);
      const foodList = document.getElementById('food-list');
      foodList.innerHTML = '<p>Failed to load frequent foods.</p>';
  });
}

// Add food calories to daily total
function addFoodCalories(calories) {
  const token = localStorage.getItem('token');
  const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // First check if there are already calories for today
  fetch(`/api/calories/date/${today}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      let currentCalories = 0;
      let method = 'POST';
      
      if (data.success && data.calories) {
          currentCalories = parseInt(data.calories.value, 10);
          method = 'PUT'; // Update existing entry
      }
      
      const newCalories = currentCalories + parseInt(calories, 10);
      
      // Now save the new calories value
      fetch('/api/calories', {
          method: method,
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              value: newCalories,
              date: today
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Update display
              document.getElementById('today-calories').textContent = newCalories;
              document.getElementById('calories-input').value = newCalories;
              updateCalorieProgress(newCalories);
          } else {
              alert(data.message || 'Failed to update calories');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  })
  .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
  });
}

// Set up event listeners for forms
function setupFormListeners() {
  // Weight form
  const weightForm = document.getElementById('daily-weight-form');
  weightForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const weightValue = document.getElementById('weight-input').value;
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      fetch('/api/weights', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              value: weightValue,
              date: today
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Update display
              document.getElementById('today-weight').textContent = `${weightValue} kg`;
              alert('Weight saved successfully!');
          } else {
              alert(data.message || 'Failed to save weight');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
  
  // Calories form
  const caloriesForm = document.getElementById('daily-calories-form');
  caloriesForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const caloriesValue = document.getElementById('calories-input').value;
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      fetch('/api/calories', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              value: caloriesValue,
              date: today
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Update display
              document.getElementById('today-calories').textContent = caloriesValue;
              updateCalorieProgress(caloriesValue);
              alert('Calories saved successfully!');
          } else {
              alert(data.message || 'Failed to save calories');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
  
  // Add new food form
  const addFoodForm = document.getElementById('add-food-form');
  addFoodForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const foodName = document.getElementById('food-name').value;
      const foodCalories = document.getElementById('food-calories').value;
      const token = localStorage.getItem('token');
      
      fetch('/api/users/foods', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              name: foodName,
              calories: foodCalories
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Reset form
              addFoodForm.reset();
              
              // Reload food list
              loadFrequentFoods();
              
              alert('Food added successfully!');
          } else {
              alert(data.message || 'Failed to add food');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
}