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

---

## Overview

Al-Wadi Library addresses the need for accessible, well-cataloged Arabic digital reading materials. The platform serves readers, researchers, and book collectors by providing an intuitive digital space to:
- Discover literature organized across core literary and non-fiction categories.
- Read excerpts, preview books, and download digital copies in PDF and EPUB formats.
- Engage in threaded discussions, submit book ratings, and curate personal reading favorites.
- Request out-of-print or missing books directly to the library curating team.
- Manage books, authors, categories, comments, and requests through an integrated administrative dashboard.

---<img width="1878" height="928" alt="image" src="https://github.com/user-attachments/assets/8c820dcb-598f-453a-9040-33a306eefe7c" />


## Key Features

### Reader & Discovery Experience
- **Curated Catalog:** Browse books by genres including *Fantasy (فانتازيا)*, *Mystery (غموض)*, *Espionage (جاسوسية)*, *Romance (رومانسي)*, and *Non-Fiction (كتب غير روائية)*.
- **Search & Filtering:** Real-time multi-attribute search across book titles, authors, keywords, categories, and series.
- **Author Profiles & Series View:** Explore detailed author biographies and dedicated series collections ordered chronologically or by part number.
- **Book Details & Excerpts:** Rich metadata presentation including page counts, publication dates, ISBNs, estimated read times, formats (PDF/EPUB), and excerpts.
- **User Favorites:** Authenticated users can bookmark books with persistent storage synced to Supabase.
- **Book Request System:** Readers can submit requests for specific books or editions, with real-time status tracking (`pending`, `fulfilled`, `rejected`).
- **Library Support & Contact:** Built-in contact channels and donation interfaces to support ongoing digitization efforts.
<img width="1895" height="927" alt="image" src="https://github.com/user-attachments/assets/cfc2669a-9306-41d4-9513-dfce53c79d2b" />



### Community & Interactivity
- **Threaded Book Discussions:** Interactive comment threads allowing replies, edits, and deletions.
- **Real-Time Updates:** Supabase Realtime integration ensuring discussion updates and reader comments propagate instantly.
- **Community Ratings:** 1-to-5 star rating system with dynamic aggregations and average score calculations.
- **Content Moderation:** Comment reporting mechanism allowing readers to flag inappropriate content for administrative review.
- **Curated Reading Lists:** Thematic book collections curated by library administrators.
<img width="1524" height="863" alt="image" src="https://github.com/user-attachments/assets/d5f9f083-7ccf-4c3e-b917-4a49c71cd921" />

  

### Administrative Content Management (CMS)
- **Role-Gated Dashboard:** Restricted to accounts with `admin` privileges verified via database profiles and JWT claims.
- **Book Catalog Management:** Add, edit, draft, publish, or hide books with multi-file uploads (cover artwork, PDF, EPUB).
- **Author & Category Administration:** Create and update author profiles (with biographies and avatars) and category metadata.
- **Book Request Moderation:** Review incoming book requests and update fulfillment states with administrative notes.
- **Comment Moderation:** Dedicated review panel to investigate reported comments and take corrective action.
- **Analytics & Telemetry:** Aggregated metrics showing download statistics, view counts, and popular titles.
- **Database Health Monitor:** In-app connection tester and schema verification tool for Supabase tables and storage buckets.
- <img width="1895" height="922" alt="image" src="https://github.com/user-attachments/assets/9c2c813d-078b-4517-99b3-a707e1ad6fc9" />
- 

### Offline Support & Mobile Readiness
- **Progressive Web App (PWA):** Web App Manifest (`manifest.json`) and mobile meta tags for home screen installation.
- **IndexedDB Offline Engine:** Client-side IndexedDB database (`alwadi_library_db`) storing downloaded book blobs and metadata for offline reading.
- **Capacitor Mobile Bridge:** Built-in compatibility with `@capacitor/core` and `@capacitor/filesystem` for native Android packaging.
- **Resilient Fallback:** Graceful fallback to cached local seed datasets if network connectivity or backend services are temporarily unavailable.
<img width="576" height="1280" alt="image" src="https://github.com/user-attachments/assets/23479b01-a5f8-4513-b91a-ef983c58a0f5" />
<img width="576" height="1280" alt="image" src="https://github.com/user-attachments/assets/29b13fd8-e45b-4c17-8968-13f6bbf30962" />



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


