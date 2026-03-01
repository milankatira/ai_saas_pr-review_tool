# AI Code Review SaaS

An AI-powered SaaS platform that automatically reviews GitHub pull requests using Anthropic Claude. Get intelligent code feedback directly in your PRs.

##🚀 Features

- **AI-Powered Code Reviews**: Get detailed feedback on code quality, security, performance, and best practices
- **GitHub Integration**: Seamless integration with GitHub via GitHub App
- **Real-time Analysis**: Reviews triggered automatically on PR creation/update
- **Multi-category Feedback**: Issues categorized by type (security, performance, readability, etc.)
- **Subscription Management**: Built-in billing with Stripe integration
- **Dashboard**: Web interface to manage repositories and view review history

##🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching and state management

### Backend
- **NestJS 10.4** - Node.js framework
- **MongoDB** - Database (Mongoose ODM)
- **Redis** - Queue processing (Bull)
- **Passport.js** - Authentication
- **Stripe** - Payment processing

### AI & GitHub
- **Anthropic Claude** - AI code analysis
- **Octokit** - GitHub API integration
- **GitHub App** - Webhook handling

##📋 Prerequisites

- Node.js 18+
- pnpm (package manager)
- MongoDB (local or Atlas)
- Redis (local or cloud)
- GitHub account
- Anthropic API key
- Stripe account (for production)

##🛠 Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ai-code-review
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

### 4. Configure Environment Variables

Edit the `.env` file with your credentials:

#### Application Settings
```env
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

#### Database
```env
MONGODB_URI=mongodb://localhost:27017/ai-code-review
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Authentication
```env
# Generate with: openssl rand -hex 32
JWT_SECRET=your-jwt-secret-change-in-production
JWT_EXPIRATION=1h
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_REFRESH_EXPIRATION=7d

# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your-32-byte-hex-key-for-token-encryption
```

#### GitHub Integration

**Create a GitHub OAuth App:**
1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Configure:
   - Application name: `AI Code Review`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3001/auth/github/callback`
4. Copy the Client ID and Client Secret

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3001/auth/github/callback
```

**Create a GitHub App:**
1. Go to https://github.com/settings/apps
2. Click "New GitHub App"
3. Configure with these settings:

**Basic Information:**
- GitHub App name: `ai-code-review`
- Homepage URL: `http://localhost:3000`

**Webhook:**
- Active: ✅
- Webhook URL: `http://localhost:3001/webhooks/github`
- Generate a secret: `openssl rand -hex 32`

**Permissions:**
- Repository permissions:
  - Pull requests: Read & Write
  - Contents: Read
  - Metadata: Read
- Organization permissions:
  - Members: Read (optional)
- Account permissions:
  - Email addresses: Read

**Subscribe to Events:**
- [x] Pull request
- [x] Installation
- [x] Installation repositories

**Installation:**
- Where can this GitHub App be installed? Any account

4. After creation:
   - Copy the App ID
   - Generate and download the private key
   - Encode the private key: `base64 -i private-key.pem`
   - Copy the webhook secret you generated

```env
GITHUB_APP_ID=your-app-id
GITHUB_APP_PRIVATE_KEY=base64-encoded-private-key
GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

#### AI Service
```env
# Get from https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key
ANTHROPIC_MODEL=claude-3.5-sonnet-20240620
```

#### Payment Processing (Optional for Development)
```env
# Get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO_MONTHLY=price_xxx
```

### 5. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev

# Or start individually
pnpm dev --filter=web      # Frontend only
pnpm dev --filter=api      # Backend only
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🚀 Production Deployment

### Railway Deployment (Recommended)

1. **Deploy Backend API:**
   - Create a new Railway project
   - Connect your GitHub repository
   - Set environment variables from `.env`
   - Add MongoDB and Redis plugins

2. **Deploy Frontend:**
   - Create separate Railway service for frontend
   - Set `NEXT_PUBLIC_API_URL` to your backend URL

3. **Update GitHub App Settings:**
   - Homepage URL: `https://your-frontend.up.railway.app`
   - Callback URL: `https://your-backend.up.railway.app/auth/github/callback`
   - Webhook URL: `https://your-backend.up.railway.app/webhooks/github`

4. **Update Environment Variables:**
   ```env
   NODE_ENV=production
   API_URL=https://your-backend.up.railway.app
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```

### Environment Variables for Production

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `API_URL` | Backend URL | `https://your-api.up.railway.app` |
| `FRONTEND_URL` | Frontend URL | `https://your-app.up.railway.app` |
| `MONGODB_URI` | MongoDB connection | Atlas connection string |
| `REDIS_HOST` | Redis host | Railway Redis URL |
| `JWT_SECRET` | JWT signing secret | Long random string |
| `ENCRYPTION_KEY` | Token encryption | 32-byte hex key |
| `GITHUB_CLIENT_ID` | GitHub OAuth Client ID | From GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Secret | From GitHub OAuth App |
| `GITHUB_CALLBACK_URL` | OAuth callback | `https://api.domain.com/auth/github/callback` |
| `GITHUB_APP_ID` | GitHub App ID | From GitHub App |
| `GITHUB_APP_PRIVATE_KEY` | Base64 encoded private key | From downloaded .pem file |
| `GITHUB_WEBHOOK_SECRET` | Webhook secret | Secret you generated |
| `ANTHROPIC_API_KEY` | Claude API key | From Anthropic console |
| `STRIPE_SECRET_KEY` | Stripe secret key | Live secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Live publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | From Stripe dashboard |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro plan price ID | Price ID from Stripe |

##📖

### For Developers

1. **Install the GitHub App** on your repositories
2. **Create a Pull Request** - AI review will be triggered automatically
3. **View feedback** directly in the PR as comments
4. **Access the Dashboard** at `/dashboard` to manage repositories

### For Team Admins

1. **Login** to the web application
2. **Install GitHub App** on organization repositories
3. **Configure settings** for each repository
4. **Monitor usage** and manage subscriptions
5. **Review analytics** in the dashboard

##🧪 Development

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm test --filter=api
pnpm test --filter=web
```

### Linting

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint -- --fix
```

### Type Checking

```bash
# Check TypeScript types
pnpm typecheck
```

### Database Migrations

```bash
# Run database migrations (if any)
pnpm db:migrate
```

##📚 Documentationation

### Authentication

All API requests require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication
- `GET /auth/github` - GitHub OAuth login
- `GET /auth/github/callback` - OAuth callback
- `POST /auth/refresh` - Refresh access token

#### Repositories
- `GET /github/my-repositories` - Get all repositories
- `GET /github/organizations/:id/repositories` - Get repositories by organization
- `PATCH /github/repositories/:id/toggle` - Enable/disable repository reviews

#### Reviews
- `GET /reviews` - Get all reviews
- `GET /reviews/:id` - Get specific review
- `GET /reviews/stats` - Get review statistics

#### Organizations
- `GET /organizations` - Get user organizations
- `POST /organizations` - Create organization

#### Billing
- `GET /billing/subscription` - Get subscription status
- `POST /billing/checkout` - Create checkout session
- `GET /billing/portal` - Get billing portal URL

##🛠️ Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation
- Ensure all tests pass before submitting PR

##🐛bleshooting

### Common Issues

**Webhook not receiving events:**
- Verify webhook URL is accessible from internet
- Check webhook secret matches in GitHub and environment
- Use ngrok for local development: `ngrok http 3001`

**Repositories not showing:**
- Ensure GitHub App is installed on repositories
- Check webhook is properly configured
- Use "Sync Repos" button in repositories page

**Authentication issues:**
- Verify GitHub OAuth credentials
- Check callback URL matches in GitHub and environment
- Ensure proper SSL in production

**AI reviews not triggering:**
- Check Anthropic API key is valid
- Verify repository has active subscription
- Check webhook is receiving `pull_request` events

### Debugging

```bash
# Enable debug logging
DEBUG=nest:* pnpm dev

# Check webhook delivery in GitHub
# Go to GitHub App Settings → Advanced → Recent Deliveries
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##🙏 Acknowledgments

- [Anthropic](https://anthropic.com) for Claude AI
- [GitHub](https://github.com) for platform integration
- [Next.js](https://nextjs.org) for frontend framework
- [NestJS](https://nestjs.com) for backend framework
- [Stripe](https://stripe.com) for payment processing

##📞 Support

For support, email support@your-domain.com or join our [Discord](https://discord.gg/your-invite).

---

*Built with ❤️ by the AI Code Review Team*
