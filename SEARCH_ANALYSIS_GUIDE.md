# Search & AI Analysis Feature Guide

## What's New

You can now **click on any paper** in the search results to get an AI-powered analysis of how it relates to the trends in your dataset!

## How It Works

### 1. Search for Papers
- Go to `/search` page
- Enter a query like "deep learning drug discovery" or "protein folding"
- Use filters for year, citations, field, or open access

### 2. Click a Paper Card
- Hover over any paper card - you'll see "Click to analyze with AI"
- Click anywhere on the card to open the analysis modal

### 3. AI Analysis Modal Opens
The modal shows:
- **Paper details** (title, authors, year, citations)
- **Field badges** showing the field and impact prediction
- **AI Analysis** using Ollama to compare against your dataset
- **Quick Stats**: ML adoption rate in that field, citation percentile
- **Field Context**: How this paper compares to field average

### 4. What the AI Analyzes

The AI (via Ollama) provides insights on:
1. How the paper's approach compares to ML adoption trends in that field
2. What makes this paper significant based on field metrics
3. What the citation count tells us about its impact
4. How it relates to overall trends in the validation metrics
5. Future directions and implications for the field

## Example Flow

1. **Search**: "alphafold protein folding"
2. **Results**: Shows papers with trend analysis
3. **Click**: Click on "Highly accurate protein structure prediction with AlphaFold"
4. **Modal Opens**: Shows it's in Biology field with 10% ML adoption
5. **AI Analysis**: Explains how AlphaFold is pioneering because it uses ML in a field with low ML adoption
6. **Insights**: Shows that with 39,627 citations, it's a high-impact pioneering paper

## Technology Stack

- **Frontend**: React modal with loading states
- **Search API**: OpenAlex (free, no key needed)
- **Analysis API**: Your `/api/chat` endpoint
- **AI Model**: Ollama (llama3.1:8b) with dataset context
- **Dataset**: Your validation metrics summary

## Visual Features

- Hover effect showing "Click to analyze with AI"
- Purple glow on hover
- Loading spinner during analysis
- Color-coded field badges
- Impact prediction badges (Pioneering, High Impact, etc.)
- Quick stats cards
- Formatted AI response

## Requirements

Make sure both are running:
1. **Backend**: `cd backend && source venv/bin/activate && uvicorn main:app --port 8000`
2. **Ollama**: With llama3.1:8b model loaded
3. **Frontend**: `npm run dev` on port 3000

## Tips

- The AI analysis takes 5-10 seconds (Ollama processing time)
- Click the X or outside the modal to close
- You can click different papers to compare analyses
- The analysis uses your actual dataset metrics for context

Enjoy exploring papers with AI-powered insights! 🚀
