#!/bin/bash

echo "🚀 Starting ChatPulse Analytics Dashboard..."

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Starting Redis..."
    brew services start redis
    sleep 2
fi

echo "✅ Redis is running"

# Start backend server
echo "🔧 Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Test backend
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend is running on port 3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🎨 Starting React frontend..."
cd chat-dashboard
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 ChatPulse is starting up!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 Backend: http://localhost:3001/health"
echo "📈 Redis: localhost:6379"
echo ""
echo "💡 To generate chat traffic, open another terminal and run:"
echo "   node simulate.js"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

wait
