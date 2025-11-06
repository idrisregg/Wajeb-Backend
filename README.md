# Wajeb Backend


## Project Overview

- User authentication and authorization
- File upload and management
- S3 storage integration
- Automated file cleanup service
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
Create a `.env` file in the root directory.

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Features

- **JWT Authentication**: Secure user authentication using JSON Web Tokens
- **File Management**: Upload, download, and delete files
- **S3 Integration**: Seamless integration with AWS S3 for file storage
- **Automated Cleanup**: Background service for managing file lifecycles
- **Error Handling**: Comprehensive error handling and logging
- **Middleware Support**: Authentication and request validation middleware


- Request validation and sanitization
