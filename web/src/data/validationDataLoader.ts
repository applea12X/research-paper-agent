/**
 * Data loader for validation_metrics_summary.json
 * Transforms raw validation metrics into structured findings for visualization
 */

import validationData from "./validation_metrics_summary.json";

export interface FieldAnalysis {
  field_name: string;
  ml_impact: {
    ml_distribution: Record<string, { count: number; percentage: number }>;
    ml_adoption_rate: number;
    significant_ml_usage_rate: number;
    core_ml_rate: number;
    total_papers: number;
  };
  reproducibility: {
    code_availability_rate: number;
    papers_with_code: number;
    papers_without_code: number;
    top_ml_frameworks: Record<string, number>;
    code_availability_by_ml_level: Record<string, {
      total: number;
      code_available: number;
      rate: number;
    }>;
  };
  methodology: {
    statistical_methods_usage_rate: number;
    papers_with_statistics: number;
    papers_without_statistics: number;
  };
  temporal: {
    year_range: string;
    papers_by_year: Record<string, number>;
    ml_adoption_by_year: Record<string, {
      total_papers: number;
      ml_papers: number;
      ml_rate: number;
    }>;
  };
  outcomes: {
    validation_mentioned_rate: number;
    clinical_outcomes_rate: number;
    real_world_application_rate: number;
  };
}

export interface ValidationMetrics {
  metadata: {
    generated_at: string;
    random_seed: number;
    total_papers: number;
    total_fields: number;
  };
  aggregate_metrics: {
    total_papers_analyzed: number;
    total_fields: number;
    aggregate_ml_adoption_rate: number;
    aggregate_code_availability_rate: number;
    top_fields_by_ml_adoption: Record<string, number>;
    top_fields_by_code_availability: Record<string, number>;
  };
  field_analyses: Record<string, FieldAnalysis>;
}

// Transform data for ML Impact visualization
export function getMLImpactData() {
  const data = validationData as ValidationMetrics;
  const fields = data.field_analyses;

  // Extract ML adoption rates over time
  const temporalData: Array<{
    year: number;
    field: string;
    mlRate: number;
    totalPapers: number;
  }> = [];

  Object.entries(fields).forEach(([fieldName, fieldData]) => {
    if (fieldData.temporal?.ml_adoption_by_year) {
      Object.entries(fieldData.temporal.ml_adoption_by_year).forEach(([year, yearData]) => {
        temporalData.push({
          year: parseInt(year),
          field: formatFieldName(fieldName),
          mlRate: yearData.ml_rate,
          totalPapers: yearData.total_papers,
        });
      });
    }
  });

  // Calculate attribution scores based on ML distribution levels
  const attributionData = Object.entries(fields).map(([fieldName, fieldData]) => {
    const dist = fieldData.ml_impact.ml_distribution;
    const minimal = dist.minimal?.percentage || 0;
    const moderate = dist.moderate?.percentage || 0;
    const substantial = dist.substantial?.percentage || 0;
    const core = dist.core?.percentage || 0;

    // Attribution: higher ML level = higher ML contribution
    const mlContribution = (minimal * 0.25 + moderate * 0.5 + substantial * 0.75 + core * 1.0) / 
                          (minimal + moderate + substantial + core || 1) * 100;
    
    return {
      field: formatFieldName(fieldName),
      mlContribution: Number(mlContribution.toFixed(1)),
      domainInsight: Number((100 - mlContribution).toFixed(1)),
      totalMLPapers: fieldData.ml_impact.total_papers,
      mlAdoptionRate: fieldData.ml_impact.ml_adoption_rate,
    };
  }).filter(d => d.mlAdoptionRate > 0);

  // Calculate efficiency metrics
  const efficiencyMetrics = Object.entries(fields).map(([fieldName, fieldData]) => {
    const codeWithML = fieldData.reproducibility.code_availability_by_ml_level;
    const mlRate = fieldData.ml_impact.ml_adoption_rate;
    
    // Calculate average code availability for ML papers
    let mlCodeAvailability = 0;
    let totalMLPapers = 0;
    
    ['minimal', 'moderate', 'substantial', 'core'].forEach(level => {
      if (codeWithML[level]) {
        mlCodeAvailability += codeWithML[level].code_available;
        totalMLPapers += codeWithML[level].total;
      }
    });

    return {
      field: formatFieldName(fieldName),
      mlAdoptionRate: mlRate,
      codeAvailability: totalMLPapers > 0 ? (mlCodeAvailability / totalMLPapers * 100) : 0,
      statisticalMethodsUsage: fieldData.methodology.statistical_methods_usage_rate,
      validationRate: fieldData.outcomes.validation_mentioned_rate,
    };
  });

  return {
    temporal: temporalData,
    attribution: attributionData,
    efficiency: efficiencyMetrics,
    aggregate: data.aggregate_metrics,
  };
}

// Transform data for Adoption Dynamics visualization
export function getAdoptionDynamicsData() {
  const data = validationData as ValidationMetrics;
  const fields = data.field_analyses;

  // Get adoption curves for each field
  const adoptionCurves: Array<{
    year: number;
    field: string;
    adoptionRate: number;
    paperCount: number;
  }> = [];

  Object.entries(fields).forEach(([fieldName, fieldData]) => {
    if (fieldData.temporal?.ml_adoption_by_year) {
      Object.entries(fieldData.temporal.ml_adoption_by_year).forEach(([year, yearData]) => {
        adoptionCurves.push({
          year: parseInt(year),
          field: formatFieldName(fieldName),
          adoptionRate: yearData.ml_rate,
          paperCount: yearData.total_papers,
        });
      });
    }
  });

  // Calculate cross-discipline comparison
  const disciplineComparison = Object.entries(fields).map(([fieldName, fieldData]) => ({
    field: formatFieldName(fieldName),
    mlAdoptionRate: fieldData.ml_impact.ml_adoption_rate,
    significantMLRate: fieldData.ml_impact.significant_ml_usage_rate,
    coreMLRate: fieldData.ml_impact.core_ml_rate,
    totalPapers: fieldData.ml_impact.total_papers,
  })).sort((a, b) => b.mlAdoptionRate - a.mlAdoptionRate);

  // Get ML distribution breakdown
  const mlDistribution = Object.entries(fields).map(([fieldName, fieldData]) => {
    const dist = fieldData.ml_impact.ml_distribution;
    return {
      field: formatFieldName(fieldName),
      none: dist.none?.percentage || 0,
      minimal: dist.minimal?.percentage || 0,
      moderate: dist.moderate?.percentage || 0,
      substantial: dist.substantial?.percentage || 0,
      core: dist.core?.percentage || 0,
    };
  });

  return {
    adoptionCurves,
    disciplineComparison,
    mlDistribution,
  };
}

// Transform data for Quality Trade-offs analysis
export function getQualityTradeoffsData() {
  const data = validationData as ValidationMetrics;
  const fields = data.field_analyses;

  // Compare reproducibility between ML and non-ML papers
  const reproducibilityComparison = Object.entries(fields).map(([fieldName, fieldData]) => {
    const codeByLevel = fieldData.reproducibility.code_availability_by_ml_level;
    
    const noMLRate = codeByLevel.none?.rate || 0;
    
    // Calculate weighted average for ML papers
    let mlCodeRate = 0;
    let mlPaperCount = 0;
    
    ['minimal', 'moderate', 'substantial', 'core'].forEach(level => {
      if (codeByLevel[level]) {
        mlCodeRate += codeByLevel[level].rate * codeByLevel[level].total;
        mlPaperCount += codeByLevel[level].total;
      }
    });
    
    const avgMLCodeRate = mlPaperCount > 0 ? mlCodeRate / mlPaperCount : 0;

    return {
      field: formatFieldName(fieldName),
      noMLCodeAvailability: noMLRate,
      mlCodeAvailability: avgMLCodeRate,
      delta: avgMLCodeRate - noMLRate,
      mlAdoptionRate: fieldData.ml_impact.ml_adoption_rate,
    };
  }).filter(d => d.mlAdoptionRate > 5); // Only fields with significant ML adoption

  // Code availability by ML level across all fields
  const codeByMLLevel = Object.entries(fields).reduce((acc, [fieldName, fieldData]) => {
    const codeByLevel = fieldData.reproducibility.code_availability_by_ml_level;
    
    Object.entries(codeByLevel).forEach(([level, levelData]) => {
      if (!acc[level]) {
        acc[level] = { total: 0, codeAvailable: 0 };
      }
      acc[level].total += levelData.total;
      acc[level].codeAvailable += levelData.code_available;
    });
    
    return acc;
  }, {} as Record<string, { total: number; codeAvailable: number }>);

  const codeAvailabilityByLevel = Object.entries(codeByMLLevel).map(([level, data]) => ({
    level: level.charAt(0).toUpperCase() + level.slice(1),
    rate: data.total > 0 ? (data.codeAvailable / data.total * 100) : 0,
    totalPapers: data.total,
  }));

  // Top ML frameworks across fields
  const allFrameworks: Record<string, number> = {};
  Object.values(fields).forEach(fieldData => {
    Object.entries(fieldData.reproducibility.top_ml_frameworks).forEach(([framework, count]) => {
      allFrameworks[framework] = (allFrameworks[framework] || 0) + count;
    });
  });

  const topFrameworks = Object.entries(allFrameworks)
    .map(([framework, count]) => ({ framework, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  return {
    reproducibilityComparison,
    codeAvailabilityByLevel,
    topFrameworks,
    aggregate: data.aggregate_metrics,
  };
}

// Helper function to format field names
function formatFieldName(fieldName: string): string {
  if (fieldName === "NA") return "N/A";
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/And/g, 'and');
}

// Get summary statistics
export function getSummaryStats() {
  const data = validationData as ValidationMetrics;
  
  return {
    totalPapers: data.metadata.total_papers,
    totalFields: data.metadata.total_fields,
    aggregateMLAdoption: data.aggregate_metrics.aggregate_ml_adoption_rate,
    aggregateCodeAvailability: data.aggregate_metrics.aggregate_code_availability_rate,
    topFieldsByML: data.aggregate_metrics.top_fields_by_ml_adoption,
    topFieldsByCode: data.aggregate_metrics.top_fields_by_code_availability,
    generatedAt: data.metadata.generated_at,
  };
}
