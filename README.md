# Utility Bill Manager

A secure and efficient utility bill management system with advanced security features.

## Features

- **Secure File Handling**
  - End-to-end encryption for sensitive files
  - Secure file storage with AWS S3
  - File integrity verification
  - MIME type validation

- **API Security**
  - API key authentication
  - Rate limiting
  - Request validation
  - Response sanitization
  - CORS protection

- **Data Protection**
  - Field-level encryption
  - AWS KMS integration
  - Secure key management
  - Data key rotation

- **Infrastructure Security**
  - Docker security best practices
  - Network isolation
  - Resource limits
  - Health monitoring

## Preview Environment

Access the preview environment at: https://preview.utility-bill-manager.com

The preview environment is automatically deployed on each push to the main branch and includes:
- Automated testing
- Security scanning
- Infrastructure deployment
- SSL/TLS encryption
- Monitoring and logging

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/utility-bill-manager.git
   cd utility-bill-manager
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the development server:
   ```bash
   docker-compose up --build
   ```

## Security Features

### Encryption
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- AWS KMS for key management
- Secure key rotation

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- API key management
- Session security

### Infrastructure
- Docker container security
- Network isolation
- Resource limits
- Health checks
- Automated security scanning

## Deployment

The application is automatically deployed using GitHub Actions:

1. Push to main branch triggers the workflow
2. Tests and security scans are run
3. Docker images are built and pushed
4. AWS ECS deployment is updated
5. DNS records are configured

## Monitoring & Logging

- AWS CloudWatch integration
- Structured logging
- Audit trail
- Health monitoring
- Performance metrics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Security

For security issues, please email security@yourdomain.com

## License

MIT License - see LICENSE file for details
