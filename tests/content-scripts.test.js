// Tests for LinkedIn and Breakcold content scripts
import { JSDOM } from 'jsdom';

describe('LinkedIn Content Script Tests', () => {
    let dom;
    let document;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <div class="feed-shared-update-v2">
                <div class="feed-shared-text-view">Sample LinkedIn post content</div>
                <div class="comments-comment-box">
                    <div contenteditable="true"></div>
                </div>
            </div>
        `);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;
    });

    test('getPostText extracts LinkedIn post content correctly', () => {
        const postElement = document.querySelector('.feed-shared-update-v2');
        const text = getPostText(postElement);
        expect(text).toBe('Sample LinkedIn post content');
    });

    test('preprocessPostText cleans LinkedIn text correctly', () => {
        const dirtyText = '#hashtag @mention https://example.com Sample text 🎉';
        const cleanText = preprocessPostText(dirtyText);
        expect(cleanText).toBe('Sample text');
    });

    test('injectButtonForCommentField adds button to LinkedIn comment field', () => {
        const commentField = document.querySelector('[contenteditable="true"]');
        injectButtonForCommentField(commentField);
        const button = document.querySelector('.comment-generator-button.linkedin');
        expect(button).not.toBeNull();
    });
});

describe('Breakcold Content Script Tests', () => {
    let dom;
    let document;

    beforeEach(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <article class="flex flex-col">
                <div class="line-clamp-none">Sample Breakcold post content</div>
                <div class="w-full flex relative">
                    <textarea placeholder="Add a comment"></textarea>
                </div>
            </article>
        `);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;
    });

    test('getPostText extracts Breakcold post content correctly', () => {
        const button = document.createElement('button');
        const commentField = document.querySelector('textarea');
        commentField.parentElement.appendChild(button);
        const text = getPostText(button);
        expect(text).toBe('Sample Breakcold post content');
    });

    test('injectButtonForCommentField adds button to Breakcold comment field', () => {
        const commentField = document.querySelector('textarea');
        injectButtonForCommentField(commentField);
        const button = document.querySelector('.comment-generator-button.breakcold');
        expect(button).not.toBeNull();
    });
});

describe('Shared Functionality Tests', () => {
    let dom;
    let document;

    beforeEach(() => {
        dom = new JSDOM(`<!DOCTYPE html><body></body>`);
        document = dom.window.document;
        global.document = document;
        global.window = dom.window;
    });

    test('showNotification creates and removes notification', (done) => {
        showNotification('Test message', 'success');
        const notification = document.querySelector('.comment-notification');
        expect(notification).not.toBeNull();
        expect(notification.textContent).toBe('Test message');
        
        // Check if notification is removed after timeout
        setTimeout(() => {
            const removedNotification = document.querySelector('.comment-notification');
            expect(removedNotification).toBeNull();
            done();
        }, 3500);
    });

    test('createLoadingSpinner creates correct structure', () => {
        const spinner = createLoadingSpinner();
        expect(spinner.classList.contains('loading-spinner')).toBe(true);
        expect(spinner.querySelectorAll('.spinner-dot').length).toBe(4);
    });
});
