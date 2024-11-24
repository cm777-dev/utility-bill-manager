# Utility Bill Manager

A comprehensive SaaS platform for tracking, analyzing, and managing utility bills with advanced sustainability and compliance features.

## Features

- **Bill Processing**
  - Bulk file upload support
  - Real-time validation
  - Multiple file format support (PDF, Excel, CSV)
  - Automated data extraction

- **Analytics & Benchmarking**
  - Usage comparison
  - Performance metrics
  - Cost analysis
  - Industry benchmarks

- **Compliance Management**
  - Regulatory requirement tracking
  - Document management
  - Audit history
  - Standardized reporting

- **Sustainability Dashboard**
  - Carbon footprint tracking
  - Emissions breakdown
  - Goal setting and monitoring
  - Initiative tracking

## Tech Stack

- Frontend: React 17+, Material-UI
- Backend: Flask (Python 3.9)
- Database: PostgreSQL
- Containerization: Docker
- CI/CD: GitHub Actions

## Prerequisites

- Node.js 14+
- Python 3.9+
- Docker Desktop
- PostgreSQL 13+

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/utility-bill-manager.git
cd utility-bill-manager
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
```

5. Start development servers:

Frontend:
```bash
cd frontend
npm start
```

Backend:
```bash
cd backend
flask run
```

## Docker Deployment

1. Build and start services:
```bash
docker-compose up --build
```

2. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

3. Stop services:
```bash
docker-compose down
```

## Testing

Frontend:
```bash
cd frontend
npm test
```

Backend:
```bash
cd backend
pytest
```

## CI/CD Pipeline

The project includes a GitHub Actions workflow that:
1. Runs tests for both frontend and backend
2. Builds Docker images
3. Deploys to production on successful merge to main

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@utilitybillmanager.com or create an issue in the repository.
