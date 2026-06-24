const express = require('express');
const app = express();
const cors = require('cors')
const path = require('path');

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve public files
app.use('/public', express.static(path.join(__dirname, 'public')))

// Basic pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'))
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'login.html'))
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'register.html'))
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'))
});

// API routes
const products = require('./routes/products')
const transactions = require('./routes/transactions')
const userRoutes = require('./routes/user')

app.use('/api/v1', products)
app.use('/api/v1', transactions)
app.use('/api/v1', userRoutes)

module.exports = app