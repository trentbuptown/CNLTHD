@echo off
echo Starting Backend Services for DigiZone Admin...
echo.

cd ..

echo Starting API Gateway...
start cmd /k "cd backend\gateway && npm run dev"
timeout /t 2 > nul

echo Starting User Service...
start cmd /k "cd backend\user-service && npm run dev"
timeout /t 2 > nul

echo Starting Product Service...
start cmd /k "cd backend\product-service && npm run dev"
timeout /t 2 > nul

echo Starting Order Service...
start cmd /k "cd backend\order-service && npm run dev"
timeout /t 2 > nul

echo Starting Payment Service...
start cmd /k "cd backend\payment-service && npm run dev"
timeout /t 2 > nul

echo.
echo All services started! You can now access the Admin panel.
echo.
echo Press any key to open the admin login page...
pause > nul

start http://localhost:8000/auth
cd digizone-frontend-web 