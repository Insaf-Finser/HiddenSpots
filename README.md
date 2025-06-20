# HiddenSpots

A cross-platform mobile app to discover, share, and bookmark hidden spots (lakes, cafes, art, nature, and more) on an interactive map. Built with Expo, React Native, and a Node.js/Express/MongoDB backend.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Running the App](#running-the-app)
- [Backend API](#backend-api)
- [Key Screens & Components](#key-screens--components)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
HiddenSpots helps users discover and share unique places by:
- Browsing an interactive map of hidden spots
- Viewing details, stories, and galleries for each spot
- Adding new spots with images, location, and type
- Bookmarking and managing favorite spots
- Filtering and searching spots by type, rating, and more

## Features
- **Interactive Map**: Explore hidden spots with custom markers and filters
- **Feed**: Discover new and trending spots
- **Bookmarking**: Save and manage your favorite places
- **My Spots**: View and edit spots you've added
- **Spot Details**: See images, ratings, comments, stories, and galleries
- **Add Spot**: Share new places with images and location
- **Stories & Comments**: Add stories and comments to spots
- **Gallery**: Upload and view multiple images per spot
- **Cross-Platform**: Works on Android, iOS, and web

## Project Structure
```
HiddenSpots/
  app/                # Main app screens and navigation
    (tabs)/           # Tab-based navigation (map, feed, bookmarks, myspot)
    savespot.tsx      # Add new spot screen
    SpotDetails.tsx   # Spot details modal/screen
    +not-found.tsx    # 404 screen
    _layout.tsx       # App layout and navigation
  backend/            # Node.js/Express backend API
    config/           # Cloudinary and other configs
    controllers/      # API controllers (spot logic)
    middleware/       # File upload middleware
    models/           # Mongoose models (Spot)
    routes/           # Express routes (spotRoutes.js)
    server.js         # API server entry point
  components/         # Reusable UI components
    ui/               # Icons, tab bar backgrounds, etc.
  src/components/SpotDetail/ # Spot detail component
  assets/             # Images and fonts
  constants/          # App-wide constants (colors, etc.)
  hooks/              # Custom React hooks
  scripts/            # Utility scripts
  tsconfig.json       # TypeScript config
  app.json            # Expo app config
  package.json        # Project dependencies/scripts
```

## Setup & Installation
### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB (local or cloud)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 1. Clone the Repository
```bash
git clone <repo-url>
cd HiddenSpots
```

### 2. Install Dependencies
#### App (frontend):
```bash
npm install
```
#### Backend:
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in `backend/`:
```
MONGO_URI=<your-mongodb-uri>
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start the Backend Server
```bash
cd backend
node server.js
```

### 5. Start the App
```bash
cd ..
npx expo start
```

## Running the App
- Use the Expo Go app or an emulator/simulator to preview the app.
- The app connects to the backend API at `http://<your-ip>:5000/api/spots` (update URLs in the app if needed).

## Backend API
The backend is a RESTful API built with Express and MongoDB. Main endpoints:

- `POST   /api/spots`           — Create a new spot (with image upload)
- `GET    /api/spots`           — Get all spots
- `GET    /api/spots/:id`       — Get a spot by ID
- `PUT    /api/spots/:id`       — Update a spot (with image/gallery upload)
- `POST   /api/spots/:id/comment` — Add a comment to a spot
- `POST   /api/spots/:id/rating`  — Add/update rating for a spot
- `GET    /api/spots/:id/rating`  — Get spot rating
- `POST   /api/spots/:id/gallery` — Add image to spot gallery
- `POST   /api/spots/:id/stories` — Add a story to a spot (with images)
- `GET    /api/spots/:id/stories` — Get all stories for a spot
- `PUT    /api/spots/:id/stories/:storyId` — Update a story

### Data Model (Spot)
- `title`, `description`, `latitude`, `longitude`, `type`, `image`, `rating`, `ratingCount`, `comments`, `gallery`, `stories`

## Key Screens & Components
- **Map** (`app/(tabs)/map.tsx`): Main map, spot markers, filtering, search
- **Feed** (`app/(tabs)/Feed.tsx`): List of all spots, filterable
- **Bookmark** (`app/(tabs)/bookmark.tsx`): Saved spots
- **MySpot** (`app/(tabs)/myspot.tsx`): Spots added by the user
- **SaveSpot** (`app/savespot.tsx`): Add a new spot
- **SpotDetail** (`src/components/SpotDetail/`): Spot details, comments, stories, gallery
- **Reusable UI** (`components/`): Collapsible, ParallaxScrollView, ThemedText, etc.

## Configuration
- **Expo config**: `app.json` (icons, splash, API keys)
- **TypeScript**: `tsconfig.json` (strict mode, path aliases)
- **Backend config**: `backend/config/`, `.env` for secrets

## Contributing
1. Fork the repo and create a feature branch
2. Make your changes and add tests if needed
3. Open a pull request with a clear description

## License
MIT

---

*Happy exploring and sharing hidden spots!*
