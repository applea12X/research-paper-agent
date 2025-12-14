# Search API - Using OpenAlex

## Overview
The search functionality now uses **OpenAlex API** - a completely free, open-source API that requires no authentication!

## Why OpenAlex?
- ✅ **100% Free** - No API key required
- ✅ **No Rate Limits** - Unlimited requests (with polite pool)
- ✅ **Open Access** - Fully open-source database
- ✅ **Comprehensive** - 250M+ works indexed
- ✅ **Well Maintained** - Updated daily

## API Endpoints

### 1. Search Papers
`GET /api/search?q={query}&limit={limit}`

**Parameters:**
- `q` - Search query (required)
- `limit` - Number of results (default: 10, max: 100)
- `year` - Year filter (e.g., "2023" or "2020-2024")
- `min_citations` - Minimum citation count
- `open_access` - Filter for open access papers only

**Example:**
```bash
curl "http://localhost:8000/api/search?q=protein%20folding&limit=5&year=2020-2024"
```

### 2. Trending Papers
`GET /api/trending?days={days}&limit={limit}`

**Parameters:**
- `days` - Papers from last N days (default: 30)
- `limit` - Number of results (default: 20, max: 100)
- `field` - Filter by research field

**Example:**
```bash
curl "http://localhost:8000/api/trending?days=30&limit=10"
```

## Features

Each paper result includes:
- **Basic Info**: Title, authors, year, abstract, citations
- **Venue**: Journal/conference name
- **Open Access**: Whether paper is freely available + PDF link
- **Trend Analysis**: 
  - Field classification (Biology, ComputerScience, etc.)
  - ML/AI keyword detection
  - ML adoption rate comparison
  - Impact prediction (High Impact, Pioneering, etc.)
  - Citation percentile

## Trend Analysis

Papers are automatically analyzed against your dataset to show:
- **Field**: Mapped to your dataset fields
- **ML Adoption Rate**: Field's average ML usage (%)
- **Has ML**: Whether this paper uses ML/AI methods
- **Prediction**: Impact prediction based on field trends
- **Comparison**: How paper compares to field average

## Example Response

```json
{
  "title": "The rise of deep learning in drug discovery",
  "year": 2018,
  "citations": 1619,
  "trendAnalysis": {
    "field": "Biology",
    "ml_adoption_rate": 10.0,
    "has_ml": true,
    "prediction": "Pioneering",
    "comparison": "This field has 10.0% ML adoption rate. This paper uses ML methods, placing it above the field average."
  }
}
```

## Running the Server

```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will be available at http://localhost:8000
