# Wajeb Backend

A robust Node.js backend service for file management and user authentication.

## Project Overview

Wajeb Backend is a RESTful API service that provides:
- User authentication and authorization
- File upload and management
- S3 storage integration
- Automated file cleanup service

## Project Structure

```
src/
├── config/
│   └── storage.js         # Storage configuration
├── controller/
│   ├── file.controller.js # File management controller
│   └── user.controller.js # User management controller
├── middlewares/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── file.model.js     # File database model
│   └── user.model.js     # User database model
├── plugins/
│   └── jwt.js           # JWT authentication plugin
├── routes/
│   ├── file.routes.js   # File-related routes
│   └── user.routes.js   # User-related routes
├── services/
│   ├── fileCleanupService.js # Automated file cleanup
│   └── s3Service.js         # S3 storage integration
└── server.js            # Main application entry point
```

## Prerequisites

- Node.js (v14 or higher recommended)
- MongoDB
- AWS S3 bucket (for file storage)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/idrisregg/Wajeb-Backend.git
cd Wajeb-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory and add the following variables:
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_BUCKET_NAME=your_s3_bucket_name
AWS_REGION=your_aws_region
```

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### File Management
- `POST /api/files/upload` - Upload a file
- `GET /api/files` - List all files
- `GET /api/files/:id` - Get file details
- `DELETE /api/files/:id` - Delete a file

## Features

- **JWT Authentication**: Secure user authentication using JSON Web Tokens
- **File Management**: Upload, download, and delete files
- **S3 Integration**: Seamless integration with AWS S3 for file storage
- **Automated Cleanup**: Background service for managing file lifecycles
- **Error Handling**: Comprehensive error handling and logging
- **Middleware Support**: Authentication and request validation middleware

## Security

- JWT-based authentication
- Secure file upload validation
- Environment variable configuration
- Request validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Idris Reggai - [GitHub](https://github.com/idrisregg)

Project Link: https://github.com/idrisregg/Wajeb-Backend