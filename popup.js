document.addEventListener('DOMContentLoaded', () => {
  const monitoringToggle = document.getElementById('monitoringToggle');
  const statusDiv = document.getElementById('status');
  const keywordInput = document.getElementById('keywordInput');
  const addKeywordBtn = document.getElementById('addKeyword');
  const keywordList = document.getElementById('keywordList');
  const refreshInterval = document.getElementById('refreshInterval');
  const testNotificationBtn = document.getElementById('testNotification');
  const openWorkanaBtn = document.getElementById('openWorkana');
  const statsDiv = document.getElementById('stats');
  
  loadSettings();
  
  monitoringToggle.addEventListener('change', () => {
    const isEnabled = monitoringToggle.checked;
    
    chrome.storage.sync.set({ monitoringEnabled: isEnabled }, () => {
      updateStatus(isEnabled);
      
      chrome.runtime.sendMessage({
        action: isEnabled ? 'startMonitoring' : 'stopMonitoring'
      });
    });
  });
  
  refreshInterval.addEventListener('change', () => {
    const interval = parseInt(refreshInterval.value) * 1000;
    if (interval >= 10000) {
      chrome.storage.sync.set({ refreshInterval: interval });
      
      if (monitoringToggle.checked) {
        chrome.runtime.sendMessage({ action: 'stopMonitoring' });
        setTimeout(() => {
          chrome.runtime.sendMessage({ action: 'startMonitoring' });
        }, 500);
      }
    }
  });
  
  addKeywordBtn.addEventListener('click', addKeyword);
  keywordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addKeyword();
    }
  });
  
  testNotificationBtn.addEventListener('click', () => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Test Notification',
      message: 'This is how new project notifications will look!'
    });
  });
  
  openWorkanaBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.workana.com/jobs' });
  });
  
  function loadSettings() {
    chrome.storage.sync.get([
      'monitoringEnabled',
      'keywords',
      'refreshInterval',
      'lastChecked'
    ], (result) => {
      monitoringToggle.checked = result.monitoringEnabled !== false;
      updateStatus(result.monitoringEnabled !== false);
      
      const keywords = result.keywords || [];
      displayKeywords(keywords);
      
      const interval = (result.refreshInterval || 30000) / 1000;
      refreshInterval.value = interval;
      
      if (result.lastChecked) {
        const lastChecked = new Date(result.lastChecked);
        statsDiv.textContent = `Last checked: ${lastChecked.toLocaleString()}`;
      }
    });
  }
  
  function updateStatus(isEnabled) {
    if (isEnabled) {
      statusDiv.textContent = 'Monitoring Active';
      statusDiv.className = 'status active';
    } else {
      statusDiv.textContent = 'Monitoring Disabled';
      statusDiv.className = 'status inactive';
    }
  }
  
  function addKeyword() {
    const keyword = keywordInput.value.trim();
    if (!keyword) return;
    
    chrome.storage.sync.get('keywords', (result) => {
      const keywords = result.keywords || [];
      
      if (!keywords.includes(keyword.toLowerCase())) {
        keywords.push(keyword.toLowerCase());
        
        chrome.storage.sync.set({ keywords }, () => {
          displayKeywords(keywords);
          keywordInput.value = '';
        });
      }
    });
  }
  
  function removeKeyword(keyword) {
    chrome.storage.sync.get('keywords', (result) => {
      const keywords = result.keywords || [];
      const updatedKeywords = keywords.filter(k => k !== keyword);
      
      chrome.storage.sync.set({ keywords: updatedKeywords }, () => {
        displayKeywords(updatedKeywords);
      });
    });
  }
  
  function displayKeywords(keywords) {
    keywordList.innerHTML = '';
    
    if (keywords.length === 0) {
      keywordList.innerHTML = `
        <div style="text-align: center; color: #999; font-size: 11px; padding: 10px;">
          No keywords added. All projects will be monitored.
        </div>
      `;
      return;
    }
    
    keywords.forEach(keyword => {
      const keywordItem = document.createElement('div');
      keywordItem.className = 'keyword-item';
      keywordItem.innerHTML = `
        <span>${keyword}</span>
        <button class="remove-btn" onclick="removeKeywordFromUI('${keyword}')">×</button>
      `;
      keywordList.appendChild(keywordItem);
    });
  }
  
  window.removeKeywordFromUI = function(keyword) {
    chrome.storage.sync.get('keywords', (result) => {
      const keywords = result.keywords || [];
      const updatedKeywords = keywords.filter(k => k !== keyword);
      
      chrome.storage.sync.set({ keywords: updatedKeywords }, () => {
        displayKeywords(updatedKeywords);
      });
    });
  };
  
  setInterval(() => {
    chrome.storage.sync.get('lastChecked', (result) => {
      if (result.lastChecked) {
        const lastChecked = new Date(result.lastChecked);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastChecked) / 60000);
        
        if (diffMinutes < 1) {
          statsDiv.textContent = 'Last checked: Just now';
        } else if (diffMinutes < 60) {
          statsDiv.textContent = `Last checked: ${diffMinutes} min ago`;
        } else {
          statsDiv.textContent = `Last checked: ${lastChecked.toLocaleString()}`;
        }
      }
    });
  }, 10000);
});