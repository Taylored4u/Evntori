# Marketplace Platform - Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │   Mobile     │  │    Admin     │          │
│  │  (Next.js)   │  │ Web (PWA)    │  │   Portal     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Next.js App Router (React 18)                 │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │  Server  │  │  Client  │  │   API    │  │ Middleware│ │ │
│  │  │Components│  │Components│  │  Routes  │  │           │ │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│      SERVICE LAYER          │  │    EXTERNAL SERVICES        │
│  ┌───────────────────────┐  │  │  ┌───────────────────────┐  │
│  │  Supabase Services    │  │  │  │  Stripe Connect       │  │
│  │  • Auth               │  │  │  │  • Payments           │  │
│  │  • PostgreSQL         │  │  │  │  • Payouts            │  │
│  │  • Real-time          │  │  │  │  • Webhooks           │  │
│  │  • Storage            │  │  │  └───────────────────────┘  │
│  │  • Edge Functions     │  │  │                             │
│  └───────────────────────┘  │  │  ┌───────────────────────┐  │
│                             │  │  │  Email Service        │  │
│                             │  │  │  • Transactional      │  │
│                             │  │  │  • Notifications      │  │
└─────────────────────────────┘  │  └───────────────────────┘  │
                                │                             │
                                └─────────────────────────────┘
```

---

## Data Flow Architecture

### 1. User Authentication Flow

```
User Action → Next.js Page → Supabase Auth → Database
                ↓                              ↓
         Auth Context ← Session Cookie ← User Profile
                ↓
         Protected Route Middleware
```

**Implementation:**
- Supabase Auth handles all authentication
- Session stored in HTTP-only cookie
- `AuthContext` provides user state to components
- Middleware protects routes based on role
- RLS policies enforce database access

### 2. Listing/Search Flow

```
Search Query → Next.js Page → Supabase Query → PostgreSQL
                ↓                              ↓
         Client State ← Formatted Data ← Full-Text Search
                ↓                       ↓
         Display Results        + RLS Filtering
```

**Key Features:**
- Server Components for initial render
- Client Components for interactions
- Real-time updates via subscriptions
- Optimized queries with indexes
- Pagination for large datasets

### 3. Booking/Payment Flow

```
User Selection → Booking Form → Create Booking → Database
                                      ↓
                            Stripe Checkout Session
                                      ↓
                            Payment Confirmation
                                      ↓
                            Stripe Webhook → Update Booking
                                      ↓
                            Notify Users → Notifications
                                      ↓
                            Connect Transfer → Seller Payout
```

**Process:**
1. User selects dates and options
2. System calculates total (base + fees + tax + deposit)
3. Booking record created with "pending" status
4. Stripe Checkout Session created
5. User completes payment
6. Webhook confirms payment
7. Booking status updated to "confirmed"
8. Notifications sent to both parties
9. Funds transferred to seller (minus platform fee)

### 4. Messaging Flow

```
User Types Message → Submit → Insert to Database
                                      ↓
                            Real-time Subscription
                                      ↓
                            Notification Trigger
                                      ↓
                    Both Users See Update Instantly
```

**Features:**
- Real-time via WebSocket (Supabase Realtime)
- Persistent message history
- Read receipts
- Conversation threading
- Mobile-optimized interface

### 5. Notification Flow

```
Database Event → Trigger Function → Create Notification
                                           ↓
                            Subscription Channel
                                           ↓
                            User's UI Updates
                                           ↓
                          Optional Email Sent
```

**Types of Notifications:**
- Booking confirmations
- Status changes
- New messages
- Reviews received
- Payment confirmations
- Milestone completions

---

## Database Architecture

### Entity Relationship Overview

```
┌─────────────┐
│   Profiles  │
└──────┬──────┘
       │ 1:1
       ▼
┌─────────────────┐         ┌──────────────┐
│  Lender Profile │────1:N──│   Listings   │
└─────────────────┘         └──────┬───────┘
                                   │ 1:N
       ┌───────────────────────────┼───────────────────┐
       ▼                           ▼                   ▼
┌──────────────┐         ┌──────────────┐    ┌──────────────┐
│   Images     │         │   Variants   │    │   Add-ons    │
└──────────────┘         └──────────────┘    └──────────────┘
                                   │
                                   │ N:1
                                   ▼
                            ┌──────────────┐
                            │   Bookings   │
                            └──────┬───────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
            ┌─────────────┐  ┌──────────┐  ┌──────────┐
            │  Payments   │  │ Messages │  │ Reviews  │
            └─────────────┘  └──────────┘  └──────────┘
```

### Key Tables and Relationships

1. **User Management** (3 tables)
   - `profiles` - User accounts
   - `lender_profiles` - Seller-specific data
   - `addresses` - User locations

2. **Marketplace Core** (12 tables)
   - `categories` - Service/product categories
   - `listings` - Main offerings
   - `listing_images` - Multiple images per listing
   - `listing_variants` - Size, color, tier options
   - `listing_add_ons` - Additional services
   - `bundles` - Package deals
   - `deposits` - Security deposit configs
   - `availability_blocks` - Blocked dates
   - `pricing_rules` - Dynamic pricing

3. **Transactions** (8 tables)
   - `bookings` - Orders/engagements
   - `booking_items` - Line items
   - `booking_add_ons` - Selected extras
   - `delivery_options` - Shipping/delivery
   - `payouts` - Seller payments
   - `refunds` - Returns
   - `disputes` - Conflict resolution
   - `fees` - Platform fees

4. **Communication** (4 tables)
   - `conversations` - Chat threads
   - `messages` - Individual messages
   - `notifications` - In-app alerts
   - `notification_preferences` - User settings

5. **Reviews & Ratings** (1 table)
   - `reviews` - Two-sided rating system

6. **Marketing** (5 tables)
   - `favorites` - Saved items
   - `saved_searches` - Saved filters
   - `coupons` - Discount codes
   - `featured_collections` - Curated lists
   - `cms_pages` - Static content

7. **Admin** (3 tables)
   - `audit_logs` - Action tracking
   - `webhook_events` - External events
   - `tax_rates` - Location-based taxes

### Data Integrity Features

**Foreign Keys:**
- All relationships enforced at database level
- Cascade deletes where appropriate
- Prevent orphaned records

**Indexes:**
- Primary keys on all tables
- Foreign key indexes for joins
- Composite indexes for common queries
- Full-text search indexes

**Constraints:**
- NOT NULL for required fields
- CHECK constraints for valid values
- UNIQUE constraints for business rules
- Default values for standard fields

**Triggers:**
- Auto-create related records
- Update timestamps
- Generate notifications
- Calculate aggregates

---

## Security Architecture

### 1. Row Level Security (RLS)

Every table has policies enforcing:

```sql
-- Users can only see their own data
CREATE POLICY "Users view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users update own data"
  ON table_name FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Policy Types:**
- `SELECT` - Reading data
- `INSERT` - Creating records
- `UPDATE` - Modifying records
- `DELETE` - Removing records

**Special Policies:**
- Sellers can see bookings for their listings
- Admins can see all data
- Public can see active, published listings
- Reviewers can only review completed bookings

### 2. Authentication Security

**Features:**
- Bcrypt password hashing
- Email verification optional
- Password reset via secure tokens
- Session expiration (7 days)
- CSRF protection on mutations
- Rate limiting on login attempts

**Token Management:**
- Access token (short-lived)
- Refresh token (long-lived)
- Tokens stored in HTTP-only cookies
- Automatic token refresh

### 3. API Security

**Validation:**
- Zod schema validation on all inputs
- Type checking with TypeScript
- Sanitization of user input
- SQL injection prevention (parameterized queries)

**Rate Limiting:**
- Per-user limits on mutations
- IP-based limits on sensitive endpoints
- Exponential backoff on failed attempts

**Authorization:**
- Middleware checks on all routes
- Role-based access control
- Resource-level permissions
- Action-level permissions

### 4. Payment Security

**Stripe Integration:**
- Webhook signature verification
- Idempotency keys for operations
- No card data stored locally
- PCI DSS compliance via Stripe
- 3D Secure for high-risk payments

**Financial Data:**
- Amounts stored as integers (cents)
- Currency tracking per transaction
- Audit trail for all financial operations
- Read-only access to historical data

### 5. Data Privacy

**PII Handling:**
- Minimal collection principle
- Encrypted at rest (Supabase default)
- Encrypted in transit (TLS 1.3)
- Right to deletion support
- Data export capability

**GDPR Compliance:**
- User consent tracking
- Privacy policy link
- Data retention policies
- User data download
- Account deletion

---

## Performance Architecture

### 1. Rendering Strategy

**Server Components (Default):**
- Initial page loads
- SEO-critical pages
- Data-heavy displays
- Static content

**Client Components:**
- Interactive features
- Real-time updates
- Form inputs
- Animations

### 2. Caching Strategy

**Next.js Caching:**
- Static pages cached at build time
- ISR (Incremental Static Regeneration) for listings
- Dynamic routes cached with revalidation
- API routes cached with appropriate headers

**Database Caching:**
- Connection pooling (Supabase default)
- Query result caching
- Prepared statements
- Materialized views for analytics

### 3. Optimization Techniques

**Code Splitting:**
- Automatic route-based splitting
- Dynamic imports for heavy components
- Lazy loading for below-fold content

**Image Optimization:**
- Next.js Image component
- Automatic WebP conversion
- Responsive images
- Lazy loading
- CDN delivery via Supabase Storage

**Database Optimization:**
- Indexes on all foreign keys
- Composite indexes for complex queries
- Query result pagination
- Selective field fetching
- JOIN optimization

### 4. Scalability Considerations

**Horizontal Scaling:**
- Stateless application servers
- Database read replicas
- CDN for static assets
- Load balancing (Vercel automatic)

**Vertical Scaling:**
- Supabase can scale to enterprise
- Connection pooler for efficiency
- Query performance monitoring
- Resource usage tracking

### 5. Monitoring & Observability

**Metrics to Track:**
- Response times per route
- Database query performance
- Error rates and types
- User session length
- Conversion funnel metrics

**Tools:**
- Vercel Analytics (built-in)
- Supabase Dashboard
- Stripe Dashboard
- Custom error logging
- Real User Monitoring (RUM)

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge Network                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Americas  │  │   Europe    │  │    Asia     │         │
│  │   Region    │  │   Region    │  │   Region    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application Instances                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js Application (Serverless Functions)          │   │
│  │  • Automatic scaling                                  │   │
│  │  • Zero downtime deployments                          │   │
│  │  • Preview deployments for PRs                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │    Stripe    │  │   Storage    │
│   (Primary)  │  │   (Global)   │  │    (CDN)     │
│              │  │              │  │              │
│  • Database  │  │  • Payments  │  │  • Images    │
│  • Auth      │  │  • Connect   │  │  • Assets    │
│  • Realtime  │  │  • Webhooks  │  │  • Uploads   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Environment Strategy

**Three Environments:**

1. **Development** (local)
   - Local Next.js dev server
   - Supabase local (optional)
   - Stripe test mode
   - Mock data seeding

2. **Staging** (Vercel preview)
   - Preview deployments per PR
   - Separate Supabase project
   - Stripe test mode
   - Full feature testing

3. **Production** (Vercel)
   - Main branch auto-deploy
   - Production Supabase
   - Stripe live mode
   - Real data

### CI/CD Pipeline

```
Code Push → GitHub
    ↓
Vercel Detects Change
    ↓
Build Process
    ├── Install dependencies
    ├── Run type checking
    ├── Run build
    ├── Generate static pages
    └── Deploy to edge
    ↓
Health Checks
    ├── HTTP status checks
    ├── Database connectivity
    └── External service status
    ↓
Route Traffic to New Version
```

### Backup Strategy

**Automated Backups:**
- Supabase: Daily automatic backups (retained 7-30 days)
- Database point-in-time recovery
- Stripe data redundancy (automatic)
- User uploads: Supabase Storage redundancy

**Manual Backups:**
- Pre-deployment database snapshot
- Critical migration backups
- Configuration exports

### Disaster Recovery

**RTO (Recovery Time Objective):** < 1 hour
**RPO (Recovery Point Objective):** < 15 minutes

**Recovery Procedures:**
1. Database restore from backup
2. Redeploy last known good version
3. Verify data integrity
4. Resume normal operations

---

## Development Workflow

### Local Development Setup

```bash
# 1. Clone repository
git clone [repo] && cd project

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.local.example .env.local
# Add your credentials

# 4. Run development server
npm run dev

# 5. Access at http://localhost:3000
```

### Code Organization

```
project/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth route group
│   ├── (marketplace)/     # Public routes
│   ├── (seller)/          # Seller routes
│   └── api/               # API endpoints
├── components/            # React components
│   ├── ui/               # Base components
│   └── [feature]/        # Feature components
├── lib/                   # Utilities
│   ├── supabase/         # DB client
│   ├── stripe/           # Payment logic
│   ├── auth/             # Auth helpers
│   └── validations/      # Zod schemas
├── types/                 # TypeScript types
├── supabase/             # Supabase config
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge functions
└── public/               # Static assets
```

### Best Practices

**Component Structure:**
- One component per file
- Co-locate related components
- Extract reusable logic
- Type all props
- Document complex components

**State Management:**
- Server state via Supabase
- Local state via useState
- Form state via React Hook Form
- Global state via Context (auth)

**Error Handling:**
- Try-catch in async functions
- User-friendly error messages
- Error boundaries for components
- Logging to monitoring service
- Fallback UI for errors

**Testing Strategy:**
- Type checking (TypeScript)
- Manual testing for features
- User acceptance testing
- Performance testing
- Security testing

---

## Integration Points

### External Services

1. **Supabase**
   - Database operations
   - Authentication
   - Storage
   - Real-time subscriptions
   - Edge Functions

2. **Stripe**
   - Payment processing
   - Connect onboarding
   - Webhook events
   - Payout management
   - Refund processing

3. **Email Service** (Optional)
   - Transactional emails
   - Notification emails
   - Marketing emails

### API Endpoints

**Public APIs:**
- `GET /api/listings` - Search listings
- `GET /api/listings/[id]` - Get listing details

**Authenticated APIs:**
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - List user bookings
- `POST /api/messages` - Send message
- `GET /api/notifications` - Get notifications

**Seller APIs:**
- `POST /api/listings` - Create listing
- `PATCH /api/listings/[id]` - Update listing
- `GET /api/analytics` - Get analytics

**Payment APIs:**
- `POST /api/stripe/checkout` - Create session
- `POST /api/stripe/connect/account` - Create Connect account
- `POST /api/webhooks/stripe` - Handle webhooks

**Admin APIs:**
- `GET /api/admin/users` - List users
- `PATCH /api/admin/listings/[id]` - Moderate listing
- `GET /api/admin/metrics` - Platform metrics

---

## Future Enhancements

### Potential Additions

1. **Mobile Apps**
   - React Native app
   - Share code with web
   - Push notifications
   - Offline support

2. **Advanced Features**
   - Multi-language support
   - Multi-currency
   - Advanced analytics
   - AI recommendations
   - Automated pricing

3. **Integrations**
   - Calendar sync (Google, Outlook)
   - Accounting software
   - Marketing tools
   - CRM systems

4. **Performance**
   - Redis caching layer
   - Read replica databases
   - GraphQL API
   - Server-side rendering optimizations

---

This architecture provides a solid foundation that can scale from MVP to enterprise while maintaining security, performance, and developer experience.
