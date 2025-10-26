# Marketplace Template - Adaptation Guide

## Converting to Small Business CRM Marketplace

This guide walks through adapting the wedding rental marketplace template into a small business CRM marketplace platform.

---

## Concept Mapping

### Current (Wedding Rental) → New (CRM Marketplace)

| Current Concept | New Concept | Description |
|----------------|-------------|-------------|
| Listing | CRM Service | A CRM solution offered by a provider |
| Lender | CRM Provider | Business offering CRM services |
| Renter | Small Business Client | Business seeking CRM services |
| Booking | Engagement | Service engagement/contract |
| Rental Period | Service Period | Duration of CRM service contract |
| Variant | Service Tier | Basic, Pro, Enterprise plans |
| Add-on | Additional Feature | Extra modules (reporting, integrations) |
| Security Deposit | Setup Fee | One-time implementation fee |
| Category | Industry Focus | Retail, Healthcare, Real Estate, etc. |

---

## Step-by-Step Adaptation

### Phase 1: Database Modifications (2-3 hours)

#### 1.1 Create New Migration

**File:** `supabase/migrations/20251005_adapt_to_crm_marketplace.sql`

```sql
-- Rename and extend listings table
ALTER TABLE listings RENAME TO crm_services;

-- Add CRM-specific columns
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS service_type text; -- 'saas', 'custom', 'hybrid'
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS deployment_type text; -- 'cloud', 'on-premise', 'hybrid'
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS min_users integer DEFAULT 1;
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS max_users integer;
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS onboarding_included boolean DEFAULT true;
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS training_hours integer DEFAULT 0;
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS support_level text; -- 'basic', 'premium', '24/7'
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS industry_focus text[]; -- Array of industries
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS integrations text[]; -- Supported integrations
ALTER TABLE crm_services ADD COLUMN IF NOT EXISTS compliance_certifications text[]; -- GDPR, HIPAA, etc.

-- Rename lender_profiles to crm_providers
ALTER TABLE lender_profiles RENAME TO crm_providers;

-- Add provider-specific columns
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS company_size text; -- 'solo', 'small', 'medium', 'enterprise'
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS years_in_business integer;
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS certifications text[];
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS specializations text[];
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE crm_providers ADD COLUMN IF NOT EXISTS case_studies jsonb;

-- Rename bookings to engagements
ALTER TABLE bookings RENAME TO engagements;

-- Add engagement-specific columns
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS contract_type text; -- 'monthly', 'annual', 'project'
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS estimated_users integer;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS go_live_date date;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS project_manager_id uuid REFERENCES profiles(id);
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS milestone_count integer DEFAULT 0;
ALTER TABLE engagements ADD COLUMN IF NOT EXISTS current_phase text;

-- Create milestones table
CREATE TABLE IF NOT EXISTS engagement_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  completed_date date,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'delayed'
  deliverables text[],
  payment_percentage numeric(5,2), -- Percentage of total project cost
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_milestones_engagement ON engagement_milestones(engagement_id);
ALTER TABLE engagement_milestones ENABLE ROW LEVEL SECURITY;

-- Create client requirements table
CREATE TABLE IF NOT EXISTS client_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id uuid NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  category text NOT NULL, -- 'features', 'integrations', 'compliance', 'performance'
  requirement text NOT NULL,
  priority text NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'deferred'
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_requirements_engagement ON client_requirements(engagement_id);
ALTER TABLE client_requirements ENABLE ROW LEVEL SECURITY;

-- Update categories for CRM industries
TRUNCATE categories CASCADE;
INSERT INTO categories (name, description, slug) VALUES
  ('Retail & E-commerce', 'CRM solutions for retail businesses', 'retail'),
  ('Healthcare', 'HIPAA-compliant healthcare CRM', 'healthcare'),
  ('Real Estate', 'Property management and client tracking', 'real-estate'),
  ('Financial Services', 'Banking and investment CRM', 'financial'),
  ('Professional Services', 'Consulting and service firms', 'professional'),
  ('Manufacturing', 'B2B manufacturing CRM', 'manufacturing'),
  ('Technology', 'Tech company CRM solutions', 'technology'),
  ('Non-Profit', 'Donor and volunteer management', 'non-profit');

-- Update listing_variants to service_tiers
ALTER TABLE listing_variants RENAME TO service_tiers;
ALTER TABLE service_tiers RENAME COLUMN listing_id TO service_id;
ALTER TABLE service_tiers ADD COLUMN IF NOT EXISTS features_included text[];
ALTER TABLE service_tiers ADD COLUMN IF NOT EXISTS user_limit integer;

-- Update add-ons to additional_features
ALTER TABLE listing_add_ons RENAME TO additional_features;
ALTER TABLE additional_features RENAME COLUMN listing_id TO service_id;
ALTER TABLE additional_features ADD COLUMN IF NOT EXISTS feature_type text; -- 'module', 'integration', 'support'
ALTER TABLE additional_features ADD COLUMN IF NOT EXISTS recurring boolean DEFAULT true;
```

#### 1.2 Update RLS Policies

All RLS policies will automatically work with renamed tables due to PostgreSQL's CASCADE behavior, but verify they still reference correct concepts.

### Phase 2: Type Definitions (30 minutes)

**File:** `types/database.ts`

Update all type definitions:

```typescript
// Find and replace:
// - Listing → CrmService
// - LenderProfile → CrmProvider
// - Booking → Engagement

export interface CrmService {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description: string;
  service_type: 'saas' | 'custom' | 'hybrid';
  deployment_type: 'cloud' | 'on-premise' | 'hybrid';
  base_price: number;
  pricing_type: 'monthly' | 'annual' | 'project';
  min_users: number;
  max_users: number | null;
  onboarding_included: boolean;
  training_hours: number;
  support_level: 'basic' | 'premium' | '24/7';
  industry_focus: string[];
  integrations: string[];
  compliance_certifications: string[];
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface Engagement {
  id: string;
  service_id: string;
  client_id: string;
  provider_id: string;
  start_date: string;
  end_date: string;
  contract_type: 'monthly' | 'annual' | 'project';
  estimated_users: number;
  go_live_date: string | null;
  project_manager_id: string | null;
  milestone_count: number;
  current_phase: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  total_price: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}
```

### Phase 3: Frontend Updates (4-6 hours)

#### 3.1 Global Search & Replace

Use these VS Code regex find/replace:

```
Find: listing(?!_)
Replace: service

Find: Listing(?!_)
Replace: CrmService

Find: lender
Replace: provider

Find: Lender
Replace: Provider

Find: booking
Replace: engagement

Find: Booking
Replace: Engagement

Find: renter
Replace: client

Find: Renter
Replace: Client
```

**Exclude:** node_modules, .next, .git

#### 3.2 Update Key Pages

**Homepage** (`app/page.tsx`):
```typescript
// Update hero section
<h2 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6">
  Find Your Perfect CRM Solution
</h2>
<p className="text-lg md:text-xl text-muted-foreground mb-10">
  Connect with expert CRM providers who understand your business needs.
  Get personalized solutions without breaking the bank.
</p>
```

**Search Page** (`app/search/page.tsx`):
```typescript
// Update search placeholder
<Input
  placeholder="Search for CRM solutions, integrations, industries..."
  // ...
/>

// Update empty state
<h3>No CRM services found</h3>
<p>Try adjusting your search criteria</p>
```

**Service Detail Page** (`app/listing/[id]/page.tsx` → `app/service/[id]/page.tsx`):

Rename file and update content:
```typescript
// Add CRM-specific details
<div className="space-y-4">
  <div>
    <h4 className="font-semibold mb-2">Deployment Type</h4>
    <Badge>{service.deployment_type}</Badge>
  </div>

  <div>
    <h4 className="font-semibold mb-2">User Capacity</h4>
    <p>{service.min_users} - {service.max_users || 'Unlimited'} users</p>
  </div>

  <div>
    <h4 className="font-semibold mb-2">Integrations</h4>
    <div className="flex flex-wrap gap-2">
      {service.integrations.map(integration => (
        <Badge key={integration} variant="outline">{integration}</Badge>
      ))}
    </div>
  </div>

  {service.compliance_certifications.length > 0 && (
    <div>
      <h4 className="font-semibold mb-2">Compliance</h4>
      <div className="flex flex-wrap gap-2">
        {service.compliance_certifications.map(cert => (
          <Badge key={cert} variant="secondary">
            <Shield className="h-3 w-3 mr-1" />
            {cert}
          </Badge>
        ))}
      </div>
    </div>
  )}
</div>
```

**Engagement Flow** (`app/booking/[listingId]` → `app/engage/[serviceId]`):
```typescript
// Update to show service engagement details
<h1>Start Your CRM Engagement</h1>

// Add business size selector
<div className="space-y-2">
  <Label>Estimated Team Size</Label>
  <Input
    type="number"
    placeholder="Number of users"
    value={estimatedUsers}
    onChange={(e) => setEstimatedUsers(parseInt(e.target.value))}
  />
</div>

// Add go-live date
<div className="space-y-2">
  <Label>Desired Go-Live Date</Label>
  <Calendar
    mode="single"
    selected={goLiveDate}
    onSelect={setGoLiveDate}
  />
</div>
```

#### 3.3 Provider Dashboard Updates

**Dashboard** (`app/sell` → `app/provider`):

Rename directory and update:
```typescript
// app/provider/page.tsx
export default function ProviderDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-6">
        Provider Dashboard
      </h1>

      {/* Show active engagements */}
      <Card>
        <CardHeader>
          <CardTitle>Active Engagements</CardTitle>
        </CardHeader>
        <CardContent>
          {/* List of current clients */}
        </CardContent>
      </Card>

      {/* Revenue metrics */}
      {/* Client satisfaction */}
      {/* Upcoming milestones */}
    </div>
  );
}
```

**Service Creation** (`app/sell/listings/new` → `app/provider/services/new`):
```typescript
// Update form fields
<div className="space-y-2">
  <Label>Service Type</Label>
  <Select value={serviceType} onValueChange={setServiceType}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="saas">SaaS Solution</SelectItem>
      <SelectItem value="custom">Custom Implementation</SelectItem>
      <SelectItem value="hybrid">Hybrid Approach</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label>Deployment Options</Label>
  <Select value={deploymentType} onValueChange={setDeploymentType}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="cloud">Cloud-Based</SelectItem>
      <SelectItem value="on-premise">On-Premise</SelectItem>
      <SelectItem value="hybrid">Hybrid</SelectItem>
    </SelectContent>
  </Select>
</div>

<div className="space-y-2">
  <Label>Supported Integrations</Label>
  <Input
    placeholder="e.g., Salesforce, HubSpot, Zapier"
    // Multi-select or tag input
  />
</div>
```

### Phase 4: New Features (4-6 hours)

#### 4.1 Create Milestone Management Component

**File:** `components/engagement/milestone-tracker.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string;
  due_date: string;
  completed_date: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  payment_percentage: number;
}

export function MilestoneTracker({ engagementId }: { engagementId: string }) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [progress, setProgress] = useState(0);

  // Fetch and display milestones
  // Calculate progress
  // Show timeline view

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Milestones</CardTitle>
        <Progress value={progress} className="mt-2" />
        <p className="text-sm text-muted-foreground mt-2">
          {progress}% Complete
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {milestones.map((milestone) => (
            <div key={milestone.id} className="flex items-start gap-4 p-4 border rounded-lg">
              {milestone.status === 'completed' ? (
                <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              )}

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{milestone.title}</h4>
                  <Badge variant={
                    milestone.status === 'completed' ? 'default' :
                    milestone.status === 'delayed' ? 'destructive' : 'secondary'
                  }>
                    {milestone.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {milestone.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                  </span>
                  <span>Payment: {milestone.payment_percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### 4.2 Create Requirements Tracking

**File:** `components/engagement/requirements-list.tsx`

```typescript
// Component to track client requirements and feature requests
// Similar structure to milestone tracker
// Categories: Features, Integrations, Compliance, Performance
// Priority levels and status tracking
```

#### 4.3 Client Dashboard

**File:** `app/client/dashboard/page.tsx`

```typescript
// Dashboard for small business clients
// Show active engagements
// Upcoming milestones
// Support tickets
// Training resources
// Billing information
```

### Phase 5: Branding & Copy (2-3 hours)

#### 5.1 Update Site Configuration

**File:** `lib/config.ts`

```typescript
export const siteConfig = {
  name: 'CRM Marketplace', // Your brand name
  description: 'Connect small businesses with expert CRM providers',
  tagline: 'Find Your Perfect CRM Solution',
  keywords: ['CRM', 'small business', 'customer management', 'sales automation'],
  industry: 'business-services',
  targetAudience: 'small-businesses',
};
```

#### 5.2 Update All User-Facing Copy

Search for wedding/rental specific terms and replace:
- "wedding" → "business"
- "rental" → "service" / "engagement"
- "couples" → "small businesses"
- "event" → "implementation"

### Phase 6: Testing Checklist

- [ ] Provider registration and Stripe Connect
- [ ] Create CRM service listing
- [ ] Search for services by industry
- [ ] Client engagement flow
- [ ] Milestone creation and tracking
- [ ] Requirements management
- [ ] Payment processing for service fees
- [ ] Messaging between client and provider
- [ ] Review system
- [ ] Admin oversight

---

## Key Differences from Original

### Pricing Model
- **Original:** Per-day/hour rental with security deposit
- **New:** Monthly/annual subscription or project-based with implementation fee

### Duration
- **Original:** Short-term (days/weeks)
- **New:** Long-term (months/years) with ongoing relationship

### Delivery
- **Original:** Physical item pickup/return
- **New:** Digital service with milestones and go-live date

### Relationship
- **Original:** Transactional
- **New:** Consultative with ongoing support

---

## Estimated Adaptation Time

| Phase | Hours | Notes |
|-------|-------|-------|
| Database modifications | 2-3 | Migrations and schema updates |
| Type definitions | 0.5 | TypeScript updates |
| Frontend updates | 4-6 | Pages and components |
| New features | 4-6 | Milestones, requirements |
| Branding & copy | 2-3 | UI text and messaging |
| Testing | 2-3 | Full platform testing |
| **Total** | **15-21 hours** | ~2-3 days for one developer |

---

## Post-Adaptation Enhancements

After basic adaptation, consider adding:

1. **Client Portal**
   - Self-service dashboard
   - Training materials
   - Support ticketing
   - Usage analytics

2. **Provider Tools**
   - Proposal builder
   - Contract templates
   - Time tracking
   - Resource planning

3. **Advanced Features**
   - Multi-provider projects
   - Referral system
   - White-label options
   - API marketplace

4. **Integrations**
   - Accounting (QuickBooks, Xero)
   - Communication (Slack, Teams)
   - Project management (Asana, Jira)
   - Documentation (Notion, Confluence)

---

## Questions & Support

For specific adaptation questions, review:
- Database schema comments in migrations
- Component-level documentation
- Type definitions
- Existing business logic in `/lib` folders

The template is designed to be flexible - adapt what you need and keep what works!
