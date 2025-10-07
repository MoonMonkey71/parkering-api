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
# Azure CLI deployment Tue Oct  7 13:46:08 CEST 2025
# Fixed Azure credentials Tue Oct  7 13:47:44 CEST 2025
# Azure Functions action deployment Tue Oct  7 13:49:49 CEST 2025
# Azure Web Apps action deployment Tue Oct  7 13:51:23 CEST 2025
# Azure CLI publish profile deployment Tue Oct  7 13:53:03 CEST 2025
# Trigger etter portal-kobling Tue Oct  7 13:58:38 CEST 2025
# Azure Web Apps Deploy test Tue Oct  7 14:05:49 CEST 2025
