const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('./auth');
const verifyToken = auth.verifyToken;

// Get all weight entries
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const weightResult = await db.query(
      'SELECT id, value, date FROM weights WHERE user_id = $1 ORDER BY date DESC',
      [userId]
    );
    
    res.json({
      success: true,
      weights: weightResult.rows
    });
    
  } catch (error) {
    console.error('Get weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get recent weight entries (last 30 days)
router.get('/recent', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const formattedDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const weightResult = await db.query(
      'SELECT id, value, date FROM weights WHERE user_id = $1 AND date >= $2 ORDER BY date',
      [userId, formattedDate]
    );
    
    res.json({
      success: true,
      weights: weightResult.rows
    });
    
  } catch (error) {
    console.error('Get recent weights error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get latest weight entry
router.get('/latest', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    
    const weightResult = await db.query(
      'SELECT id, value, date FROM weights WHERE user_id = $1 ORDER BY date DESC LIMIT 1',
      [userId]
    );
    
    if (weightResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No weight entries found'
      });
    }
    
    res.json({
      success: true,
      weight: weightResult.rows[0]
    });
    
  } catch (error) {
    console.error('Get latest weight error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get weight entry for a specific date
router.get('/date/:date', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const date = req.params.date;
    
    const weightResult = await db.query(
      'SELECT id, value, date FROM weights WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (weightResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No weight entry found for this date'
      });
    }
    
    res.json({
      success: true,
      weight: weightResult.rows[0]
    });
    
  } catch (error) {
    console.error('Get weight by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add or update weight entry
router.post('/', verifyToken, async (req, res) => {
  try {
    const { value, date } = req.body;
    const userId = req.userId;
    
    // Check if entry for this date already exists
    const existingResult = await db.query(
      'SELECT id FROM weights WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing entry
      await db.query(
        'UPDATE weights SET value = $1 WHERE id = $2',
        [value, existingResult.rows[0].id]
      );
      
      return res.json({
        success: true,
        message: 'Weight updated successfully'
      });
    }
    
    // Insert new entry
    await db.query(
      'INSERT INTO weights (user_id, value, date) VALUES ($1, $2, $3)',
      [userId, value, date]
    );
    
    // Also update user's current weight
    await db.query(
      'UPDATE users SET weight = $1 WHERE id = $2',
      [value, userId]
    );
    
    res.json({
      success: true,
      message: 'Weight added successfully'
    });
    
  } catch (error) {
    console.error('Add weight error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete weight entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const weightId = req.params.id;
    const userId = req.userId;
    
    // Verify ownership
    const weightResult = await db.query(
      'SELECT id FROM weights WHERE id = $1 AND user_id = $2',
      [weightId, userId]
    );
    
    if (weightResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Weight entry not found'
      });
    }
    
    // Delete entry
    await db.query(
      'DELETE FROM weights WHERE id = $1',
      [weightId]
    );
    
    res.json({
      success: true,
      message: 'Weight entry deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete weight error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;