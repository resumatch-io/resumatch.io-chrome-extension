## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd resumatch-extension
```

### 2. Install Dependencies

```bash
pnpm install
# or
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your environment variables to `.env`:

```env
# Clerk Authentication (Required)
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Chrome Extension Key (Optional - for consistent extension ID)
CRX_PUBLIC_KEY=your_crx_public_key_here
```

### 4. Clerk Authentication Setup

1. **Create Clerk Application:**
   - Visit [Clerk Dashboard](https://dashboard.clerk.com)
   - Create a new application
   - Select "Chrome Extension" as application type

2. **Configure Clerk:**
   - Copy your Publishable Key to `.env`
   - Add your extension's URL to allowed origins
   - Configure social providers (Google recommended)

3. **Detailed Setup:**
   - See `CLERK_AUTH_SETUP.md` for complete authentication configuration

## 🚀 Development

### Start Development Server

```bash
pnpm dev
# or
npm run dev
```

This will:
- Start the Plasmo development server
- Generate development builds in `build/chrome-mv3-dev/`
- Enable hot reloading for code changes

## 🏗️ Project Structure

```
resumatch-extension/
├── src/
│   ├── features/           # Feature components
│   │   ├── sidebar.tsx     # Main sidebar component
│   │   ├── tailor.tsx      # Resume tailoring page
│   │   ├── select.tsx      # Resume selection page
│   │   ├── resume.tsx      # Resume download page
│   │   └── screenshot.tsx  # Screenshot capture
│   ├── background.ts       # Background script
│   ├── content.tsx         # Content script
│   └── style.css          # Global styles
├── assets/                 # Static assets (icons, images)
├── build/                  # Generated extension builds
├── .env                    # Environment variables
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # TailwindCSS configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```
# extension
# chrome-extension
# chrome-extension
# chrome-extension
