import { Paper } from "@/types";

export { type Paper };

const domains = [
  "Computer Vision",
  "NLP",
  "Robotics",
  "Bioinformatics",
  "Healthcare",
  "Finance",
  "Climate Science",
  "Physics"
];

const titles = [
  "Deep Learning for Protein Folding",
  "Transformer Models in Legal Text Analysis",
  "Reinforcement Learning for Autonomous Navigation",
  "Generative Adversarial Networks in Art",
  "Predicting Stock Market Trends with LSTM",
  "Climate Change Modeling using CNNs",
  "Automated Medical Diagnosis via Image Recognition",
  "Quantum State Tomography with Neural Networks",
  "Efficient Neural Architecture Search",
  "Self-Supervised Learning for Speech Recognition",
  "Graph Neural Networks for Drug Discovery",
  "Explainable AI in Credit Scoring",
  "Real-time Object Detection on Edge Devices",
  "Multi-Agent Reinforcement Learning in Games",
  "Zero-Shot Learning for Rare Disease Classification"
];

export const generateMockPapers = (count: number = 100): Paper[] => {
  return Array.from({ length: count }, (_, i) => {
    const impactScore = Math.random() * 100;
    // Higher impact score correlates slightly with code availability for realism, but not strictly
    const codeAvailable = Math.random() > 0.4 || (impactScore > 80 && Math.random() > 0.2); 
    
    return {
      id: `paper-${i}`,
      title: titles[i % titles.length] + (i >= titles.length ? ` ${Math.floor(i / titles.length) + 1}` : ""),
      impactScore,
      codeAvailable,
      year: 2020 + Math.floor(Math.random() * 6),
      citations: Math.floor(Math.random() * 1000) + (impactScore * 10),
      domain: domains[Math.floor(Math.random() * domains.length)],
    };
  });
};

export const MOCK_PAPERS = generateMockPapers(150);