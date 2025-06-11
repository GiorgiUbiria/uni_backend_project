# Inventory Management Platform

A comprehensive inventory management system built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- **User Authentication**: JWT-based authentication with secure login/register
- **Inventory Management**: Full CRUD operations for inventory items
- **Category Management**: Organize items by categories
- **Supplier Management**: Track suppliers and their information
- **Stock Tracking**: Monitor stock levels and get low stock alerts
- **Search & Filter**: Advanced search and filtering capabilities
- **Role-based Access**: Admin and user roles with different permissions
- **Data Validation**: Comprehensive input validation using Joi
- **Security**: Rate limiting, CORS, Helmet protection
- **Testing**: Comprehensive test suite with Mocha and Chai

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Testing**: Mocha, Chai, Chai-HTTP
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi
- **Environment**: dotenv

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
4. Update `.env` file with your MongoDB URI and JWT secret
5. Start MongoDB service
6. Run the application:
   ```bash
   npm run dev
   ```

## Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run test suite
- `npm run test:watch`: Run tests in watch mode
- `npm run seed`: Seed database with sample data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create new supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Inventory Items
- `GET /api/items` - Get all items (with pagination, search, filter)
- `GET /api/items/:id` - Get single item
- `POST /api/items` - Create new item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `GET /api/items/low-stock` - Get low stock items

## Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Mongoose models
├── routes/         # Express routes
├── utils/          # Utility functions
├── config/         # Configuration files
└── server.js       # Main server file

test/               # Test files
├── unit/          # Unit tests
└── integration/   # Integration tests
```

## License

MIT License 