# Product Roadmap

## Hackathon Strategy
This roadmap prioritizes building a working end-to-end system for the Symby AI hackathon demo, focusing on the validation dataset (81K papers) first, then scaling to 20M+ papers. The order emphasizes "systems engineering" scoring: data ingestion → GPU processing → analysis → visualization → insights.

## Phase 1: Foundation & Data Pipeline (Days 1-2)

### 1. Environment Setup & DGX Spark Configuration `XS`
**Goal:** Configure NVIDIA DGX Spark environment with RAPIDS ecosystem
- Install RAPIDS 24.10+ (cuDF, cuGraph, cuML) via conda
- Set up Python 3.10+ environment with CUDA 12.0+ support
- Install NIMs for local LLM inference (Llama 3 or similar)
- Verify GPU memory access (128GB unified memory)
- Create project structure: `/data`, `/processing`, `/analysis`, `/visualization`, `/models`
- **Success Criteria:** Run cuDF/cuGraph hello-world successfully, confirm GPU acceleration working
- **Deliverable:** Reproducible conda environment.yml + setup script

### 2. Data Ingestion & Parsing Pipeline `M`
**Goal:** Build GPU-accelerated ETL to load modular S2ORC dataset
- Parse compressed JSON.gz files from dataset directory structure (organized by field/year)
- Extract key fields using cuDF for parallel processing:
  - Paper metadata: id, title, year, fields_of_study, abstract (text field)
  - Citation data: cited paper IDs (extract from text or metadata)
  - ML adoption markers: keywords (deep learning, transformer, GAN, reinforcement learning), compute mentions (GPU, TPU, supercomputer), frameworks (PyTorch, TensorFlow)
  - Reproducibility indicators: GitHub URLs, dataset references, code availability mentions
- Store in Parquet format (columnar, GPU-friendly) with partitioning by field and year
- Implement progress tracking and error handling for 81K validation papers
- **Success Criteria:** Process 81K papers in <30 minutes, extract 95%+ citation links
- **Deliverable:** ETL pipeline script, validated Parquet dataset
- **DGX Spark Justification:** cuDF processes compressed JSON 5-10x faster than pandas

### 3. Paper Classification System `S`
**Goal:** Categorize papers as ML methodology vs domain science
- **Rule-Based Classifier:**
  - ML methodology: Computer Science field + keywords (neural network architecture, training algorithm, optimization method)
  - Domain science: Biology, Chemistry, Physics, Medicine, Materials Science fields
  - Hybrid: Papers citing both ML and domain papers
- **ML Technique Tagging:** Extract specific techniques from abstracts (deep learning, transformers, GANs, graph neural networks, reinforcement learning, CNNs, RNNs, LSTMs)
- Use NIM-based LLM for ambiguous cases (local inference, not cloud API)
- **Success Criteria:** 90%+ classification accuracy on manually labeled subset
- **Deliverable:** Classified paper dataset with ML technique tags

## Phase 2: Citation Network & Graph Analytics (Days 2-3)

### 4. Citation Network Graph Construction `L`
**Goal:** Build GPU-accelerated citation graph using RAPIDS cuGraph
- Create directed graph: nodes = papers (20M at scale), edges = citations (200M+ at scale)
- Graph schema:
  - Node attributes: paper_id, year, field, ml_techniques[], is_ml_method, reproducibility_score
  - Edge attributes: citation_year, citation_context (if available)
- Build temporal snapshots (2016, 2017, ... 2024) for evolution analysis
- Implement bi-directional indexing: cites and cited-by for efficient traversal
- Store graph in cuGraph-compatible format (edge list, adjacency matrix)
- **Success Criteria:** Build 81K-node graph in <10 minutes, support 3-hop queries in <1 second
- **Deliverable:** Citation graph database with temporal layers
- **DGX Spark Justification:** 128GB unified memory holds full graph + metadata in GPU memory for real-time queries; cuGraph provides 10-100x faster PageRank and community detection vs NetworkX CPU

### 5. Graph Analytics & Impact Metrics `M`
**Goal:** Calculate citation-based impact metrics using GPU algorithms
- **PageRank:** Identify most influential papers (weighted by citation importance, not just count)
- **Community Detection:** Cluster papers into research communities (Louvain algorithm on GPU)
- **Centrality Metrics:** Betweenness centrality for "bridge" papers connecting ML to domain science
- **Citation Velocity:** Citations per year for each paper, detect explosive growth patterns
- **ML Method Influence:** For each ML methodology paper, calculate total citations from domain papers (direct + transitive)
- **Success Criteria:** PageRank on 81K graph completes in <30 seconds (vs minutes on CPU)
- **Deliverable:** Impact metrics table joined with paper metadata
- **DGX Spark Justification:** cuGraph PageRank runs 50-100x faster than NetworkX on large graphs

## Phase 3: Core Attribution & Acceleration Analysis (Days 3-4)

### 6. Attribution Scoring Engine `L`
**Goal:** Quantify ML contribution percentage for each domain paper
- **Citation-Based Attribution:**
  - Count direct citations to ML methodology papers
  - Count citations to domain-only papers
  - Calculate ratio: ML_attribution = ML_citations / (ML_citations + domain_citations)
- **Temporal Attribution:**
  - Compare publication date with ML technique introduction date
  - Papers published <2 years after ML method get higher ML attribution
- **Keyword Attribution:**
  - Papers with extensive ML methodology sections get higher scores
  - Papers only mentioning ML in passing get lower scores
- **Co-authorship Attribution:**
  - Mixed ML + domain expert author teams indicate true collaboration
- **Combined Score:** Weighted average (40% citation, 30% temporal, 20% keyword, 10% co-author)
- **Success Criteria:** Attribution scores correlate with manual expert assessment (Pearson r > 0.7)
- **Deliverable:** Attribution scores (0-100%) with confidence intervals for all domain papers

### 7. Acceleration Metrics Calculator `M`
**Goal:** Measure time-to-discovery speedup from ML adoption
- **Pre/Post Analysis:**
  - Identify problem domains (drug target class, material type, climate phenomenon)
  - Calculate median time from problem definition paper → solution paper pre-ML (2016-2018)
  - Calculate median time post-ML adoption (2019-2024)
  - Compute speedup factor with statistical significance (t-test, bootstrapping)
- **Comparative Analysis:**
  - Match papers solving similar problems (with/without ML) using embedding similarity
  - Compare timelines for matched pairs
- **Publication Velocity:**
  - Track papers-per-year in sub-fields before and after ML adoption
- **Output Metrics:**
  - Speedup factor (e.g., "2.3x faster")
  - Confidence intervals and p-values
  - Field-specific timelines
- **Success Criteria:** Detect known accelerations (AlphaFold in protein structure prediction)
- **Deliverable:** Acceleration metrics by discipline and ML technique
- **DGX Spark Justification:** Parallel computation of millions of pairwise paper comparisons using cuML

### 8. ML Adoption Detection & Tracking `S`
**Goal:** Track ML technique adoption curves across disciplines (S-curves)
- **Adoption Metrics:**
  - Calculate % of papers in each field using specific ML techniques by year
  - Fit S-curve (logistic growth) models to adoption data
  - Identify adoption phases: early (0-10%), growth (10-50%), maturity (50-90%)
- **Technique Diffusion:**
  - Track time from ML method publication to 10%/50% adoption in each domain
  - Identify early adopter fields vs laggards
- **Cross-Pollination:**
  - Detect when techniques jump between fields (transformers: NLP→CV→biology)
- **Success Criteria:** Visualize clear S-curves for major techniques (deep learning, transformers)
- **Deliverable:** Adoption time-series data, S-curve parameters

## Phase 4: Reproducibility & Quality Analysis (Days 4-5)

### 9. Reproducibility Indicator Extraction `M`
**Goal:** Extract and score reproducibility signals from papers
- **Code Availability:**
  - Detect GitHub URLs, Zenodo links, "code available" statements
  - Score: 1.0 (GitHub link), 0.5 (code upon request), 0.0 (no mention)
- **Data Availability:**
  - Detect dataset links, benchmark participation, "data available" statements
  - Score: 1.0 (public dataset), 0.5 (available upon request), 0.0 (no mention)
- **Replication Attempts:**
  - Identify papers that cite original with "replicate", "reproduce", "fail to replicate" keywords
  - Score: 1.0 (successful replication), 0.0 (failed replication)
- **Methodological Transparency:**
  - Hyperparameter reporting, architecture diagrams, ablation studies
- **Combined Reproducibility Score:** Weighted average (40% code, 30% data, 20% replication, 10% transparency)
- **Success Criteria:** Scores correlate with known reproducible/irreproducible papers
- **Deliverable:** Reproducibility scores for all papers
- **DGX Spark Justification:** NIM-based local LLM inference for text analysis (no cloud API costs)

### 10. Reproducibility Correlation Analysis `M`
**Goal:** Cross-reference ML adoption with reproducibility metrics
- **Correlation Studies:**
  - ML technique type vs reproducibility score (deep RL vs traditional ML)
  - Model complexity (parameter count, compute requirements) vs code availability
  - Citation rate vs reproducibility (high citations + low reproducibility = bubble warning)
- **Field Comparisons:**
  - Which disciplines balance innovation with reproducibility best?
  - Materials science vs neuroscience vs drug discovery
- **Temporal Trends:**
  - Is reproducibility improving or declining over 2016-2024?
- **Risk Scoring:**
  - Identify ML techniques with "high citation, low reproducibility" (potential hype)
- **Success Criteria:** Find statistically significant correlations (p < 0.05)
- **Deliverable:** Correlation matrices, scatter plots, field-specific reproducibility benchmarks

### 11. Quality Signal Detection `S`
**Goal:** Identify citation bubbles and early warning signals
- **Citation Bubble Detection:**
  - Papers with citation rate > 95th percentile but reproducibility score < 25th percentile
  - Techniques with exponential citation growth but declining code availability over time
- **Hype vs Reality:**
  - Keywords appearing in abstracts but not methodology sections
  - Papers claiming breakthroughs without ablation studies or baselines
- **Peer Review Quality Proxies:**
  - Correlation between review thoroughness and reproducibility (if review metadata available)
- **Success Criteria:** Identify 10+ high-profile bubble candidates for manual review
- **Deliverable:** Bubble risk scores, flagged papers list

## Phase 5: Visualization & Dashboard (Days 5-6)

### 12. Interactive Web Dashboard `L`
**Goal:** Build responsive web interface using Plotly Dash or Streamlit
- **Technology Stack:** Plotly Dash (better for complex interactions) or Streamlit (faster prototyping)
- **Dashboard Sections:**
  1. **Overview:** High-level metrics (total papers analyzed, fields covered, date range)
  2. **Adoption Dynamics:** S-curve charts, heatmaps, temporal animations
  3. **Attribution Explorer:** Search papers, see attribution scores, drill down
  4. **Citation Network:** Interactive graph visualization with temporal animation
  5. **Reproducibility Analysis:** Correlation charts, bubble warnings, field comparisons
  6. **Case Studies:** Deep dives on AlphaFold, COVID drug discovery, etc.
- **Interactive Features:**
  - Filters: year range, field, ML technique, reproducibility score
  - Search: find papers by title, author, keywords
  - Export: download charts as SVG/PDF, export data as CSV
- **Performance:** Server-side rendering, GPU-accelerated data queries, cache frequently accessed views
- **Success Criteria:** Dashboard responds in <5 seconds for all queries on 81K dataset
- **Deliverable:** Deployed web dashboard accessible via localhost

### 13. S-Curve Adoption Visualizations `M`
**Goal:** Create compelling adoption dynamics charts
- **S-Curve Charts:** Logistic curves showing ML technique adoption over time
  - Separate curves for each discipline
  - Color-coded by technique (deep learning, transformers, GANs, etc.)
  - Interactive: hover for exact percentages, click to drill down
- **Adoption Velocity Heatmap:** Matrix of technique × field, color = time to 50% adoption
- **Cross-Discipline Comparison:** Side-by-side S-curves for materials vs neuroscience vs drug discovery
- **Success Criteria:** Clearly show transformers' explosive growth vs GANs' plateau
- **Deliverable:** Interactive Plotly charts embedded in dashboard

### 14. Citation Network Visualization `M`
**Goal:** Animated network graph showing citation flows
- **Network Graph Features:**
  - Nodes: papers (size = citation count, color = field, shape = ML method vs domain)
  - Edges: citations (thickness = number of co-citations, animated flow direction)
  - Layout: force-directed (D3-like) for natural clustering
- **Temporal Animation:** Time slider (2016-2024), watch network grow and evolve
- **Interactive Exploration:**
  - Click node to see paper details, ML techniques used, reproducibility score
  - Highlight citation paths from specific ML methodology papers
  - Filter by field, technique, year
- **Performance:** Use Plotly with WebGL backend for 10K+ nodes (subsample from 81K if needed)
- **Success Criteria:** Visualize complete citation path from AlphaFold to drug discovery papers
- **Deliverable:** Interactive network graph with animation controls

### 15. Statistical Dashboards & Reports `S`
**Goal:** Create standard analytics views
- **Reproducibility Dashboards:**
  - Scatter plots: citation rate vs reproducibility score (bubble detection)
  - Bar charts: code availability by ML technique
  - Time series: reproducibility trends 2016-2024
- **Attribution Analysis:**
  - Histograms: distribution of attribution scores by field
  - Box plots: attribution score variation by ML technique
- **Acceleration Metrics:**
  - Bar charts: speedup factors by discipline
  - Timeline comparisons: pre-ML vs post-ML discovery timelines
- **Success Criteria:** All charts publication-ready (high DPI, clear labels)
- **Deliverable:** Comprehensive analytics dashboard

## Phase 6: Case Studies & Discovery Tracing (Days 6-7)

### 16. Case Study Deep Dive: AlphaFold `M`
**Goal:** Trace AlphaFold's complete impact journey
- **Methodology:**
  1. Identify AlphaFold methodology papers (DeepMind 2018, 2021)
  2. Find all citing papers (direct citations)
  3. Classify citing papers by field (drug discovery, structural biology, etc.)
  4. Extract outcomes: clinical trials mentioned, patents filed, FDA approvals
  5. Calculate attribution scores for major citing papers
  6. Compare protein structure prediction timelines pre/post AlphaFold
- **Visualizations:**
  - Timeline: AlphaFold publication → citing papers → clinical outcomes
  - Citation flow network: AlphaFold at center, domain papers radiating outward
  - Impact metrics: citation count, time acceleration, real-world outcomes
- **Success Criteria:** Show quantifiable 3-5 year acceleration in protein structure prediction
- **Deliverable:** Complete case study with interactive visualization

### 17. Discovery Journey Mapping `M`
**Goal:** Build general framework for tracing any ML method → breakthrough path
- **Journey Components:**
  1. **Origin:** ML methodology paper (GPT-3, AlphaFold, graph neural networks)
  2. **Adoption:** First domain papers citing the method (early adopters)
  3. **Diffusion:** Explosion of citing papers across sub-fields
  4. **Breakthrough:** High-impact papers solving major problems
  5. **Real-World Impact:** Patents, clinical trials, policy changes, products
- **Path Analysis:**
  - Identify intermediate "bridge" papers connecting ML to domain
  - Calculate multi-hop citation distances
  - Detect bottlenecks where techniques get stuck
- **Interactive Features:**
  - Click any paper node to see its journey role
  - Filter by time period, field, outcome type
- **Success Criteria:** Trace 5+ major ML breakthroughs end-to-end
- **Deliverable:** Discovery journey visualization framework

### 18. Automated Insight Generation `M`
**Goal:** Generate natural language summaries of findings
- **Pattern Detection:**
  - Statistical anomalies: techniques with unusual adoption rates
  - Cross-discipline trends: techniques jumping between fields
  - Temporal patterns: techniques accelerating or declining
  - Quality signals: fields with reproducibility issues
- **LLM-Based Summarization:**
  - Use local NIM inference to generate insights
  - Prompt template: "Analyze this data and identify non-obvious patterns..."
  - Persona-specific summaries: funding director (ROI focus), scientist (actionable recommendations), policymaker (strategic priorities)
- **Example Insights:**
  - "Materials science adopts graph neural networks 3x faster than neuroscience, likely due to established computational chemistry culture and infrastructure"
  - "Deep reinforcement learning papers show 67% higher citation rates but 30% lower code availability compared to supervised learning—potential bubble warning"
  - "Transformers achieved 50% adoption in NLP by 2020 but only 15% in biology by 2024, suggesting domain-specific barriers"
- **Success Criteria:** Generate 20+ non-obvious, actionable insights
- **Deliverable:** Automated insight report generator
- **DGX Spark Justification:** Local NIM inference for LLM (no cloud API costs, complete data privacy)

## Phase 7: Production Scale-Up (Days 7-8)

### 19. Scale to 20M Papers `L`
**Goal:** Optimize pipeline for full HuggingFace dataset (20M+ papers)
- **Optimization Strategies:**
  - **Batch Processing:** Process papers in 100K chunks to manage memory
  - **Distributed Computation:** Use Dask with GPU workers for parallel ETL
  - **Incremental Graph Construction:** Build citation graph in chunks, merge on GPU
  - **Efficient Storage:** Use Parquet partitioning by year + field for fast queries
  - **Memory Management:** Use RAPIDS memory pools, pin memory for faster GPU transfers
- **Pipeline Stages:**
  1. Download from HuggingFace (https://huggingface.co/datasets/claran/modular-s2orc)
  2. ETL processing (parallel cuDF)
  3. Citation graph construction (cuGraph)
  4. Analytics computation (PageRank, community detection, attribution scoring)
  5. Insight generation (NIM-based LLM)
- **Monitoring:** Progress bars, ETA estimates, memory usage tracking, error logging
- **Success Criteria:** Process 20M papers in <4 hours, build citation graph in <2 hours
- **Deliverable:** Production-ready pipeline with configuration for scale
- **DGX Spark Justification:** 128GB unified memory + GPU acceleration essential for 20M-node graph; consumer GPUs would require slow disk swapping

### 20. Performance Benchmarking & Documentation `S`
**Goal:** Document DGX Spark advantages for competition scoring (30 points)
- **Benchmark Comparisons:**
  - **cuDF vs pandas:** Data loading and transformation speed (expected: 5-10x faster)
  - **cuGraph vs NetworkX:** PageRank on 20M-node graph (expected: 50-100x faster)
  - **GPU vs CPU:** Full pipeline runtime (expected: 10-20x faster)
  - **Memory Efficiency:** 128GB unified memory enables full graph in-memory (impossible on consumer GPUs)
- **Technical Writeup:**
  - Why DGX Spark is essential: "Citation network of 20M papers with 200M edges requires ~60GB GPU memory for PageRank computation. DGX Spark's 128GB unified memory + cuGraph enables real-time graph queries in seconds vs hours on CPU NetworkX."
  - Performance graphs: side-by-side bar charts showing GPU vs CPU timings
  - Architecture diagram: data flow through RAPIDS ecosystem
- **Video Demo:** Screen recording showing interactive graph queries responding in <5 seconds
- **Success Criteria:** Clear 10-100x performance advantage over CPU/cloud alternatives
- **Deliverable:** Performance benchmarking report, technical justification document

### 21. Error Handling & Data Quality `S`
**Goal:** Robust production system with monitoring
- **Error Handling:**
  - Try-catch blocks around file parsing (corrupted JSON)
  - Validation checks: missing citations, invalid years, null fields
  - Graceful degradation: skip corrupted papers, log errors, continue processing
- **Data Quality Metrics:**
  - Track % of papers with complete metadata
  - Identify fields with sparse data (exclude from analysis or caveat)
  - Validate citation links: do cited papers exist in dataset?
- **Monitoring:**
  - Log file with timestamps, progress updates, warnings, errors
  - Memory usage tracking (nvidia-smi polling)
  - Pipeline stage timing for bottleneck identification
- **Success Criteria:** Pipeline handles 20M papers without crashing, logs all issues
- **Deliverable:** Production-grade pipeline with comprehensive error handling

## Phase 8: Polish & Presentation (Day 9)

### 22. Demo Preparation `M`
**Goal:** Prepare compelling hackathon demo
- **Demo Script:** 5-minute walkthrough hitting all evaluation criteria
  1. **Problem Statement:** "How much does ML actually accelerate science?" (30 sec)
  2. **Technical Execution:** Show pipeline processing 81K papers → attribution scores → visualizations (60 sec)
  3. **NVIDIA Ecosystem:** Explain RAPIDS cuGraph PageRank, local NIM inference, 128GB unified memory (60 sec)
  4. **Value & Insights:** Show non-obvious findings (materials vs neuroscience, bubble warnings) (90 sec)
  5. **Frontier Factor:** Demonstrate real-time graph queries, show performance benchmarks (60 sec)
  6. **Dashboard Walkthrough:** Interactive exploration of S-curves, citation networks, case studies (60 sec)
- **Demo Data:** Prepare interesting examples (AlphaFold journey, transformer adoption, reproducibility correlation)
- **Backup Plan:** Pre-rendered visualizations in case live demo fails
- **Success Criteria:** Demo clearly shows working system, NVIDIA tech usage, valuable insights
- **Deliverable:** Demo script, slide deck (5-10 slides), rehearsed presentation

### 23. Documentation & Code Quality `S`
**Goal:** Professional codebase and documentation
- **Code Organization:**
  - Clear directory structure: `/src/ingestion`, `/src/analytics`, `/src/visualization`
  - Modular functions with docstrings
  - Type hints for key functions
  - Configuration file (YAML) for parameters
- **Documentation:**
  - README.md: project overview, setup instructions, usage examples
  - ARCHITECTURE.md: system design, data flow, key algorithms
  - API.md: function signatures for main modules
  - BENCHMARKS.md: performance results, GPU vs CPU comparisons
- **Code Quality:**
  - Run `ruff` linter, fix warnings
  - Run `black` formatter for consistent style
  - Add unit tests for critical functions (if time permits)
- **Success Criteria:** Clean, readable code that judges can understand
- **Deliverable:** Professional codebase with comprehensive README

### 24. Insight Report & Presentation Slides `M`
**Goal:** Synthesize findings into compelling narrative
- **Insight Report (2-3 pages):**
  - **Executive Summary:** Key findings in 3-5 bullet points
  - **Major Insights:** 10+ non-obvious findings with supporting data
  - **Field-Specific Recommendations:** What should materials scientists vs neuroscientists know about ML adoption?
  - **Policy Implications:** Where should funding agencies invest?
  - **Reproducibility Concerns:** Which ML techniques show bubble warning signs?
- **Presentation Slides (8-12 slides):**
  1. Title + Team
  2. Problem Statement (ML impact is unknown)
  3. Solution Overview (GPU-accelerated analytics platform)
  4. Technical Architecture (RAPIDS, cuGraph, NIMs)
  5. Key Insights #1: Adoption Dynamics (S-curves, field differences)
  6. Key Insights #2: Attribution & Acceleration (quantified impact)
  7. Key Insights #3: Reproducibility Trade-offs (bubble warnings)
  8. Case Study: AlphaFold Journey (impact tracing)
  9. Performance Benchmarks (DGX Spark advantage)
  10. Demo (live or video)
  11. Conclusions & Impact
  12. Thank You + Contact
- **Success Criteria:** Judges understand value, see technical depth, want to use the system
- **Deliverable:** Polished slide deck, 1-page insight summary

## Stretch Goals (If Time Permits)

### 25. Trend Forecasting `S`
- Extrapolate S-curves to predict which ML techniques will reach maturity in next 2-3 years
- Identify emerging techniques showing early exponential growth
- Field readiness scoring: which domains are primed for specific ML adoption

### 26. Real-World Outcome Tracking `M`
- Scrape patent databases (Google Patents) for papers with patent citations
- Track clinical trials (ClinicalTrials.gov) mentioning papers
- Identify policy documents (regulations, white papers) citing research

### 27. Co-Authorship Network Analysis `S`
- Build author collaboration networks
- Identify key "bridge" researchers connecting ML to domain science
- Track career trajectories: do ML-adopting scientists publish more?

### 28. Fine-Tuned Classification Models `M`
- Train cuML classifier on manually labeled papers for more accurate ML adoption detection
- Fine-tune NIM-based LLM on scientific paper abstracts for better insight generation

---

## Priority Key
- `XS` = <4 hours
- `S` = 4-8 hours
- `M` = 8-16 hours (1-2 days)
- `L` = 16-32 hours (2-4 days)

## Critical Path
**Must-Have for Demo:**
1. Data Pipeline (Items 1-3): Load and classify 81K papers
2. Citation Graph (Items 4-5): Build network, run PageRank
3. Core Analytics (Items 6-8): Attribution scoring, acceleration metrics
4. Reproducibility (Items 9-11): Extract signals, correlations, bubble detection
5. Visualization (Items 12-14): Dashboard with S-curves, network graphs
6. Case Study (Item 16): AlphaFold demo
7. Performance (Item 20): Benchmark documentation
8. Demo Prep (Items 22-24): Presentation materials

**Nice-to-Have:**
- Items 17-19: Additional features
- Items 25-28: Stretch goals

## Competition Scoring Alignment

### Technical Execution (30 pts)
- Items 1-11: Complete pipeline from ingestion to insights
- Focus on system depth, not just API wrappers

### NVIDIA Ecosystem (30 pts)
- Items 2, 4, 5, 9, 19, 20: Heavy RAPIDS usage
- Item 18: Local NIM inference
- Item 20: DGX Spark justification writeup

### Value & Impact (20 pts)
- Items 6-11, 16-18: Non-obvious insights
- Items 22-24: Usable insights for stakeholders

### Frontier Factor (20 pts)
- Items 14, 17: Novel visualizations
- Items 19-20: Performance optimization

**Total: 100 Points**
