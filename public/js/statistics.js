document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  
  if (!token) {
      window.location.href = 'login.html';
      return;
  }
  
  // Initialize time period filter
  initializeTimeFilter();
  
  // Fetch user data and display statistics for the default period (week)
  fetchStatistics('week');
  
  // Load friends list
  loadFriends();
  
  // Set up event listeners for forms
  setupFormListeners();
});

// Initialize time period filter
function initializeTimeFilter() {
  const filterButtons = document.querySelectorAll('.btn-filter');
  
  filterButtons.forEach(button => {
      button.addEventListener('click', function() {
          // Remove active class from all buttons
          filterButtons.forEach(btn => btn.classList.remove('active'));
          
          // Add active class to clicked button
          this.classList.add('active');
          
          // Fetch statistics for the selected period
          const period = this.getAttribute('data-period');
          fetchStatistics(period);
      });
  });
}

// Fetch statistics for the specified time period
function fetchStatistics(period) {
  const token = localStorage.getItem('token');
  
  fetch(`/api/users/statistics?period=${period}`, {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Update summary statistics
          updateSummaryStats(data.statistics);
          
          // Update charts
          updateWeightChart(data.statistics.weightData, period);
          updateCalorieChart(data.statistics.calorieData, period);
          
          // Pre-fill goals form
          document.getElementById('new-calorie-goal').value = data.statistics.calorieGoal;
          document.getElementById('new-weight-goal').value = data.statistics.weightGoal || '';
      } else {
          console.error('Failed to fetch statistics');
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

// Update summary statistics
function updateSummaryStats(stats) {
  document.getElementById('starting-weight').textContent = stats.startingWeight;
  document.getElementById('current-weight').textContent = stats.currentWeight;
  
  const weightChange = parseFloat(stats.currentWeight) - parseFloat(stats.startingWeight);
  document.getElementById('weight-change').textContent = weightChange.toFixed(1);
  
  // Color code the weight change (red for gain, green for loss)
  const weightChangeElement = document.getElementById('weight-change');
  if (weightChange < 0) {
      weightChangeElement.style.color = '#27ae60'; // Green for weight loss
  } else if (weightChange > 0) {
      weightChangeElement.style.color = '#e74c3c'; // Red for weight gain
  } else {
      weightChangeElement.style.color = '#2c3e50'; // Default color for no change
  }
  
  document.getElementById('avg-calories').textContent = stats.averageCalories;
}

// Update weight chart
function updateWeightChart(weightData, period) {
  // Get context for the chart
  const ctx = document.getElementById('weight-history-chart').getContext('2d');
  
  // Destroy previous chart if it exists
  if (window.weightChart) {
      window.weightChart.destroy();
  }
  
  // Prepare data for chart
  const labels = weightData.dates;
  const data = weightData.values;
  
  // Create chart
  window.weightChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: labels,
          datasets: [{
              label: 'Weight (kg)',
              data: data,
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
}

// Update calorie chart
function updateCalorieChart(calorieData, period) {
  // Get context for the chart
  const ctx = document.getElementById('calorie-history-chart').getContext('2d');
  
  // Destroy previous chart if it exists
  if (window.calorieChart) {
      window.calorieChart.destroy();
  }
  
  // Prepare data for chart
  const labels = calorieData.dates;
  const data = calorieData.values;
  const goal = calorieData.goal;
  
  // Create goal line dataset
  const goalData = Array(labels.length).fill(goal);
  
  // Create chart
  window.calorieChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [
              {
                  label: 'Calories',
                  data: data,
                  backgroundColor: 'rgba(231, 76, 60, 0.6)',
                  borderColor: 'rgba(231, 76, 60, 1)',
                  borderWidth: 1
              },
              {
                  label: 'Goal',
                  data: goalData,
                  type: 'line',
                  backgroundColor: 'rgba(46, 204, 113, 0.2)',
                  borderColor: 'rgba(46, 204, 113, 1)',
                  borderWidth: 2,
                  tension: 0,
                  pointRadius: 0
              }
          ]
      },
      options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
}

// Load friends list
function loadFriends() {
  const token = localStorage.getItem('token');
  
  fetch('/api/users/friends', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          const friendsList = document.getElementById('friends-list');
          friendsList.innerHTML = '';
          
          if (data.friends && data.friends.length > 0) {
              data.friends.forEach(friend => {
                  const friendItem = document.createElement('div');
                  friendItem.className = 'friend-item';
                  
                  const friendInfo = document.createElement('div');
                  friendInfo.className = 'friend-info';
                  
                  const friendAvatar = document.createElement('div');
                  friendAvatar.className = 'friend-avatar';
                  friendAvatar.textContent = friend.name.charAt(0).toUpperCase();
                  
                  const friendDetails = document.createElement('div');
                  
                  const friendName = document.createElement('div');
                  friendName.className = 'friend-name';
                  friendName.textContent = friend.name;
                  
                  const friendStatus = document.createElement('div');
                  friendStatus.className = 'friend-status';
                  
                  if (friend.status === 'pending') {
                      friendStatus.textContent = 'Request Pending';
                  } else if (friend.status === 'received') {
                      friendStatus.textContent = 'Request Received';
                  } else {
                      friendStatus.textContent = `Current Weight: ${friend.currentWeight} kg`;
                  }
                  
                  friendDetails.appendChild(friendName);
                  friendDetails.appendChild(friendStatus);
                  
                  friendInfo.appendChild(friendAvatar);
                  friendInfo.appendChild(friendDetails);
                  
                  const friendActions = document.createElement('div');
                  friendActions.className = 'friend-actions';
                  
                  if (friend.status === 'received') {
                      const acceptButton = document.createElement('button');
                      acceptButton.className = 'btn-small';
                      acceptButton.textContent = 'Accept';
                      acceptButton.onclick = function() {
                          acceptFriendRequest(friend.id);
                      };
                      
                      const rejectButton = document.createElement('button');
                      rejectButton.className = 'btn-small';
                      rejectButton.textContent = 'Reject';
                      rejectButton.onclick = function() {
                          rejectFriendRequest(friend.id);
                      };
                      
                      friendActions.appendChild(acceptButton);
                      friendActions.appendChild(rejectButton);
                  } else if (friend.status === 'accepted') {
                      const viewButton = document.createElement('button');
                      viewButton.className = 'btn-small';
                      viewButton.textContent = 'View Stats';
                      viewButton.onclick = function() {
                          viewFriendStats(friend.id);
                      };
                      
                      friendActions.appendChild(viewButton);
                  }
                  
                  friendItem.appendChild(friendInfo);
                  friendItem.appendChild(friendActions);
                  
                  friendsList.appendChild(friendItem);
              });
          } else {
              friendsList.innerHTML = '<p>No friends yet. Add friends using their email address.</p>';
          }
      } else {
          console.error('Failed to fetch friends');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      const friendsList = document.getElementById('friends-list');
      friendsList.innerHTML = '<p>Failed to load friends list.</p>';
  });
}

// Accept friend request
function acceptFriendRequest(friendId) {
  const token = localStorage.getItem('token');
  
  fetch(`/api/users/friends/${friendId}/accept`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Reload friends list
          loadFriends();
      } else {
          alert(data.message || 'Failed to accept friend request');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
  });
}

// Reject friend request
function rejectFriendRequest(friendId) {
  const token = localStorage.getItem('token');
  
  fetch(`/api/users/friends/${friendId}/reject`, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          // Reload friends list
          loadFriends();
      } else {
          alert(data.message || 'Failed to reject friend request');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
  });
}

// View friend stats
function viewFriendStats(friendId) {
  // This could open a modal or navigate to a friend's stats page
  alert('View friend stats feature coming soon!');
}

// Set up event listeners for forms
function setupFormListeners() {
  // Goals form
  const goalsForm = document.getElementById('goals-form');
  goalsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const calorieGoal = document.getElementById('new-calorie-goal').value;
      const weightGoal = document.getElementById('new-weight-goal').value;
      const token = localStorage.getItem('token');
      
      fetch('/api/users/goals', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              calorieGoal,
              weightGoal
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('Goals updated successfully!');
              
              // Refresh statistics with current time period
              const activePeriod = document.querySelector('.btn-filter.active').getAttribute('data-period');
              fetchStatistics(activePeriod);
          } else {
              alert(data.message || 'Failed to update goals');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
  
  // Add friend form
  const addFriendForm = document.getElementById('add-friend-form');
  addFriendForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const friendEmail = document.getElementById('friend-email').value;
      const token = localStorage.getItem('token');
      
      fetch('/api/users/friends', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
              email: friendEmail
          })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              // Reset form
              addFriendForm.reset();
              
              alert('Friend request sent successfully!');
              
              // Reload friends list
              loadFriends();
          } else {
              alert(data.message || 'Failed to send friend request');
          }
      })
      .catch(error => {
          console.error('Error:', error);
          alert('An error occurred. Please try again.');
      });
  });
}