# Workana Project Monitor Chrome Extension

A Chrome extension that monitors Workana.com for new projects and sends notifications when matching projects are found.

## Features

- 🔍 **Automatic Monitoring**: Periodically checks Workana for new projects
- 🔔 **Smart Notifications**: Browser notifications for new projects with duplicate prevention
- 🏷️ **Keyword Filtering**: Set keywords to only get notified about relevant projects
- ⚙️ **Customizable Settings**: Adjustable refresh intervals and monitoring preferences
- 📊 **Excel Export**: Automatically saves project data to Excel files via Python backend
- 🚀 **Manifest V3**: Built with the latest Chrome extension standards

## Project Structure

```
workana-monitor/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # Service worker for monitoring logic
├── content.js            # Content script for scraping Workana
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality and settings
├── icons/                # Extension icons (16, 32, 48, 128px)
├── backend/              # Python Flask backend
│   ├── app.py           # Flask API server
│   ├── requirements.txt # Python dependencies
│   └── workana_projects.xlsx # Generated Excel file
└── README.md            # This file
```

## Installation & Setup

### 1. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the folder containing the extension files
5. The Workana Monitor extension should now appear in your extensions

### 2. Python Backend Setup

```bash
# Navigate to backend directory
cd backend/

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

The backend will start on `http://localhost:5000`

### 3. Extension Configuration

1. Click the extension icon in Chrome toolbar
2. Toggle "Enable Monitoring" to start monitoring
3. Add keywords (optional) to filter projects
4. Set refresh interval (minimum 10 seconds recommended)
5. Test notifications using the "Test Notification" button

## How It Works

### Extension Components

1. **Background Service Worker** (`background.js`)
   - Manages periodic monitoring intervals
   - Handles notifications and duplicate prevention
   - Communicates with Python backend to store project data

2. **Content Script** (`content.js`)
   - Scrapes project data from Workana pages
   - Extracts project titles, links, descriptions, budgets, and tags
   - Handles dynamic content loading with MutationObserver

3. **Popup Interface** (`popup.html` + `popup.js`)
   - User-friendly settings panel
   - Keyword management
   - Monitoring controls and status display

### Backend API

The Python Flask backend provides these endpoints:

- `POST /api/projects` - Save new project data to Excel
- `GET /api/projects` - Retrieve all stored projects
- `GET /api/export/excel` - Export data to Excel format
- `GET /api/stats` - Get monitoring statistics
- `GET /api/health` - Health check endpoint

### Data Storage

Project data is automatically saved to `workana_projects.xlsx` with the following columns:
- ID, Title, Description, Link, Budget, Tags, Posted_Time, Scraped_At, Source

## Usage Instructions

1. **Start Monitoring**: 
   - Open the extension popup
   - Enable monitoring toggle
   - Extension will start checking Workana every 30 seconds (default)

2. **Set Keywords** (Optional):
   - Add relevant keywords like "web development", "python", "design"
   - Only projects matching keywords will trigger notifications
   - Leave empty to monitor all projects

3. **Receive Notifications**:
   - Browser notifications appear for new matching projects
   - Click notifications to open the project page
   - No duplicate notifications for the same project

4. **View Collected Data**:
   - All project data is saved to Excel automatically
   - Access via backend API or directly open the Excel file
   - Located at `backend/workana_projects.xlsx`

## Customization

### Modify Refresh Interval
- Minimum: 10 seconds (to avoid being blocked)
- Default: 30 seconds
- Adjust via popup settings

### Add More Keywords
- Use the popup interface to add/remove keywords
- Keywords are case-insensitive
- Partial matches are supported

### Backend Configuration
Edit `backend/app.py` to:
- Change Excel file location
- Modify API endpoints
- Add additional data processing

## Troubleshooting

### Extension Not Working
1. Check if both monitoring and notifications are enabled in popup
2. Verify Chrome allows notifications for the extension
3. Ensure you have an active internet connection
4. Check Chrome developer console for errors

### Backend Connection Issues
1. Verify Python backend is running on localhost:5000
2. Check firewall/antivirus isn't blocking the connection
3. Ensure all Python dependencies are installed
4. Check backend console for error messages

### No Notifications Appearing
1. Verify Chrome notifications are enabled for the extension
2. Check if keywords are too restrictive
3. Manually visit Workana to verify new projects exist
4. Test notifications using the popup "Test Notification" button

### Excel File Issues
1. Close Excel if the file is open during monitoring
2. Check file permissions in the backend directory
3. Verify openpyxl is properly installed
4. Check backend logs for Excel-related errors

## Security Notes

- Extension only accesses Workana.com and localhost:5000
- No sensitive data is transmitted or stored
- Backend runs locally for data privacy
- All project data remains on your local machine

## Development

To modify the extension:

1. Make changes to the source files
2. Reload the extension in Chrome (chrome://extensions/)
3. Test functionality with Workana.com
4. For backend changes, restart the Python server

## License

This project is for educational and personal use. Respect Workana's terms of service and rate limits when using this tool.