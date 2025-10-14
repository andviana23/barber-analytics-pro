# Barber Analytics Pro - AI Development Guide

## Architecture Overview

**Barber Analytics Pro** is a React-based barbershop management system with real-time features, built on Supabase PostgreSQL with Row-Level Security (RLS).

### Core Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + Atomic Design
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **Charts**: Recharts for KPI dashboards
- **Icons**: Lucide React
- **Deployment**: Vercel

## Project Structure Patterns

### Atomic Design Implementation
```
src/
├── atoms/          # Basic components (Button, Input, Card)
├── molecules/      # Composed components (KPICard, ChartComponent)
├── organisms/      # Complex components (Navbar, Sidebar)
├── templates/      # Page layouts
├── pages/          # Route components with business logic
├── context/        # React Contexts (Auth, Theme, Unit, Toast)
├── services/       # Supabase integration + business logic
├── hooks/          # Custom React hooks for data fetching
└── utils/          # Helper functions and constants
```

### Service Layer Pattern
All business logic lives in `src/services/`:
- **Convention**: `[feature]Service.js` exports object with methods
- **Pattern**: Each service method returns `{ data, error }` for consistent error handling
- **Example**: `profissionaisService.getProfissionais()`, `unitsService.createUnit()`
- **Integration**: Services use Supabase client directly, no additional abstraction

### Context Architecture
Multiple contexts work together:
```javascript
// In App.jsx - nested providers
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      <UnitProvider>
        {/* app content */}
      </UnitProvider>
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

## Key Development Patterns

### Authentication & Permissions
- Use `useAuth()` hook for authentication state
- Three permission levels: `barbeiro`, `gerente`, `admin`
- RLS policies enforce data access at database level
- Frontend components adapt UI based on `user.user_metadata.role`

### Data Fetching with Custom Hooks
```javascript
// Standard pattern for data hooks
const { data, loading, error, refetch } = useCustomHook(params);

// Example implementation in hooks/
export const useProfissionais = (unidadeId) => {
  const [state, setState] = useState({ data: [], loading: true, error: null });
  // ... hook implementation with caching
};
```

### Route Protection
- `<ProtectedRoute>`: Requires authentication
- `<RoleProtectedRoute requiredRole="admin">`: Requires specific role
- `<PublicRoute>`: Only accessible when NOT authenticated

### Modal & CRUD Patterns
- Modal components follow naming: `Create[Entity]Modal`, `Edit[Entity]Modal`, `Delete[Entity]Modal`
- Each modal includes validation, loading states, and toast notifications
- Soft delete pattern: Set `is_active = false` instead of hard delete

## Supabase Integration

### Environment Setup
Required `.env.local` variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Database Conventions
- All tables use UUID primary keys with `gen_random_uuid()`
- Snake_case naming: `unidades`, `profissionais`, `created_at`
- RLS enabled on all tables with policies for each role
- Views prefixed with `vw_`: `vw_dashboard_expenses`, `vw_monthly_dre`

### Realtime Features
- Queue management uses Supabase Realtime subscriptions
- Pattern: Subscribe in `useEffect`, cleanup on unmount
- Example in `useFilaRealtime.js` hook

## Development Workflows

### Adding New Features
1. **Service Layer**: Create `[feature]Service.js` with CRUD methods
2. **Custom Hook**: Create `use[Feature].js` for state management
3. **Components**: Build atomic → molecular → organism components
4. **Page Integration**: Add to routing in `App.jsx`
5. **Permissions**: Update RLS policies in database

### Testing Pattern
- Manual testing with custom test suites (see `test-fase-*.js`)
- No unit tests currently - focus on integration testing
- Each feature includes validation script with comprehensive checks

### Code Style
- **Imports**: Group by source (React, libraries, internal)
- **Component Structure**: Props, state, effects, handlers, render
- **Naming**: PascalCase components, camelCase functions/variables
- **Comments**: JSDoc for service methods, inline for complex logic

### Performance Considerations
- Components use `React.memo` when appropriate
- Hooks implement caching with TTL patterns
- Database queries optimized with proper indexes
- Bundle splitting at route level

## Database Schema Highlights

### Core Tables
- `unidades` (units): Business locations
- `profissionais` (professionals): Staff members linked to units
- `receitas` (revenues): Income tracking by category
- `despesas` (expenses): Expense tracking by category
- `fila_atendimento` (service_queue): Real-time queue management

### Key Relationships
- Users → Professionals → Units (many-to-one)
- Professionals → Queue entries (one-to-many)
- Units → Financial records (one-to-many)

## Common Gotchas

- **RLS Policies**: Always test with different user roles
- **Realtime Subscriptions**: Remember to unsubscribe in cleanup
- **Service Methods**: Always handle both success and error cases
- **Context Updates**: State changes trigger re-renders in all consumers
- **Portuguese Locale**: Use `pt-BR` for date/currency formatting

## Current Status (85% Complete)

**Completed**: Authentication, Dashboard, Financial module, Queue management, Reports, Professional management, Units management
**In Progress**: Settings page, Advanced features
**Next**: External integrations, notifications, performance optimization

This codebase follows enterprise patterns with strong separation of concerns, comprehensive error handling, and scalable architecture suitable for multi-tenant barbershop management.