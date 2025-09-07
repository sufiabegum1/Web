# Overview

This is a lottery application built with modern web technologies featuring a React frontend and Express backend. The system provides a complete lottery experience including ticket purchasing, automated draws, wallet management, and results tracking. The application supports multiple lottery types (daily, weekly, monthly) with scheduled automatic draws and comprehensive user management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build System**: Vite with ESM modules and hot module replacement

## Backend Architecture
- **Framework**: Express.js with TypeScript in ESM mode
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect (OIDC)
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful API with comprehensive error handling and request logging
- **Background Services**: Automated draw scheduler with lottery service layer

## Database Schema
- **Users**: Core user profiles with admin flags and authentication data
- **Wallets**: Digital wallet system for managing user credits and balances
- **Lotteries**: Different lottery types (daily, weekly, monthly) with configurable pricing
- **Draws**: Individual lottery draws with scheduling, status tracking, and winner selection
- **Tickets**: User-purchased tickets with number combinations and winner status
- **Transactions**: Financial transaction history for deposits and purchases
- **Sessions**: Secure session storage for authentication state

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC integration for secure user authentication
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **Middleware**: Route-level authentication guards and user context injection
- **Admin Access**: Role-based access control for administrative functions

## Core Business Logic
- **Lottery Service**: Centralized service for lottery operations, draw management, and winner selection
- **Draw Scheduler**: Automated background service for triggering scheduled draws
- **Number Generation**: Cryptographically secure random number generation for lottery draws
- **Prize Calculation**: Dynamic prize pool management and winner determination
- **Wallet Operations**: Secure credit management with transaction logging

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database operations with migration support

## Authentication & Identity
- **Replit Auth**: OIDC-based authentication service for user management
- **OpenID Client**: Standard OIDC client implementation with Passport.js integration

## UI & Design System
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Shadcn/ui**: Pre-built component library following design system principles
- **Lucide Icons**: Comprehensive icon library for consistent visual elements

## Development & Deployment
- **Vite**: Modern build tool with hot module replacement and optimized production builds
- **TypeScript**: Type safety across frontend and backend with shared schema types
- **ESBuild**: Fast JavaScript bundling for server-side code compilation
- **Replit Platform**: Integrated development and hosting environment with specialized plugins

## Utility Libraries
- **TanStack Query**: Server state management with caching and synchronization
- **Date-fns**: Date manipulation and formatting utilities
- **Zod**: Runtime type validation and schema parsing
- **Class Variance Authority**: Utility for managing component variant styles