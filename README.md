# Pine - Visual AI Conversations

**Pine** is a revolutionary visual, spatial AI chat interface that transforms how you interact with AI. Instead of traditional linear chat threads, Pine enables you to branch conversations into an infinite canvas, creating a visual map of your thoughts and ideas.

![Pine Banner](./public/og-image.png)

---

## 🌲 Overview

Pine reimagines AI conversations by introducing a spatial, branching interface. Every conversation exists as a draggable chat window on an infinite canvas. You can select any portion of an AI response and "branch" it into a new conversation, maintaining context while exploring different paths. This creates a tree-like structure of interconnected ideas, perfect for brainstorming, research, and complex problem-solving.

### Key Concepts

- **Infinite Canvas**: A ReactFlow-powered spatial board where all chat windows exist
- **Branching**: Select text from any AI response to create a new chat window with that context
- **Parent-Child Relationships**: Branched chats maintain connections to their source, creating a visual conversation tree
- **Real-time Streaming**: AI responses stream in real-time with optimistic UI updates
- **Persistent State**: All conversations, positions, and connections are saved to the database

---

## ✨ Features

### Core Functionality

- **🎨 Infinite Canvas Navigation**
  - Pan, zoom, and navigate across an unlimited workspace
  - Drag chat windows to organize your thoughts spatially
  - Minimap for easy navigation across large conversation trees
  - Tree-based dragging: moving a parent window automatically moves all its children

- **🌿 Intelligent Branching**
  - Select any text in an AI response to branch into a new conversation
  - Context is automatically carried over to the new branch
  - Visual connections (edges) show the relationship between conversations
  - Each branch can evolve independently while maintaining its lineage

- **💬 Advanced Chat Features**
  - Real-time AI response streaming with GPT-4
  - Optimistic UI updates for instant feedback
  - "Thinking" and "Streaming" states for clear user feedback
  - Editable chat window titles (hover to edit)
  - Auto-scroll to latest messages

- **📊 Organization & Navigation**
  - "All Chats" drawer showing all parent conversations
  - Search functionality to find specific chats
  - Recent chats sorted by last activity
  - Click any chat to auto-focus and center it on the canvas

- **🎯 User Experience**
  - Lazy window creation: windows are created optimistically before API confirmation
  - Smooth animations and transitions
  - Responsive design with mobile considerations
  - Light mode interface with premium aesthetics
  - Industrial typography with custom "Pine" branding (Oswald font)

### Technical Features

- **🔐 Authentication & Authorization**
  - Supabase-based authentication with SSR support
  - Email/password login and signup
  - Protected routes with middleware
  - User-specific boards and conversations

- **💾 Data Persistence**
  - PostgreSQL database with Prisma ORM
  - Real-time optimistic updates with server sync
  - Automatic position saving for all windows
  - Message history and conversation state preservation

- **⚡ Performance Optimizations**
  - Optimistic UI updates for instant feedback
  - Efficient state management with React hooks
  - Debounced position updates
  - Streaming responses with flushSync for immediate rendering

- **🛡️ Security**
  - Security headers configured (HSTS, X-Frame-Options, CSP)
  - User-scoped data access
  - Protected API routes
  - Environment variable management

- **📱 SEO & Metadata**
  - OpenGraph and Twitter card metadata
  - Sitemap and robots.txt generation
  - JSON-LD structured data
  - Custom 404 and loading pages
  - Privacy policy and terms of service pages

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Server-side rendering, routing, API routes |
| **Language** | TypeScript | Type safety and developer experience |
| **Styling** | Tailwind CSS v4 | Utility-first styling with custom design tokens |
| **Canvas** | ReactFlow v11 | Infinite canvas, node management, edge rendering |
| **Database** | PostgreSQL | Relational data storage |
| **ORM** | Prisma | Type-safe database access and migrations |
| **Auth** | Supabase (SSR) | Authentication and user management |
| **AI** | Vercel AI SDK + OpenAI | Streaming AI responses with GPT-4 |
| **UI Components** | Radix UI + shadcn/ui | Accessible, customizable components |
| **Forms** | React Hook Form + Zod | Form validation and state management |

### Database Schema

```prisma
User
├── id: String (UUID)
├── email: String (unique)
└── boards: Board[]

Board
├── id: String (UUID)
├── userId: String
├── name: String
├── description: String?
├── chatWindows: ChatWindow[]
└── edges: Edge[]

ChatWindow
├── id: String (UUID)
├── boardId: String
├── title: String
├── positionX: Float
├── positionY: Float
├── messages: Message[]
├── sourceEdges: Edge[]
└── targetEdges: Edge[]

Message
├── id: String (UUID)
├── chatWindowId: String
├── role: MessageRole (USER | ASSISTANT)
├── content: String
└── sourceEdges: Edge[]

Edge
├── id: String (UUID)
├── boardId: String
├── sourceWindowId: String
├── targetWindowId: String
├── selectedText: String
└── sourceMessageId: String
```

### Project Structure

```
/Users/amankumarm/Aman/inter/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── boards/
│   │       └── [boardId]/
│   │           ├── route.ts      # Get board data
│   │           ├── edges/        # Create edges (branches)
│   │           └── windows/      # Window management
│   │               ├── route.ts  # Create windows
│   │               └── [windowId]/
│   │                   ├── route.ts      # Update window
│   │                   ├── messages/     # Send messages
│   │                   └── context/      # Get conversation context
│   ├── dashboard/                # Main application
│   │   ├── page.tsx             # Dashboard entry point
│   │   ├── board-flow-client.tsx # Client-side board logic
│   │   └── flow/                # Flow-specific components
│   ├── login/                   # Authentication pages
│   ├── signup/
│   ├── profile/
│   ├── privacy/                 # Legal pages
│   ├── terms/
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Landing page
│   ├── globals.css              # Global styles and design tokens
│   ├── loading.tsx              # Global loading state
│   ├── not-found.tsx            # Custom 404 page
│   ├── sitemap.ts               # SEO sitemap
│   └── robots.ts                # SEO robots.txt
│
├── components/                   # React Components
│   ├── flow/                    # ReactFlow-specific components
│   │   ├── board-flow.tsx       # Main canvas component
│   │   ├── chat-window-node.tsx # Individual chat window node
│   │   ├── chat-message.tsx     # Message display with branching
│   │   ├── chat-input.tsx       # Message input field
│   │   └── all-chats-drawer.tsx # Navigation drawer
│   ├── ui/                      # Reusable UI components (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   └── label.tsx
│   └── navbar.tsx               # Main navigation bar
│
├── lib/                         # Utilities and Services
│   ├── auth.ts                  # Authentication helpers
│   ├── prisma.ts                # Prisma client singleton
│   ├── utils.ts                 # Utility functions
│   ├── openai/                  # OpenAI integration
│   │   ├── stream.ts            # Streaming chat responses
│   │   ├── context.ts           # Context building for branches
│   │   └── title.ts             # Auto-generate chat titles
│   ├── services/                # Business logic
│   │   ├── boards.ts            # Board CRUD operations
│   │   ├── windows.ts           # Window management
│   │   ├── messages.ts          # Message handling
│   │   └── edges.ts             # Edge (branch) creation
│   └── supabase/                # Supabase client utilities
│       ├── client.ts            # Client-side Supabase
│       ├── server.ts            # Server-side Supabase
│       └── middleware.ts        # Session management
│
├── prisma/                      # Database
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Migration history
│
├── public/                      # Static assets
│   ├── favicon.ico
│   ├── og-image.png
│   └── *.svg                    # Icons
│
├── middleware.ts                # Next.js middleware (auth)
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── components.json              # shadcn/ui configuration
└── package.json                 # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (with npm or pnpm)
- **PostgreSQL** database (local or hosted)
- **Supabase** account (for authentication)
- **OpenAI** API key (for AI responses)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/amankumarm/pine.git
   cd pine
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
   
   # Supabase Authentication
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   
   # OpenAI
   OPENAI_API_KEY="sk-..."
   
   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Set up the database**
   
   Run Prisma migrations to create the database schema:
   ```bash
   npx prisma migrate dev
   ```
   
   (Optional) Open Prisma Studio to view your database:
   ```bash
   npx prisma studio
   ```

5. **Configure Supabase**
   
   - Create a new Supabase project
   - Enable Email authentication in Authentication settings
   - Copy your project URL and anon key to `.env`
   - (Optional) Configure email templates for better UX

6. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### First-Time Setup

1. Navigate to `/signup` to create an account
2. Log in with your credentials
3. You'll be redirected to `/dashboard` with a default chat window
4. Start chatting with the AI!
5. Select any AI response text to create a branch

---

## 💡 How It Works

### User Flow

1. **Authentication**
   - User signs up or logs in via Supabase
   - Session is managed with SSR cookies
   - Middleware protects authenticated routes

2. **Board Initialization**
   - On first login, a default board is created with one chat window
   - Board data is fetched server-side and passed to the client

3. **Sending Messages**
   - User types a message and hits send
   - Message is optimistically added to the UI
   - API route creates the user message in the database
   - OpenAI streaming response begins
   - Each chunk updates the UI in real-time using `flushSync`
   - Final message is saved to the database

4. **Branching Conversations**
   - User selects text in an AI response
   - "Ask a follow up" button appears above the selection
   - Clicking creates a new chat window with:
     - Position offset from the parent window
     - An edge connecting the two windows
     - Context from the conversation up to the selected message
   - The new window is ready for input

5. **Canvas Interaction**
   - Users can drag windows to organize their workspace
   - Dragging a parent window moves all its children
   - Zoom and pan to navigate large conversation trees
   - Minimap provides overview of the entire canvas

6. **Navigation**
   - "All Chats" drawer shows all parent (root) conversations
   - Search to filter chats by title
   - Click any chat to auto-focus it on the canvas
   - "New Chat" button creates a new root conversation

### Technical Flow

#### Message Streaming

```typescript
// 1. Client sends message
POST /api/boards/{boardId}/windows/{windowId}/messages
Body: { content: "user message" }

// 2. Server creates user message in DB
const userMessage = await createMessage(windowId, 'USER', content)

// 3. Server initiates OpenAI stream
const stream = await streamChatResponse(messages, content)

// 4. Server streams response as SSE
for await (const chunk of stream) {
  encoder.encode(`data: ${JSON.stringify({ delta: chunk, messageId })}\n\n`)
}

// 5. Client receives chunks and updates UI
flushSync(() => {
  setWindows(prev => /* update message content */)
})
```

#### Branching Logic

```typescript
// 1. User selects text in a message
onTextSelect(selectedText, messageId, sourceWindowId, range)

// 2. Create new window optimistically
const tempWindow = {
  id: `temp-${Date.now()}`,
  positionX: sourceWindow.positionX + 600,
  positionY: sourceWindow.positionY,
  messages: []
}

// 3. Create edge optimistically
const tempEdge = {
  sourceWindowId,
  targetWindowId: tempWindow.id,
  selectedText,
  sourceMessageId: messageId
}

// 4. Persist to database
POST /api/boards/{boardId}/windows
POST /api/boards/{boardId}/edges

// 5. Sync with server state
GET /api/boards/{boardId}
```

#### Context Building

When branching, the system builds context intelligently:

```typescript
// Get all messages up to the selected message
const contextMessages = buildContextUpToMessage(messages, sourceMessageId)

// This includes:
// - All messages before the selected message
// - The selected message itself
// - Excludes messages after the selection

// The new branch starts with this context
// allowing the AI to understand the conversation history
```

---

## 🎨 Design System

### Color Palette

Pine uses a carefully crafted color system with OKLCH color space for perceptual uniformity:

**Light Mode (Default)**
- Background: `oklch(1 0 0)` - Pure white
- Foreground: `oklch(0.141 0.005 285.823)` - Near black
- Primary: `oklch(0.21 0.006 285.885)` - Dark gray
- Muted: `oklch(0.967 0.001 286.375)` - Light gray
- Border: `oklch(0.92 0.004 286.32)` - Subtle gray

**Dark Mode**
- Background: `rgb(16, 15, 11)` - Warm black
- Foreground: `rgb(250, 250, 250)` - Off-white
- Primary: `rgb(228, 228, 231)` - Light gray
- Card: `rgb(37, 36, 30, 0.7)` - Translucent dark
- Border: `rgba(250, 250, 250, 0.1)` - Subtle white

### Typography

- **Primary Font**: Geist Sans (body text)
- **Monospace**: Geist Mono (code)
- **Branding**: Oswald (Pine logo, uppercase, tracking-wider)
- **Scale**: 1.25 ratio (1rem, 1.25rem, 1.563rem, 1.953rem, 2.441rem)
- **Line Height**: 1.5 (body), 1.2-1.4 (headings)
- **Font Weight**: 400 (normal), 550 (headings)

### Component Styling

- **Border Radius**: `0.625rem` (10px) for consistency
- **Shadows**: Subtle shadows for depth (`shadow-sm`, `shadow-lg`)
- **Transitions**: Smooth `transition-all` for interactive elements
- **Glassmorphism**: Translucent backgrounds with blur effects
- **Animations**: Pulse, bounce, fade for loading states

---

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@localhost:5432/pine` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | `eyJ...` |
| `OPENAI_API_KEY` | OpenAI API key | Yes | `sk-...` |
| `NEXT_PUBLIC_APP_URL` | Application URL | Yes | `http://localhost:3000` |

### Next.js Configuration

**Security Headers** (`next.config.ts`):
- `X-DNS-Prefetch-Control: on`
- `Strict-Transport-Security: max-age=63072000`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: origin-when-cross-origin`

**Middleware** (`middleware.ts`):
- Matches all routes except static files and images
- Updates Supabase session on each request
- Redirects unauthenticated users from protected routes

### Prisma Configuration

**Database Provider**: PostgreSQL  
**Client Generation**: `prisma-client-js`  
**Migration Strategy**: `prisma migrate dev` for development

---

## 📊 API Reference

### Boards

#### `GET /api/boards/:boardId`
Fetch board data with all windows, messages, and edges.

**Response:**
```json
{
  "id": "uuid",
  "name": "Canvas",
  "description": null,
  "chatWindows": [...],
  "edges": [...]
}
```

### Windows

#### `POST /api/boards/:boardId/windows`
Create a new chat window.

**Request:**
```json
{
  "title": "New Chat",
  "positionX": 250,
  "positionY": 100
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "New Chat",
  "positionX": 250,
  "positionY": 100,
  "messages": []
}
```

#### `PATCH /api/boards/:boardId/windows/:windowId`
Update window position or title.

**Request:**
```json
{
  "positionX": 300,
  "positionY": 150,
  "title": "Updated Title"
}
```

### Messages

#### `POST /api/boards/:boardId/windows/:windowId/messages`
Send a message and get AI response (streaming).

**Request:**
```json
{
  "content": "Hello, AI!"
}
```

**Response:** Server-Sent Events (SSE)
```
data: {"delta": "Hello", "messageId": "uuid"}
data: {"delta": "!", "messageId": "uuid"}
data: {"done": true}
```

### Edges

#### `POST /api/boards/:boardId/edges`
Create a branch connection.

**Request:**
```json
{
  "sourceWindowId": "uuid",
  "targetWindowId": "uuid",
  "selectedText": "selected text",
  "sourceMessageId": "uuid"
}
```

---

## 🧪 Development

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Code Quality

- **TypeScript**: Strict mode enabled for type safety
- **ESLint**: Next.js recommended configuration
- **Prettier**: (Add if needed for consistent formatting)
- **Git Hooks**: (Consider adding Husky for pre-commit linting)

### Best Practices

1. **State Management**
   - Use optimistic updates for instant feedback
   - Sync with server after mutations
   - Handle errors gracefully with rollback

2. **Performance**
   - Memoize expensive computations with `useMemo`
   - Use `useCallback` for stable function references
   - Lazy load components when appropriate
   - Debounce position updates to reduce API calls

3. **Accessibility**
   - Use semantic HTML elements
   - Provide ARIA labels for interactive elements
   - Ensure keyboard navigation works
   - Maintain sufficient color contrast

4. **Security**
   - Validate all user inputs
   - Use parameterized queries (Prisma handles this)
   - Implement rate limiting on API routes (TODO)
   - Sanitize user-generated content

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Vercel auto-detects Next.js configuration

2. **Configure Environment Variables**
   - Add all `.env` variables in Vercel dashboard
   - Ensure `NEXT_PUBLIC_APP_URL` points to your production domain

3. **Database Setup**
   - Use a hosted PostgreSQL service (Supabase, Neon, Railway)
   - Run migrations: `npx prisma migrate deploy`

4. **Deploy**
   - Push to main branch to trigger automatic deployment
   - Vercel handles build and deployment

### Self-Hosted

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up environment variables**
   - Create `.env.production` with production values

3. **Run migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Use a process manager**
   - PM2: `pm2 start npm --name "pine" -- start`
   - Docker: Create a Dockerfile (see below)

### Docker

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Provide a clear description of the problem
3. Include steps to reproduce
4. Add screenshots or videos if applicable
5. Specify your environment (OS, browser, Node version)

### Submitting Pull Requests

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/pine.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   - Ensure the app builds: `npm run build`
   - Test core functionality manually
   - (TODO: Add automated tests)

5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Request review from maintainers

### Development Guidelines

- **Code Style**: Follow existing patterns and conventions
- **Commits**: Use clear, descriptive commit messages
- **Documentation**: Update README and inline comments
- **Testing**: Add tests for new features (when test suite exists)
- **Performance**: Consider performance implications of changes

---

## 🗺️ Roadmap

### Planned Features

- [ ] **Collaboration**
  - Real-time multi-user editing
  - Shared boards with permissions
  - Commenting on messages

- [ ] **Enhanced AI**
  - Multiple AI model support (Claude, Gemini)
  - Custom system prompts per window
  - Image generation and analysis
  - Code execution environment

- [ ] **Organization**
  - Multiple boards per user
  - Folders and tags for organization
  - Search across all conversations
  - Export conversations (PDF, Markdown)

- [ ] **Customization**
  - Dark mode toggle
  - Custom color themes
  - Adjustable window sizes
  - Canvas backgrounds and grid options

- [ ] **Mobile**
  - Responsive mobile interface
  - Touch gestures for canvas navigation
  - Mobile-optimized chat windows

- [ ] **Performance**
  - Virtual scrolling for large conversations
  - Lazy loading of off-screen windows
  - Optimized rendering for large trees

- [ ] **Developer Experience**
  - Automated testing (Jest, Playwright)
  - Storybook for component development
  - CI/CD pipeline
  - API documentation (Swagger/OpenAPI)

---

## 📝 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2024 Aman Kumar

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** - The React framework for production
- **[ReactFlow](https://reactflow.dev/)** - For the amazing canvas library
- **[Supabase](https://supabase.com/)** - For authentication and database hosting
- **[Vercel](https://vercel.com/)** - For the AI SDK and hosting platform
- **[OpenAI](https://openai.com/)** - For GPT-4 and AI capabilities
- **[shadcn/ui](https://ui.shadcn.com/)** - For beautiful UI components
- **[Radix UI](https://www.radix-ui.com/)** - For accessible primitives
- **[Tailwind CSS](https://tailwindcss.com/)** - For utility-first styling

---

## 📧 Contact

**Aman Kumar**  
- GitHub: [@amankumarm](https://github.com/amankumarm)
- Project: [Pine](https://github.com/amankumarm/pine)

For questions, suggestions, or feedback, please open an issue on GitHub.

---

## 🌟 Star History

If you find Pine useful, please consider giving it a star on GitHub! ⭐

---

**Built with ❤️ by Aman Kumar**
