const fs = require('fs');
const path = require('path');

// Paths
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const ML_OUTPUT_DIR = path.join(DATA_DIR, 'ml_output');
const NONML_OUTPUT_DIR = path.join(DATA_DIR, 'nonml_output');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'generatedPapers.json');

/**
 * Read all JSONL files from a directory
 */
function readJSONLFiles(directory) {
  const papers = [];

  try {
    if (!fs.existsSync(directory)) {
      console.warn(`Directory does not exist: ${directory}`);
      return papers;
    }

    const files = fs.readdirSync(directory);

    for (const file of files) {
      if (file.endsWith('.jsonl')) {
        const filePath = path.join(directory, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const paper = JSON.parse(line);
            papers.push(paper);
          } catch (e) {
            console.warn(`Failed to parse line in ${file}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error(`Error reading directory ${directory}:`, e);
  }

  return papers;
}

/**
 * Normalize field names to match discipline file names
 */
function normalizeFieldName(field) {
  // Map of incorrect field names to correct discipline names
  const fieldMapping = {
    // Computer Science variations
    'Computer Vision': 'ComputerScience',
    'Natural Language Processing': 'ComputerScience',
    
    // Engineering variations
    'Civil Engineering': 'Engineering',
    
    // Medicine variations
    'Gastroenterology': 'Medicine',
    'MedicalScience': 'Medicine',
    'Medical Science': 'Medicine',
    
    // Education variations
    'Sport Studies, Education': 'Education',
    'English Language Teaching (ELT)': 'Education',
    
    // Physics variations
    'Particle Physics': 'Physics',
    'Photonic Technologies': 'Physics',
    
    // Environmental Science variations
    'Geology': 'EnvironmentalScience',
  };
  
  // Return mapped field or original field
  return fieldMapping[field] || field;
}

/**
 * Format display name for a discipline
 */
function formatDisplayName(field) {
  const displayNames = {
    'AgriculturalAndFoodSciences': 'Agricultural And Food Sciences',
    'ComputerScience': 'Computer Science',
    'EnvironmentalScience': 'Environmental Science',
    'MaterialsScience': 'Materials Science',
    'PoliticalScience': 'Political Science',
  };
  
  return displayNames[field] || field;
}

/**
 * Convert ML impact category to a numeric score
 */
function mlImpactToScore(impact) {
  const scoreMap = {
    'none': 20,
    'minimal': 35,
    'moderate': 65,
    'substantial': 90,
    'core': 100,
  };
  return scoreMap[impact] || 20;
}

/**
 * Main function
 */
function generateStaticData() {
  console.log('Reading papers from JSONL files...');

  const mlPapers = readJSONLFiles(ML_OUTPUT_DIR);
  const nonMlPapers = readJSONLFiles(NONML_OUTPUT_DIR);
  const allRawPapers = [...mlPapers, ...nonMlPapers];

  console.log(`Found ${allRawPapers.length} papers total`);
  console.log(`  - ML papers: ${mlPapers.length}`);
  console.log(`  - Non-ML papers: ${nonMlPapers.length}`);

  // Convert to Paper format
  const papers = allRawPapers
    .map((raw, index) => {
      // Normalize the field name first
      const normalizedField = normalizeFieldName(raw.field);
      
      // Skip NA papers
      if (normalizedField === 'NA') {
        return null;
      }
      
      return {
        id: `paper-${normalizedField}-${raw.year}-${index}`,
        title: raw.title,
        year: parseInt(raw.year),
        domain: formatDisplayName(normalizedField),
        mlImpact: raw.ml_impact,
        impactScore: mlImpactToScore(raw.ml_impact),
        codeAvailable: raw.code_availability,
        citations: Math.floor(Math.random() * 500),
        summary: raw.summary,
        mlFrameworks: raw.ml_frameworks && raw.ml_frameworks.length > 0 ? raw.ml_frameworks : undefined,
        statisticalMethods: raw.statistics ? [raw.statistics] : undefined,
      };
    })
    .filter(paper => paper !== null); // Remove NA papers

  // Write to output file
  console.log(`Writing ${papers.length} papers to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(papers, null, 2));
  console.log('Done!');

  // Print some statistics
  const mlImpactCounts = papers.reduce((acc, p) => {
    acc[p.mlImpact] = (acc[p.mlImpact] || 0) + 1;
    return acc;
  }, {});

  console.log('\nML Impact distribution:');
  Object.entries(mlImpactCounts).forEach(([impact, count]) => {
    console.log(`  ${impact}: ${count}`);
  });

  // Print domain distribution
  const domainCounts = papers.reduce((acc, p) => {
    acc[p.domain] = (acc[p.domain] || 0) + 1;
    return acc;
  }, {});

  console.log('\nDomain distribution:');
  Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}`);
    });
}

// Run the script
generateStaticData();
