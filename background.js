let monitoringInterval = null;
let isMonitoring = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    keywords: [],
    monitoringEnabled: true,
    refreshInterval: 30000,
    lastCheckedProjects: []
  });
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Workana Monitor',
    message: 'Extension installed successfully! Configure your keywords in the popup.'
  });
});

chrome.runtime.onStartup.addListener(() => {
  startMonitoring();
});

function startMonitoring() {
  chrome.storage.sync.get(['monitoringEnabled', 'refreshInterval'], (result) => {
    if (result.monitoringEnabled && !isMonitoring) {
      isMonitoring = true;
      const interval = result.refreshInterval || 30000;
      
      monitoringInterval = setInterval(() => {
        checkForNewProjects();
      }, interval);
      
      checkForNewProjects();
    }
  });
}

function stopMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    isMonitoring = false;
  }
}

async function checkForNewProjects() {
  try {
    const tabs = await chrome.tabs.query({url: 'https://www.workana.com/*'});
    
    if (tabs.length === 0) {
      const newTab = await chrome.tabs.create({
        url: 'https://www.workana.com/jobs',
        active: false
      });
      
      setTimeout(() => {
        chrome.tabs.sendMessage(newTab.id, {action: 'scrapeProjects'});
      }, 3000);
    } else {
      chrome.tabs.reload(tabs[0].id);
      setTimeout(() => {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'scrapeProjects'});
      }, 3000);
    }
  } catch (error) {
    console.error('Error checking for new projects:', error);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'startMonitoring':
      startMonitoring();
      break;
      
    case 'stopMonitoring':
      stopMonitoring();
      break;
      
    case 'projectsFound':
      handleNewProjects(message.projects);
      break;
      
    case 'updateSettings':
      chrome.storage.sync.set(message.settings);
      if (message.settings.monitoringEnabled) {
        startMonitoring();
      } else {
        stopMonitoring();
      }
      break;
  }
});

async function handleNewProjects(projects) {
  const result = await chrome.storage.sync.get(['lastCheckedProjects', 'keywords']);
  const lastCheckedProjects = result.lastCheckedProjects || [];
  const keywords = result.keywords || [];
  
  const newProjects = projects.filter(project => 
    !lastCheckedProjects.some(lastProject => lastProject.id === project.id)
  );
  
  for (const project of newProjects) {
    const matchesKeywords = keywords.length === 0 || 
      keywords.some(keyword => 
        project.title.toLowerCase().includes(keyword.toLowerCase()) ||
        project.description.toLowerCase().includes(keyword.toLowerCase())
      );
    
    if (matchesKeywords) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'New Workana Project!',
        message: `${project.title}\nClick to view project`,
        contextMessage: project.budget || 'Budget not specified'
      }, (notificationId) => {
        chrome.notifications.onClicked.addListener(() => {
          chrome.tabs.create({url: project.link});
        });
      });
      
      await sendProjectToBackend(project);
    }
  }
  
  if (newProjects.length > 0) {
    chrome.storage.sync.set({
      lastCheckedProjects: projects
    });
  }
}

async function sendProjectToBackend(project) {
  try {
    const response = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(project)
    });
    
    if (!response.ok) {
      console.error('Failed to send project to backend');
    }
  } catch (error) {
    console.error('Error sending project to backend:', error);
  }
}