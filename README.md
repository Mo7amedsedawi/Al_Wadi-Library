# Al-Wadi Library (مكتبة الوادي)

A modern, responsive web application and digital library platform designed for discovering, browsing, reading, and downloading Arabic literature, academic works, rare books, and philosophical treatises. Built with React 19, TypeScript, Tailwind CSS, and powered by Supabase for authentication, real-time discussions, and database management, Al-Wadi Library offers seamless Arabic typography (RTL) alongside native-grade mobile responsiveness and offline reading capabilities.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Reader & Discovery Experience](#reader--discovery-experience)
  - [Community & Interactivity](#community--interactivity)
  - [Administrative Content Management (CMS)](#administrative-content-management-cms)
  - [Offline Support & Mobile Readiness](#offline-support--mobile-readiness)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Authentication & Role-Based Access Control](#authentication--role-based-access-control)
- [Database Schema & Backend Services](#database-schema--backend-services)
  - [PostgreSQL Schema Tables](#postgresql-schema-tables)
  - [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
  - [Storage Buckets](#storage-buckets)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Local Development](#installation--local-development)
  - [Production Build](#production-build)
- [Database Setup & Migrations](#database-setup--migrations)
- [License](#license)

---

## Overview

Al-Wadi Library addresses the need for accessible, well-cataloged Arabic digital reading materials. The platform serves readers, researchers, and book collectors by providing an intuitive digital space to:
- Discover literature organized across core literary and non-fiction categories.
- Read excerpts, preview books, and download digital copies in PDF and EPUB formats.
- Engage in threaded discussions, submit book ratings, and curate personal reading favorites.
- Request out-of-print or missing books directly to the library curating team.
- Manage books, authors, categories, comments, and requests through an integrated administrative dashboard.

---

## Key Features

### Reader & Discovery Experience
- **Curated Catalog:** Browse books by genres including *Fantasy (فانتازيا)*, *Mystery (غموض)*, *Espionage (جاسوسية)*, *Romance (رومانسي)*, and *Non-Fiction (كتب غير روائية)*.
- **Search & Filtering:** Real-time multi-attribute search across book titles, authors, keywords, categories, and series.
- **Author Profiles & Series View:** Explore detailed author biographies and dedicated series collections ordered chronologically or by part number.
- **Book Details & Excerpts:** Rich metadata presentation including page counts, publication dates, ISBNs, estimated read times, formats (PDF/EPUB), and excerpts.
- **User Favorites:** Authenticated users can bookmark books with persistent storage synced to Supabase.
- **Book Request System:** Readers can submit requests for specific books or editions, with real-time status tracking (`pending`, `fulfilled`, `rejected`).
- **Library Support & Contact:** Built-in contact channels and donation interfaces to support ongoing digitization efforts.

### Community & Interactivity
- **Threaded Book Discussions:** Interactive comment threads allowing replies, edits, and deletions.
- **Real-Time Updates:** Supabase Realtime integration ensuring discussion updates and reader comments propagate instantly.
- **Community Ratings:** 1-to-5 star rating system with dynamic aggregations and average score calculations.
- **Content Moderation:** Comment reporting mechanism allowing readers to flag inappropriate content for administrative review.
- **Curated Reading Lists:** Thematic book collections curated by library administrators.

### Administrative Content Management (CMS)
- **Role-Gated Dashboard:** Restricted to accounts with `admin` privileges verified via database profiles and JWT claims.
- **Book Catalog Management:** Add, edit, draft, publish, or hide books with multi-file uploads (cover artwork, PDF, EPUB).
- **Author & Category Administration:** Create and update author profiles (with biographies and avatars) and category metadata.
- **Book Request Moderation:** Review incoming book requests and update fulfillment states with administrative notes.
- **Comment Moderation:** Dedicated review panel to investigate reported comments and take corrective action.
- **Analytics & Telemetry:** Aggregated metrics showing download statistics, view counts, and popular titles.
- **Database Health Monitor:** In-app connection tester and schema verification tool for Supabase tables and storage buckets.

### Offline Support & Mobile Readiness
- **Progressive Web App (PWA):** Web App Manifest (`manifest.json`) and mobile meta tags for home screen installation.
- **IndexedDB Offline Engine:** Client-side IndexedDB database (`alwadi_library_db`) storing downloaded book blobs and metadata for offline reading.
- **Capacitor Mobile Bridge:** Built-in compatibility with `@capacitor/core` and `@capacitor/filesystem` for native Android packaging.
- **Resilient Fallback:** Graceful fallback to cached local seed datasets if network connectivity or backend services are temporarily unavailable.

---

## Architecture & Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite 8](https://vitejs.dev/)
- **Programming Language:** [TypeScript 5.8 / 7.x](https://www.typescriptlang.org/)
- **Styling & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) with native Right-to-Left (RTL) Arabic typography
- **Animation:** [Motion](https://motion.dev/) (Framer Motion)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Backend as a Service:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Auth, Storage, Realtime)
- **Mobile Container:** [Capacitor](https://capacitorjs.com/) (`@capacitor/core`, `@capacitor/filesystem`)
- **Offline Storage:** Browser IndexedDB API via native promise wrappers

---

## Project Structure

├── public/
│ ├── images/ # Static assets, branding, and logos
│ ├── supabase/ # Public-facing schema and seed SQL references
│ ├── icon.svg # Application vector icon
│ └── manifest.json # Progressive Web App manifest
├── src/
│ ├── components/
│ │ ├── admin/ # Administrative CMS views
│ │ │ ├── AdminDashboard.tsx
│ │ │ ├── AdminSidebar.tsx
│ │ │ ├── AuthorsManagement.tsx
│ │ │ ├── BookFormView.tsx
│ │ │ ├── BookRequestsManagement.tsx
│ │ │ ├── BooksManagement.tsx
│ │ │ ├── CategoriesManagement.tsx
│ │ │ ├── DatabaseSettings.tsx
│ │ │ ├── ModerationManagement.tsx
│ │ │ └── ReadingListsManagement.tsx
│ │ ├── common/ # Reusable UI widgets (Logo, Modals, Buttons, Cards)
│ │ ├── navigation/ # Header, Navigation bar, and Mobile Drawer
│ │ └── views/ # Primary application screens
│ │ ├── AuthScreens.tsx
│ │ ├── AuthorProfileScreen.tsx
│ │ ├── BookDetailsScreen.tsx
│ │ ├── BookRequestScreen.tsx
│ │ ├── BrowseScreen.tsx
│ │ ├── ContactScreen.tsx
│ │ ├── DonateScreen.tsx
│ │ ├── FavoritesScreen.tsx
│ │ ├── HomeScreen.tsx
│ │ ├── ProfileScreen.tsx
│ │ └── SeriesScreen.tsx
│ ├── context/ # React Context Providers (Auth, Library, Router)
│ ├── data/ # Mock seed data and initial constants
│ ├── services/ # API, Supabase, Auth, and Storage service layers
│ │ ├── authService.ts
│ │ ├── communityService.ts
│ │ ├── downloadEngine.ts
│ │ ├── libraryService.ts
│ │ ├── offlineStorageService.ts
│ │ └── supabaseClient.ts
│ ├── types/ # TypeScript data models and interfaces
│ ├── utils/ # Formatting, date, and text helper functions
│ ├── App.tsx # Main application orchestrator
│ ├── index.css # Tailwind CSS global styles and Arabic font declarations
│ └── main.tsx # Application entry point
├── supabase/
│ ├── migrations/ # Incremental database migration SQL scripts
│ ├── schema.sql # Complete baseline PostgreSQL schema with RLS & Storage
│ └── seed.sql # Initial library books, authors, and categories
├── index.html # HTML entry point with RTL meta configurations
├── package.json # NPM package dependencies and scripts
├── tsconfig.json # TypeScript configuration
└── vite.config.ts # Vite configuration

codeCode

---

## Authentication & Role-Based Access Control

Authentication is powered by Supabase Auth with session persistence:

- **Guest Access:** Full access to browse books, search catalog items, view author biographies, inspect excerpts, and submit book requests without creating an account.
- **Registered User (`user`):** Access to personal profiles, favorite book bookmarking, reading history tracking, submitting 1-5 star ratings, and participating in book discussions.
- **Administrator (`admin`):** Full access to the Admin Dashboard (`/admin`), book creation/editing/deletion, author/category management, comment moderation, request management, and system telemetry.

### Security Enforcements
1. User registration triggers a database function (`handle_new_user`) that automatically provisions a row in `public.profiles` with the default role `'user'`.
2. Role elevation to `'admin'` is strictly protected at the database level. Row Level Security (RLS) rules prevent users from modifying their own `role` field.
3. System administrators can be granted administrative privileges using the SQL helper:
   ```sql
   SELECT public.make_user_admin('admin@example.com');



Database Schema & Backend Services

PostgreSQL Schema Tables







Table Name



Description



Key Relationships





public.authors



Author records, biographical info, birth/nationality



Primary author catalog





public.categories



Literature genres and classifications



Unique genre naming





public.books



Central book repository, ratings, and display flags



FK to authors.id & categories.id





public.book_formats



Digital assets (PDF/EPUB URLs, sizes)



FK to books.id (CASCADE)





public.book_keywords



Search indexing tags



FK to books.id (CASCADE)





public.profiles



User account profiles and roles (user, admin)



FK to auth.users.id (CASCADE)





public.user_favorites



Bookmarks saved by users



FK to auth.users.id & books.id





public.user_reading_history



User reading progress percentage and timestamps



FK to auth.users.id & books.id





public.book_comments



Discussion threads and nested replies



Self-referencing FK (parent_id)





public.comment_reports



Moderation queue for flagged comments



FK to book_comments.id





public.book_ratings



User ratings (1-5 integer scale)



Unique per user per book





public.reading_lists



Thematic reading lists created by admins



Array of book_ids





public.book_requests



Reader book acquisition requests



FK to auth.users.id





public.book_analytics



Anonymous telemetry (views and downloads)



FK to books.id

Row Level Security (RLS) Policies

All database tables have Row Level Security enabled:





Public Read: authors, categories, books, book_formats, book_keywords, book_comments, book_ratings, and reading_lists can be read by any visitor.



User Isolation: user_favorites, user_reading_history, and personal profile updates can only be accessed or modified by the authenticated user (auth.uid() = user_id).



Admin Control: Administrative tables, moderation reports, analytics read access, and write operations on books, authors, and categories require role = 'admin'.

Storage Buckets

Supabase Storage is utilized for hosting digital files:





book-covers: Public bucket storing JPEG/PNG/WebP book cover art.



book-files: Public bucket storing downloadable PDF and EPUB files.



Getting Started

Prerequisites





Node.js (version 18 or higher recommended)



npm (version 9 or higher)



A Supabase project (optional for read-only local browsing with fallbacks; required for authentication, admin features, and live cloud synchronization)

Environment Configuration

Create a .env file in the root directory by copying .env.example:

codeBash

cp .env.example .env

Configure your Supabase credentials:

codeEnv

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key

Note: The application includes production-safe defaults for immediate evaluation, but you should connect your own Supabase project for private deployments.

Installation & Local Development





Install Dependencies:

codeBash

npm install



Start the Development Server:

codeBash

npm run dev

The application will be accessible at http://localhost:3000.



Code Validation:

codeBash

npm run lint

Production Build

To compile a production-ready web application:

codeBash

npm run build

To preview the compiled static build locally:

codeBash

npm run preview

The output will be generated in the dist/ directory, ready for deployment to any static hosting provider (e.g., Cloudflare Pages, Vercel, Netlify, or standard Nginx/Apache servers).



Database Setup & Migrations

If setting up a fresh Supabase database instance:





Open the SQL Editor in your Supabase dashboard.



Execute the contents of supabase/schema.sql to initialize all tables, indexes, RLS policies, and storage buckets.



(Optional) Run the migration scripts in supabase/migrations/ in chronological order if applying incremental updates.



Execute supabase/seed.sql to populate initial authors, categories, and literature titles.



Grant admin access to your email address:

codeSQL

SELECT public.make_user_admin('your-email@example.com');



License

This project is distributed under the terms of the Apache License 2.0. See the source headers for details.
