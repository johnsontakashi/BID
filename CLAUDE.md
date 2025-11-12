# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome extension for monitoring Workana.com projects with a Python Flask backend. The extension automatically scrapes new projects from Workana, sends browser notifications for matching projects, and saves all data to Excel files via a local API server.

## Architecture

### Chrome Extension (Frontend)
- **manifest.json**: Manifest V3 configuration with permissions for Workana.com and localhost:5000
- **background.js**: Service worker that manages monitoring intervals, notifications, and communicates with backend
- **content.js**: Content script that scrapes project data from Workana pages using multiple CSS selectors
- **popup.html/js**: Extension popup interface for user settings, keyword management, and monitoring controls
- **icons/**: Extension icons in multiple sizes (16x16 to 128x128)

### Python Backend (API Server)
- **backend/app.py**: Flask server providing REST API endpoints for project data management
- **backend/requirements.txt**: Python dependencies (Flask, Flask-CORS, pandas, openpyxl, requests)
- **backend/workana_projects.xlsx**: Auto-generated Excel file storing all scraped project data

### Key Data Flow
1. Background service worker triggers content script injection into Workana pages
2. Content script scrapes project data and sends to background script
3. Background script filters by keywords and sends notifications for new matches
4. Project data is sent to Python backend via POST /api/projects
5. Backend saves data to Excel file and prevents duplicates

## Development Commands

### Backend Setup
```bash
# Install Python dependencies
pip3 install -r backend/requirements.txt

# Start Flask development server
cd backend && python3 app.py
```

### Testing
```bash
# Test backend API endpoints
python3 test_backend.py

# Test extension functionality
# 1. Load unpacked extension in chrome://extensions/
# 2. Visit https://www.workana.com/jobs
# 3. Check notifications and Excel file updates
```

### Setup Script
```bash
# Run complete project setup
./setup.sh
```

## API Endpoints

- `POST /api/projects` - Save new project data (requires: id, title, link)
- `GET /api/projects` - Retrieve all stored projects with optional limit parameter
- `GET /api/projects/<id>` - Get specific project by ID
- `GET /api/stats` - Get monitoring statistics (total/today counts)
- `GET /api/health` - Health check endpoint
- `GET /api/export/excel` - Export data to Excel format

## Chrome Extension Development

### Loading the Extension
1. Open `chrome://extensions/` and enable Developer mode
2. Click "Load unpacked" and select project root directory
3. Extension will appear in toolbar with monitoring controls

### Key Extension Components
- **Storage**: Uses chrome.storage.sync for persistent settings (keywords, intervals, monitoring state)
- **Notifications**: Browser notifications with duplicate prevention using project IDs
- **Content Script Injection**: Dynamic injection into Workana tabs for scraping
- **Cross-origin Communication**: Extension communicates with localhost:5000 backend

## Configuration Files

### Extension Manifest (manifest.json)
- Manifest V3 with service worker architecture
- Permissions: storage, notifications, activeTab, background
- Host permissions: workana.com and localhost:5000

### Python Requirements (backend/requirements.txt)
- Flask 2.3.3 for web server
- Flask-CORS 4.0.0 for cross-origin requests
- pandas 2.0.3 for data manipulation
- openpyxl 3.1.2 for Excel file operations
- requests 2.31.0 for HTTP client functionality

## Project Data Schema

Excel columns: ID, Title, Description, Link, Budget, Tags, Posted_Time, Scraped_At, Source

## Security Notes

- Extension only accesses Workana.com and localhost:5000
- All data stored locally, no external data transmission
- Backend runs on localhost for privacy
- No sensitive credentials stored in codebase