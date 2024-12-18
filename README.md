# AI Comment Generator Extension

A powerful Chrome extension that provides AI-powered comment generation for both LinkedIn and Breakcold platforms. This extension helps users generate contextually relevant and engaging comments with a single click.

## Features

- **Multi-Platform Support**
  - LinkedIn comment generation
  - Breakcold comment generation
  - Automatic platform detection
  - Platform-specific UI/UX

- **Smart Comment Generation**
  - Context-aware comments based on post content
  - Multiple comment suggestions
  - Different comment tones (LinkedIn)
  - One-click comment insertion

- **User Interface**
  - Clean, modern design
  - Platform-specific styling
  - Dark mode support (Breakcold)
  - Loading indicators and notifications

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/ai-comment-generator.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extension directory

## Project Structure

```
ai-comment-generator/
├── manifest.json           # Extension configuration
├── background.js          # Background script with platform detection
├── content/              # Platform-specific content scripts
│   ├── linkedin-content.js
│   └── breakcold-content.js
├── popup/               # Extension popup
│   ├── popup.html
│   └── popup.js
├── styles/             # Platform-specific styles
│   ├── common.css
│   ├── linkedin.css
│   └── breakcold.css
├── utils/              # Shared utilities
│   └── shared-functions.js
├── db/                 # Database operations
│   ├── models/
│   └── schemas/
└── tests/              # Test files
    ├── content-scripts.test.js
    └── api-utils.test.js
```

## Usage

1. **LinkedIn Comments**
   - Navigate to any LinkedIn post
   - Click the "✨ Generate Comment" button below the comment box
   - Select from multiple generated comments with different tones
   - Click a comment to insert it into the comment box

2. **Breakcold Comments**
   - Navigate to any Breakcold post
   - Click the "✨" button next to the comment box
   - Select from generated comments
   - Click to insert the selected comment

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Chrome browser

### Setup Development Environment
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

### Testing
The project includes comprehensive tests for both platforms:
- Content script functionality
- API integration
- Utility functions
- Platform-specific features

Run tests with:
```bash
npm test
```

## API Integration

The extension uses a unified API endpoint for both platforms:
```javascript
const API_CONFIG = {
    studioId: 'e24e0d8f-55bc-42b3-b4c0-ef86b7f9746c',
    projectId: '8cdcb88c-3a0b-44b1-915e-09454e18f5e5',
    baseUrl: 'https://api-bcbe5a.stack.tryrelevance.com/latest/studios'
};
```

API responses are formatted differently for each platform:
- LinkedIn: Includes comment text and tone
- Breakcold: Simple comment text

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- LinkedIn platform integration
- Breakcold platform integration
- AI-powered comment generation service

## Support

For support, please open an issue in the GitHub repository or contact the development team.
