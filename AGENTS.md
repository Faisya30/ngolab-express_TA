# Backend Commands
cd apps/backend
npm run dev      # Run development server
npm start        # Run production server
npm run test:smoke  # Smoke test

# Lint/Format (if available)
# Add node-based lint commands here when configured

# Test admin login endpoint
# curl -X POST http://localhost:4000/api/admin/login -H "Content-Type: application/json" -d '{"username":"admin","password":"your_password"}'
# curl -H "Authorization: Bearer <token>" http://localhost:4000/api/admin/me