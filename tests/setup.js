// Mock Chrome API
global.chrome = {
    runtime: {
        onMessage: {
            addListener: jest.fn()
        },
        sendMessage: jest.fn()
    },
    tabs: {
        query: jest.fn()
    }
};

// Mock fetch API
global.fetch = jest.fn();

// Mock DOM APIs not available in jsdom
if (typeof window !== 'undefined') {
    window.matchMedia = window.matchMedia || function() {
        return {
            matches: false,
            addListener: function() {},
            removeListener: function() {}
        };
    };
}

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});
