#!/bin/bash

echo "🚀 Starting Surge Analytics Dashboard..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."
    redis-server --daemonize yes
    sleep 2
fi

echo "✅ Redis is running"

# Start backend server
echo "🔧 Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🎨 Starting React frontend..."
cd chat-dashboard
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Surge is starting up!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001/health"
echo "📈 Redis: localhost:6379"
echo ""
echo "💡 To simulate chat traffic, run: node simulate.js"
echo "🛑 Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
