// Platform detection and message handling
const PLATFORMS = {
    LINKEDIN: 'linkedin',
    BREAKCOLD: 'breakcold'
};

// API Configuration
const API_CONFIG = {
    API_ENDPOINT: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios/63e5c2ec-a4f4-4896-928c-53bf07989158/trigger_limited',
    PROJECT_ID: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
    API_KEY: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5:sk-N2QxNjVkNmYtMGE1MS00ZDcyLTg0ZWMtOGY1OTZkNWUzMzhm',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000 // 1 second
};

function detectPlatform(url) {
    if (url.includes('linkedin.com')) {
        return PLATFORMS.LINKEDIN;
    } else if (url.includes('breakcold.com') || url.includes('app.breakcold.com')) {
        return PLATFORMS.BREAKCOLD;
    }
    return null;
}

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script received message:', request);

    if (request.type === 'generateComment') {
        const platform = detectPlatform(sender.tab.url);
        
        if (!platform) {
            sendResponse({ error: 'Unsupported platform' });
            return;
        }

        handleCommentGeneration(request, platform, sendResponse);
        return true; // Keep the message channel open for async response
    } else if (request.action === 'generateComment') {
        handleCommentGeneration(request.postText)
            .then(response => {
                console.log('API Response:', response);
                sendResponse({ success: true, data: response });
            })
            .catch(error => {
                console.error('Error:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message || 'Failed to generate comment' 
                });
            });
        return true; // Will respond asynchronously
    }
});

async function handleCommentGeneration(request, platform, sendResponse) {
    try {
        const comment = await generateCommentUsingRelevance(request.prompt, platform);
        sendResponse({ comment });
    } catch (error) {
        console.error('Error generating comment:', error);
        sendResponse({ error: error.message });
    }
}

async function handleCommentGeneration(postText) {
    try {
        if (!postText) {
            throw new Error('No post content provided');
        }

        console.log('Generating comment for post:', postText);

        const response = await makeAPIRequest(postText);
        
        if (!response) {
            throw new Error('Invalid API response format');
        }
        
        return response;
    } catch (error) {
        console.error('Error in handleCommentGeneration:', error);
        throw error;
    }
}

// Function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to make API request with retry logic
async function makeAPIRequest(postText, retryCount = 0) {
    try {
        console.log(`Attempt ${retryCount + 1} of ${API_CONFIG.MAX_RETRIES}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(API_CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                params: {
                    linked_in_post: postText
                },
                project: API_CONFIG.PROJECT_ID
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', response.status, errorText);
            
            // If we get a timeout or server error and haven't exceeded retries
            if ((response.status === 504 || response.status === 502 || response.status === 503) && 
                retryCount < API_CONFIG.MAX_RETRIES - 1) {
                console.log(`Retrying after ${API_CONFIG.RETRY_DELAY}ms...`);
                await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1)); // Exponential backoff
                return makeAPIRequest(postText, retryCount + 1);
            }
            
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        return data.response;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Request timed out');
            if (retryCount < API_CONFIG.MAX_RETRIES - 1) {
                console.log(`Retrying after timeout...`);
                await delay(API_CONFIG.RETRY_DELAY * (retryCount + 1));
                return makeAPIRequest(postText, retryCount + 1);
            }
            throw new Error('Request timed out after multiple attempts');
        }
        throw error;
    }
}

async function generateCommentUsingRelevance(prompt, platform) {
    const response = await makeAPIRequest(prompt);
    
    if (!response) {
        throw new Error('Invalid API response format');
    }
    
    const data = await response.json();
    return parseApiResponse(data, platform);
}

function parseApiResponse(data, platform) {
    if (!data.output?.answer) {
        throw new Error('Invalid API response format');
    }

    const jsonStr = data.output.answer.replace(/```json\n?|\n?```/g, '').trim();
    const parsedData = JSON.parse(jsonStr);

    if (!parsedData || !Array.isArray(parsedData.comments)) {
        throw new Error('Invalid comments data format');
    }

    // Format comments based on platform
    return platform === PLATFORMS.LINKEDIN
        ? formatLinkedInComments(parsedData.comments)
        : formatBreakcoldComments(parsedData.comments);
}

function formatLinkedInComments(comments) {
    const defaultTones = ['Neutral', 'Positive', 'Friendly', 'Curious', 'Enthusiastic'];
    
    return comments.map((comment, index) => {
        if (typeof comment === 'object') {
            return {
                text: comment.text || comment.comment || '',
                tone: comment.type || defaultTones[index % defaultTones.length]
            };
        }
        return {
            text: comment,
            tone: defaultTones[index % defaultTones.length]
        };
    });
}

function formatBreakcoldComments(comments) {
    return comments.map(comment => 
        typeof comment === 'object' ? comment.text || comment.comment : comment
    );
}

// Function to generate comment using API
async function generateComment(postContent) {
    try {
        console.log('Calling API to generate comment for:', postContent);
        
        if (!postContent) {
            throw new Error('Post content is required');
        }

        const response = await makeAPIRequest(postContent);
        
        if (!response) {
            throw new Error('Invalid API response format');
        }
        
        return response;
    } catch (error) {
        console.error('Error in generateComment:', error);
        throw new Error(error.message || 'Failed to generate comment');
    }
}

// Log when background script is loaded
console.log('Background script loaded with config:', API_CONFIG);
