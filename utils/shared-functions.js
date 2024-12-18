// Shared utility functions for both LinkedIn and Breakcold extensions

/**
 * Shows a notification message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success' or 'error')
 */
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `comment-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Creates a loading spinner element
 * @returns {HTMLElement} The loading spinner element
 */
export function createLoadingSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
        <div class="spinner-dot"></div>
    `;
    return spinner;
}

/**
 * Creates a loading container with spinner and text
 * @param {string} loadingText - The text to display while loading
 * @returns {HTMLElement} The loading container element
 */
export function createLoadingContainer(loadingText = 'Generating comments...') {
    const container = document.createElement('div');
    container.className = 'loading-container';
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner-dot"></div>
            <div class="spinner-dot"></div>
            <div class="spinner-dot"></div>
            <div class="spinner-dot"></div>
        </div>
        <div class="loading-text">${loadingText}</div>
    `;
    return container;
}

/**
 * Creates or retrieves an existing modal
 * @param {string} className - The class name for the modal
 * @returns {HTMLElement} The modal element
 */
export function createOrGetModal(className = 'comment-modal') {
    let modal = document.querySelector(`.${className}`);
    if (!modal) {
        modal = document.createElement('div');
        modal.className = `${className} hidden`;
        document.body.appendChild(modal);
    }
    return modal;
}

/**
 * Shows the loading state in a modal
 * @param {HTMLElement} modal - The modal element
 */
export function showLoadingState(modal) {
    const loadingContainer = modal.querySelector('.loading-container');
    const errorMessage = modal.querySelector('.error-message');
    const commentsList = modal.querySelector('.comments-list');
    
    if (loadingContainer) loadingContainer.classList.remove('hidden');
    if (errorMessage) errorMessage.classList.add('hidden');
    if (commentsList) commentsList.innerHTML = '';
}

/**
 * Handles API errors and retries
 * @param {Error} error - The error object
 * @param {number} attempt - Current attempt number
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} A promise that resolves after the delay
 */
export async function handleApiError(error, attempt, maxRetries) {
    console.error(`Error in attempt ${attempt}:`, error);
    
    if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
    }
    
    const delay = 1000 * Math.pow(2, attempt - 1);
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {string} errorContext - Context for error message
 * @returns {Object} The parsed JSON object
 */
export function safeJsonParse(jsonString, errorContext = '') {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error(`Error parsing JSON ${errorContext}:`, error);
        throw new Error(`Failed to parse JSON ${errorContext}`);
    }
}
