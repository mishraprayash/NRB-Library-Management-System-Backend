# Library Management System

A robust and scalable library management system built with Node.js, Express, and PostgreSQL. This system provides comprehensive features for managing books, members, and borrowing operations with role-based access control.

## Features

- **User Management**
  - Role-based access control (Admin, SuperAdmin, Member)
  - User registration and authentication
  - Email verification system
  - Profile management

- **Book Management**
  - Add, update, and remove books
  - Track book availability
  - Categorize books
  - Manage book inventory

- **Borrowing System**
  - Book borrowing and returning
  - Automatic due date calculation
  - Book renewal functionality
  - Borrowing limits and restrictions

- **Administrative Features**
  - Comprehensive logging system
  - System variable configuration
  - User activity monitoring
  - Automated email notifications

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT
- **Task Queue**: BullMQ
- **Logging**: Winston
- **Validation**: Zod
- **Testing**: Jest
- **Process Management**: PM2

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd library-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/library
   JWT_SECRET=your_jwt_secret
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

4. Initialize the database:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database (optional):
   ```bash
   npx prisma db seed
   ```

## Running the Application

### Development Mode
```bash
# Start the main application
npm run dev

# Start the worker process
npm run dev:worker

# Start both processes concurrently
npm run dev:all
```

### Production Mode
```bash
# Build the application
npm run build

# Start with PM2
npm run pm2:start
```

### Docker Deployment
```bash
# Build the Docker image
npm run docker:build

# Run the container
npm run docker:run
```

## Project Structure

```
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── prisma/         # Database schema and migrations
├── routes/         # API routes
├── services/       # Business logic
├── validation/     # Request validation
├── lib/           # Utility functions
├── logs/          # Application logs
├── app.js         # Main application file
└── worker.js      # Background job processor
```

## API Documentation

The API documentation is available at `/api-docs` when running the application in development mode.

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the repository or contact the maintainers.
