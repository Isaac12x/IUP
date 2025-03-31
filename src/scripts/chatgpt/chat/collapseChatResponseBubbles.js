/**
 * Script to collapse ChatGPT response bubbles while keeping user messages expanded
 */
export const execute = () => {
  console.log("Executing: Collapse ChatGPT Response Bubbles");

  const collapseResponses = () => {
    // Find all article elements with the specific class
    const articles = document.querySelectorAll('article.text-token-text-primary');
    let lastUserMessage = null;
    let responsesToCollapse = [];

    articles.forEach(article => {
      // More precise selector for the h5 element
      const firstChild = article.querySelector('h5.sr-only');
      
      if (firstChild && firstChild.textContent.trim() === 'You said:') {
        // If we have responses to collapse from previous user message, create collapse div
        if (responsesToCollapse.length > 0) {
          createCollapseDiv(responsesToCollapse, lastUserMessage);
          responsesToCollapse = [];
        }
        lastUserMessage = article;
      } else {
        // Add non-user messages to collapse array
        responsesToCollapse.push(article);
      }
    });

    // Handle final set of responses if any
    if (responsesToCollapse.length > 0) {
      createCollapseDiv(responsesToCollapse, lastUserMessage);
    }
  };

  const createCollapseDiv = (responses, userMessage) => {
    // Create collapse container
    const container = document.createElement('div');
    container.className = 'collapsed-responses';
    container.style.cssText = `
      margin: 10px 0;
      padding: 10px;
      border-radius: 8px;
      background: rgba(0,0,0,0.1);
      cursor: pointer;
    `;

    // Add toggle functionality
    let isCollapsed = true;
    responses.forEach(response => {
      response.style.display = 'none';
      // Move response after user message
      if (userMessage && userMessage.nextSibling) {
        userMessage.parentNode.insertBefore(response, userMessage.nextSibling);
      }
    });

    // Create toggle button
    container.innerHTML = `<div>Show ${responses.length} ChatGPT Response${responses.length > 1 ? 's' : ''}</div>`;
    
    container.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      responses.forEach(response => {
        response.style.display = isCollapsed ? 'none' : '';
      });
      container.innerHTML = `<div>${isCollapsed ? 'Show' : 'Hide'} ${responses.length} ChatGPT Response${responses.length > 1 ? 's' : ''}</div>`;
    });

    // Insert container after user message
    if (userMessage && userMessage.nextSibling) {
      userMessage.parentNode.insertBefore(container, userMessage.nextSibling);
    }
  };

  // Initial collapse
  collapseResponses();

  // Watch for new messages
  const observer = new MutationObserver(() => {
    collapseResponses();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  return { success: true, observer };
};

export default execute;
