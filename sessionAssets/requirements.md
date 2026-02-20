# Implementation Plan: AI Chatbot Application

## Problem Statement
Build a lightweight, fast-loading chatbot application for 3 whitelisted users that provides a general-purpose AI assistant interface. The application must prioritize speed, usability, and simplicity with local conversation storage and Azure hosting.

## Approach
1. Start with minimal viable architecture (frontend + backend proxy)
2. Implement core chat functionality first
3. Add conversation management features
4. Optimize for performance and mobile usability
5. Deploy using GitHub Actions CI/CD pipeline

## Technology Decisions

### Frontend
- **Technology**: Plain TypeScript (no framework)
- **Browser Target**: Modern browsers only (Chrome/Firefox/Safari/Edge latest) - use ES2022+, modern CSS
- **Storage**: IndexedDB via idb library
- **Markdown**: marked.js
- **Syntax Highlighting**: highlight.js
- **Build Tool**: Vite for fast builds and dev server (no polyfills needed)

### Backend
- **Runtime**: Azure Functions (Node.js)
- **LLM**: Azure OpenAI Service
- **Auth**: Azure Static Web Apps built-in authentication + custom whitelist validation
- **Logging**: Azure Application Insights

### Hosting
- **Frontend**: Azure Static Web Apps (includes CDN, SSL, auth integration)
- **Backend**: Azure Functions (integrated with Static Web Apps)
- **CI/CD**: GitHub Actions

## Implementation Todos

Todos are tracked in the SQL database. See SQL queries below for current status.

### Phase 1: Project Setup & Infrastructure
- `setup-repo`: Initialize project repository structure
- `setup-frontend-build`: Configure Vite build system for TypeScript
- `setup-azure-resources`: Create Azure resources (Static Web App, Functions, OpenAI)
- `setup-github-actions`: Create CI/CD pipeline for automated deployment
- `setup-env-config`: Configure environment variables and secrets

### Phase 2: Authentication
- `implement-google-oauth`: Integrate Google OAuth via Azure Static Web Apps
- `implement-whitelist`: Backend whitelist validation for 3 users
- `implement-auth-ui`: Login/logout UI components
- `test-auth-flow`: End-to-end authentication testing

### Phase 3: Backend API
- `implement-chat-stream`: Azure Function for streaming LLM responses
- `implement-title-gen`: Azure Function for conversation title generation
- `implement-user-endpoint`: Azure Function to validate/get user info
- `implement-error-handling`: Error handling and logging
- `test-backend-apis`: Backend API testing

### Phase 4: Core Frontend - Data Layer
- `implement-indexeddb`: IndexedDB schema and wrapper functions
- `implement-conversation-store`: Conversation CRUD operations
- `implement-message-store`: Message CRUD operations
- `test-data-layer`: Data layer unit tests

### Phase 5: Core Frontend - UI Components
- `implement-chat-interface`: Main chat input and message display
- `implement-streaming-display`: Real-time token streaming UI
- `implement-markdown-renderer`: Markdown and code block rendering
- `implement-message-actions`: Copy to clipboard, edit message
- `test-chat-ui`: Chat interface testing

### Phase 6: Conversation Management
- `implement-conversation-list`: Sidebar with conversation list
- `implement-new-conversation`: Create new conversation flow
- `implement-switch-conversation`: Load and display selected conversation
- `implement-delete-conversation`: Delete conversation functionality
- `implement-conversation-naming`: Auto-naming via LLM
- `test-conversation-mgmt`: Conversation management testing

### Phase 7: Mobile Optimizations
- `implement-responsive-layout`: Mobile-first responsive CSS
- `implement-swipe-gestures`: Swipe between conversations on mobile
- `implement-mobile-ui`: Mobile-specific UI adjustments
- `test-mobile-experience`: Mobile device testing (iOS/Android)

### Phase 8: Performance Optimization
- `optimize-bundle-size`: Code splitting, tree shaking, minification
- `implement-lazy-loading`: Lazy load conversations and messages
- `optimize-caching`: Browser caching headers and service worker (optional)
- `performance-testing`: Load time and responsiveness testing

### Phase 9: Polish & Nice-to-Haves
- `implement-dark-theme`: Dark mode styling
- `implement-usage-stats`: Usage tracking and display (if time permits)
- `implement-keyboard-shortcuts`: Keyboard navigation (desktop)
- `accessibility-review`: Basic accessibility improvements

### Phase 10: Deployment & Documentation
- `deploy-production`: Production deployment to Azure
- `create-user-guide`: Simple user guide for the 3 users
- `create-dev-docs`: Developer documentation for future maintenance
- `final-testing`: End-to-end production testing

## Dependencies

Key dependencies between phases:
- Phase 2 (Auth) must complete before Phase 3 (Backend API)
- Phase 3 (Backend API) must complete before Phase 5 (Chat UI)
- Phase 4 (Data Layer) must complete before Phase 5 (Chat UI)
- Phase 5 (Chat UI) must complete before Phase 6 (Conversation Management)
- Phase 6 (Conversation Management) must complete before Phase 7 (Mobile)

## Notes

### Architecture Decisions
1. **Hosting Choice**: Azure Static Web Apps provides the best balance of features (built-in auth, CDN, SSL) and cost for this use case
2. **Streaming**: Use Server-Sent Events (SSE) instead of WebSockets for simpler implementation
3. **No Backend Database**: Local-only storage simplifies architecture and reduces costs
4. **TypeScript**: Chosen over framework for minimal bundle size and direct control
5. **Modern Browser Target**: No legacy browser support needed - use ES2022+, CSS Grid, CSS Variables, async/await, optional chaining, etc. without transpilation to ES5

### Performance Targets
- Initial load: < 2 seconds
- First response token: < 1 second
- Conversation switch: < 200ms

### Cost Considerations
- Azure Static Web Apps: Free tier (100 GB/month bandwidth)
- Azure Functions: Consumption plan (~$0.20 per million executions)
- Azure OpenAI: Pay per token usage
- Total estimated cost: ~$20-50/month for 3 users with moderate usage

### Risk Mitigation
- **Risk**: IndexedDB quota limitations
  - **Mitigation**: Implement quota monitoring and user warnings
- **Risk**: Azure OpenAI rate limits
  - **Mitigation**: Implement retry logic with exponential backoff
- **Risk**: Poor mobile performance
  - **Mitigation**: Early mobile testing and progressive enhancement
- **Risk**: Azure Functions cold starts (1-3 seconds after inactivity)
  - **Mitigation**: Accept occasional delays on first API call. Frontend loads instantly from CDN.

## Next Steps

1. Review Requirements.md and this plan
2. Get approval to proceed with implementation
3. Start with Phase 1: Project Setup & Infrastructure
4. Iterate through phases sequentially, testing along the way
