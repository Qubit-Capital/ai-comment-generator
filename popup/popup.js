document.addEventListener('DOMContentLoaded', function() {
    const platformSelect = document.getElementById('platformSelect');
    const linkedinSection = document.getElementById('linkedinSection');
    const breakcoldSection = document.getElementById('breakcoldSection');
    
    // Platform detection and section display
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const url = tabs[0].url;
        if (url.includes('linkedin.com')) {
            platformSelect.value = 'linkedin';
            showLinkedInSection();
        } else if (url.includes('breakcold.com') || url.includes('app.breakcold.com')) {
            platformSelect.value = 'breakcold';
            showBreakcoldSection();
        }
    });
    
    // Platform selection handler
    platformSelect.addEventListener('change', function() {
        if (this.value === 'linkedin') {
            showLinkedInSection();
        } else {
            showBreakcoldSection();
        }
    });
    
    function showLinkedInSection() {
        linkedinSection.style.display = 'block';
        breakcoldSection.style.display = 'none';
    }
    
    function showBreakcoldSection() {
        linkedinSection.style.display = 'none';
        breakcoldSection.style.display = 'block';
    }
    
    // LinkedIn comment generation
    document.getElementById('generateLinkedinComment').addEventListener('click', function() {
        const prompt = document.getElementById('linkedinPrompt').value;
        chrome.runtime.sendMessage({
            type: 'generateComment',
            platform: 'linkedin',
            prompt: prompt
        }, handleGeneratedComment);
    });
    
    // Breakcold comment generation
    document.getElementById('generateBreakcoldComment').addEventListener('click', function() {
        const prompt = document.getElementById('breakcoldPrompt').value;
        chrome.runtime.sendMessage({
            type: 'generateComment',
            platform: 'breakcold',
            prompt: prompt
        }, handleGeneratedComment);
    });
    
    // Handle generated comment
    function handleGeneratedComment(response) {
        if (response && response.comment) {
            const generatedComment = document.getElementById('generatedComment');
            generatedComment.value = response.comment;
        }
    }
    
    // Copy to clipboard functionality
    document.getElementById('copyComment').addEventListener('click', function() {
        const generatedComment = document.getElementById('generatedComment');
        generatedComment.select();
        document.execCommand('copy');
    });
});
