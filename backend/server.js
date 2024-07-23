// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3200;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Permite el acceso de tu frontend

// Rutas
app.get('/api/data', (req, res) => {
    res.json({ message: 'Hola como vas!'});
});

app.post('/api/data', (req, res) => {
    const data = req.body;
    res.json({ received: data });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
