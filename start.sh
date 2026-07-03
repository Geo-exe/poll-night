#!/bin/bash

echo "Starting Poll Night..."

# Start Backend
echo "Starting Backend on port 3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend on port 5173..."
cd frontend
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo "=========================================="
echo "Both servers are starting up!"
echo "Admin Panel: http://localhost:5173"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "=========================================="
echo "Press Ctrl+C to stop the servers."

# Trap Ctrl+C and kill background processes
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Wait to keep the script running
wait
