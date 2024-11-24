const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// 添加靜態文件服務
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci'
});


db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// Create a task
app.post('/tasks', (req, res) => {
    const { name, importance, urgency } = req.body;
    const query = 'INSERT INTO tasks (name, importance, urgency) VALUES (?, ?, ?)';
    db.query(query, [name, importance, urgency], (err, result) => {
        if (err) throw err;
        res.status(201).send(`Task added with ID: ${result.insertId}`);
    });
});

// Read all tasks
app.get('/tasks', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Update a task
app.put('/tasks/:id', (req, res) => {
    const id = req.params.id;
    const { name, importance, urgency } = req.body;

    let sql = 'UPDATE tasks SET importance = ?, urgency = ?';
    let values = [importance, urgency];

    // Only include name in the update if it's provided and not null
    if (name !== undefined && name !== null && name !== '') {
        sql += ', name = ?';
        values.push(name);
    }

    sql += ' WHERE id = ?';
    values.push(id);

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            res.status(500).json({ error: 'Error updating task' });
            return;
        }
        res.json({ message: 'Task updated successfully' });
    });
});

// Delete a task
app.delete('/tasks/:id', (req, res) => {
    db.query('DELETE FROM tasks WHERE id = ?', [req.params.id], (err, result) => {
        if (err) throw err;
        res.send(`Task deleted: ${result.affectedRows} row(s) affected`);
    });
});

// 添加一個路由來提供 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});