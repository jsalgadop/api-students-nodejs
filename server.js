const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 8001;

// Middleware para parsear datos de formularios y JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a la base de datos SQLite existente
function dbConnection() {
    return new sqlite3.Database('students.sqlite', (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message);
        }
        console.log('Conectado a la base de datos SQLite');
    });
}

const db = dbConnection();

// Ruta para manejar todos los estudiantes (GET y POST)
app.route('/students')
    .get((req, res) => {
        db.all('SELECT * FROM students', [], (err, rows) => {
            if (err) {
                return res.status(500).send('Error al consultar estudiantes');
            }
            res.json(rows);
        });
    })
    .post((req, res) => {
        const { firstname, lastname, gender, age } = req.body;
        if (!firstname || !lastname || !gender || !age) {
            return res.status(400).send('Faltan campos obligatorios');
        }
        db.run(
            `INSERT INTO students (firstname, lastname, gender, age) VALUES (?, ?, ?, ?)`,
            [firstname, lastname, gender, age],
            function(err) {
                if (err) {
                    return res.status(500).send('Error al crear estudiante');
                }
                res.send(`Student with id: ${this.lastID} created successfully`);
            }
        );
    });

// Ruta para manejar un estudiante específico (GET, PUT, DELETE)
app.route('/student/:id')
    .get((req, res) => {
        const id = req.params.id;
        db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
            if (err) {
                return res.status(500).send('Error al consultar estudiante');
            }
            if (row) {
                res.json(row);
            } else {
                res.status(404).send('Something went wrong');
            }
        });
    })
    .put((req, res) => {
        const id = req.params.id;
        const { firstname, lastname, gender, age } = req.body;
        if (!firstname || !lastname || !gender || !age) {
            return res.status(400).send('Faltan campos obligatorios');
        }
        db.run(
            `UPDATE students SET firstname = ?, lastname = ?, gender = ?, age = ? WHERE id = ?`,
            [firstname, lastname, gender, age, id],
            function(err) {
                if (err) {
                    return res.status(500).send('Error al actualizar estudiante');
                }
                if (this.changes === 0) {
                    return res.status(404).send('Estudiante no encontrado');
                }
                res.json({ id, firstname, lastname, gender, age });
            }
        );
    })
    .delete((req, res) => {
        const id = req.params.id;
        db.run(`DELETE FROM students WHERE id = ?`, [id], function(err) {
            if (err) {
                return res.status(500).send('Error al eliminar estudiante');
            }
            if (this.changes === 0) {
                return res.status(404).send('Estudiante no encontrado');
            }
            res.status(200).send(`The Student with id: ${id} has been deleted.`);
        });
    });

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});

// Cerrar la conexión a la base de datos al cerrar el servidor
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error al cerrar la conexión a la base de datos:', err.message);
        }
        console.log('Conexión a la base de datos cerrada.');
        process.exit(0);
    });
});