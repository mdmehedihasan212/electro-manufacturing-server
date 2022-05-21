const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Electro Manufacturing!')
})

app.listen(port, () => {
    console.log(`Example Electro Manufacturing listening on port ${port}`)
})