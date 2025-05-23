// Backend Data Modeling Exercise
//
// This code contains several data modeling issues to address.
// Look for problems related to:
// - Nested vs. flat data structures
// - Route organization
// - Data duplication
// - API consistency
//
// Your task is to refactor this code following proper data modeling principles
// from the Selego Style Guide. Consider the tradeoffs between different approaches.

// models/task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'done'],
    default: 'todo'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    user_id: String,
    name: String,
    email: String,
    avatar: String
  },
  comments: [{
    text: String,
    createdAt: { type: Date, default: Date.now },
    user_id: String,
    user_name: String,
    user_avatar: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;

// controllers/taskController.js
const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const User = require('../models/user');

// Create a new task
router.post('/', async (req, res) => {
  try {

    const { user_id } = req.body;
    
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }
    
    const task = new Task({
      ...req.body,
      createdBy: {
        user_id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
    
    await task.save();
    return res.status(201).json({ ok: true, data: task });
  } catch (error) {
    return res.status(500).json({ error: 'FAILED_TO_CREATE_TASK' });
  }
});

// Assign task to user
router.put('/:id', async (req, res) => {
  try {
    const { user_id } = req.body;
    
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'TASK_NOT_FOUND' });
    
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });
    
    task.assignedTo = {
      user_id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar
    };
    task.updatedAt = Date.now();
    
    await task.save();
    return res.status(200).json({ ok: true, data: task  });
  } catch (error) {
    capture(error);
    res.status(500).json({ error: 'FAILED_TO_ASSIGN_TASK' });
  }
});

// Add a comment to a task
// /comments est dans un query ducoup ?
router.put('/:id', async (req, res) => {
  try {
    const {user_id} = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).send({ ok: false, code: "TASK_NOT_FOUND" });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).send({ ok: false, code: "USER_NOT_FOUND" });
    }

    task.comments.push({
      text : req.body.text,
      user_id: user._id,
      user_name: user.name,
      user_avatar: user.avatar,
      createdAt: Date.now()
    });

    task.updatedAt = Date.now();

    await task.save();
    return res.status(201).send({ ok: true, data: task });
  } catch (error) {
    capture(error); 
    res.status(500).send({ ok: false, code: "FAILED_TO_ADD_COMMENT", error });
  }
});

module.exports = router;