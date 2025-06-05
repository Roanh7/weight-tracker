const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('./auth');
const verifyToken = auth.verifyToken;

// Get all calorie entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const calorieResult = await db.query(
      'SELECT id, value, date FROM calories WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    
    res.json({
      success: true,
      calories: calorieResult.rows
    });
    
  } catch (error) {
    console.error('Get calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get recent calorie entries (last 30 days)
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const calorieResult = await db.query(
      'SELECT id, value, date FROM calories WHERE user_id = $1 AND date >= $2 ORDER BY date',
      [userId, formattedDate]
    );
    
    res.json({
      success: true,
      calories: calorieResult.rows
    });
    
  } catch (error) {
    console.error('Get recent calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get calorie entry for a specific date
router.get('/date/:date', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const date = req.params.date;
    
    const calorieResult = await db.query(
      'SELECT id, value, date FROM calories WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (calorieResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No calorie entry found for this date'
      });
    }
    
    res.json({
      success: true,
      calories: calorieResult.rows[0]
    });
    
  } catch (error) {
    console.error('Get calories by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add calorie entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { value, date } = req.body;
    const userId = req.userId;
    
    // Check if entry for this date already exists
    const existingResult = await db.query(
      'SELECT id FROM calories WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing entry
      await db.query(
        'UPDATE calories SET value = $1 WHERE id = $2',
        [value, existingResult.rows[0].id]
      );
      
      return res.json({
        success: true,
        message: 'Calories updated successfully'
      });
    }
    
    // Insert new entry
    await db.query(
      'INSERT INTO calories (user_id, value, date) VALUES ($1, $2, $3)',
      [userId, value, date]
    );
    
    res.json({
      success: true,
      message: 'Calories added successfully'
    });
    
  } catch (error) {
    console.error('Add calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update calorie entry (explicitly)
router.put('/', verifyToken, async (req, res) => {
  try {
    const { value, date } = req.body;
    const userId = req.userId;
    
    // Check if entry exists
    const existingResult = await db.query(
      'SELECT id FROM calories WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (existingResult.rows.length === 0) {
      // Create new entry instead
      await db.query(
        'INSERT INTO calories (user_id, value, date) VALUES ($1, $2, $3)',
        [userId, value, date]
      );
      
      return res.json({
        success: true,
        message: 'Calories added successfully'
      });
    }
    
    // Update existing entry
    await db.query(
      'UPDATE calories SET value = $1 WHERE id = $2',
      [value, existingResult.rows[0].id]
    );
    
    res.json({
      success: true,
      message: 'Calories updated successfully'
    });
    
  } catch (error) {
    console.error('Update calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete calorie entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const calorieId = req.params.id;
    const userId = req.userId;
    
    // Verify ownership
    const calorieResult = await db.query(
      'SELECT id FROM calories WHERE id = $1 AND user_id = $2',
      [calorieId, userId]
    );
    
    if (calorieResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Calorie entry not found'
      });
    }
    
    // Delete entry
    await db.query(
      'DELETE FROM calories WHERE id = $1',
      [calorieId]
    );
    
    res.json({
      success: true,
      message: 'Calorie entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete calories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;