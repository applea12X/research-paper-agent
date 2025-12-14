# Findings Demo - Validation Metrics Analysis

This page (`/findingsdemo`) provides a comprehensive data-driven analysis of machine learning's impact on scientific research using the `validation_metrics_summary.json` dataset.

## Overview

The page answers three core research questions:

### 1. Quantify ML Impact
**Goal:** Measure how much ML actually contributes to scientific breakthroughs and discovery efficiency.

**Visualizations:**
- **ML Adoption Over Time**: Line chart showing temporal evolution (2007-2022) across top 6 disciplines
- **ML Attribution Scoring**: Stacked bar chart estimating ML vs domain insight contribution by field
- **Discovery Efficiency**: Scatter plot correlating ML adoption with research validation rates

**Key Metrics:**
- Aggregate ML adoption rate: 12.8%
- Total papers analyzed: 7,200
- Code availability rate: 2.85%

### 2. Visualize Adoption Dynamics
**Goal:** Show how ML techniques spread across scientific disciplines over time.

**Visualizations:**
- **S-Curve Adoption Patterns**: Multi-line chart showing classic innovation diffusion curves
- **Cross-Discipline Comparison**: Horizontal bar chart + pie chart of ML adoption by field
- **ML Integration Depth**: Stacked bar chart breaking down minimal/moderate/substantial/core usage levels
- **Multi-Dimensional Radar**: Radar chart comparing adoption dimensions across top 6 fields

**Key Insights:**
- Computer Science leads with 36.7% adoption (93.2% in 2022)
- Most fields entering plateau phase (2021+)
- Average adoption growth: ~2-5% per year

### 3. Analyze Quality Trade-offs
**Goal:** Investigate whether ML adoption correlates with better or worse research reproducibility.

**Visualizations:**
- **Reproducibility Comparison**: Bar chart comparing code availability between ML and non-ML papers
- **Code Availability by ML Level**: Bar chart showing reproducibility by integration level
- **ML Adoption vs Code Availability**: Scatter plot showing correlation (or lack thereof)
- **Top ML Frameworks**: Bar chart of most cited tools (SPSS, R, MATLAB, Python, etc.)
- **Detailed Breakdown Table**: Field-by-field comparison with delta calculations

**Key Findings:**
- Moderate ML integration shows highest code availability (11.4%)
- No universal reproducibility trade-off - field-specific factors dominate
- Computer Science shows +9.6% code availability with ML

## Data Source

**File:** `/data/validation_metrics_summary.json`

**Structure:**
```json
{
  "metadata": {
    "generated_at": "2025-12-13T17:34:18.559311",
    "total_papers": 7200,
    "total_fields": 13
  },
  "aggregate_metrics": {
    "aggregate_ml_adoption_rate": 12.79,
    "aggregate_code_availability_rate": 2.85,
    "top_fields_by_ml_adoption": {...},
    "top_fields_by_code_availability": {...}
  },
  "field_analyses": {
    "ComputerScience": {...},
    "Biology": {...},
    // ... 13 fields total
  }
}
```

Each field contains:
- **ml_impact**: Distribution by ML level (none/minimal/moderate/substantial/core), adoption rates
- **reproducibility**: Code availability overall and by ML level, top frameworks
- **methodology**: Statistical methods usage
- **temporal**: Year-by-year adoption trends
- **outcomes**: Validation rates, clinical outcomes, real-world applications

## Components

### Data Loader
**File:** `/web/src/data/validationDataLoader.ts`

Exports:
- `getMLImpactData()`: Temporal trends, attribution scores, efficiency metrics
- `getAdoptionDynamicsData()`: Adoption curves, discipline comparisons, ML distribution
- `getQualityTradeoffsData()`: Reproducibility comparisons, code availability by level, frameworks
- `getSummaryStats()`: High-level aggregate metrics

### Visualization Components

1. **MLImpactOverview** (`/components/findingsdemo/MLImpactOverview.tsx`)
   - Shows ML adoption trends over time
   - Attribution scoring (ML vs domain contribution)
   - Efficiency scatter plot

2. **AdoptionDynamicsVisualization** (`/components/findingsdemo/AdoptionDynamicsVisualization.tsx`)
   - S-curve temporal evolution
   - Cross-discipline bar/pie charts
   - ML integration depth stacked bars
   - Multi-dimensional radar chart

3. **QualityTradeoffsAnalysis** (`/components/findingsdemo/QualityTradeoffsAnalysis.tsx`)
   - ML vs non-ML code availability comparison
   - Code availability by ML integration level
   - Correlation scatter plot
   - Top frameworks bar chart
   - Detailed reproducibility table

## Key Insights

### Strong Evidence (High Confidence)
- **S-Curve Patterns**: Clear innovation diffusion visible across all fields
- **Moderate ML = Best Reproducibility**: 11.4% code availability for moderate ML vs 7.2% minimal, 2.7% none

### Emerging Patterns (Medium Confidence)
- **Variable Attribution**: 25-75% ML contribution depending on integration level
- **No Universal Trade-off**: Reproducibility outcomes vary by field, not ML adoption level

### Open Questions (Requires Further Research)
- **Causal Attribution**: Correlation ≠ causation for ML breakthroughs
- **Long-term Culture Impact**: Effects on training, careers, equity unclear

## Differences from `/findings` Page

The `/findings` page uses **mock/synthetic data** from `loadRealFindingsData()` which transforms and estimates values.

The `/findingsdemo` page uses **direct validation metrics** from the actual research dataset with:
- Real paper counts by year and field
- Actual ML distribution percentages
- Measured code availability rates
- Framework usage frequencies

This provides more granular, field-specific, and temporally accurate insights.

## Navigation

The page is accessible via:
- Sidebar menu: "Findings Demo (Validation Metrics)"
- Direct URL: `/findingsdemo`

## Technologies Used

- **React/Next.js**: Page framework
- **Recharts**: All visualizations (Line, Bar, Scatter, Pie, Radar, Stacked Bar)
- **Tailwind CSS**: Styling and responsive design
- **Framer Motion**: (Inherited from global styles)

## Future Enhancements

Potential additions:
- Interactive filtering by discipline
- Time range slider for temporal charts
- Export functionality for charts/data
- Citation flow visualization (if data becomes available)
- Retraction pattern analysis (not currently in dataset)
- Animated transitions between years
