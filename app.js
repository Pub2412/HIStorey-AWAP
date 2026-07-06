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
// Serve uploads (legacy seed paths)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')))

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

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'register.html'))
});

app.get('/forgot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'forgot.html'))
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'))
});

app.get('/product/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'product.html'))
});

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'products.html'))
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html'))
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'cart.html'))
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'checkout.html'))
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'dashboard.html'))
});

app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'dashboard.html'))
});

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'users.html'))
});

app.get('/admin/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'products.html'))
});

app.get('/admin/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'admin', 'orders.html'))
});

app.get('/404', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'))
})

// API routes
const products = require('./routes/products')
const transactions = require('./routes/transactions')
const userRoutes = require('./routes/user')
const cartRoutes = require('./routes/cart');

app.use('/api/v1', cartRoutes);
app.use('/api/v1', products)
app.use('/api/v1', transactions)
app.use('/api/v1', userRoutes)

app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/')) {
        return next()
    }

    return res.status(404).sendFile(path.join(__dirname, 'public', 'html', '404.html'))
})

module.exports = app