# Yyoung Belt Project Documentation

## Project Overview
The Yyoung Clinic Belt is a pharmaceutical warehouse management system that processes orders through a multi-stage conveyor belt system. It manages order fulfillment from receipt through quality control to shipping.

### Core Functionality
- **Belt Processing System**: 3-stage order processing workflow
- **Quality Control**: Pharmacist review and approval
- **User Management**: Role-based access control (Admin, Coordinator, Pharmacist, Belt Operator)
- **Real-time Tracking**: Order status and queue management
- **Documentation**: Photo capture at each processing stage
- **Integration**: PharmacyWire API for order and patient data

## Technical Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: MySQL with Drizzle ORM
- **Authentication**: NextAuth.js
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **External Services**: 
  - UploadThing (file uploads)
  - Twilio (SMS notifications)
  - Resend (email)
  - PharmacyWire (order data API)

## Build Commands
- `bun run dev`: Start development server
- `bun run build`: Build for production
- `bun run lint`: Run ESLint
- `bun run test`: Run tests with `tsx ./src/test/main.ts`
- `bun run db:generate`: Generate database migrations
- `bun run db:migrate`: Apply database migrations
- `bun run db:push`: Generate and apply database migrations
- `bun run db:studio`: Open Drizzle Studio for database management

## Code Style Guidelines
- **Imports**: Use absolute imports with `@/*` path alias for src directory
- **TypeScript**: Strict mode enabled, use proper typing for all variables and functions
- **Components**: Follow Next.js App Router structure, use React Server Components where appropriate
- **Naming**: PascalCase for components, camelCase for functions/variables, kebab-case for files
- **UI Components**: Use Shadcn UI components from `/components/ui`
- **Forms**: Use react-hook-form with zod validation schema
- **State Management**: Use hooks pattern with `/components/hooks/use-store.ts`
- **Error Handling**: Use try/catch blocks with proper error logging
- **API Structure**: Utilize Next.js API routes in `/app/api`
- **Database Access**: Use Drizzle ORM for database operations
- **Authentication**: Implement NextAuth for user authentication

## Application Architecture

### User Roles and Permissions
1. **ADMIN**: Full system access, user management, process oversight
2. **COORDINATOR**: Process monitoring, reporting, cannot pull belt queues
3. **PHARMACIST**: Review and approve/deny completed orders
4. **BELT**: Process orders through stages, assigned to specific belts (A, B, C, D)

### Belt Processing Workflow
Orders move through three sequential stages:

#### Stage 1 (Initial Processing)
- Pull order from queue
- Scan and verify items against order
- Record lot numbers
- Take photo of packed items
- Push to Stage 2

#### Stage 2 (Label Application)
- Verify items from Stage 1
- Apply shipping label
- Take photo with label visible
- Push to Stage 3

#### Stage 3 (Final Processing)
- Final verification
- Assign to shipping cage (1-12)
- Take final documentation photo
- Mark as completed for pharmacist review

### Database Schema Overview
Key tables in the system:
- `users`: System users with role-based access
- `belt_queues`: Main processing queue tracking orders through stages
- `affiliates`: Partner organizations sending orders
- `orders/order_items`: Order details and line items
- `packages/drugs`: Product catalog from PharmacyWire
- `logs`: Activity and audit trail
- `files`: Document and image storage

### Key Features

#### Queue Management
- Automatic order assignment based on availability
- Skip/unskip functionality for problem orders
- Real-time status updates
- Cage capacity tracking

#### Quality Control
- Multi-stage photo documentation
- Pharmacist review workflow
- Approval/denial with reason tracking
- SMS notifications for denials

#### Integrations
- **PharmacyWire API**: Order and patient data synchronization
- **File Upload**: UploadThing for image storage
- **Notifications**: Twilio SMS and Resend email

### Development Guidelines

#### Server Actions
- Located in `/src/components/pages/*/action.ts`
- Use `"use server"` directive
- Return consistent response format: `{ success: boolean, message?: string, data?: any }`
- Handle errors gracefully with try/catch

#### Component Structure
- Page components in `/src/app/(auth)/`
- Reusable components in `/src/components/`
- Server components by default, client components with `"use client"`
- Co-locate related components in feature folders

#### Database Operations
- Use Drizzle ORM for all database queries
- Transactions for multi-table operations
- Proper error handling and rollback

#### Security Considerations
- Role-based access control on all routes
- Server-side validation for all inputs
- Secure session management with NextAuth
- Environment variables for sensitive configuration

## Testing
- Test files in `/src/test/`
- Run with `bun run test`
- Focus on critical business logic and workflows

## Deployment
- Environment variables required (see `.env.example`)
- Database migrations must be run before deployment
- Ensure file upload service is configured
- Configure SMS/email services for production