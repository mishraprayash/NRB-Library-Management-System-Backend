# NRB Library Management System

A comprehensive library management system developed for Nepal Rastra Bank as part of an internship program. This backend application is built with Node.js, Express, and PostgreSQL to provide a robust solution for managing books, members, and borrowing operations with role-based access control.

## Features

- **User Management**
  - Role-based access control (Admin, SuperAdmin, Member)
  - Secure user registration and authentication with JWT
  - Email verification system
  - Password reset functionality
  - Profile management

- **Book Management**
  - Add, update, and remove books
  - Real-time book availability tracking
  - Book categorization
  - Search and filter books by various attributes

- **Borrowing System**
  - Book borrowing and returning workflow
  - Automatic due date calculation
  - Book renewal functionality with configurable limits
  - Tracking of borrowed book history

- **Administrative Features**
  - Comprehensive logging system
  - System variable configuration
  - Automated email reminders for due dates
  - User activity monitoring

## Technology Stack

- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (jsonwebtoken) with bcryptjs
- **Task Queue**: BullMQ for background processing
- **Logging**: Winston for structured logging
- **Validation**: Zod schema validation
- **Process Management**: PM2 for production deployment
- **Security**: Helmet, express-rate-limit
- **Data Processing**: xlsx for Excel file processing

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm package manager

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/nrb-library-backend.git
   cd nrb-library-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the project root with the following variables:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/library
   JWT_SECRET=your_secret_key
   EMAIL_SERVICE=your_email_service
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   PORT=3000
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Seed the database with initial data:
   ```bash
   # Seed with dummy data (books, members, and sample borrowed records)
   npm run seed:dummy
   
   # OR seed specific entities
   npm run seed:book   # Seed only books
   npm run seed:user   # Seed only users
   npm run seed:all    # Seed both books and users
   ```

## Running the Application

### Development Mode
```bash
# Start the main application
npm run dev

# Start the worker process for background jobs
npm run dev:worker

# Start both processes concurrently
npm run dev:all
```

### Production Deployment
```bash
# prisma generate
npm run build

# Start with PM2 process manager
npm run pm2:start

# View logs
npm run pm2:logs

# Restart services
npm run pm2:restart

# Stop services
npm run pm2:stop
```

## Database Management

The project includes several utilities for database management:

```bash
# Flush all data
npm run db-flush:all

# Flush only members data
npm run db-flush:members

# Flush only books data
npm run db-flush:books

# Flush only borrowed records
npm run db-flush:borrowed

# Flush only logs
npm run db-flush:logs

# Flush only system variables
npm run db-flush:variables

# Clean log files
npm run clean
```

## Project Structure

```
├── app.js                # Main application entry point
├── worker.js             # Background job processor
├── ecosystem.config.cjs  # PM2 configuration
├── controllers/          # Request handlers
│   ├── auth.controller.js
│   ├── book.controller.js
│   ├── common.controller.js
│   ├── member.controller.js
│   └── variable.controller.js
├── middleware/           # Custom middleware functions
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── validateSchema.js
│   └── validateUser.js
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Prisma database schema
│   ├── migrations/       # Database migrations
│   └── Seeds/            # Database seeding scripts
├── routes/               # API route definitions
│   ├── auth.route.js
│   ├── book.route.js
│   ├── common.route.js
│   ├── member.route.js
│   └── variable.routes.js
├── services/             # Business logic
│   ├── auth.service.js
│   ├── bullMQ/           # Background job processing
│   └── emailService/     # Email notification system
├── lib/                  # Utility functions
│   ├── helpers.js
│   ├── prisma.js
│   └── responseHelper.js
├── validation/           # Request validation schemas
│   └── schema.js
└── logs/                 # Application logs
```

## Database Schema

The system uses a PostgreSQL database with the following main entities:

- **Book**: Stores information about books including title, authors, publisher, category
- **Member**: Manages users with different roles (Admin, SuperAdmin, Member)
- **BorrowedBook**: Tracks book borrowing history, due dates, and renewals
- **Variables**: System-wide configuration variables
- **Logs**: Comprehensive activity logging

## Security Features

The application implements several security best practices:
- JWT-based authentication
- Password hashing with bcryptjs
- Request rate limiting
- HTTP header security with Helmet
- Input validation with Zod

## Background Processing

The system uses BullMQ for handling asynchronous tasks:
- Email notifications for due dates
- Scheduled reports generation
- Activity logging

## Maintenance and Monitoring

```bash
# Lint code
npm run lint

# Clean logs
npm run clean

# Monitor running processes
npm run pm2:logs
```

## Future Improvements

- Implement comprehensive test suite
- Add Docker containerization
- Enhance API documentation with Swagger/OpenAPI
- Implement additional reporting features
- Add caching layer for improved performance

## Contributors

- Prayash Mishra
- Ashim Karki
- Aarati Mahato

## License

This project is licensed under the ISC License.

## Acknowledgements

- Nepal Rastra Bank for providing the internship opportunity
- All contributors who have participated in this project