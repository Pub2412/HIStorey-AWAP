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
// Serve media (audio/images) folder
app.use('/media', express.static(path.join(__dirname, 'media')))

// Basic pages
// Landing page is the default for non-authenticated users
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'landing.html'))
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

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'users.html'))
})

// API routes
const products = require('./routes/products')
const transactions = require('./routes/transactions')
const userRoutes = require('./routes/user')

app.use('/api/v1', products)
app.use('/api/v1', transactions)
app.use('/api/v1', userRoutes)

module.exports = app