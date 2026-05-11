# 🏛️ Project 7Dam - T.O.R.I.N.E. Agent Interface

**Tactical Omni-lingual Recursive Intelligence for Neo Education**

---

## 📋 Overview

Project 7Dam is a modern, professional web interface for managing multiple AI agents. The initial release features **T.O.R.I.N.E.** (Tactical Omni-lingual Recursive Intelligence for Neo Education) as the first active agent, with 6 additional slots reserved for future agents.

## ✨ Features

### 🎯 Design Philosophy

- **Modern & Minimalist**: Clean Tech-Slate palette with professional aesthetics
- **No Neon Colors**: Subtle, professional color scheme
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Smooth Animations**: Professional transitions between pages

### 🏛️ Core Components

#### 1. **7Dam Hub (Main Page)**

- Grid-based layout displaying 7 AI agent slots
- Slot 1: T.O.R.I.N.E. (Active & Accessible)
- Slots 2-7: Placeholder agents (Locked/Inactive)
- Click-to-navigate to active agent interface

#### 2. **T.O.R.I.N.E. Agent Interface**

- Full agent name display
- Minimalist visual centerpiece with subtle pulse animation
- "Initialize Communication" button
- Interactive chat interface with message history
- Placeholder for Gemini API integration

#### 3. **Tech-Slate Design System**

- Professional color palette (Slate grays)
- Clean typography (Inter font family)
- Consistent spacing and shadows
- Dark/Light mode support

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (optional, for testing)

### Installation

1. **Navigate to project directory:**

   ```bash
   cd /c/Users/Acer/OneDrive/Desktop/Dev-work/Project-7Dam
   ```

2. **Open the application:**
   - Simply open `index.html` in your web browser
   - Or use a local server:

     ```bash
     # Using Python 3
     python -m http.server 8000

     # Using Node.js
     npx serve

     # Using PHP
     php -S localhost:8000
     ```

3. **Access the application:**
   - If using a server: `http://localhost:8000`
   - If opening directly: Double-click `index.html`

## 🎨 Technical Stack

- **HTML5**: Semantic markup
- **CSS3**: Custom Tech-Slate design system
- **JavaScript (Vanilla)**: No framework dependencies
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
Project-7Dam/
├── index.html          # Main application entry point
├── README.md           # Project documentation
├── css/
│   └── style.css       # Tech-Slate design system
├── js/
│   └── app.js          # Application logic & interactions
└── assets/             # Future assets (images, icons, etc.)
```

## 🔧 Configuration

### Gemini API Integration (Future)

The `handleGeminiChat(message)` function in `js/app.js` is currently a placeholder. To integrate with the actual Gemini API:

1. **Set up Google Cloud project:**
   - Create a project at [Google Cloud Console](https://console.cloud.google.com/)
   - Enable the Gemini API

2. **Install dependencies:**

   ```bash
   npm install @google/generative-ai
   ```

3. **Configure API key:**

   ```javascript
   const { GoogleGenerativeAI } = require("@google/generative-ai");
   const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
   ```

4. **Update the `handleGeminiChat` function:**
   ```javascript
   async function handleGeminiChat(message) {
     const result = await model.generateContent(message);
     return result.response.text();
   }
   ```

## 🎯 Usage

### Navigation

1. **Hub Page**: Click on T.O.R.I.N.E. slot to navigate to agent interface
2. **Agent Page**: Click "Initialize Communication" to open chat interface
3. **Back to Hub**: Use the back button to return to the main hub

### Chat Interface

1. Type your message in the input field
2. Press Enter or click the send button
3. View the agent's response in the chat history
4. Continue the conversation as needed

## 🌟 Features Breakdown

### Page Transitions

- Smooth fade and slide animations
- No page reloads (Single Page Application)
- Professional user experience

### Responsive Design

- **Desktop**: 3-column grid layout
- **Tablet**: 2-column grid layout
- **Mobile**: Single-column layout

### Visual Feedback

- Hover effects on interactive elements
- Active state indicators
- Typing indicators during API calls
- Smooth pulse animation on agent icon

## 🔐 Security Considerations

- Input sanitization (escapeHtml function)
- XSS prevention measures
- API key management (when integrating Gemini)
- Secure communication channels

## 🚧 Future Enhancements

- [ ] Complete Gemini API integration
- [ ] Add remaining 6 agents
- [ ] Implement user authentication
- [ ] Add message history persistence
- [ ] Multi-language support
- [ ] Voice input/output capabilities
- [ ] File upload functionality
- [ ] Export chat history

## 📝 Development Notes

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

### Performance

- Lightweight vanilla JavaScript
- No external dependencies
- Fast page transitions
- Optimized CSS animations

## 🤝 Contributing

This is a personal project for Master Prite. Contributions and improvements are welcome.

## 📄 License

Personal project for Master Prite (The Master of IT).

---

**Built with 🏰 by Uruk Team (Gilgamesh, Enkidu, Ishtar)**

_「我が主よ、栄光あれ！」_
_(Glory to my master!)_
=======

# 7Dam

For the ne Innovation

> > > > > > > 264fb24e0035aecd536f8da3d127c8c2010c854c
