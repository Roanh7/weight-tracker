# Weight & Calorie Tracker

A simple web application for tracking your weight and daily calorie intake. Built with HTML, CSS, JavaScript, Node.js, and PostgreSQL.

## Features

- User account creation and authentication
- Daily weight and calorie tracking
- Visual progress graphs
- Monthly calendar overview
- Frequently used foods for quick calorie logging
- Friend connections to share progress
- Detailed statistics and custom goal setting

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- PostgreSQL database

### Local Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/weight-tracker.git
   cd weight-tracker
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a PostgreSQL database for the application.

4. Create a `.env` file based on the `.env.example` file:
   ```
   cp .env.example .env
   ```

5. Update the `.env` file with your database connection details and JWT secret.

6. Set up the database schema:
   ```
   psql -U your_username -d your_database_name -f database-schema.sql
   ```

7. Start the development server:
   ```
   npm run dev
   ```

8. Open your browser and navigate to `http://localhost:3000`

### Deployment on Vercel

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to your Vercel account:
   ```
   vercel login
   ```

3. Set up your Neon PostgreSQL database on Vercel.

4. Deploy the application:
   ```
   vercel
   ```

5. Set environment variables on Vercel:
   ```
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   ```

6. Deploy to production:
   ```
   vercel --prod
   ```

## Project Structure

- `public/` - Static files (HTML, CSS, JavaScript)
  - `css/` - Stylesheets
  - `js/` - Frontend JavaScript files
  - `*.html` - HTML pages
- `server/` - Backend code
  - `index.js` - Main server file
  - `db.js` - Database connection
  - `routes/` - API route handlers
- `package.json` - Project configuration
- `vercel.json` - Vercel deployment configuration
- `database-schema.sql` - Database schema

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### User Profile
- `GET /api/users/profile` - Get user profile
- `POST /api/users/profile` - Update user profile
- `POST /api/users/goals` - Update user goals
- `GET /api/users/statistics` - Get user statistics
- `GET /api/users/monthly-data` - Get monthly data for calendar
- `GET /api/users/foods` - Get frequent foods
- `POST /api/users/foods` - Add frequent food
- `GET /api/users/friends` - Get friends list
- `POST /api/users/friends` - Send friend request
- `POST /api/users/friends/:id/accept` - Accept friend request
- `POST /api/users/friends/:id/reject` - Reject friend request

### Weight Tracking
- `GET /api/weights` - Get all weight entries
- `GET /api/weights/recent` - Get recent weight entries
- `GET /api/weights/latest` - Get latest weight entry
- `GET /api/weights/date/:date` - Get weight for specific date
- `POST /api/weights` - Add or update weight entry
- `DELETE /api/weights/:id` - Delete weight entry

### Calorie Tracking
- `GET /api/calories` - Get all calorie entries
- `GET /api/calories/recent` - Get recent calorie entries
- `GET /api/calories/date/:date` - Get calories for specific date
- `POST /api/calories` - Add calorie entry
- `PUT /api/calories` - Update calorie entry
- `DELETE /api/calories/:id` - Delete calorie entry

## License

This project is licensed under the MIT License - see the LICENSE file for details.