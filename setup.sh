#!/bin/bash

# GazetteHere Setup Script
echo "🌍 Setting up GazetteHere with OpenAI integration..."
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
fi

echo ""
echo "🔑 Next steps:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "2. Open the .env file and replace 'your_openai_api_key_here' with your actual API key"
echo "3. Run 'npm start' to start the server"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "💡 For testing without AI, you can still open index.html directly in your browser"
echo ""

# Check if user wants to open the .env file
read -p "Would you like to open the .env file now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v code &> /dev/null; then
        code .env
    elif command -v nano &> /dev/null; then
        nano .env
    else
        echo "Please open .env in your preferred editor and add your OpenAI API key"
    fi
fi
