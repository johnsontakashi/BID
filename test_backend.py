import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:5000/api"

def test_backend():
    print("🔧 Testing Workana Monitor Backend...")
    
    try:
        print("\n1. Testing health check endpoint...")
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print("❌ Health check failed")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running!")
        print("   Please start the backend with: python backend/app.py")
        return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False
    
    try:
        print("\n2. Testing project submission...")
        test_project = {
            "id": "test-123",
            "title": "Test Web Development Project",
            "description": "This is a test project for web development services",
            "link": "https://www.workana.com/jobs/test-123",
            "budget": "$500 - $1000",
            "tags": ["web development", "javascript", "react"],
            "postedTime": "2 hours ago",
            "scrapedAt": datetime.now().isoformat(),
            "source": "workana-test"
        }
        
        response = requests.post(f"{BASE_URL}/projects", json=test_project, timeout=10)
        if response.status_code in [200, 201]:
            print("✅ Project submission successful")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Project submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Project submission error: {e}")
    
    try:
        print("\n3. Testing project retrieval...")
        response = requests.get(f"{BASE_URL}/projects", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Project retrieval successful")
            print(f"   Found {data.get('total', 0)} projects")
            if data.get('projects'):
                print(f"   Latest project: {data['projects'][0].get('Title', 'N/A')}")
        else:
            print(f"❌ Project retrieval failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Project retrieval error: {e}")
    
    try:
        print("\n4. Testing statistics endpoint...")
        response = requests.get(f"{BASE_URL}/stats", timeout=5)
        if response.status_code == 200:
            stats = response.json()
            print("✅ Statistics endpoint working")
            print(f"   Total projects: {stats.get('total_projects', 0)}")
            print(f"   Today's projects: {stats.get('today_projects', 0)}")
            print(f"   Excel file exists: {stats.get('excel_file_exists', False)}")
        else:
            print(f"❌ Statistics failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Statistics error: {e}")
    
    print("\n🎉 Backend testing completed!")
    print("\n📋 Next Steps:")
    print("1. Load the Chrome extension in chrome://extensions/ (Developer mode)")
    print("2. Enable monitoring in the extension popup")
    print("3. Visit https://www.workana.com/jobs to test scraping")
    print("4. Check for notifications and Excel file updates")
    
    return True

if __name__ == "__main__":
    test_backend()