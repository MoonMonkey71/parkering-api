# Azure Functions API for Parkering.no

## 🚀 Deployment via GitHub Actions

This repository contains the Azure Functions API for the Parkering.no application.

### API Endpoints:
- `POST /api/authRegister` - User registration
- `POST /api/authLogin` - User login  
- `GET /api/listingsGet` - Get parking listings
- `POST /api/listingsCreate` - Create parking listing
- `POST /api/bookingsCreate` - Create booking

### Deployment:
Automatically deployed to Azure Functions via GitHub Actions when code is pushed to `main` branch.

### Environment Variables:
- `SQL_CONNECTION_STRING` - Azure SQL Database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (production)
- `WEBSITE_NODE_DEFAULT_VERSION` - Node.js version (20)# Trigger deployment
# Trigger deployment Tue Oct  7 13:42:35 CEST 2025
# Test deployment Tue Oct  7 13:45:13 CEST 2025
