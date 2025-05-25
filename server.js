const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 8001;

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database connection
function dbConnection() {
  const db = new sqlite3.Database('students.sqlite', (err) => {
    if (err) {
      console.error('Database connection error:', err);
    }
  });
  return db;
}

// Route for handling /students
app.route('/students')
  .get((req, res) => {
    const db = dbConnection();
    db.all('SELECT * FROM students', [], (err, rows) => {
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }
      const students = rows.map(row => ({
        id: row.id,
        firstname: row.firstname,
        lastname: row.lastname,
        gender: row.gender,
        age: row.age
      }));
      res.json(students);
    });
    db.close();
  })
  .post((req, res) => {
    const { firstname, lastname, gender, age } = req.body;
    const db = dbConnection();
    const sql = `INSERT INTO students (firstname, lastname, gender, age) VALUES (?, ?, ?, ?)`;
    db.run(sql, [firstname, lastname, gender, age], function(err) {
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }
      res.send(`Student with id: ${this.lastID} created successfully`);
    });
    db.close();
  });

// Route for handling /student/:id
app.route('/student/:id')
  .get((req, res) => {
    const { id } = req.params;
    const db = dbConnection();
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }
      if (row) {
        res.json(row);
      } else {
        res.status(404).send('Something went wrong');
      }
    });
    db.close();
  })
  .put((req, res) => {
    const { id } = req.params;
    const { firstname, lastname, gender, age } = req.body;
    const db = dbConnection();
    const sql = `UPDATE students SET firstname = ?, lastname = ?, gender = ?, age = ? WHERE id = ?`;
    db.run(sql, [firstname, lastname, gender, age, id], function(err) {
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }
      if (this.changes === 0) {
        res.status(404).send('Student not found');
        return;
      }
      res.json({ id, firstname, lastname, gender, age });
    });
    db.close();
  })
  .delete((req, res) => {
    const { id } = req.params;
    const db = dbConnection();
    const sql = `DELETE FROM students WHERE id = ?`;
    db.run(sql, [id], function(err) {
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }
      if (this.changes === 0) {
        res.status(404).send('Student not found');
        return;
      }
      res.send(`The Student with id: ${id} has been deleted.`);
    });
    db.close();
  });

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});