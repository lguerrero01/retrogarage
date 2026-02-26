# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 17 restaurant management application with a retro-themed UI. The app provides three main views:
- **Menu View**: Customer-facing interface for browsing menu items and placing orders
- **Kitchen View**: Chef interface for managing incoming orders and updating their status
- **Admin Panel**: Administrative interface for managing menu items and viewing daily summaries

## Development Commands

### Start Development Server
```bash
npm start
# or
npm run dev
# Runs on http://localhost:4200 by default
```

### Build
```bash
npm run build              # Production build
npm run watch              # Development build with watch mode
```

### Testing
```bash
npm test                   # Run all tests with Karma/Jasmine
```

### Linting
```bash
# This project uses ESLint - configuration in eslint.config.js
```

## Architecture

### Application Structure

The app uses **standalone components** (Angular 17's new approach) - no NgModule declarations needed. Bootstrap happens in `src/main.ts` using `bootstrapApplication()`.

### State Management

State is managed through **RxJS BehaviorSubjects** in services, with data persisted to localStorage:

- **AppService** (`src/app/services/app.service.ts`): Core application state
  - Cart management (`cart$`)
  - Orders list (`orders$`)
  - Current view routing (`currentView$`)
  - Menu items CRUD (`menuItems$`)

- **AuthService** (`src/app/services/auth.service.ts`): Authentication state
  - Demo users: `admin/admin123` (full access), `chef/chef123` (kitchen only)
  - Role-based access control for kitchen and admin views
  - Auth state persisted in localStorage

- **WebSocketService** (`src/app/services/websocket.service.ts`): Real-time updates
  - Currently in **simulation mode** (`isSimulated = true`)
  - Provides observables for new orders and status updates
  - Ready to connect to actual WebSocket server at `ws://localhost:8080/ws`

- **NotificationService**: Kitchen notification system
- **BillingService**: Invoice generation and management
- **FirebaseService** (`src/app/services/firebase.service.ts`): Firestore integration
  - Real-time collection listeners using RxJS observables
  - Type-safe generic methods for any collection
  - Automatic cleanup and unsubscribe management
  - Support for Firestore query constraints (where, orderBy, limit, etc.)
  - See `FIREBASE_USAGE.md` for detailed examples

### Data Flow

1. **Order Creation Flow**:
   - Customer adds items to cart (MenuView → AppService)
   - Order created with customer info (AppService.createOrder())
   - Order sent via WebSocket (simulation mode active)
   - Order appears in Kitchen View automatically
   - Notifications created for kitchen staff

2. **Order Status Updates**:
   - Kitchen updates order status (pending → preparing → ready → completed)
   - Status changes broadcast via WebSocket
   - Notifications sent for status changes
   - Changes persisted to localStorage

### View Routing

The app uses a **custom view system** (not Angular Router) managed by `AppService.currentView$`:
- Views switch based on BehaviorSubject state
- Protected views (kitchen/admin) trigger authentication checks
- Access control integrated with AuthService role checks

### Component Architecture

All components are standalone and use:
- **Lucide Angular** for icons
- **Tailwind CSS** for styling (primary brand color: `#ed450d`)
- Component-level templates (no separate HTML files for most components)
- Reactive patterns with RxJS observables

### Key Components

- **HeaderComponent**: Navigation between views, displays cart badge, user auth controls
- **MenuViewComponent**: Customer menu browser with cart, category filters
- **KitchenViewComponent**: Order management dashboard with status controls
- **AdminPanelComponent**: Menu CRUD operations, daily summary statistics
- **LoginComponent**: Modal-based authentication form

### Data Models

All TypeScript interfaces defined in `src/app/models/types.ts`:
- `MenuItem`: Menu item structure with optional customization
- `CartItem`: Extends MenuItem with quantity and ingredient modifications
- `Order`: Complete order with customer info, items, status, timestamps
- `User`: Authentication user with role-based permissions
- `DailySummary`: Analytics data structure

### Styling

- **Tailwind CSS** configured in `tailwind.config.js`
- Global styles in `src/styles.css`
- Brand color: `#ed450d` (orange-red)
- Responsive design with mobile-first approach

## Important Notes

### WebSocket Integration

To switch from simulation to real WebSocket:
1. Set `isSimulated = false` in WebSocketService constructor
2. Update WebSocket URL if different from `ws://localhost:8080/ws`
3. Backend must handle message types: `new-order`, `order-status-update`

### Data Persistence

All data stored in localStorage with keys:
- `restaurant-cart`: Shopping cart state
- `restaurant-orders`: All orders
- `restaurant-menu-items`: Menu items (defaults from `menu-items.ts`)
- `auth-state`: Authentication state
- `current-view`: Last active view

### Demo Credentials

- Admin: `admin` / `admin123` (access to all views)
- Chef: `chef` / `chef123` (kitchen view only)

### Firebase/Firestore Integration

The app includes a complete Firebase/Firestore integration service:

**Setup**:
1. Copy `.env.example` to `.env`
2. Add your Firebase credentials from [Firebase Console](https://console.firebase.google.com/)
3. Configure Firestore security rules in Firebase Console

**Usage**:
- Import `FirebaseService` from `src/app/services/firebase.service.ts`
- Use `listenToCollection<T>()` to subscribe to real-time updates
- Supports query constraints: `where()`, `orderBy()`, `limit()`, etc.
- Automatic cleanup with `unsubscribeFromCollection()` or `unsubscribeAll()`

**Environment Variables**:
- `FIREBASE_API_KEY`: Firebase API key
- `FIREBASE_AUTH_DOMAIN`: Auth domain (project-id.firebaseapp.com)
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_STORAGE_BUCKET`: Storage bucket URL
- `FIREBASE_MESSAGING_SENDER_ID`: Cloud messaging sender ID
- `FIREBASE_APP_ID`: Firebase app ID
- `FIREBASE_MEASUREMENT_ID`: Google Analytics measurement ID

For detailed examples and advanced usage, see `FIREBASE_USAGE.md`.
