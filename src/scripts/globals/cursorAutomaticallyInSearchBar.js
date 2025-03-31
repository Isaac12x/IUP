/**
 * Script to automatically focus the cursor in a website's search bar if one exists
 */
export const execute = () => {
  console.log("Executing: Auto-focus Search Bar");

  // Common search input selectors
  const searchSelectors = [
    'input[type="search"]',
    'input[name="q"]',
    'input[name="search"]',
    'input[placeholder*="search" i]',
    'input[placeholder*="find" i]',
    'input[aria-label*="search" i]',
    '.search-input',
    '#search',
    '#searchbox',
    '.searchbox',
    
    // Site-specific selectors
    'textarea[name="q"]', // Modern Google search that uses textarea
    'input[title="Search"]',
    'input#search',
    'input[name="search_query"]', // YouTube
    'input.search-query',
    'input[role="search"]',
    'input[name="s"]', // WordPress and others
    'input.header-search-input' // GitHub style
  ];

  // Try to find and focus the search input
  const focusSearchBar = () => {
    for (const selector of searchSelectors) {
      const searchInput = document.querySelector(selector);
      if (searchInput) {
        // Don't focus if it's hidden or disabled
        if (searchInput.offsetParent !== null && !searchInput.disabled) {
          searchInput.focus();
          return true;
        }
      }
    }
    return false;
  };

  // Try immediately
  let focused = focusSearchBar();

  // If not found, watch for dynamic content
  if (!focused) {
    const observer = new MutationObserver(() => {
      if (!focused) {
        focused = focusSearchBar();
        if (focused) {
          observer.disconnect();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return { success: true, observer };
  }

  return { success: true };
};

export default execute;
