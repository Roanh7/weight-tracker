const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('./auth');
const verifyToken = auth.verifyToken;

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const userResult = await db.query(
      'SELECT id, name, email, age, date_of_birth, weight, height, calorie_goal, weight_goal FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Format user data
    const user = {
      id: userResult.rows[0].id,
      name: userResult.rows[0].name,
      email: userResult.rows[0].email,
      age: userResult.rows[0].age,
      dateOfBirth: userResult.rows[0].date_of_birth,
      weight: userResult.rows[0].weight,
      height: userResult.rows[0].height,
      calorieGoal: userResult.rows[0].calorie_goal,
      weightGoal: userResult.rows[0].weight_goal
    };
    
    res.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user profile
router.post('/profile', verifyToken, async (req, res) => {
  try {
    const { age, dateOfBirth, weight, height, calorieGoal } = req.body;
    const userId = req.userId;
    
    // Update user profile
    await db.query(
      'UPDATE users SET age = $1, date_of_birth = $2, weight = $3, height = $4, calorie_goal = $5 WHERE id = $6',
      [age, dateOfBirth, weight, height, calorieGoal, userId]
    );
    
    // Insert initial weight record
    await db.query(
      'INSERT INTO weights (user_id, value, date) VALUES ($1, $2, CURRENT_DATE)',
      [userId, weight]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update user goals
router.post('/goals', verifyToken, async (req, res) => {
  try {
    const { calorieGoal, weightGoal } = req.body;
    const userId = req.userId;
    
    // Update user goals
    await db.query(
      'UPDATE users SET calorie_goal = $1, weight_goal = $2 WHERE id = $3',
      [calorieGoal, weightGoal, userId]
    );
    
    res.json({
      success: true,
      message: 'Goals updated successfully'
    });
    
  } catch (error) {
    console.error('Update goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get user statistics
router.get('/statistics', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const period = req.query.period || 'week';
    
    // Get date range based on period
    let dateFilter;
    const today = new Date();
    
    switch (period) {
      case 'week':
        // Last 7 days
        dateFilter = new Date(today);
        dateFilter.setDate(today.getDate() - 7);
        break;
      case 'month':
        // Last 30 days
        dateFilter = new Date(today);
        dateFilter.setDate(today.getDate() - 30);
        break;
      case '3months':
        // Last 90 days
        dateFilter = new Date(today);
        dateFilter.setDate(today.getDate() - 90);
        break;
      case 'year':
        // Last 365 days
        dateFilter = new Date(today);
        dateFilter.setDate(today.getDate() - 365);
        break;
      case 'all':
        // All time (no filter)
        dateFilter = new Date(0); // January 1, 1970
        break;
      default:
        dateFilter = new Date(today);
        dateFilter.setDate(today.getDate() - 7);
    }
    
    // Format date for PostgreSQL
    const formattedDate = dateFilter.toISOString().split('T')[0];
    
    // Get user profile for goals and starting weight
    const userResult = await db.query(
      'SELECT weight, calorie_goal, weight_goal FROM users WHERE id = $1',
      [userId]
    );
    
    // Get weight data
    const weightResult = await db.query(
      'SELECT value, date FROM weights WHERE user_id = $1 AND date >= $2 ORDER BY date',
      [userId, formattedDate]
    );
    
    // Get calorie data
    const calorieResult = await db.query(
      'SELECT value, date FROM calories WHERE user_id = $1 AND date >= $2 ORDER BY date',
      [userId, formattedDate]
    );
    
    // Get the latest weight
    const latestWeightResult = await db.query(
      'SELECT value FROM weights WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [userId]
    );
    
    // Calculate average calories
    let averageCalories = 0;
    if (calorieResult.rows.length > 0) {
      const totalCalories = calorieResult.rows.reduce((sum, row) => sum + parseFloat(row.value), 0);
      averageCalories = Math.round(totalCalories / calorieResult.rows.length);
    }
    
    // Format data for response
    const startingWeight = userResult.rows[0].weight;
    const currentWeight = latestWeightResult.rows.length > 0 
      ? latestWeightResult.rows[0].value 
      : startingWeight;
    
    const weightData = {
      dates: weightResult.rows.map(row => new Date(row.date).toLocaleDateString()),
      values: weightResult.rows.map(row => row.value)
    };
    
    const calorieData = {
      dates: calorieResult.rows.map(row => new Date(row.date).toLocaleDateString()),
      values: calorieResult.rows.map(row => row.value),
      goal: userResult.rows[0].calorie_goal
    };
    
    res.json({
      success: true,
      statistics: {
        startingWeight,
        currentWeight,
        weightGoal: userResult.rows[0].weight_goal,
        calorieGoal: userResult.rows[0].calorie_goal,
        averageCalories,
        weightData,
        calorieData
      }
    });
    
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get monthly data for calendar
router.get('/monthly-data', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || new Date().getMonth() + 1;
    
    // Format dates for PostgreSQL
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month
    
    // Get weight data for the month
    const weightResult = await db.query(
      'SELECT value, date FROM weights WHERE user_id = $1 AND date >= $2 AND date <= $3',
      [userId, startDate, endDate]
    );
    
    // Get calorie data for the month
    const calorieResult = await db.query(
      'SELECT value, date FROM calories WHERE user_id = $1 AND date >= $2 AND date <= $3',
      [userId, startDate, endDate]
    );
    
    // Format data for response
    const weights = {};
    weightResult.rows.forEach(row => {
      weights[row.date.toISOString().split('T')[0]] = row.value;
    });
    
    const calories = {};
    calorieResult.rows.forEach(row => {
      calories[row.date.toISOString().split('T')[0]] = row.value;
    });
    
    res.json({
      success: true,
      weights,
      calories
    });
    
  } catch (error) {
    console.error('Get monthly data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get frequent foods
router.get('/foods', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const foodsResult = await db.query(
      'SELECT id, name, calories FROM foods WHERE user_id = $1 ORDER BY name',
      [userId]
    );
    
    res.json({
      success: true,
      foods: foodsResult.rows
    });
    
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add frequent food
router.post('/foods', verifyToken, async (req, res) => {
  try {
    const { name, calories } = req.body;
    const userId = req.userId;
    
    // Insert new food
    await db.query(
      'INSERT INTO foods (user_id, name, calories) VALUES ($1, $2, $3)',
      [userId, name, calories]
    );
    
    res.json({
      success: true,
      message: 'Food added successfully'
    });
    
  } catch (error) {
    console.error('Add food error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get friends list
router.get('/friends', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get all friendship records (sent and received)
    const friendsResult = await db.query(
      `SELECT f.id, f.user_id, f.friend_id, f.status, u.name, u.weight as current_weight
       FROM friendships f
       JOIN users u ON (f.user_id = $1 AND u.id = f.friend_id) OR (f.friend_id = $1 AND u.id = f.user_id)
       WHERE f.user_id = $1 OR f.friend_id = $1`,
      [userId]
    );
    
    // Format data for response
    const friends = friendsResult.rows.map(row => {
      const isSender = row.user_id === userId;
      return {
        id: row.id,
        name: row.name,
        currentWeight: row.current_weight,
        // Adjust status based on if user is sender or receiver
        status: row.status === 'pending' 
          ? (isSender ? 'pending' : 'received') 
          : row.status
      };
    });
    
    res.json({
      success: true,
      friends
    });
    
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Send friend request
router.post('/friends', verifyToken, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.userId;
    
    // Find user by email
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const friendId = userResult.rows[0].id;
    
    // Can't add yourself as a friend
    if (friendId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as a friend'
      });
    }
    
    // Check if friendship already exists
    const existingResult = await db.query(
      'SELECT * FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [userId, friendId]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Friendship already exists or pending'
      });
    }
    
    // Create friendship request
    await db.query(
      'INSERT INTO friendships (user_id, friend_id, status) VALUES ($1, $2, $3)',
      [userId, friendId, 'pending']
    );
    
    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });
    
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Accept friend request
router.post('/friends/:id/accept', verifyToken, async (req, res) => {
  try {
    const friendshipId = req.params.id;
    const userId = req.userId;
    
    // Verify friendship exists and user is the recipient
    const friendshipResult = await db.query(
      'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [friendshipId, userId, 'pending']
    );
    
    if (friendshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }
    
    // Update friendship status
    await db.query(
      'UPDATE friendships SET status = $1 WHERE id = $2',
      ['accepted', friendshipId]
    );
    
    res.json({
      success: true,
      message: 'Friend request accepted'
    });
    
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reject friend request
router.post('/friends/:id/reject', verifyToken, async (req, res) => {
  try {
    const friendshipId = req.params.id;
    const userId = req.userId;
    
    // Verify friendship exists and user is the recipient
    const friendshipResult = await db.query(
      'SELECT * FROM friendships WHERE id = $1 AND friend_id = $2 AND status = $3',
      [friendshipId, userId, 'pending']
    );
    
    if (friendshipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }
    
    // Delete friendship record
    await db.query(
      'DELETE FROM friendships WHERE id = $1',
      [friendshipId]
    );
    
    res.json({
      success: true,
      message: 'Friend request rejected'
    });
    
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;