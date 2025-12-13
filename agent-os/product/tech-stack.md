# Tech Stack

## Hardware & Platform

### NVIDIA DGX Spark (REQUIRED for Competition)
- **Hardware:** NVIDIA DGX Spark with 128GB Unified Memory, NVIDIA GPU with CUDA 12.0+ support
- **Why Essential (Competition Scoring - 30 Points):**
  - **Unified Memory Architecture:** 128GB enables loading complete 20M-node citation graph (60GB) + paper embeddings (20GB) + metadata (10GB) entirely in GPU memory for real-time graph traversal
  - **Graph Analytics:** cuGraph PageRank on 20M papers completes in 30 seconds vs 45+ minutes on CPU NetworkX
  - **Data Processing:** cuDF parallel JSON parsing processes 81K papers in 10 minutes vs 60+ minutes with pandas
  - **Local Inference:** Run NIM-optimized LLMs locally for paper analysis without expensive cloud API calls or data privacy concerns
- **Competition Justification Document:** "The citation network of 20M papers with 200M+ edges requires ~60GB GPU memory for efficient PageRank computation. Consumer GPUs (24GB max) would require slow disk swapping. Cloud-based graph APIs (Neo4j, AWS Neptune) charge per query and cannot run complex multi-hop citation path analysis. DGX Spark's 128GB unified memory + RAPIDS ecosystem enables interactive exploration impossible elsewhere."
- **Performance Target:** 10-100x speedup vs CPU-only solutions on core analytics tasks

## Framework & Runtime

### Application Framework
- **Primary:** Python 3.10+ (scientific computing ecosystem, RAPIDS compatibility)
- **Package Manager:** conda (for NVIDIA RAPIDS dependencies) + pip (for additional packages)
- **Environment Management:** conda environment.yml for reproducibility across DGX systems
- **Configuration:** YAML-based config files for pipeline parameters, file paths, model settings

### Virtual Environment Setup
```bash
# Create conda environment with RAPIDS
conda create -n ml-observatory python=3.10 -y
conda activate ml-observatory
conda install -c rapidsai -c conda-forge -c nvidia \
    rapids=24.10 python=3.10 cudatoolkit=12.0
pip install -r requirements.txt
```

## NVIDIA Ecosystem (CRITICAL - 30 Points in Competition)

### RAPIDS (GPU-Accelerated Data Science) - PRIMARY FOCUS

#### cuDF (GPU-Accelerated DataFrames)
- **Use Case:** ETL pipeline for 81K-20M papers - load compressed JSON.gz files, parse, transform, filter
- **Why Essential:** Process 81K papers in 10 minutes vs 60 minutes with pandas; handles compressed files directly with GPU decompression
- **Key Operations:**
  - Parallel JSON parsing from gzipped files
  - Text column operations for metadata extraction (title, abstract, authors)
  - Date/time parsing for year fields
  - Join operations between papers and citations
  - GroupBy aggregations for per-field statistics
- **API:** pandas-compatible API, easy migration from pandas code
- **Performance Target:** 5-10x faster than pandas on data loading and transformation
- **Code Example:**
```python
import cudf
# Load compressed papers 5-10x faster than pandas
papers = cudf.read_json('papers.json.gz', lines=True, compression='gzip')
# Filter ML papers with GPU acceleration
ml_papers = papers[papers['field'].str.contains('Computer Science')]
```

#### cuGraph (GPU-Accelerated Graph Analytics)
- **Use Case:** Build citation network (20M nodes, 200M edges), run PageRank, community detection, path analysis
- **Why Essential:** Core to competition value proposition - citation network analysis is primary insight source
- **Key Algorithms:**
  - **PageRank:** Identify most influential papers (not just citation count, but citation importance)
  - **Louvain Community Detection:** Cluster papers into research communities
  - **Betweenness Centrality:** Find "bridge" papers connecting ML methods to domain science
  - **Shortest Path:** Trace discovery journeys from ML paper to breakthrough
  - **K-Core Decomposition:** Identify tightly connected research clusters
- **Performance:** 50-100x faster than NetworkX on large graphs
  - PageRank on 20M nodes: 30 seconds (cuGraph) vs 45 minutes (NetworkX CPU)
  - Community detection on 20M nodes: 5 minutes (cuGraph) vs hours (NetworkX)
- **Memory Efficiency:** Graph stored in GPU memory (adjacency list format, CSR/CSC sparse matrices)
- **API:** NetworkX-compatible for easy migration
- **Performance Target:** Real-time graph queries (<5 seconds) on full 20M paper network
- **Code Example:**
```python
import cugraph
# Build citation graph on GPU
G = cugraph.Graph(directed=True)
G.from_cudf_edgelist(edges_df, source='citing_paper', destination='cited_paper')
# Run PageRank 50-100x faster than NetworkX
pagerank_scores = cugraph.pagerank(G)
# Community detection in minutes vs hours
communities = cugraph.louvain(G)
```

#### cuML (GPU-Accelerated Machine Learning)
- **Use Case:** Paper classification, clustering, similarity analysis, reproducibility prediction
- **Key Algorithms:**
  - **K-Means Clustering:** Group papers by topic/methodology
  - **HDBSCAN:** Hierarchical clustering for research community detection
  - **Random Forest / XGBoost (GPU):** Classify papers as ML methodology vs domain science
  - **UMAP:** Dimensionality reduction for visualization (2D/3D embeddings)
  - **Cosine Similarity:** Find similar papers for comparative analysis
- **Performance:** 10-50x faster than scikit-learn on GPU
- **Use Cases:**
  - Train classifier to detect ML adoption in papers (features: keywords, citations, field)
  - Cluster papers into sub-fields for comparative analysis
  - Reduce paper embeddings to 2D for visualization
- **Code Example:**
```python
import cuml
# GPU-accelerated classification 10-50x faster than sklearn
clf = cuml.ensemble.RandomForestClassifier(n_estimators=100)
clf.fit(X_train, y_train)
predictions = clf.predict(X_test)
# UMAP dimensionality reduction for visualization
reducer = cuml.UMAP(n_components=2)
embeddings_2d = reducer.fit_transform(embeddings)
```

### NIMs (NVIDIA Inference Microservices) - SECONDARY FOCUS

#### Local LLM Inference
- **Use Case:** Paper content analysis, methodology extraction, insight generation, natural language summaries
- **Why Essential:** Competition prohibits cloud APIs (GPT-4 gets 0 points); local inference required for privacy and cost
- **Model Selection:**
  - **Llama 3 8B (recommended):** Good balance of quality and speed, fits in DGX memory
  - **Mistral 7B (alternative):** Faster inference, slightly lower quality
  - **Mixtral 8x7B (stretch goal):** Higher quality for insight generation if memory permits
- **NIM Optimization:** TensorRT optimization for maximum throughput
- **Batch Processing:** Process papers in batches for efficiency
- **Use Cases:**
  1. **Paper Classification:** "Classify this abstract as ML methodology or domain science"
  2. **Technique Extraction:** "Identify specific ML techniques mentioned: [abstract]"
  3. **Insight Generation:** "Analyze these statistics and identify non-obvious patterns"
  4. **Summary Generation:** "Summarize findings for a funding agency director"
- **Performance Target:** Process 1000 paper abstracts in <10 minutes
- **Code Example:**
```python
from langchain_nvidia_ai_endpoints import ChatNVIDIA
# Use local NIM (not cloud API)
llm = ChatNVIDIA(model="llama3-8b-instruct", base_url="http://localhost:8000")
# Extract ML techniques from abstract
prompt = f"Identify ML techniques in this abstract: {abstract}"
response = llm.invoke(prompt)
```

### Additional NVIDIA Technologies (Optional - Extra Credit)

#### NeMo Framework (Stretch Goal)
- **Use Case:** Fine-tune LLM on scientific paper corpus for better classification
- **Benefit:** Domain-specific language model trained on S2ORC papers
- **Time Permitting:** Fine-tune Llama 3 on paper abstracts for improved technique extraction

#### TensorRT (Optimization)
- **Use Case:** Optimize custom deep learning models (if we train any)
- **Benefit:** Maximum inference throughput for paper classification models

## Data Processing & Storage

### Database & Storage Strategy

#### File Storage Format
- **Primary:** Apache Parquet (columnar format, GPU-friendly with cuDF)
- **Why Parquet:**
  - Columnar storage enables reading only needed fields (not entire JSON)
  - Excellent compression (5-10x smaller than JSON)
  - Native cuDF support for fast GPU loading
  - Supports complex nested data (citation lists, author lists)
- **Partitioning Strategy:** Partition by field and year for efficient filtering
  - `/data/papers/field=Biology/year=2020/*.parquet`
  - Enables loading only relevant subsets (e.g., only Physics papers from 2018-2020)
- **Schema:**
```python
{
    'paper_id': str,
    'title': str,
    'abstract': str,
    'year': int,
    'field': str,
    'authors': list[str],
    'cited_papers': list[str],  # IDs of papers this paper cites
    'ml_techniques': list[str],  # ['transformer', 'deep learning']
    'reproducibility_score': float,
    'code_url': str,
    'pagerank_score': float
}
```

#### Vector Database (Semantic Search)
- **Option 1 (Recommended):** FAISS with GPU support
  - GPU-accelerated similarity search for finding similar papers
  - Supports 768-dim embeddings (Sentence Transformers)
  - Integration: Use cuDF for data prep, transfer to FAISS GPU index
- **Option 2:** Chroma with GPU backend
  - Simpler API, built-in embedding generation
  - May be slower than FAISS for large-scale searches
- **Use Case:** "Find papers similar to this AlphaFold paper" for discovery journey tracing
- **Embedding Model:** sentence-transformers/allenai-specter (scientific paper embeddings)

#### Graph Storage
- **Primary:** RAPIDS cuGraph in-memory representation
  - Graph stored as edge list in cuDF DataFrame
  - Converted to cuGraph Graph object for analytics
  - Persist as Parquet for reloading
- **Format:** Edge list with source, target, edge attributes
```python
edges_df = cudf.DataFrame({
    'source': [paper_id1, paper_id2, ...],
    'target': [cited_paper_id1, cited_paper_id2, ...],
    'year': [2020, 2021, ...]
})
```
- **Temporal Snapshots:** Separate graphs for each year (2016, 2017, ..., 2024) stored as separate Parquet files

#### Caching Strategy
- **In-Memory Cache:** RAPIDS GPU memory pools for frequently accessed subgraphs
- **File Cache:** Cache processed Parquet files to avoid re-parsing JSON
- **Query Cache:** Cache PageRank results, community detection outputs

### ETL Pipeline Architecture

#### Data Ingestion (Input: Compressed S2ORC JSON)
1. **Discover Files:** Scan dataset directory structure (`Biology,2020-2020/train/*.json.gz`)
2. **Parallel Load:** Use cuDF `read_json` with compression='gzip', process multiple files in parallel with Dask
3. **Schema Validation:** Ensure required fields present (id, text, year, metadata)
4. **Error Handling:** Log corrupted files, skip and continue

#### Data Transformation (cuDF Operations)
1. **Parse Nested Fields:** Extract `metadata.year`, `metadata.s2fieldsofstudy` from nested JSON
2. **Text Processing:** Extract keywords from abstract/title for ML technique detection
3. **Citation Extraction:** Parse citation IDs from text or metadata
4. **Reproducibility Signals:** Extract GitHub URLs, dataset mentions using regex
5. **ML Technique Tagging:** Keyword matching + NIM-based LLM classification

#### Data Storage (Output: Parquet + Graph)
1. **Write Parquet:** Partitioned by field and year, compressed with snappy
2. **Build Edge List:** Create citation edges DataFrame (source, target, year)
3. **Validate Graph:** Check for orphan nodes, invalid citations

#### Parallel Processing with Dask
- **Dask + RAPIDS:** Distribute cuDF operations across multiple GPU workers (if available)
- **Single GPU Mode:** Process data in batches to fit in memory
- **Progress Monitoring:** tqdm progress bars, ETA estimates

## Machine Learning & AI

### ML/AI Frameworks

#### Deep Learning (If Training Custom Models)
- **Primary:** PyTorch 2.0+ with CUDA support
- **Use Case:** Train custom paper classifier or embedding model (stretch goal)
- **Optimization:** torch.compile() for faster training, mixed precision (fp16)

#### Sentence Transformers (Paper Embeddings)
- **Model:** `allenai-specter` (scientific paper embeddings, pre-trained on S2ORC)
- **Use Case:** Generate embeddings for semantic similarity search
- **GPU Acceleration:** Run on CUDA for faster batch encoding
- **Integration:** Encode abstracts to 768-dim vectors, store in FAISS index

#### LangChain / LlamaIndex (LLM Orchestration)
- **Use Case:** Build RAG pipeline for insight generation
- **Integration:** Use local NIM as LLM backend (not OpenAI API)
- **Workflow:**
  1. Query: "What are the top insights about ML in neuroscience?"
  2. Retrieve: Use FAISS to find relevant papers
  3. Generate: Use NIM-based LLM to synthesize findings

### ML Techniques & Algorithms

#### Classification (ML Adoption Detection)
- **Algorithm:** cuML Random Forest or XGBoost (GPU)
- **Features:**
  - Keyword counts: "deep learning", "neural network", "transformer"
  - Citation patterns: % of citations to ML methodology papers
  - Field metadata: Computer Science vs Biology
  - Compute mentions: "GPU", "TPU", "supercomputer"
- **Labels:** ML methodology, domain science, hybrid
- **Training:** Use manually labeled subset, validate on held-out set

#### Clustering (Research Community Detection)
- **Algorithm:** cuML HDBSCAN for hierarchical clustering
- **Features:** Paper embeddings (SPECTER), citation patterns
- **Use Case:** Identify sub-fields within disciplines (drug discovery → antibody design, small molecule design)

#### Time Series Analysis (Adoption Curves)
- **Algorithm:** Logistic regression for S-curve fitting
- **Use Case:** Model ML technique adoption over time
- **Library:** SciPy `curve_fit` for logistic growth model

#### Graph Algorithms (Citation Network)
- **PageRank:** Paper influence scoring (iterative algorithm, converges in <10 iterations on DGX)
- **Louvain:** Community detection (research clusters)
- **Betweenness Centrality:** Identify bridge papers
- **Shortest Path:** Discovery journey tracing

## Visualization & Frontend

### Web Dashboard Framework

#### Option 1: Plotly Dash (RECOMMENDED)
- **Pros:**
  - Rich interactive charts (Plotly.js with WebGL backend)
  - Better for complex interactions (callbacks, multi-page apps)
  - Professional appearance
- **Cons:** Steeper learning curve than Streamlit
- **Use Case:** Multi-page dashboard with advanced filtering and interactions

#### Option 2: Streamlit
- **Pros:** Rapid prototyping, simple API, easy deployment
- **Cons:** Less flexible for complex interactions
- **Use Case:** Quick prototype or single-page dashboard

**Decision:** Use Plotly Dash for hackathon (better demo appeal, judges appreciate sophistication)

### Visualization Libraries

#### Plotly (Primary Charting Library)
- **Interactive Charts:** Hover tooltips, zoom, pan, export to PNG/SVG
- **Chart Types:**
  - **Line Charts:** S-curve adoption over time
  - **Scatter Plots:** Citation rate vs reproducibility (bubble detection)
  - **Heatmaps:** Technique × field adoption velocity
  - **Bar Charts:** Speedup factors by discipline
  - **Network Graphs:** Citation flow visualization (force-directed layout)
- **Performance:** WebGL backend for 10K+ points without lag
- **Animation:** Temporal animation with time slider

#### NetworkX + Plotly (Citation Network Visualization)
- **NetworkX:** Graph layout algorithms (spring layout, hierarchical layout)
- **Plotly:** Render layout as interactive 3D scatter plot
- **Workflow:**
  1. Subsample graph (10K nodes for visualization, full 20M for analytics)
  2. Compute layout with NetworkX on CPU (GPU layout not needed for subset)
  3. Render with Plotly WebGL backend
- **Interactive Features:**
  - Hover: show paper title, year, citations
  - Click: highlight citation paths
  - Filter: by field, year, technique

#### Matplotlib / Seaborn (Static Plots for Reports)
- **Use Case:** Publication-quality figures for insight report
- **Chart Types:** Box plots, violin plots, distribution histograms
- **Export:** High-DPI PNG/PDF for presentations

### Dashboard Architecture

#### Multi-Page Layout
1. **Home:** Overview metrics, key insights summary
2. **Adoption Dynamics:** S-curves, heatmaps, temporal animations
3. **Attribution Analysis:** Attribution scores, field comparisons
4. **Citation Network:** Interactive graph visualization
5. **Reproducibility:** Correlation charts, bubble warnings
6. **Case Studies:** Deep dives (AlphaFold, COVID drug discovery)

#### Performance Optimization
- **Server-Side Rendering:** Pre-compute aggregations, cache results
- **GPU-Accelerated Queries:** Use cuDF for dashboard data queries
- **Lazy Loading:** Load visualizations only when tab is opened
- **Caching:** Cache frequently accessed views (home page, top papers)

#### User Interactions
- **Global Filters:** Year range slider, field multi-select, technique checkboxes
- **Search:** Paper title/author search (use FAISS semantic search)
- **Export:** Download charts as SVG/PDF, export data as CSV
- **Responsive Design:** Works on desktop (1920x1080), tablet (1024x768)

## Testing & Quality

### Test Framework
- **Unit Testing:** pytest for component testing
- **Test Coverage:** Focus on critical pipeline stages (ETL, graph construction, scoring algorithms)
- **Test Data:** Small subset of papers (100-1000) for fast test execution
- **Fixtures:** Pre-built test graphs, sample papers with known properties
- **Example Tests:**
  - ETL: Verify 100 papers load correctly, all fields present
  - Graph: Verify PageRank scores sum to 1.0, no NaN values
  - Attribution: Verify score range [0, 100], confidence intervals valid

### Data Validation
- **Great Expectations (Optional):** Data quality checks on Parquet files
- **Custom Validators:**
  - Year range check: 2016 <= year <= 2024
  - Citation validity: All cited papers exist in dataset
  - Field consistency: Fields match expected values
  - Reproducibility scores: Range [0, 1]

### Code Quality Tools
- **Linting:** ruff (fast, modern Python linter)
  - Run: `ruff check src/`
  - Fix: `ruff check src/ --fix`
- **Formatting:** black (automatic code formatter)
  - Run: `black src/`
  - Config: Max line length 100 characters
- **Type Checking:** mypy (static type analysis)
  - Run: `mypy src/`
  - Config: Strict mode, ignore missing imports for RAPIDS (no type stubs)
- **Pre-Commit Hooks:** Run ruff + black before each commit

### Documentation Standards
- **Docstrings:** Google style
```python
def calculate_attribution_score(paper_id: str, graph: cugraph.Graph) -> float:
    """Calculate ML attribution score for a paper.
    
    Args:
        paper_id: Unique paper identifier
        graph: Citation network graph
    
    Returns:
        Attribution score in range [0, 100]
    
    Raises:
        ValueError: If paper_id not found in graph
    """
```
- **Type Hints:** All function signatures have type hints
- **README:** Setup instructions, usage examples, architecture overview

## Deployment & Infrastructure

### Deployment Model
- **Target:** Local deployment on NVIDIA DGX Spark (no cloud hosting)
- **Access:** Dashboard runs on localhost:8050, accessible via browser on DGX system
- **Demo:** Screen sharing or HDMI output for hackathon presentation

### Containerization (Optional for Reproducibility)
- **Docker:** Container with RAPIDS + dependencies
- **NVIDIA Container Toolkit:** Enable GPU access in container
- **Dockerfile:**
```dockerfile
FROM nvcr.io/nvidia/rapidsai/rapidsai:24.10-cuda12.0-runtime-ubuntu22.04-py3.10
COPY requirements.txt /app/
RUN pip install -r /app/requirements.txt
COPY src/ /app/src/
WORKDIR /app
CMD ["python", "src/dashboard.py"]
```
- **Build & Run:**
```bash
docker build -t ml-observatory .
docker run --gpus all -p 8050:8050 ml-observatory
```

### Dependency Management
- **conda environment.yml:**
```yaml
name: ml-observatory
channels:
  - rapidsai
  - conda-forge
  - nvidia
dependencies:
  - python=3.10
  - rapids=24.10
  - cudatoolkit=12.0
  - pip
  - pip:
    - plotly
    - dash
    - sentence-transformers
    - langchain
    - faiss-gpu
```
- **pip requirements.txt:**
```txt
plotly>=5.18.0
dash>=2.14.0
sentence-transformers>=2.2.2
langchain>=0.1.0
faiss-gpu>=1.7.2
pandas  # For compatibility, mostly using cuDF
torch>=2.0.0
transformers>=4.35.0
```

### Monitoring & Logging

#### Logging Strategy
- **Python logging module:** Structured logs with timestamps
- **Log Levels:**
  - INFO: Pipeline progress, stage completion
  - WARNING: Missing data, skipped papers
  - ERROR: Parsing failures, graph construction errors
- **Log File:** `logs/pipeline_YYYYMMDD_HHMMSS.log`
- **Example:**
```python
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Processing {len(papers)} papers")
```

#### Performance Profiling
- **NVIDIA Nsight Systems:** Detailed GPU profiling
  - Run: `nsys profile python src/pipeline.py`
  - Visualize: Open .qdrep file in Nsight Systems GUI
  - Identify: GPU utilization, memory transfers, kernel launches
- **NVIDIA Nsight Compute:** Kernel-level profiling (if needed)
- **RAPIDS Memory Profiler:** Track GPU memory usage
  - Use: `cudf.utils.memory_profiler` for memory snapshots

#### GPU Monitoring
- **nvidia-smi:** Real-time GPU usage
  - Run: `watch -n 1 nvidia-smi` (refresh every second)
  - Monitor: GPU utilization %, memory usage, temperature
- **Integration:** Poll nvidia-smi in pipeline, log GPU metrics
```python
import subprocess
result = subprocess.run(['nvidia-smi', '--query-gpu=memory.used', '--format=csv,noheader'], 
                       capture_output=True, text=True)
memory_used = result.stdout.strip()
logger.info(f"GPU memory: {memory_used}")
```

#### Pipeline Monitoring
- **tqdm Progress Bars:** Visual progress tracking
```python
from tqdm import tqdm
for file in tqdm(files, desc="Loading papers"):
    process_file(file)
```
- **Stage Timing:** Measure time for each pipeline stage
```python
import time
start = time.time()
load_papers()
logger.info(f"Load papers: {time.time() - start:.2f}s")
```
- **ETA Estimates:** Calculate remaining time based on current progress

## Key Python Dependencies

### NVIDIA RAPIDS Ecosystem
```
rapids=24.10              # GPU-accelerated data science
cudf                      # GPU DataFrames
cuml                      # GPU ML algorithms
cugraph                   # GPU graph analytics
```

### Machine Learning & NLP
```
torch>=2.0.0              # Deep learning (with CUDA)
transformers>=4.35.0      # Hugging Face models
sentence-transformers>=2.2.2  # Paper embeddings
langchain>=0.1.0          # LLM orchestration
llama-index>=0.9.0        # RAG framework (optional)
faiss-gpu>=1.7.2          # Vector similarity search
```

### Data Processing
```
pandas                    # For compatibility (mostly using cuDF)
numpy                     # Numerical operations
pyarrow                   # Parquet file format
dask                      # Distributed computing (optional)
```

### Visualization
```
plotly>=5.18.0            # Interactive charts
dash>=2.14.0              # Web dashboard
matplotlib>=3.7.0         # Static plots
seaborn>=0.12.0           # Statistical visualizations
networkx>=3.1             # Graph visualization layouts
```

### Utilities
```
pytest>=7.4.0             # Unit testing
ruff>=0.1.0               # Fast Python linter
black>=23.0.0             # Code formatter
mypy>=1.5.0               # Type checking
pydantic>=2.0.0           # Data validation
tqdm>=4.66.0              # Progress bars
pyyaml>=6.0               # Config file parsing
```

## Performance Targets & Benchmarks

### Core Performance Goals

#### Data Processing (cuDF vs pandas)
- **Target:** 5-10x faster than pandas
- **Benchmark:**
  - Load 81K papers: <10 minutes (cuDF) vs 60+ minutes (pandas)
  - Parse compressed JSON: 5x faster with GPU decompression
  - Text column operations: 10x faster with cuDF string functions

#### Graph Analytics (cuGraph vs NetworkX)
- **Target:** 50-100x faster than NetworkX on large graphs
- **Benchmarks:**
  - PageRank on 81K nodes: <10 seconds (cuGraph) vs 5 minutes (NetworkX)
  - PageRank on 20M nodes: <30 seconds (cuGraph) vs 45+ minutes (NetworkX)
  - Community detection (Louvain) on 20M nodes: <5 minutes (cuGraph) vs hours (NetworkX)
  - Shortest path queries: <1 second (cuGraph) vs 10+ seconds (NetworkX)

#### End-to-End Pipeline
- **Validation Set (81K papers):** <30 minutes total
  - Data loading: 10 minutes
  - Graph construction: 5 minutes
  - Analytics (PageRank, attribution): 10 minutes
  - Insight generation: 5 minutes
- **Production Set (20M papers):** <4 hours total
  - Data loading: 90 minutes
  - Graph construction: 60 minutes
  - Analytics: 45 minutes
  - Insight generation: 45 minutes

#### Dashboard Responsiveness
- **Target:** <5 seconds for all queries on 81K dataset
- **Interactions:**
  - Load S-curve chart: <2 seconds
  - Filter by field/year: <3 seconds
  - Citation network query (3-hop): <5 seconds
  - Search papers: <2 seconds (FAISS semantic search)

### Memory Efficiency

#### GPU Memory Utilization
- **20M Paper Dataset:**
  - Citation graph (adjacency list): 50-60GB
  - Paper embeddings (768-dim): 15-20GB
  - Metadata (in GPU): 8-10GB
  - Total: 75-90GB (fits comfortably in 128GB DGX Spark)
- **81K Validation Set:**
  - Citation graph: 150-200MB
  - Paper embeddings: 50MB
  - Metadata: 20MB
  - Total: <300MB (fits easily, leaves room for other operations)

#### Memory Optimization Techniques
- **RAPIDS Memory Pools:** Reuse GPU memory allocations
- **Sparse Matrix Storage:** CSR/CSC format for citation graph
- **Batch Processing:** Process papers in chunks if needed
- **Garbage Collection:** Explicit memory release after each stage

## Competition Scoring Justification

### Technical Execution (30 Points)
- **Completeness:** Full pipeline from ingestion → processing → analytics → visualization → insights
- **Engineering Depth:** Multi-stage GPU-accelerated system (not simple API wrapper)
  - cuDF ETL pipeline
  - cuGraph citation network analytics
  - cuML classification and clustering
  - NIM local inference
  - Interactive Dash dashboard

### NVIDIA Ecosystem (30 Points) - KEY DIFFERENTIATOR
- **RAPIDS Usage:**
  - cuDF: All data processing (JSON parsing, transformation, filtering)
  - cuGraph: Citation network analysis (PageRank, community detection)
  - cuML: Paper classification, clustering, dimensionality reduction
- **NIMs Usage:**
  - Local LLM inference for paper classification and insight generation
  - NO cloud APIs (GPT-4 = 0 points)
- **DGX Spark Justification:**
  - **128GB Unified Memory:** "Citation graph of 20M papers with 200M edges requires ~60GB GPU memory for PageRank. DGX Spark's 128GB unified memory enables real-time graph queries impossible on consumer GPUs (24GB max) or cloud graph APIs."
  - **Performance:** "cuGraph PageRank on 20M papers completes in 30 seconds vs 45+ minutes on CPU NetworkX—a 90x speedup enabling interactive exploration."
  - **Local Processing:** "Running NIM-based LLMs locally avoids cloud API costs ($thousands for 20M papers) and ensures complete data privacy for sensitive research metrics."

### Value & Impact (20 Points)
- **Non-Obvious Insights:**
  - "Materials science adopts graph neural networks 3x faster than neuroscience, likely due to computational chemistry culture"
  - "Deep RL papers show 67% higher citations but 30% lower code availability—potential bubble warning"
  - "Transformers achieved 50% NLP adoption by 2020 but only 15% biology adoption by 2024—domain-specific barriers"
- **Usability:**
  - Funding directors: Use dashboard to decide ML investment priorities (which fields/techniques deliver ROI)
  - Scientists: Identify proven ML techniques in their domain before committing lab resources
  - Policymakers: Evidence-based recommendations for national AI research strategy

### Frontier Factor (20 Points)
- **Creativity:**
  - Novel combination: Citation network analysis + temporal evolution + reproducibility signals + discovery journey tracing
  - Multi-dimensional impact: Attribution + acceleration + efficiency + quality trade-offs (not just citation counts)
- **Performance:**
  - Optimized GPU pipeline: 10-100x faster than CPU alternatives
  - Real-time graph queries: Interactive exploration impossible with cloud APIs
  - Scalable: System handles 20M papers without code changes (only config)

**Total: 100 Points**

## Success Criteria Summary

✅ **Must Achieve for Competition Win:**
1. Complete ETL → Analytics → Visualization pipeline working on DGX Spark
2. Heavy RAPIDS usage (cuDF, cuGraph, cuML) with documented speedups
3. Local NIM inference (no cloud APIs)
4. Non-obvious, actionable insights about ML's impact on science
5. Interactive dashboard demonstrating real-time graph queries
6. Clear 10-100x performance advantage over CPU/cloud (documented with benchmarks)
7. DGX Spark justification writeup explaining why 128GB unified memory is essential

🎯 **Competitive Advantages:**
- Multi-dimensional impact analysis (attribution, acceleration, reproducibility)
- Discovery journey tracing (ML method → breakthrough → real-world impact)
- Citation bubble detection (quality signals)
- Cross-disciplinary comparisons (which fields benefit most)
- Temporal evolution (8 years of data, 2016-2024)
