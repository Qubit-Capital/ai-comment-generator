// Breakcold Comment Generator Content Script

// Import shared utilities (will be created later)
import { showNotification, createLoadingSpinner } from '../utils/shared-functions.js';

// Breakcold-specific functions
function getPostText(button) {
    try {
        const commentField = button.parentElement;
        if (!commentField) {
            throw new Error('Could not find comment field');
        }

        let currentElement = commentField;
        let postContainer = null;

        while (currentElement && !postContainer) {
            if (currentElement.matches('article') || 
                currentElement.matches('.flex.flex-col')) {
                postContainer = currentElement;
                break;
            }
            currentElement = currentElement.parentElement;
        }

        if (!postContainer) {
            throw new Error('Could not find post container');
        }

        const contentContainer = postContainer.querySelector('.line-clamp-none') || 
                               postContainer.querySelector('[class*="text-black dark:text-white text-sm break-words"]');

        if (!contentContainer) {
            throw new Error('Could not find content container');
        }

        const textContent = Array.from(contentContainer.childNodes)
            .filter(node => {
                if (node.nodeType === Node.TEXT_NODE) return true;
                if (node.nodeType === Node.ELEMENT_NODE) {
                    return !node.matches('button, a, [class*="cursor-pointer"]');
                }
                return false;
            })
            .map(node => node.textContent.trim())
            .filter(text => text)
            .join(' ');

        const image = postContainer.querySelector('img:not([alt=""])');
        const imageAlt = image ? image.alt : '';

        const postText = [textContent, imageAlt].filter(Boolean).join(' ').trim();

        if (!postText) {
            throw new Error('Could not find post content');
        }

        return postText;
    } catch (error) {
        console.error('Error in getPostText:', error);
        throw error;
    }
}

async function fetchCommentSuggestions(postText) {
    const API_CONFIG = {
        studioId: 'e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c',
        projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
        baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios'
    };
    
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const apiUrl = `${API_CONFIG.baseUrl}/${API_CONFIG.studioId}/trigger_limited`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "params": {
                        "linked_in_post": postText
                    },
                    "project": API_CONFIG.projectId
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.output || !data.output.answer) {
                throw new Error('Invalid API response format');
            }

            let parsedAnswer = JSON.parse(data.output.answer.replace(/```json\n?|\n?```/g, '').trim());
            
            if (!parsedAnswer || !Array.isArray(parsedAnswer.comments)) {
                throw new Error('Invalid comments data format');
            }

            return parsedAnswer.comments;

        } catch (error) {
            console.error(`Error in attempt ${attempt}:`, error);
            if (attempt === maxRetries) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

function createCommentButton() {
    const button = document.createElement('button');
    button.className = 'comment-generator-button breakcold';
    button.innerHTML = `
        <span class="icon">✨</span>
    `;
    
    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = 'rgba(100, 116, 139, 0.1)';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = 'transparent';
    });
    
    button.addEventListener('click', handleCommentGeneration);
    return button;
}

function injectButtonForCommentField(commentField) {
    if (!commentField.matches('textarea[placeholder*="Add a comment"]')) return;
    
    const container = commentField.closest('.w-full.flex.relative');
    if (!container) return;
    
    const existingButton = container.querySelector('.comment-generator-button');
    if (existingButton) return;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'comment-generator-container';
    
    const button = createCommentButton();
    buttonContainer.appendChild(button);
    
    const emojiButton = container.querySelector('button[aria-haspopup="dialog"]');
    if (emojiButton) {
        emojiButton.parentElement.insertBefore(buttonContainer, emojiButton);
    } else {
        container.appendChild(buttonContainer);
    }
}

function initializeButtonInjection() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const commentFields = node.querySelectorAll('textarea[placeholder*="Add a comment"]');
                    commentFields.forEach(injectButtonForCommentField);
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    document.querySelectorAll('textarea[placeholder*="Add a comment"]')
        .forEach(injectButtonForCommentField);
}

// Initialize when the document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtonInjection);
} else {
    initializeButtonInjection();
}
