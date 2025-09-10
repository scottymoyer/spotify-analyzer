# Spotify Playlist Analyzer

A web application that analyzes Spotify playlists to provide insights into their audio features and characteristics.

## MVP Scope

The Minimum Viable Product focuses on core playlist analysis functionality:

### Core Features
- **Playlist URL Input**: Accept Spotify playlist URLs from users
- **Audio Feature Analysis**: Extract and analyze audio features for all tracks in a playlist
- **Basic Visualizations**: Display key metrics and characteristics in a readable format
- **Health Monitoring**: API health check endpoint for system monitoring

### Technical Stack
- **Frontend**: Next.js 14 with TypeScript and React
- **API**: Next.js API routes for backend functionality
- **Styling**: CSS with minimal, clean design
- **Data Source**: Spotify Web API integration

## User Stories

### As a music enthusiast, I want to:
1. **Analyze Playlist Content**
   - Enter a Spotify playlist URL
   - View audio features (energy, danceability, valence, etc.)
   - See overall playlist characteristics and trends

2. **Understand Music Preferences**
   - Compare different playlists side by side
   - Identify patterns in my music taste
   - Discover insights about playlist mood and energy

3. **Share Analysis Results**
   - View analysis results on a dedicated page
   - Access results via shareable URLs
   - See clear, visual representations of data

### As a developer, I want to:
1. **Monitor System Health**
   - Access health check endpoints
   - Verify API functionality
   - Debug issues quickly

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /playlist/[id]` - Individual playlist analysis page

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Home page with playlist form
│   ├── api/health/        # Health check API
│   └── playlist/[id]/     # Playlist analysis pages
├── components/            # React components
├── styles/               # Global CSS styles
└── types/                # TypeScript type definitions
```
