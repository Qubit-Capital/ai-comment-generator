// LinkedIn Comment Generator Content Script

// LinkedIn-specific functions
function getPostText(postElement) {
    if (!postElement) return '';
    
    const contentSelectors = [
        '.feed-shared-update-v2__description',
        '.feed-shared-text-view',
        '.feed-shared-inline-show-more-text',
        '.feed-shared-update__description',
        '.update-components-text',
        '[data-test-id="main-feed-activity-card__commentary"]'
    ];
    
    for (const selector of contentSelectors) {
        const element = postElement.querySelector(selector);
        if (element) {
            return element.textContent.trim();
        }
    }
    
    return '';
}

function preprocessPostText(text) {
    if (!text) return '';
    
    const parts = text.split(/~+|…more/).filter(Boolean);
    const uniqueParts = Array.from(new Set(parts));
    let cleanText = uniqueParts[0] || '';
    
    cleanText = cleanText
        .replace(/(?:^|\s)(?:#|@)[\w-]+/g, '')
        .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .replace(/https?:\/\/[^\s]+/g, '')
        .replace(/[^\w\s.,!?-]/g, ' ')
        .trim();
    
    return cleanText;
}

async function fetchCommentSuggestions(postText) {
    const cleanedText = preprocessPostText(postText);
    if (!cleanedText) {
        throw new Error('No valid text content found in post');
    }
    
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch('https://api-bcbe5a.stack.tryrelevance.com/latest/studios/e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c/trigger_limited', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    params: {
                        linked_in_post: cleanedText
                    },
                    project: "8cdcb88c-3a0b-44b1-915e-09454e18f5e5"
                })
            });
            
            if (response.status >= 500) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const text = await response.text();
            
            if (!response.ok) {
                throw new Error(`API request failed: ${text || response.statusText}`);
            }
            
            return parseApiResponse(text);
            
        } catch (error) {
            console.error(`Error in attempt ${attempt}:`, error);
            
            if (attempt === maxRetries) {
                throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

function parseApiResponse(responseText) {
    try {
        const response = JSON.parse(responseText);
        if (!response.output?.answer) {
            throw new Error('Invalid API response format');
        }

        const jsonStr = response.output.answer.replace(/```json\n|\n```/g, '');
        
        try {
            const commentsData = JSON.parse(jsonStr);
            
            if (!commentsData.comments || !Array.isArray(commentsData.comments)) {
                throw new Error('Invalid comments format');
            }

            const defaultTones = ['Neutral', 'Positive', 'Friendly', 'Curious', 'Enthusiastic'];
            
            return commentsData.comments.map((comment, index) => {
                let commentText = '';
                let commentTone = '';
                
                if (typeof comment === 'object') {
                    if (comment.text && comment.type) {
                        commentText = comment.text;
                        commentTone = comment.type;
                    } else if (comment.comment) {
                        commentText = comment.comment;
                        commentTone = defaultTones[index % defaultTones.length];
                    }
                } else if (typeof comment === 'string') {
                    commentText = comment;
                    commentTone = defaultTones[index % defaultTones.length];
                }
                
                return {
                    text: commentText || '',
                    tone: commentTone || defaultTones[index % defaultTones.length]
                };
            });

        } catch (innerError) {
            console.error('Error parsing comments JSON:', innerError);
            throw new Error('Failed to parse comments data');
        }
    } catch (error) {
        console.error('Error parsing API response:', error);
        throw new Error('Failed to parse API response');
    }
}

function findCommentField(button) {
    // First try to find the comment field within the post container
    const postContainer = button.closest('.feed-shared-update-v2, .feed-shared-post, .feed-shared-update, .main-feed-activity-card');
    if (!postContainer) return null;

    // Updated selectors for LinkedIn's new UI
    const commentFieldSelectors = [
        'div[contenteditable="true"]',
        'div[role="textbox"]',
        '.comments-comment-box__form-container div[contenteditable="true"]',
        '.comments-comment-texteditor__content',
        '[data-test-id="comments-comment-box__form-container"] [contenteditable="true"]',
        '.ql-editor',
        '.editor-content'
    ];

    for (const selector of commentFieldSelectors) {
        const field = postContainer.querySelector(selector);
        if (field) return field;
    }

    // If not found in post container, try finding in comment section
    const commentSection = postContainer.querySelector('.comments-comment-box, .feed-shared-comments-list');
    if (commentSection) {
        for (const selector of commentFieldSelectors) {
            const field = commentSection.querySelector(selector);
            if (field) return field;
        }
    }

    return null;
}

// Function to create the comment generator button
function createCommentButton() {
    const button = document.createElement('button');
    button.innerHTML = '💬 Generate Comment';
    button.className = 'comment-generator-button linkedin';
    
    // Add inline styles for guaranteed visibility
    button.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 1000 !important;
        position: relative !important;
        background-color: #0a66c2 !important;
        color: white !important;
        border: none !important;
        border-radius: 16px !important;
        padding: 6px 16px !important;
        margin: 8px !important;
        font-size: 14px !important;
        cursor: pointer !important;
        font-weight: 600 !important;
    `;

    button.addEventListener('mouseover', () => {
        button.style.backgroundColor = '#004182 !important';
    });

    button.addEventListener('mouseout', () => {
        button.style.backgroundColor = '#0a66c2 !important';
    });

    return button;
}

// Function to handle comment generation
async function handleCommentGeneration(postContent) {
    try {
        if (!postContent) {
            console.error('No post content found');
            showError('Could not find post content. Please try again.');
            return null;
        }

        console.log('Generating comment for post:', postContent);
        
        // Show loading state
        const button = document.querySelector('.comment-generator-button');
        const originalText = button.innerHTML;
        button.innerHTML = '⌛ Generating...';
        button.style.opacity = '0.7';
        button.disabled = true;

        const response = await chrome.runtime.sendMessage({
            action: 'generateComment',
            postText: postContent
        });

        console.log('Response from background:', response);
        
        // Reset button state
        button.innerHTML = originalText;
        button.style.opacity = '1';
        button.disabled = false;

        if (response && response.success && response.data) {
            return response.data;
        } else {
            const errorMessage = response?.error || 'Failed to generate comment';
            console.error('Error generating comment:', errorMessage);
            showError(errorMessage);
            return null;
        }
    } catch (error) {
        console.error('Error in comment generation:', error);
        showError('An unexpected error occurred. Please try again.');
        return null;
    }
}

// Helper function to show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'comment-generator-error';
    errorDiv.style.cssText = `
        color: #d93025;
        font-size: 12px;
        margin: 4px 16px;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: #fce8e6;
    `;
    errorDiv.textContent = message;

    const button = document.querySelector('.comment-generator-button');
    if (button) {
        const container = button.closest('.comment-generator-container');
        if (container) {
            // Remove any existing error messages
            const existingError = container.querySelector('.comment-generator-error');
            if (existingError) {
                existingError.remove();
            }
            container.appendChild(errorDiv);

            // Remove error message after 5 seconds
            setTimeout(() => {
                errorDiv.remove();
            }, 5000);
        }
    }
}

// Function to add button to comment field
function addButtonToCommentField(commentField) {
    // Check if button already exists
    if (!commentField || commentField.querySelector('.comment-generator-button')) {
        return;
    }

    console.log('Adding button to comment field:', commentField);

    const button = createCommentButton();
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'comment-generator-container';
    buttonContainer.style.cssText = `
        display: flex !important;
        align-items: center !important;
        margin: 8px 0 !important;
        padding: 0 16px !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;
    buttonContainer.appendChild(button);

    // Try multiple selectors for better compatibility
    const selectors = [
        '.comments-comment-box__form-container',
        '.comments-comment-texteditor',
        '[contenteditable="true"]',
        '.comments-comment-box',
        '.feed-shared-comment-box',
        '.comments-comment-box__comment-text',
        '.ember-view .comments-comment-box'
    ];

    let inserted = false;
    for (const selector of selectors) {
        const target = commentField.querySelector(selector);
        if (target) {
            console.log('Found target element:', selector);
            target.parentElement.insertBefore(buttonContainer, target);
            inserted = true;
            break;
        }
    }

    // Fallback: insert at the beginning of the comment field
    if (!inserted) {
        console.log('Using fallback insertion');
        commentField.insertBefore(buttonContainer, commentField.firstChild);
    }

    // Add click event listener
    button.addEventListener('click', async () => {
        const postContent = getPostContent();
        console.log('Clicked generate button. Post content:', postContent);
        const generatedComment = await handleCommentGeneration(postContent);
        
        if (generatedComment) {
            insertGeneratedComment(commentField, generatedComment);
        }
    });
}

// Function to get post content
function getPostContent() {
    // First try to get content from the closest post container
    const commentBox = document.activeElement.closest('.comments-comment-box, .comments-comment-texteditor');
    if (commentBox) {
        const postContainer = commentBox.closest([
            'article',
            '.feed-shared-update-v2',
            '.main-feed-activity-card',
            '.feed-shared-update',
            '.feed-shared-post',
            '.feed-shared-article',
            '.feed-shared-external-article',
            '.feed-shared-image',
            '.feed-shared-linkedin-video',
            '.feed-shared-text'
        ].join(','));

        if (postContainer) {
            console.log('Found post container:', postContainer);

            // Try to get text content from specific elements
            const contentSelectors = [
                // Main post content
                '.feed-shared-update-v2__description',
                '.feed-shared-text-view',
                '.feed-shared-text',
                '.feed-shared-mini-update-v2__description',
                '.feed-shared-text-view span[dir="ltr"]',
                
                // Article previews
                '.feed-shared-article__description',
                '.feed-shared-external-article__description',
                '.feed-shared-article__title',
                
                // LinkedIn specific content
                '.feed-shared-inline-show-more-text',
                '.feed-shared-update-v2__commentary',
                '.update-components-text',
                '.update-components-text span[dir="ltr"]',
                
                // Legacy selectors
                '.feed-shared-body',
                '.share-article__description',
                '.feed-shared-mini-article-list__description'
            ];

            for (const selector of contentSelectors) {
                const element = postContainer.querySelector(selector);
                if (element) {
                    const content = element.textContent.trim();
                    if (content) {
                        console.log('Found post content from selector:', selector);
                        console.log('Content:', content);
                        return content;
                    }
                }
            }

            // If no specific selector worked, try getting all text content from the post
            const allText = Array.from(postContainer.querySelectorAll('p, span[dir="ltr"], div[dir="ltr"]'))
                .map(el => el.textContent.trim())
                .filter(text => text.length > 0)
                .join(' ');

            if (allText) {
                console.log('Found post content from general text');
                console.log('Content:', allText);
                return allText;
            }
        }
    }

    console.log('No post content found');
    return '';
}

// Helper function to check if an element is visible
function isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Helper function to insert generated comment
function insertGeneratedComment(commentField, comment) {
    const selectors = [
        '[contenteditable="true"]',
        '.comments-comment-box__comment-text',
        '.ql-editor'
    ];

    for (const selector of selectors) {
        const editor = commentField.querySelector(selector);
        if (editor) {
            editor.textContent = comment;
            editor.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('Inserted comment:', comment);
            return;
        }
    }
    console.log('Could not find editor element');
}

// Function to observe DOM changes
function observeCommentFields() {
    console.log('Starting comment field observer');
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const commentFields = node.querySelectorAll([
                        '.comments-comment-box',
                        '.comments-comment-texteditor',
                        '.feed-shared-comment-box',
                        '.comments-comment-box__form-container'
                    ].join(','));
                    
                    commentFields.forEach(field => {
                        // Add a small delay to ensure DOM is ready
                        setTimeout(() => addButtonToCommentField(field), 100);
                    });
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Check for existing comment fields
    const existingFields = document.querySelectorAll([
        '.comments-comment-box',
        '.comments-comment-texteditor',
        '.feed-shared-comment-box',
        '.comments-comment-box__form-container'
    ].join(','));

    console.log('Found existing comment fields:', existingFields.length);
    existingFields.forEach(field => {
        addButtonToCommentField(field);
    });
}

// Start observing when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM Content Loaded - initializing');
        observeCommentFields();
    });
} else {
    console.log('Document already loaded - initializing');
    observeCommentFields();
}

// Add debug logging
console.log('LinkedIn Comment Generator: Content script loaded');
document.addEventListener('DOMContentLoaded', () => {
    console.log('LinkedIn Comment Generator: DOM Content Loaded');
});
