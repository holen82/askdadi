# Detailed Task List: AI Chatbot Application

## Task Structure
Each task follows this format:
- **ID**: Unique identifier
- **Description**: What needs to be done
- **Implementation Steps**: Key actions
- **Verification**: How to confirm completion
- **Dependencies**: What must be done first

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Repository Structure

#### Task: init-repo-structure
**Description**: Create base folder structure for the project
**Steps**:
1. Create `/frontend` folder with subfolders: `/src`, `/public`, `/src/styles`, `/src/utils`, `/src/types`
2. Create `/backend` folder with subfolders: `/functions`, `/shared`
3. Create `/docs` folder
4. Create root `.gitignore` file with Node.js, Azure, and IDE patterns
**Verify**:
- Run `ls -R` to confirm folder structure exists
- Verify `.gitignore` contains node_modules, .env, dist, .azure patterns
**Dependencies**: None

#### Task: init-package-json
**Description**: Initialize package.json for frontend
**Steps**:
1. Navigate to `/frontend`
2. Run `npm init -y`
3. Update name, version, description fields
4. Set type to "module"
**Verify**:
- `frontend/package.json` exists
- Contains correct project name and type field
**Dependencies**: init-repo-structure

#### Task: install-frontend-deps
**Description**: Install frontend dependencies
**Steps**:
1. Install dev dependencies: `npm install -D vite typescript @types/node`
2. Install runtime dependencies: `npm install idb marked highlight.js`
3. Verify package.json and package-lock.json updated
**Verify**:
- Run `npm list` - all packages shown
- `node_modules` folder exists
- No installation errors
**Dependencies**: init-package-json

#### Task: config-typescript
**Description**: Configure TypeScript for frontend
**Steps**:
1. Create `frontend/tsconfig.json`
2. Set target to ES2022, module to ESNext
3. Enable strict mode, skipLibCheck
4. Set moduleResolution to bundler
5. Include src folder, exclude node_modules and dist
**Verify**:
- Run `npx tsc --noEmit` - should complete without errors
- tsconfig.json is valid JSON
**Dependencies**: install-frontend-deps

#### Task: config-vite
**Description**: Configure Vite build tool
**Steps**:
1. Create `frontend/vite.config.ts`
2. Configure build output to `dist`
3. Set base path for Azure Static Web Apps
4. Configure dev server on port 3000
5. Add TypeScript path resolution
**Verify**:
- Run `npm run dev` (after adding script to package.json)
- Should start dev server without errors
**Dependencies**: config-typescript

#### Task: add-npm-scripts
**Description**: Add build and dev scripts to package.json
**Steps**:
1. Add `"dev": "vite"` script
2. Add `"build": "tsc && vite build"` script
3. Add `"preview": "vite preview"` script
4. Add `"type-check": "tsc --noEmit"` script
**Verify**:
- Run `npm run type-check` - completes successfully
- Run `npm run dev` - starts dev server
**Dependencies**: config-vite

#### Task: create-html-entry
**Description**: Create index.html entry point
**Steps**:
1. Create `frontend/index.html`
2. Add HTML5 doctype, meta tags (viewport, charset)
3. Add title "AI Assistant"
4. Add empty `<div id="app"></div>`
5. Add script tag: `<script type="module" src="/src/main.ts"></script>`
**Verify**:
- HTML validates (use W3C validator or check in browser)
- No console errors when loaded
**Dependencies**: config-vite

#### Task: create-main-ts
**Description**: Create main TypeScript entry point
**Steps**:
1. Create `frontend/src/main.ts`
2. Add console.log("App loaded")
3. Add comment "// TODO: Initialize app"
**Verify**:
- Run `npm run dev` and open browser
- Console shows "App loaded" message
- No TypeScript errors
**Dependencies**: create-html-entry

### 1.2 Azure Resources Setup (Manual)

#### Task: document-azure-setup-instructions
**Description**: Create comprehensive Azure resource setup guide
**Steps**:
1. Create `docs/azure-setup-guide.md`
2. Document resource group creation steps
3. Document Static Web App creation (Free tier, link to GitHub, build folder: `frontend/dist`)
4. Document Function App creation (Node.js 18, Consumption plan)
5. Document Azure OpenAI Service setup (request access, deploy gpt-4 model)
6. Document Application Insights creation
7. Include screenshots/CLI commands for each step
8. Document required configuration values to note
**Verify**:
- File exists with complete instructions
- All steps clearly explained
- CLI and Portal instructions included
**Dependencies**: None

#### Task: verify-resource-group-created
**Description**: Verify user has created Azure resource group
**Steps**:
1. User should have created resource group (suggested name: `rg-chatbot-app`)
2. Verify by checking if resource group name is known
3. Document the actual resource group name in `docs/azure-resources.md`
**Verify**:
- User confirms resource group exists
- Resource group name documented
**Dependencies**: document-azure-setup-instructions

#### Task: verify-static-web-app-created
**Description**: Verify Azure Static Web App is provisioned
**Steps**:
1. User should have created Static Web App (Free tier)
2. Verify deployment URL is accessible
3. Check if GitHub Actions workflow was auto-created in repo
4. Document Static Web App name and URL in `docs/azure-resources.md`
5. Note the deployment token for GitHub secrets
**Verify**:
- Static Web App URL accessible (may show placeholder)
- GitHub Actions workflow file exists in `.github/workflows/`
- Deployment URL and name documented
**Dependencies**: verify-resource-group-created

#### Task: verify-function-app-created
**Description**: Verify Azure Functions app is created
**Steps**:
1. User should have created Function App (Node.js 18, Consumption plan)
2. Function App should be linked to Static Web App
3. Document Function App name and URL in `docs/azure-resources.md`
4. Note publish profile for GitHub secrets
**Verify**:
- Function App appears in Azure Portal
- Runtime is Node.js 18
- Configuration documented
**Dependencies**: verify-resource-group-created

#### Task: verify-openai-resource-created
**Description**: Verify Azure OpenAI Service is set up
**Steps**:
1. User should have created Azure OpenAI resource
2. GPT-4 model should be deployed
3. Document endpoint URL in `docs/azure-resources.md`
4. Verify user has noted the API key (don't store in docs)
5. Confirm region supports GPT-4
**Verify**:
- OpenAI resource exists and shows "Succeeded"
- Model deployment shows "Succeeded"
- Endpoint URL documented (no keys in docs)
**Dependencies**: verify-resource-group-created

#### Task: verify-app-insights-created
**Description**: Verify Application Insights is configured
**Steps**:
1. User should have created Application Insights
2. Should be linked to Function App
3. Document instrumentation key location in `docs/azure-resources.md`
4. Verify connection string is accessible
**Verify**:
- Application Insights resource exists
- Connection string visible in Portal
- Link to Function App confirmed
**Dependencies**: verify-resource-group-created

#### Task: document-azure-config
**Description**: Compile all Azure resource configurations
**Steps**:
1. Create/update `docs/azure-resources.md`
2. List all resource names, IDs, endpoints (no secrets)
3. Document configuration settings
4. Add architecture diagram (text-based)
5. Include links to Azure Portal pages
**Verify**:
- File exists with all resource info
- All endpoints and names documented
- No secrets stored in file
**Dependencies**: verify-app-insights-created

### 1.3 GitHub Actions CI/CD

#### Task: create-frontend-workflow
**Description**: Create GitHub Actions workflow for frontend
**Steps**:
1. Check if workflow file was auto-created by Azure Static Web App
2. If not, create `.github/workflows/deploy-frontend.yml`
3. Configure trigger on push to main branch
4. Add job: build frontend with Node.js 18
5. Add step: npm install and build
6. Add step: deploy to Azure Static Web App using deployment token
**Verify**:
- Workflow file is valid YAML
- Uses Static Web App deployment token from secrets
- Workflow syntax validates
**Dependencies**: verify-static-web-app-created

#### Task: create-backend-workflow
**Description**: Create GitHub Actions workflow for backend
**Steps**:
1. Create `.github/workflows/deploy-backend.yml`
2. Trigger on push to main when backend/ files change
3. Add job: build and deploy Azure Functions
4. Add Azure login step
5. Add function app deployment step
**Verify**:
- Workflow file is valid YAML
- Workflow syntax check passes
**Dependencies**: create-function-app

#### Task: add-workflow-secrets
**Description**: Configure GitHub repository secrets
**Steps**:
1. Go to GitHub repo Settings > Secrets
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Static Web App settings)
3. Add `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (from Function App)
4. Add `AZURE_OPENAI_KEY` (from Azure OpenAI resource)
5. Add `AZURE_OPENAI_ENDPOINT` (from Azure OpenAI resource)
**Verify**:
- All secrets visible in Settings (values masked)
- No plaintext secrets in repository
- User confirms secrets are correctly copied
**Dependencies**: verify-static-web-app-created, verify-openai-resource-created

#### Task: test-cicd-pipeline
**Description**: Validate end-to-end CI/CD pipeline
**Steps**:
1. Make a small change to frontend/src/main.ts
2. Commit and push to main branch
3. Monitor GitHub Actions workflow
4. Check deployment status
5. Verify deployment URL shows changes
**Verify**:
- Workflow completes successfully
- Deployment URL serves updated app
- No errors in workflow logs
**Dependencies**: create-frontend-workflow, add-workflow-secrets

### 1.4 Environment Configuration

#### Task: create-env-template
**Description**: Create environment variable templates
**Steps**:
1. Create `frontend/.env.example` with placeholder values
2. Create `backend/.env.example` with placeholder values
3. List all required variables with descriptions
4. Add .env files to .gitignore
**Verify**:
- .env.example files exist and documented
- .env files not tracked by git
**Dependencies**: init-repo-structure

#### Task: document-function-settings-instructions
**Description**: Document required Function App settings
**Steps**:
1. Create section in `docs/azure-setup-guide.md` for Function App configuration
2. List required settings: `AZURE_OPENAI_KEY`, `AZURE_OPENAI_ENDPOINT`, `WHITELISTED_EMAILS`
3. Document where to find values (Azure OpenAI Keys page)
4. Document format for WHITELISTED_EMAILS (comma-separated)
5. Include screenshots/steps to add settings in Portal
**Verify**:
- Configuration instructions clear
- All required settings documented
**Dependencies**: verify-function-app-created

#### Task: verify-function-settings-configured
**Description**: Verify user has configured Function App settings
**Steps**:
1. User should have added all required settings in Azure Portal
2. Verify settings are documented (values not stored)
3. Confirm WHITELISTED_EMAILS contains the 3 allowed users
4. Test settings are accessible by Function App
**Verify**:
- User confirms settings added
- Settings visible in Portal (values masked)
- WHITELISTED_EMAILS format correct
**Dependencies**: document-function-settings-instructions

#### Task: document-auth-configuration-instructions
**Description**: Document authentication setup instructions
**Steps**:
1. Add section to `docs/azure-setup-guide.md` for authentication
2. Document how to enable Google OAuth in Static Web App
3. Document that whitelist validation happens in backend
4. Include steps to test login flow
**Verify**:
- Auth configuration steps documented
- Clear instructions provided
**Dependencies**: verify-static-web-app-created

#### Task: verify-auth-configured
**Description**: Verify authentication is configured
**Steps**:
1. User should have enabled Google OAuth provider in Static Web App
2. Test that login flow redirects to Google
3. Confirm backend whitelist will be the final authorization
**Verify**:
- Authentication provider shows as enabled in Portal
- Test login redirects correctly
- User understands backend handles final authorization
**Dependencies**: document-auth-configuration-instructions

---

## Phase 2: Authentication

### 2.1 Backend Authentication

#### Task: init-backend-project
**Description**: Initialize backend Functions project
**Steps**:
1. Navigate to `/backend` folder
2. Run `npm init -y`
3. Run `npm install -D @azure/functions typescript @types/node`
4. Run `npm install @azure/identity @azure/openai`
**Verify**:
- package.json exists in backend folder
- All packages installed successfully
**Dependencies**: init-repo-structure

#### Task: create-function-user-info
**Description**: Create Azure Function to get user info
**Steps**:
1. Create `backend/functions/user.ts`
2. Extract user from Static Web Apps auth headers
3. Validate user email against whitelist
4. Return user object or 403 error
**Verify**:
- Function file created
- TypeScript compiles without errors
- Function exports proper Azure Function handler
**Dependencies**: init-backend-project

#### Task: create-whitelist-validator
**Description**: Create shared whitelist validation utility
**Steps**:
1. Create `backend/shared/auth.ts`
2. Export `isWhitelisted(email: string): boolean` function
3. Read from environment variable `WHITELISTED_EMAILS`
4. Add unit test cases for validation logic
**Verify**:
- File exists with exported function
- TypeScript types are correct
- Logic handles edge cases (null, empty string)
**Dependencies**: init-backend-project

#### Task: test-user-function-local
**Description**: Test user info function locally
**Steps**:
1. Install Azure Functions Core Tools
2. Add mock auth headers in local.settings.json
3. Run `func start` in backend folder
4. Test endpoint with curl/Postman
5. Verify whitelisted user returns 200, non-whitelisted returns 403
**Verify**:
- Function starts without errors
- Correct response for valid user
- Correct error for invalid user
- Logs show validation checks
**Dependencies**: create-function-user-info, create-whitelist-validator

### 2.2 Frontend Authentication UI

#### Task: create-auth-types
**Description**: Define TypeScript types for authentication
**Steps**:
1. Create `frontend/src/types/auth.ts`
2. Define `User` interface (name, email, id)
3. Define `AuthState` interface (isAuthenticated, user, loading)
4. Export types
**Verify**:
- File compiles without errors
- Types are properly exported
**Dependencies**: config-typescript

#### Task: create-auth-service
**Description**: Create authentication service module
**Steps**:
1. Create `frontend/src/services/authService.ts`
2. Add `getUserInfo()` function - calls `/api/user` endpoint
3. Add `logout()` function - redirects to logout endpoint
4. Handle loading and error states
5. Return typed responses
**Verify**:
- TypeScript compilation successful
- Functions have proper return types
- Error handling implemented
**Dependencies**: create-auth-types

#### Task: create-login-ui
**Description**: Create login screen UI
**Steps**:
1. Create `frontend/src/components/LoginScreen.ts`
2. Show app name and description
3. Add "Sign in with Google" button
4. Style button (center aligned, branded colors)
5. Link to Static Web Apps auth endpoint
**Verify**:
- Login screen renders correctly
- Button has correct styling
- Click redirects to auth provider
**Dependencies**: create-html-entry

#### Task: create-auth-guard
**Description**: Implement authentication flow guard
**Steps**:
1. Create `frontend/src/utils/authGuard.ts`
2. On app load, call authService.getUserInfo()
3. If authenticated, show main app
4. If not authenticated, show login screen
5. Handle loading state with spinner
**Verify**:
- Unauthenticated user sees login screen
- Authenticated user sees app (placeholder)
- Loading state displays briefly
**Dependencies**: create-auth-service, create-login-ui

#### Task: create-logout-button
**Description**: Add logout functionality
**Steps**:
1. Create logout button component
2. Position in top-right corner
3. Call authService.logout() on click
4. Add confirmation dialog
**Verify**:
- Button visible when logged in
- Click triggers logout
- User redirected to login screen
**Dependencies**: create-auth-service

#### Task: test-auth-flow-e2e
**Description**: End-to-end authentication testing
**Steps**:
1. Clear browser storage
2. Navigate to app URL
3. Verify login screen appears
4. Complete OAuth flow with whitelisted email
5. Verify app loads
6. Click logout
7. Verify return to login screen
**Verify**:
- Full flow works without errors
- User state persists across page refreshes
- Non-whitelisted users see error message
**Dependencies**: create-auth-guard, create-logout-button

---

## Phase 3: Backend API - Chat Functions

### 3.1 Chat Streaming Endpoint

#### Task: create-chat-function-scaffold
**Description**: Create chat function file structure
**Steps**:
1. Create `backend/functions/chat.ts`
2. Set up HTTP trigger accepting POST
3. Add auth header validation
4. Add request body TypeScript interface
5. Return 200 with placeholder response
**Verify**:
- Function file created
- Compiles without errors
- Local test returns 200
**Dependencies**: init-backend-project

#### Task: create-openai-client
**Description**: Initialize Azure OpenAI client
**Steps**:
1. Create `backend/shared/openaiClient.ts`
2. Import OpenAI SDK
3. Initialize with endpoint and key from env vars
4. Export configured client instance
5. Add error handling for missing credentials
**Verify**:
- Client initializes without errors
- Environment variables loaded correctly
- TypeScript types correct
**Dependencies**: init-backend-project

#### Task: implement-chat-request-parsing
**Description**: Parse and validate chat request
**Steps**:
1. In chat function, extract messages array from body
2. Validate message format (role, content)
3. Return 400 if invalid
4. Add TypeScript types for chat messages
**Verify**:
- Valid requests parse correctly
- Invalid requests return 400 with clear error
- Types prevent compilation errors
**Dependencies**: create-chat-function-scaffold

#### Task: implement-openai-streaming
**Description**: Implement streaming LLM response
**Steps**:
1. Call OpenAI chat completion API with stream=true
2. Set up SSE (Server-Sent Events) response headers
3. Stream tokens as they arrive
4. Format as SSE events
5. Handle completion and errors
**Verify**:
- Function returns SSE stream
- Tokens appear progressively
- Stream closes properly on completion
- Errors handled gracefully
**Dependencies**: create-openai-client, implement-chat-request-parsing

#### Task: add-chat-system-prompt
**Description**: Configure system prompt for chat
**Steps**:
1. Create `backend/shared/prompts.ts`
2. Define system prompt for general assistant
3. Export as constant
4. Inject system prompt into chat messages
**Verify**:
- System prompt defined
- Appears in OpenAI API call
- Chat responses reflect persona
**Dependencies**: implement-openai-streaming

#### Task: add-chat-error-handling
**Description**: Implement comprehensive error handling
**Steps**:
1. Catch OpenAI API errors
2. Catch network errors
3. Log errors to Application Insights
4. Return user-friendly error messages
5. Handle rate limiting with retry logic
**Verify**:
- Errors logged to Azure
- User sees clear error messages
- Rate limit errors retry automatically
- No sensitive data in logs
**Dependencies**: implement-openai-streaming

#### Task: test-chat-function-local
**Description**: Local testing of chat endpoint
**Steps**:
1. Start function locally with `func start`
2. Send POST request with valid messages
3. Verify streaming response
4. Test error cases (invalid input, auth failure)
5. Check logs for proper error tracking
**Verify**:
- Streaming works in local environment
- All error cases handled
- Performance acceptable (<1s first token)
**Dependencies**: add-chat-error-handling

### 3.2 Title Generation Function

#### Task: create-title-function-scaffold
**Description**: Create title generation function
**Steps**:
1. Create `backend/functions/generateTitle.ts`
2. Accept POST with conversation messages
3. Validate authentication
4. Return 200 with placeholder
**Verify**:
- Function file created
- Compiles successfully
**Dependencies**: init-backend-project

#### Task: implement-title-generation
**Description**: Generate conversation title using LLM
**Steps**:
1. Extract first few messages from request
2. Create prompt: "Generate a 3-5 word title for this conversation"
3. Call OpenAI with low temperature
4. Return generated title
5. Limit to 50 characters max
**Verify**:
- Generates relevant titles
- Titles are concise
- Performance <2 seconds
**Dependencies**: create-title-function-scaffold, create-openai-client

#### Task: add-title-caching
**Description**: Cache titles to avoid regeneration
**Steps**:
1. Accept optional conversationId in request
2. Check if title already exists for conversation
3. Return cached title if found
4. Generate only if not cached
**Verify**:
- Repeated requests return cached result
- Performance <100ms for cached titles
**Dependencies**: implement-title-generation

#### Task: test-title-function-local
**Description**: Test title generation locally
**Steps**:
1. Send various conversation samples
2. Verify titles are relevant and concise
3. Test edge cases (empty conversation, very long)
4. Verify caching works
**Verify**:
- All test cases pass
- Titles match conversation topics
**Dependencies**: add-title-caching

---

## Phase 4: Frontend Data Layer - IndexedDB

### 4.1 Database Schema

#### Task: create-db-types
**Description**: Define TypeScript interfaces for data models
**Steps**:
1. Create `frontend/src/types/database.ts`
2. Define `Conversation` interface (id, title, createdAt, updatedAt)
3. Define `Message` interface (id, conversationId, role, content, timestamp)
4. Export types
**Verify**:
- Types compile without errors
- All required fields included
**Dependencies**: config-typescript

#### Task: create-db-schema
**Description**: Define IndexedDB schema
**Steps**:
1. Create `frontend/src/services/database.ts`
2. Define database name and version
3. Create `conversations` object store with keyPath='id'
4. Create `messages` object store with keyPath='id'
5. Add index on messages.conversationId
6. Add index on conversations.updatedAt
**Verify**:
- Schema definition is valid
- Compiles without errors
**Dependencies**: create-db-types

#### Task: implement-db-initialization
**Description**: Initialize IndexedDB connection
**Steps**:
1. Use `idb` library for IndexedDB access
2. Create `initDB()` function
3. Handle database upgrade events
4. Create object stores and indexes
5. Export database instance
**Verify**:
- Database opens successfully
- Object stores created
- Indexes created
- No errors in console
**Dependencies**: create-db-schema, install-frontend-deps

### 4.2 Conversation Operations

#### Task: implement-create-conversation
**Description**: Create new conversation in database
**Steps**:
1. Create `createConversation()` function in database.ts
2. Generate UUID for conversation ID
3. Set createdAt and updatedAt timestamps
4. Insert into conversations store
5. Return conversation object
**Verify**:
- Function creates conversation successfully
- ID is unique
- Timestamps are correct
- Returns created object
**Dependencies**: implement-db-initialization

#### Task: implement-get-conversation
**Description**: Retrieve single conversation by ID
**Steps**:
1. Create `getConversation(id)` function
2. Query conversations store by key
3. Return conversation or null if not found
4. Include TypeScript return type
**Verify**:
- Retrieves existing conversation
- Returns null for non-existent ID
- Correct TypeScript types
**Dependencies**: implement-db-initialization

#### Task: implement-list-conversations
**Description**: List all conversations sorted by date
**Steps**:
1. Create `listConversations()` function
2. Query all conversations
3. Sort by updatedAt descending
4. Return array of conversations
**Verify**:
- Returns all conversations
- Sorted correctly (newest first)
- Empty array if no conversations
**Dependencies**: implement-db-initialization

#### Task: implement-update-conversation
**Description**: Update conversation fields
**Steps**:
1. Create `updateConversation(id, updates)` function
2. Get existing conversation
3. Merge updates
4. Update updatedAt timestamp
5. Save to store
**Verify**:
- Updates conversation successfully
- updatedAt timestamp refreshed
- Partial updates work
**Dependencies**: implement-get-conversation

#### Task: implement-delete-conversation
**Description**: Delete conversation and its messages
**Steps**:
1. Create `deleteConversation(id)` function
2. Delete conversation from store
3. Delete all associated messages
4. Use transaction for atomicity
**Verify**:
- Conversation deleted
- All messages deleted
- Transaction rolls back on error
**Dependencies**: implement-get-conversation

### 4.3 Message Operations

#### Task: implement-add-message
**Description**: Add message to conversation
**Steps**:
1. Create `addMessage(conversationId, role, content)` function
2. Generate message ID
3. Add timestamp
4. Insert into messages store
5. Update conversation updatedAt
**Verify**:
- Message created successfully
- Correct conversationId association
- Conversation timestamp updated
**Dependencies**: implement-db-initialization

#### Task: implement-get-messages
**Description**: Retrieve messages for conversation
**Steps**:
1. Create `getMessages(conversationId)` function
2. Query messages by conversationId index
3. Sort by timestamp ascending
4. Return array of messages
**Verify**:
- Returns all messages for conversation
- Sorted chronologically
- Empty array for new conversation
**Dependencies**: implement-db-initialization

#### Task: implement-update-message
**Description**: Update message content (for edits)
**Steps**:
1. Create `updateMessage(id, content)` function
2. Get existing message
3. Update content field
4. Save to store
**Verify**:
- Message content updates
- Timestamp preserved
- Other fields unchanged
**Dependencies**: implement-db-initialization

#### Task: implement-delete-message
**Description**: Delete single message
**Steps**:
1. Create `deleteMessage(id)` function
2. Remove message from store
3. Optionally update conversation timestamp
**Verify**:
- Message deleted successfully
- Conversation still accessible
**Dependencies**: implement-db-initialization

### 4.4 Data Layer Testing

#### Task: create-db-test-suite
**Description**: Create unit tests for database operations
**Steps**:
1. Create test file `frontend/src/services/database.test.ts`
2. Test conversation CRUD operations
3. Test message CRUD operations
4. Test conversation-message relationships
5. Test error cases
**Verify**:
- All tests pass
- Edge cases covered
- No database leaks between tests
**Dependencies**: implement-delete-message

#### Task: test-db-performance
**Description**: Test database performance
**Steps**:
1. Create 100 conversations
2. Add 50 messages to each
3. Measure query times
4. Verify < 100ms for list operations
5. Clean up test data
**Verify**:
- Performance meets targets
- No memory leaks
- Database size reasonable
**Dependencies**: create-db-test-suite

---

## Phase 5: Frontend UI - Chat Interface

### 5.1 Chat Layout

#### Task: create-app-layout-html
**Description**: Create main application layout structure
**Steps**:
1. Update `frontend/src/main.ts` to build DOM structure
2. Create sidebar div (conversation list)
3. Create main chat area div
4. Create header with title and logout button
5. Make layout responsive (CSS Grid)
**Verify**:
- Layout renders correctly
- Responsive at mobile and desktop sizes
- No layout shift on load
**Dependencies**: create-auth-guard

#### Task: style-app-layout
**Description**: Style the application layout
**Steps**:
1. Create `frontend/src/styles/layout.css`
2. Use CSS Grid for sidebar + main area
3. Set sidebar width (250px desktop, hidden mobile)
4. Add header styling
5. Import in main.ts
**Verify**:
- Layout looks clean and modern
- Sidebar collapsible on mobile
- Header fixed at top
**Dependencies**: create-app-layout-html

#### Task: create-message-types
**Description**: Define message UI types
**Steps**:
1. Create `frontend/src/types/message.ts`
2. Define `DisplayMessage` type (extends database Message)
3. Add `isStreaming` boolean flag
4. Export types
**Verify**:
- Types compile correctly
- Compatible with database types
**Dependencies**: create-db-types

#### Task: create-message-list-component
**Description**: Create message list container
**Steps**:
1. Create `frontend/src/components/MessageList.ts`
2. Create function to render array of messages
3. Create container div with scrolling
4. Auto-scroll to bottom on new messages
5. Export render function
**Verify**:
- Empty list shows correctly
- Auto-scroll works
- Container scrollable
**Dependencies**: create-app-layout-html

#### Task: create-message-bubble-component
**Description**: Create individual message bubble
**Steps**:
1. Create `frontend/src/components/MessageBubble.ts`
2. Render user vs assistant messages differently
3. Add styling (background color, alignment, padding)
4. Show message content
5. Add timestamp
**Verify**:
- User messages right-aligned, blue background
- Assistant messages left-aligned, gray background
- Timestamps visible and formatted
**Dependencies**: create-message-list-component

### 5.2 Chat Input

#### Task: create-input-component-structure
**Description**: Create chat input component structure
**Steps**:
1. Create `frontend/src/components/ChatInput.ts`
2. Create textarea element
3. Create send button
4. Create container div
5. Position at bottom of chat area
**Verify**:
- Input area visible at bottom
- Textarea expands with content
- Send button clickable
**Dependencies**: create-app-layout-html

#### Task: style-input-component
**Description**: Style the chat input
**Steps**:
1. Create `frontend/src/styles/chat-input.css`
2. Style textarea (border, padding, font)
3. Style send button (primary color, hover state)
4. Add focus states
5. Make responsive
**Verify**:
- Input looks polished
- Accessible focus indicators
- Mobile-friendly sizing
**Dependencies**: create-input-component-structure

#### Task: implement-input-handlers
**Description**: Add input event handlers
**Steps**:
1. Add keypress handler (Enter to send, Shift+Enter for newline)
2. Add click handler for send button
3. Disable input while sending
4. Clear textarea after send
5. Add TypeScript types for handlers
**Verify**:
- Enter key sends message
- Shift+Enter creates new line
- Input disabled during send
- Textarea clears after send
**Dependencies**: style-input-component

#### Task: add-input-validation
**Description**: Validate user input before sending
**Steps**:
1. Trim whitespace from input
2. Disable send button if empty
3. Show character count (optional)
4. Limit max message length
**Verify**:
- Empty messages not sent
- Button disabled for empty input
- Character limit enforced
**Dependencies**: implement-input-handlers

### 5.3 Message Streaming Display

#### Task: create-streaming-types
**Description**: Define types for streaming state
**Steps**:
1. Create `frontend/src/types/streaming.ts`
2. Define `StreamingState` interface (isActive, currentMessage, error)
3. Export types
**Verify**:
- Types compile successfully
**Dependencies**: create-message-types

#### Task: implement-sse-client
**Description**: Create Server-Sent Events client
**Steps**:
1. Create `frontend/src/services/sseClient.ts`
2. Create function to establish SSE connection
3. Handle `message` events
4. Handle `error` and `close` events
5. Return EventSource instance
**Verify**:
- SSE connection established
- Events received and parsed
- Connection closes properly
- Errors handled
**Dependencies**: create-streaming-types

#### Task: implement-streaming-message-update
**Description**: Update message UI during streaming
**Steps**:
1. Create partial message in database
2. Update message content as tokens arrive
3. Re-render message bubble progressively
4. Mark as complete when stream ends
**Verify**:
- Message appears immediately
- Updates smoothly as tokens arrive
- Final message saved to database
- UI stays responsive
**Dependencies**: implement-sse-client, create-message-bubble-component

#### Task: add-streaming-indicators
**Description**: Add visual indicators for streaming
**Steps**:
1. Add animated "typing" indicator
2. Show when assistant is generating
3. Add streaming cursor at end of message
4. Remove indicators when complete
**Verify**:
- Indicator shows during generation
- Cursor animates at message end
- Indicators removed on completion
**Dependencies**: implement-streaming-message-update

#### Task: test-streaming-rendering
**Description**: Test streaming message display
**Steps**:
1. Send test message
2. Verify immediate response display
3. Check smooth token updates
4. Verify final state correct
5. Test error during streaming
**Verify**:
- Streaming works smoothly
- No UI jank or flickering
- Errors shown to user
- Message recoverable after error
**Dependencies**: add-streaming-indicators

### 5.4 Markdown and Code Rendering

#### Task: integrate-marked-library
**Description**: Set up markdown parser
**Steps**:
1. Import `marked` library
2. Configure marked options (GFM, breaks)
3. Create utility function `renderMarkdown(text)`
4. Export from utils
**Verify**:
- Markdown parses correctly
- Output is sanitized
- Links, lists, headers render
**Dependencies**: install-frontend-deps

#### Task: integrate-highlight-js
**Description**: Set up syntax highlighting
**Steps**:
1. Import `highlight.js` library
2. Import language definitions (JS, Python, TypeScript, etc.)
3. Import highlight.js CSS theme
4. Configure auto-detection
**Verify**:
- Code blocks highlighted correctly
- Languages detected accurately
- Theme loads properly
**Dependencies**: install-frontend-deps

#### Task: create-markdown-renderer
**Description**: Create markdown rendering component
**Steps**:
1. Create `frontend/src/components/MarkdownRenderer.ts`
2. Parse markdown using marked
3. Apply syntax highlighting to code blocks
4. Sanitize HTML output
5. Return rendered HTML
**Verify**:
- Markdown renders correctly
- Code syntax highlighted
- No XSS vulnerabilities
- Links open in new tabs
**Dependencies**: integrate-marked-library, integrate-highlight-js

#### Task: update-message-bubble-with-markdown
**Description**: Use markdown renderer in message display
**Steps**:
1. Update MessageBubble component
2. Render user messages as plain text
3. Render assistant messages with markdown
4. Apply proper CSS for markdown elements
**Verify**:
- Assistant messages show formatted content
- Code blocks have copy button (next task)
- Lists, tables, links work
**Dependencies**: create-markdown-renderer, create-message-bubble-component

#### Task: add-code-copy-button
**Description**: Add copy-to-clipboard for code blocks
**Steps**:
1. Add copy button to code blocks
2. Implement clipboard API
3. Show "Copied!" feedback
4. Style button
**Verify**:
- Button appears on code block hover
- Clicking copies code to clipboard
- Feedback message shows
**Dependencies**: update-message-bubble-with-markdown

### 5.5 Message Actions

#### Task: create-message-actions-ui
**Description**: Add action buttons to messages
**Steps**:
1. Add action bar to message bubbles
2. Add copy message button
3. Add edit message button (user messages only)
4. Add delete message button
5. Show on hover
**Verify**:
- Actions appear on hover
- Buttons styled correctly
- Only relevant actions shown per message type
**Dependencies**: create-message-bubble-component

#### Task: implement-copy-message
**Description**: Copy message text to clipboard
**Steps**:
1. Add click handler to copy button
2. Use Clipboard API
3. Copy plain text (no markdown)
4. Show "Copied" feedback
**Verify**:
- Message copied to clipboard
- Feedback appears briefly
- Works on all message types
**Dependencies**: create-message-actions-ui

#### Task: implement-edit-message
**Description**: Allow editing user messages
**Steps**:
1. Add click handler to edit button
2. Replace message bubble with textarea
3. Populate with existing text
4. Add save/cancel buttons
5. Update database on save
6. Regenerate assistant response
**Verify**:
- Edit mode activates
- Changes saved to database
- Assistant regenerates response
- Cancel restores original
**Dependencies**: create-message-actions-ui, implement-update-message

#### Task: implement-delete-message
**Description**: Delete messages from conversation
**Steps**:
1. Add click handler to delete button
2. Show confirmation dialog
3. Delete from database
4. Remove from UI
5. Update conversation timestamp
**Verify**:
- Confirmation required
- Message removed from display
- Database updated
- No orphaned data
**Dependencies**: create-message-actions-ui

---

## Phase 6: Conversation Management

### 6.1 Conversation List UI

#### Task: create-conversation-list-component
**Description**: Create sidebar conversation list
**Steps**:
1. Create `frontend/src/components/ConversationList.ts`
2. Query conversations from database
3. Render list of conversation items
4. Show title and last updated time
5. Highlight active conversation
**Verify**:
- List displays all conversations
- Sorted by most recent
- Active conversation highlighted
- Empty state shown when no conversations
**Dependencies**: implement-list-conversations, style-app-layout

#### Task: style-conversation-list
**Description**: Style conversation list items
**Steps**:
1. Create `frontend/src/styles/conversation-list.css`
2. Style list items (padding, hover, active states)
3. Add truncation for long titles
4. Add time formatting
5. Responsive adjustments
**Verify**:
- List looks clean and readable
- Hover states clear
- Active state prominent
- Mobile-friendly
**Dependencies**: create-conversation-list-component

#### Task: add-conversation-selection
**Description**: Handle conversation selection
**Steps**:
1. Add click handler to conversation items
2. Load selected conversation messages
3. Update active conversation state
4. Display messages in chat area
5. Update URL (optional history API)
**Verify**:
- Clicking loads conversation
- Messages display correctly
- Active state updates
- Works smoothly
**Dependencies**: style-conversation-list, implement-get-messages

### 6.2 New Conversation Flow

#### Task: add-new-conversation-button
**Description**: Add button to create new conversation
**Steps**:
1. Add "New Chat" button to sidebar header
2. Style as primary action button
3. Add icon (plus sign)
4. Add click handler
**Verify**:
- Button visible and prominent
- Styling consistent with design
- Click handler attached
**Dependencies**: create-conversation-list-component

#### Task: implement-new-conversation-flow
**Description**: Create new conversation on button click
**Steps**:
1. In click handler, call createConversation()
2. Generate default title "New Conversation"
3. Add to database
4. Clear chat area
5. Set as active conversation
6. Focus chat input
**Verify**:
- New conversation created
- Chat area cleared
- Ready for input
- Added to sidebar list
**Dependencies**: add-new-conversation-button, implement-create-conversation

#### Task: add-new-conversation-on-first-message
**Description**: Auto-create conversation if none exists
**Steps**:
1. Check if active conversation exists before sending message
2. If not, create new conversation automatically
3. Add first message
4. Continue with chat flow
**Verify**:
- Fresh app shows empty state
- First message creates conversation
- No errors
**Dependencies**: implement-new-conversation-flow

### 6.3 Auto-naming Conversations

#### Task: create-title-generation-service
**Description**: Create frontend service for title generation
**Steps**:
1. Create `frontend/src/services/titleService.ts`
2. Add function to call backend title generation API
3. Pass first 2-3 messages
4. Return generated title
5. Handle errors
**Verify**:
- Service calls API correctly
- Title returned successfully
- Errors handled gracefully
**Dependencies**: implement-title-generation (backend)

#### Task: implement-auto-title-generation
**Description**: Auto-generate title after first exchange
**Steps**:
1. After assistant's first response completes
2. Call titleService.generateTitle()
3. Update conversation title in database
4. Update UI to show new title
5. Only generate once per conversation
**Verify**:
- Title generates automatically
- Appears in sidebar
- Only happens once
- Doesn't interrupt chat flow
**Dependencies**: create-title-generation-service

#### Task: add-manual-title-edit
**Description**: Allow manual title editing
**Steps**:
1. Add edit icon next to conversation title in sidebar
2. Make title editable on click
3. Save to database on blur/enter
4. Cancel on escape
**Verify**:
- Title becomes editable
- Changes save to database
- Sidebar updates immediately
**Dependencies**: implement-auto-title-generation

### 6.4 Delete Conversation

#### Task: add-delete-conversation-button
**Description**: Add delete option to conversations
**Steps**:
1. Add delete button to conversation items (show on hover)
2. Style button (icon, color)
3. Add click handler
**Verify**:
- Button appears on hover
- Styled appropriately (red/destructive)
**Dependencies**: style-conversation-list

#### Task: implement-delete-confirmation
**Description**: Add confirmation dialog for deletion
**Steps**:
1. Create modal dialog component
2. Show on delete button click
3. Display "Are you sure?" message
4. Add confirm and cancel buttons
5. Style modal
**Verify**:
- Modal appears centered
- Message clear
- Buttons work correctly
**Dependencies**: add-delete-conversation-button

#### Task: implement-conversation-deletion
**Description**: Delete conversation and handle state
**Steps**:
1. On confirm, call deleteConversation()
2. Remove from sidebar list
3. If was active conversation, clear chat area or load another
4. Show success message
5. Update UI
**Verify**:
- Conversation deleted from database
- Removed from UI
- App state consistent
- No errors
**Dependencies**: implement-delete-confirmation, implement-delete-conversation

---

## Phase 7: Mobile Optimization

### 7.1 Responsive Layout

#### Task: implement-mobile-first-css
**Description**: Refactor CSS for mobile-first approach
**Steps**:
1. Review all CSS files
2. Set base styles for mobile (320px+)
3. Add media queries for tablet (768px+)
4. Add media queries for desktop (1024px+)
5. Test at various breakpoints
**Verify**:
- App usable on small screens
- No horizontal scrolling
- Text readable without zoom
**Dependencies**: style-app-layout, style-conversation-list

#### Task: implement-sidebar-toggle
**Description**: Add hamburger menu for mobile
**Steps**:
1. Add hamburger menu button (mobile only)
2. Sidebar hidden by default on mobile
3. Toggle sidebar visibility on button click
4. Overlay sidebar on top of chat
5. Close on outside click
**Verify**:
- Hamburger visible on mobile
- Sidebar toggles correctly
- Overlay works
- Desktop not affected
**Dependencies**: implement-mobile-first-css

#### Task: optimize-header-mobile
**Description**: Adjust header for mobile screens
**Steps**:
1. Reduce header height on mobile
2. Make logout button smaller
3. Adjust font sizes
4. Ensure touch targets 44px minimum
**Verify**:
- Header fits well on mobile
- All buttons tappable
- No text cutoff
**Dependencies**: implement-mobile-first-css

#### Task: optimize-input-mobile
**Description**: Optimize chat input for mobile
**Steps**:
1. Adjust textarea sizing for mobile keyboards
2. Increase send button tap target
3. Prevent zoom on input focus (font-size: 16px minimum)
4. Handle viewport resize when keyboard appears
**Verify**:
- Input doesn't cause zoom
- Button easy to tap
- Keyboard doesn't break layout
**Dependencies**: implement-mobile-first-css

### 7.2 Touch Interactions

#### Task: add-swipe-to-open-sidebar
**Description**: Swipe from left to open sidebar
**Steps**:
1. Add touch event listeners
2. Detect swipe from left edge
3. Open sidebar with animation
4. Add gesture feedback
**Verify**:
- Swipe from left opens sidebar
- Smooth animation
- Works on iOS and Android
**Dependencies**: implement-sidebar-toggle

#### Task: add-swipe-to-close-sidebar
**Description**: Swipe to close sidebar on mobile
**Steps**:
1. Detect swipe left on open sidebar
2. Close with animation
3. Also close on tap outside
**Verify**:
- Swipe closes sidebar
- Tap outside closes
- Smooth animation
**Dependencies**: add-swipe-to-open-sidebar

#### Task: add-pull-to-refresh-disable
**Description**: Disable pull-to-refresh where needed
**Steps**:
1. Add CSS overscroll-behavior
2. Prevent default touch actions on message list
3. Allow scroll but not refresh
**Verify**:
- Scrolling works
- Pull-to-refresh disabled on message list
- Overall page can still refresh
**Dependencies**: implement-mobile-first-css

### 7.3 Mobile Testing

#### Task: test-ios-safari
**Description**: Test on iOS Safari
**Steps**:
1. Deploy to test environment
2. Open on iPhone (or simulator)
3. Test chat flow
4. Test conversation management
5. Test sidebar toggle
6. Check for visual bugs
**Verify**:
- All features work
- No CSS bugs
- Performance acceptable
- Touch interactions smooth
**Dependencies**: add-swipe-to-close-sidebar

#### Task: test-android-chrome
**Description**: Test on Android Chrome
**Steps**:
1. Open on Android device
2. Test full feature set
3. Check keyboard behavior
4. Test touch interactions
5. Check performance
**Verify**:
- All features work
- Keyboard doesn't break UI
- Performance acceptable
**Dependencies**: test-ios-safari

#### Task: test-tablet-layouts
**Description**: Test on tablet devices
**Steps**:
1. Test on iPad (or simulator)
2. Test on Android tablet
3. Verify layout uses screen space well
4. Check sidebar behavior
**Verify**:
- Layout optimized for tablet size
- Not just stretched mobile view
- All features accessible
**Dependencies**: test-android-chrome

---

## Phase 8: Performance Optimization

### 8.1 Bundle Size Optimization

#### Task: analyze-bundle-size
**Description**: Analyze current bundle size
**Steps**:
1. Build production bundle
2. Use `vite build --reportCompressedSize`
3. Identify large dependencies
4. Document current sizes
**Verify**:
- Bundle size documented
- Large dependencies identified
**Dependencies**: config-vite

#### Task: implement-code-splitting
**Description**: Split code into smaller chunks
**Steps**:
1. Use dynamic imports for non-critical code
2. Split by route/feature
3. Lazy load markdown renderer
4. Lazy load highlight.js
**Verify**:
- Initial bundle reduced by >30%
- Chunks load on demand
- No errors
**Dependencies**: analyze-bundle-size

#### Task: tree-shake-dependencies
**Description**: Remove unused code from dependencies
**Steps**:
1. Import only needed functions from libraries
2. Configure Vite to tree-shake
3. Remove unused dependencies
4. Update imports to named imports
**Verify**:
- Bundle size reduced
- No functionality lost
**Dependencies**: implement-code-splitting

#### Task: minify-and-compress
**Description**: Minify JS and enable compression
**Steps**:
1. Enable Vite minification (default in production)
2. Configure Azure Static Web Apps for gzip/brotli
3. Test compressed sizes
**Verify**:
- JS minified
- Gzip enabled on server
- Transfer sizes < 100KB for main bundle
**Dependencies**: tree-shake-dependencies

### 8.2 Lazy Loading

#### Task: lazy-load-conversations
**Description**: Load conversations on demand
**Steps**:
1. Initially load only recent 20 conversations
2. Add "Load More" button
3. Implement pagination
4. Load older conversations on scroll or click
**Verify**:
- Initial load faster
- Old conversations accessible
- Smooth loading experience
**Dependencies**: create-conversation-list-component

#### Task: lazy-load-messages
**Description**: Load messages in chunks
**Steps**:
1. Load most recent 50 messages initially
2. Load older messages on scroll to top
3. Implement virtual scrolling for very long conversations
**Verify**:
- Large conversations load quickly
- Scrolling smooth
- All messages accessible
**Dependencies**: create-message-list-component

#### Task: implement-image-lazy-loading
**Description**: Lazy load images in messages (if supported)
**Steps**:
1. Add `loading="lazy"` attribute to images
2. Add placeholder while loading
3. Handle errors
**Verify**:
- Images load on scroll
- Placeholders show
- Page doesn't jump
**Dependencies**: update-message-bubble-with-markdown

### 8.3 Caching Strategy

#### Task: configure-cache-headers
**Description**: Set up browser caching
**Steps**:
1. Configure Azure Static Web Apps for cache headers
2. Set long cache for static assets (JS, CSS)
3. Set short cache for HTML
4. Add cache-busting via Vite
**Verify**:
- Assets cached in browser
- Updates deployed without hard refresh
- Cache headers correct in network tab
**Dependencies**: create-static-web-app

#### Task: implement-service-worker
**Description**: Add service worker for offline support (optional)
**Steps**:
1. Create service worker file
2. Cache static assets
3. Implement cache-first strategy
4. Add online/offline detection
**Verify**:
- Service worker registers
- App loads offline (partially)
- Online/offline status shown
**Dependencies**: configure-cache-headers

### 8.4 Performance Testing

#### Task: measure-load-time
**Description**: Measure and document load times
**Steps**:
1. Use Lighthouse to test performance
2. Measure First Contentful Paint (FCP)
3. Measure Time to Interactive (TTI)
4. Test on fast and slow connections
5. Document results
**Verify**:
- FCP < 1.5 seconds
- TTI < 3 seconds
- Lighthouse score > 90
**Dependencies**: minify-and-compress

#### Task: optimize-critical-path
**Description**: Optimize critical rendering path
**Steps**:
1. Inline critical CSS
2. Defer non-critical JavaScript
3. Optimize font loading
4. Reduce render-blocking resources
**Verify**:
- Critical path optimized
- Initial render faster
- No layout shift
**Dependencies**: measure-load-time

#### Task: test-response-time
**Description**: Test API response times
**Steps**:
1. Measure first token time for chat
2. Measure time to title generation
3. Test under load
4. Document results
**Verify**:
- First token < 1 second
- Title gen < 2 seconds
- Performance consistent
**Dependencies**: test-chat-function-local

---

## Phase 9: Polish & Nice-to-Haves

### 9.1 Dark Mode

#### Task: create-theme-system
**Description**: Set up CSS custom properties for theming
**Steps**:
1. Create `frontend/src/styles/theme.css`
2. Define CSS variables for colors
3. Create light theme variables
4. Create dark theme variables
5. Use variables throughout CSS
**Verify**:
- Variables defined
- Can switch between themes manually
**Dependencies**: style-app-layout

#### Task: implement-theme-toggle
**Description**: Add theme toggle button
**Steps**:
1. Add toggle button to header
2. Save preference to localStorage
3. Apply theme on load
4. Smooth transition between themes
**Verify**:
- Toggle switches theme
- Preference persisted
- Smooth transition
**Dependencies**: create-theme-system

#### Task: implement-system-theme-detection
**Description**: Detect and respect system theme preference
**Steps**:
1. Use `prefers-color-scheme` media query
2. Set default theme from system
3. Allow user override
**Verify**:
- System preference detected
- User can override
- Changes with system preference
**Dependencies**: implement-theme-toggle

### 9.2 Keyboard Shortcuts

#### Task: implement-keyboard-nav
**Description**: Add keyboard navigation
**Steps**:
1. Add keypress listeners
2. Ctrl+K: Focus search/new chat
3. Escape: Close modals/sidebar
4. Up/Down: Navigate conversations
5. Ctrl+Enter: Send message
**Verify**:
- All shortcuts work
- No conflicts with browser shortcuts
- Shortcuts documented
**Dependencies**: create-app-layout-html

#### Task: add-shortcut-help-modal
**Description**: Show keyboard shortcuts help
**Steps**:
1. Create help modal
2. List all shortcuts
3. Open with "?" key or help button
4. Style modal
**Verify**:
- Modal opens
- All shortcuts listed
- Easy to read
**Dependencies**: implement-keyboard-nav

### 9.3 Accessibility

#### Task: add-aria-labels
**Description**: Add ARIA labels for screen readers
**Steps**:
1. Add aria-label to all buttons
2. Add role attributes where needed
3. Add aria-live regions for chat messages
4. Add focus indicators
**Verify**:
- Screen reader can navigate app
- All interactive elements labeled
- Focus visible
**Dependencies**: create-app-layout-html

#### Task: implement-keyboard-only-nav
**Description**: Ensure full keyboard navigation
**Steps**:
1. Test tab navigation through all elements
2. Ensure logical tab order
3. Add skip links
4. Test with keyboard only
**Verify**:
- Can use app with keyboard only
- Tab order logical
- No keyboard traps
**Dependencies**: add-aria-labels

#### Task: test-accessibility
**Description**: Run accessibility audit
**Steps**:
1. Use Lighthouse accessibility audit
2. Use axe DevTools
3. Fix issues found
4. Document any exceptions
**Verify**:
- Lighthouse accessibility score > 90
- No critical axe issues
**Dependencies**: implement-keyboard-only-nav

---

## Phase 10: Deployment & Documentation

### 10.1 Production Deployment

#### Task: create-prod-config
**Description**: Create production configuration
**Steps**:
1. Set production environment variables
2. Configure production OpenAI settings
3. Set up production whitelist
4. Configure logging levels
**Verify**:
- All config values set correctly
- No dev values in production
**Dependencies**: config-function-settings

#### Task: deploy-to-production
**Description**: Deploy application to production
**Steps**:
1. Merge to main branch
2. Trigger GitHub Actions workflows
3. Monitor deployment
4. Verify deployment success
5. Test production URL
**Verify**:
- Deployments succeed
- Production URL accessible
- App loads correctly
**Dependencies**: test-cicd-pipeline, create-prod-config

#### Task: document-custom-domain-instructions
**Description**: Document custom domain setup (optional)
**Steps**:
1. Add section to `docs/azure-setup-guide.md` for custom domain
2. Document how to add custom domain in Static Web Apps
3. Document DNS record configuration
4. Document SSL certificate verification
5. Mark as optional step
**Verify**:
- Instructions documented
- DNS and SSL steps clear
**Dependencies**: deploy-to-production

#### Task: verify-custom-domain-configured
**Description**: Verify custom domain if user chooses to set up
**Steps**:
1. If user wants custom domain, verify it's added in Portal
2. Verify DNS records point correctly
3. Verify SSL certificate is valid
4. Test HTTPS access
5. Skip if using default azurestaticapps.net domain
**Verify**:
- Custom domain resolves (if configured)
- HTTPS works correctly
- Or default domain works if custom not needed
**Dependencies**: document-custom-domain-instructions

#### Task: document-monitoring-setup
**Description**: Document monitoring configuration
**Steps**:
1. Add section to `docs/azure-setup-guide.md` for monitoring
2. Document how to verify Application Insights connection
3. Document alert configuration for errors
4. Document how to view logs and usage
5. Include dashboard setup instructions
**Verify**:
- Monitoring setup documented
- Alert configuration clear
**Dependencies**: verify-app-insights-created

#### Task: verify-monitoring-configured
**Description**: Verify monitoring is working
**Steps**:
1. Verify Application Insights is connected to Function App
2. User should configure error alerts (optional)
3. Test that logs appear in Application Insights
4. Verify telemetry is flowing
**Verify**:
- Logs visible in Application Insights
- Connection verified
- User understands how to access logs
**Dependencies**: document-monitoring-setup

### 10.2 Testing & Quality Assurance

#### Task: run-e2e-tests
**Description**: Execute full end-to-end test suite
**Steps**:
1. Test complete chat flow
2. Test conversation management
3. Test authentication
4. Test on multiple browsers
5. Test on mobile devices
**Verify**:
- All features work in production
- No console errors
- Performance acceptable
**Dependencies**: deploy-to-production

#### Task: security-review
**Description**: Conduct security review
**Steps**:
1. Verify authentication working
2. Check whitelist enforcement
3. Verify no exposed secrets
4. Test CORS settings
5. Review Content Security Policy
**Verify**:
- Only whitelisted users can access
- No security vulnerabilities found
- API endpoints secured
**Dependencies**: run-e2e-tests

#### Task: performance-validation
**Description**: Validate production performance
**Steps**:
1. Run Lighthouse on production URL
2. Test from multiple geographic locations
3. Test under simulated load
4. Verify metrics meet targets
**Verify**:
- Load time < 2 seconds
- First token < 1 second
- Lighthouse score > 90
**Dependencies**: deploy-to-production

### 10.3 Documentation

#### Task: create-user-guide
**Description**: Write user guide for end users
**Steps**:
1. Create `docs/user-guide.md`
2. Document how to access app
3. Explain chat features
4. Explain conversation management
5. Add screenshots
**Verify**:
- Guide is clear and complete
- Covers all features
- Easy to follow
**Dependencies**: run-e2e-tests

#### Task: create-dev-documentation
**Description**: Write developer documentation
**Steps**:
1. Create `docs/developer-guide.md`
2. Document architecture
3. Explain codebase structure
4. Document deployment process
5. Add troubleshooting guide
**Verify**:
- Documentation complete
- Covers all major systems
- Future developers can understand
**Dependencies**: deploy-to-production

#### Task: document-api
**Description**: Document backend API endpoints
**Steps**:
1. Create `docs/api-reference.md`
2. Document each endpoint
3. Include request/response examples
4. Document authentication
5. Document error codes
**Verify**:
- All endpoints documented
- Examples accurate
**Dependencies**: test-backend-apis

#### Task: create-runbook
**Description**: Create operational runbook
**Steps**:
1. Create `docs/runbook.md`
2. Document common operations
3. Document troubleshooting procedures
4. Document monitoring and alerts
5. Document backup procedures (if any)
**Verify**:
- Runbook covers common scenarios
- Clear action items
**Dependencies**: setup-monitoring

---

## Summary

**Total Tasks**: ~150 granular tasks across 10 phases

**Key Principles**:
- Each task is small and completable in 5-15 minutes
- Every task has clear verification steps
- Dependencies explicitly stated
- Progress can be validated after each task
- LLM can execute tasks sequentially with confidence

**Estimated Timeline**:
- Phase 1: Setup (2-3 days)
- Phase 2-3: Auth & Backend (3-4 days)
- Phase 4-5: Data & UI (4-5 days)
- Phase 6: Conversations (2-3 days)
- Phase 7: Mobile (2-3 days)
- Phase 8: Performance (2-3 days)
- Phase 9: Polish (2-3 days)
- Phase 10: Deploy & Docs (2-3 days)

**Total**: Approximately 3-4 weeks with focused development

**Next Steps**:
1. Review this task list
2. Begin with Phase 1 tasks
3. Execute tasks sequentially
4. Verify after each task
5. Update status in SQL database
