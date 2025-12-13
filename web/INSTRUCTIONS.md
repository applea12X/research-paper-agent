# AI Research Impact Observatory - Frontend

This is the Next.js frontend for the Research Paper Agent project. It visualizes the impact of Machine Learning on research outcomes using an interactive bubble heatmap.

## Prerequisites

- Node.js (v18 or later recommended)
- npm (Package Manager)

## Setup

1. Navigate to the `web` directory:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   *Note: If you encounter issues with `bun` being missing, ensure you are using `npm` directly.*

## Running the Application

To start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Interactive Bubble Heatmap**: Visualizes research papers based on their ML impact score.
- **Color Encoding**: Papers are colored from Blue (Low Impact) to Red (High Impact).
- **Filtering**: 
  - **ML Impact**: Default view, sorted by impact.
  - **Code Availability**: Separates papers based on whether code is publicly available.
- **Glassmorphism UI**: Modern, translucent UI elements.
- **Sidebar**: View detailed case studies of high-impact papers.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: UI components (BubbleHeatmap, Navigation, Sidebar).
- `src/data`: Mock data generation.
- `src/types`: TypeScript definitions.
