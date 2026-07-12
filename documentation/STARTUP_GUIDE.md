# HIStore'y Startup Guide

This guide provides step-by-step instructions for setting up the HIStore'y web application on a new PC.

## 1. Prerequisites

Before starting, ensure you have the following installed on your PC:
- **Node.js** (v18 or higher recommended)
- **MySQL Server** (Using XAMPP, WAMP, or standalone MySQL)
- **Git** (optional, for cloning the repository)

## 2. Environment Setup

### Database Configuration
1. Open your MySQL client (e.g., phpMyAdmin if using XAMPP).
2. Create a new empty database named `hstore_db`.
3. Import the SQL dump file located at `database/hstore_db.sql` into your new `hstore_db` database. This will create all necessary tables and insert default data.

### Project Files
1. Copy the `HStore` project folder to your local environment (e.g., `C:\xampp\htdocs\HStore` or any preferred directory).
2. Open a terminal or command prompt inside the `HStore` directory.
3. Run the following command to install all required Node.js dependencies:
   ```bash
   npm install
   ```

## 3. Environment Variables (.env)

The application requires environment variables to connect to the database, AI services, and mail server.
Create a file named `.env` in the root directory (`HStore/`) and configure it as follows:

```env
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hstore_db
DB_USER=root
DB_PASSWORD= # Leave blank if you are using XAMPP's default root user without a password

# AI Chatbot Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Mailtrap Configuration (For sending emails)
MAILTRAP_HOST=smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=your_mailtrap_user
MAILTRAP_PASS=your_mailtrap_password
MAILTRAP_FROM_EMAIL=noreply@historey.com

# Security (Change this to a strong random string)
JWT_SECRET=your_jwt_secret_key_here
```

> **Note:** For the AI Chatbot to work, you must obtain a free API key from [Google AI Studio](https://aistudio.google.com/) and place it in the `GEMINI_API_KEY` field.

## 4. Running the Application

1. In your terminal (inside the `HStore` directory), start the application using:
   ```bash
   npm start
   ```
   *(This uses nodemon to start the server and watch for changes. Alternatively, run `node index.js`)*

2. If successful, you will see output indicating that the server is running on `port 3000` and the database is connected.

3. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

## 5. Troubleshooting

- **Database Connection Error**: Double check your `DB_USER` and `DB_PASSWORD` in `.env`. Ensure XAMPP's MySQL module is running.
- **Port already in use**: If port 3000 is occupied, change the `PORT` variable in the `.env` file to 3001 or another available port.
- **Chatbot Not Working**: Verify that the `GEMINI_API_KEY` is correctly set and that the key has not exhausted its free-tier quota.
