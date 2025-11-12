function scrapeWorkanaProjects(targetPinIndex = null) {
  const projects = [];
  
  // First try to find pins/items in viewer
  const pins = document.querySelectorAll('.pin, [class*="pin"], .item, .card, .project-item, .card-project, [class*="project"]');
  
  if (pins.length > 0) {
    console.log(`Found ${pins.length} pins/items in viewer`);
    
    if (targetPinIndex !== null && pins[targetPinIndex]) {
      // Target specific pin (4th pin = index 3)
      console.log(`Targeting pin ${targetPinIndex + 1}`);
      const project = extractProjectData(pins[targetPinIndex]);
      if (project) {
        project.pinIndex = targetPinIndex + 1;
        projects.push(project);
      }
    } else {
      // Scrape all pins
      pins.forEach((element, index) => {
        const project = extractProjectData(element);
        if (project) {
          project.pinIndex = index + 1;
          projects.push(project);
        }
      });
    }
  }
  
  // Fallback to original selectors if no pins found
  if (projects.length === 0) {
    const projectElements = document.querySelectorAll('.project-item, .card-project, [class*="project"]');
    
    if (projectElements.length === 0) {
      const alternativeSelectors = [
        'article',
        '.job-post',
        '.project-card',
        '[data-testid*="project"]',
        '.list-group-item'
      ];
      
      for (const selector of alternativeSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((element, index) => {
            const project = extractProjectData(element);
            if (project) {
              project.itemIndex = index + 1;
              projects.push(project);
            }
          });
          break;
        }
      }
    } else {
      projectElements.forEach((element, index) => {
        const project = extractProjectData(element);
        if (project) {
          project.itemIndex = index + 1;
          projects.push(project);
        }
      });
    }
  }
  
  if (projects.length === 0) {
    const fallbackProjects = scrapeFallbackProjects();
    projects.push(...fallbackProjects);
  }
  
  return projects;
}

function extractProjectData(element) {
  try {
    const titleElement = element.querySelector('h2, h3, h4, .title, [class*="title"], a[href*="/jobs/"]');
    const linkElement = element.querySelector('a[href*="/jobs/"], a[href*="/project/"]') || titleElement;
    const descriptionElement = element.querySelector('.description, .project-description, p, [class*="description"]');
    const budgetElement = element.querySelector('.budget, .price, [class*="budget"], [class*="price"], .amount');
    const tagsElements = element.querySelectorAll('.tag, .skill, .category, [class*="tag"], [class*="skill"]');
    const timeElement = element.querySelector('.time, .posted, .date, [class*="time"], [class*="date"]');
    
    if (!titleElement || !linkElement) return null;
    
    const title = titleElement.textContent?.trim() || titleElement.getAttribute('title') || '';
    const link = linkElement.getAttribute('href');
    const description = descriptionElement?.textContent?.trim() || '';
    const budget = budgetElement?.textContent?.trim() || '';
    const tags = Array.from(tagsElements).map(tag => tag.textContent?.trim()).filter(Boolean);
    const postedTime = timeElement?.textContent?.trim() || '';
    
    if (!title || !link) return null;
    
    const fullLink = link.startsWith('http') ? link : `https://www.workana.com${link}`;
    const projectId = extractProjectId(link) || generateProjectId(title, description);
    
    return {
      id: projectId,
      title,
      link: fullLink,
      description: description.substring(0, 500),
      budget,
      tags,
      postedTime,
      scrapedAt: new Date().toISOString(),
      source: 'workana'
    };
  } catch (error) {
    console.error('Error extracting project data:', error);
    return null;
  }
}

function scrapeFallbackProjects() {
  const projects = [];
  
  const allLinks = document.querySelectorAll('a[href*="/jobs/"], a[href*="/project/"]');
  
  allLinks.forEach((link, index) => {
    const title = link.textContent?.trim() || link.getAttribute('title') || `Project ${index + 1}`;
    const href = link.getAttribute('href');
    
    if (title && href && title.length > 5) {
      const fullLink = href.startsWith('http') ? href : `https://www.workana.com${href}`;
      const projectId = extractProjectId(href) || generateProjectId(title, '');
      
      const parentElement = link.closest('div, article, li, section');
      const description = parentElement?.textContent?.replace(title, '').trim().substring(0, 300) || '';
      
      projects.push({
        id: projectId,
        title,
        link: fullLink,
        description,
        budget: '',
        tags: [],
        postedTime: '',
        scrapedAt: new Date().toISOString(),
        source: 'workana-fallback'
      });
    }
  });
  
  return projects.slice(0, 20);
}

function extractProjectId(link) {
  const matches = link.match(/\/jobs\/([^\/]+)|\/project\/([^\/]+)|\/([0-9]+)/);
  return matches ? (matches[1] || matches[2] || matches[3]) : null;
}

function generateProjectId(title, description) {
  const text = (title + description).replace(/[^a-zA-Z0-9]/g, '');
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
}

function refreshViewer() {
  console.log('Refreshing viewer...');
  
  // Try multiple refresh strategies
  const refreshStrategies = [
    () => window.location.reload(),
    () => {
      const refreshBtn = document.querySelector('[class*="refresh"], [class*="reload"], button[title*="refresh"], button[title*="reload"]');
      if (refreshBtn) refreshBtn.click();
    },
    () => {
      const viewer = document.querySelector('.viewer, [class*="viewer"], .container, [class*="container"]');
      if (viewer) {
        viewer.style.opacity = '0.5';
        setTimeout(() => viewer.style.opacity = '1', 500);
      }
    }
  ];
  
  // Try refresh strategies in order
  for (const strategy of refreshStrategies) {
    try {
      strategy();
      break;
    } catch (e) {
      console.warn('Refresh strategy failed:', e);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scrapeProjects') {
    try {
      const targetPin = message.targetPin !== undefined ? message.targetPin - 1 : null; // Convert 1-based to 0-based
      const projects = scrapeWorkanaProjects(targetPin);
      console.log(`Scraped ${projects.length} projects from Workana`);
      
      chrome.runtime.sendMessage({
        action: 'projectsFound',
        projects: projects
      });
      
      sendResponse({success: true, projectCount: projects.length});
    } catch (error) {
      console.error('Error scraping projects:', error);
      sendResponse({success: false, error: error.message});
    }
  } else if (message.action === 'refreshViewer') {
    try {
      refreshViewer();
      sendResponse({success: true, message: 'Viewer refreshed'});
    } catch (error) {
      console.error('Error refreshing viewer:', error);
      sendResponse({success: false, error: error.message});
    }
  } else if (message.action === 'scrapeFourthPin') {
    try {
      refreshViewer();
      setTimeout(() => {
        const projects = scrapeWorkanaProjects(3); // 4th pin = index 3
        console.log(`Scraped 4th pin data:`, projects);
        
        chrome.runtime.sendMessage({
          action: 'projectsFound',
          projects: projects,
          source: 'fourthPin'
        });
        
        sendResponse({success: true, projectCount: projects.length, message: 'Fourth pin scraped after refresh'});
      }, 2000); // Wait for refresh to complete
    } catch (error) {
      console.error('Error scraping fourth pin:', error);
      sendResponse({success: false, error: error.message});
    }
  }
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      const hasNewProjects = Array.from(mutation.addedNodes).some(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        (node.matches?.('.project-item, .card-project, [class*="project"]') ||
         node.querySelector?.('.project-item, .card-project, [class*="project"]'))
      );
      
      if (hasNewProjects) {
        setTimeout(() => {
          const projects = scrapeWorkanaProjects();
          if (projects.length > 0) {
            chrome.runtime.sendMessage({
              action: 'projectsFound',
              projects: projects
            });
          }
        }, 1000);
      }
    }
  });
});

if (window.location.hostname === 'www.workana.com') {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  setTimeout(() => {
    const projects = scrapeWorkanaProjects();
    if (projects.length > 0) {
      chrome.runtime.sendMessage({
        action: 'projectsFound',
        projects: projects
      });
    }
  }, 2000);
}