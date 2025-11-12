#!/bin/bash

echo "🚀 Setting up Workana Monitor Extension..."

echo "📁 Creating project structure..."
mkdir -p backend
mkdir -p icons

echo "🐍 Setting up Python backend..."
cd backend

if command -v python3 &> /dev/null; then
    echo "✅ Python3 found"
    
    if command -v pip3 &> /dev/null; then
        echo "📦 Installing Python dependencies..."
        pip3 install -r requirements.txt
        
        if [ $? -eq 0 ]; then
            echo "✅ Dependencies installed successfully"
        else
            echo "❌ Failed to install dependencies"
            echo "💡 Try: pip3 install flask flask-cors pandas openpyxl requests"
            exit 1
        fi
    else
        echo "❌ pip3 not found. Please install pip3 first."
        exit 1
    fi
else
    echo "❌ Python3 not found. Please install Python3 first."
    exit 1
fi

cd ..

echo "🖼️ Creating extension icons..."
if command -v python3 &> /dev/null; then
    python3 create_icons.py
    if [ $? -eq 0 ]; then
        echo "✅ Icons created successfully"
    else
        echo "⚠️ Icon creation failed, but continuing..."
    fi
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend server:"
echo "   cd backend && python3 app.py"
echo ""
echo "2. Load the Chrome extension:"
echo "   - Open Chrome and go to chrome://extensions/"
echo "   - Enable 'Developer mode'"
echo "   - Click 'Load unpacked'"
echo "   - Select this project folder"
echo ""
echo "3. Configure the extension:"
echo "   - Click the extension icon"
echo "   - Enable monitoring"
echo "   - Add keywords (optional)"
echo "   - Test notifications"
echo ""
echo "4. Test the functionality:"
echo "   - Visit https://www.workana.com/jobs"
echo "   - Wait for notifications"
echo "   - Check the Excel file in backend/workana_projects.xlsx"
echo ""
echo "🔧 For testing the backend, run:"
echo "   python3 test_backend.py"
echo ""