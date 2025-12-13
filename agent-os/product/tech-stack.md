# Tech Stack

## Hardware & Platform

### NVIDIA DGX Spark (REQUIRED for Competition)
- **Hardware:** NVIDIA DGX Spark with 128GB Unified Memory
- **Why Essential:** Enables processing 20M+ papers with citation graphs entirely in GPU memory; unified memory architecture allows seamless data transfer between CPU and GPU for complex analytics pipelines; required for competition scoring (30 points for NVIDIA ecosystem utilization)
- **Key Advantage:** 10-100x faster graph traversal and network analysis compared to CPU-only solutions

## Framework & Runtime

### Application Framework
- **Primary:** Python 3.10+ (scientific computing and ML ecosystem)
- **Package Manager:** pip + conda (conda for NVIDIA RAPIDS dependencies)
- **Environment Management:** conda environments for reproducibility

### NVIDIA Ecosystem (CRITICAL - 30 Points in Competition)

#### RAPIDS (GPU-Accelerated Data Science)
- **cuDF:** GPU-accelerated pandas-like dataframe operations for 81K-20M paper dataset processing
- **cuGraph:** GPU-accelerated graph analytics for citation network analysis (NetworkX-compatible API)
- **cuML:** GPU-accelerated machine learning for clustering, classification, and similarity analysis
- **Justification:** Processing 20M papers with citation networks requires GPU acceleration; cuGraph enables graph queries (PageRank, community detection, path analysis) 10-100x faster than CPU NetworkX

#### NIMs (NVIDIA Inference Microservices)
- **Use Case:** Deploy optimized LLM inference for paper content analysis, methodology extraction, and insight generation
- **Models:** Llama 3 NIM or similar for text understanding and classification
- **Justification:** Local inference on DGX Spark avoids cloud API costs and latency; NIM optimization provides maximum throughput for batch processing millions of papers

#### Additional NVIDIA Technologies (Optional Enhancement)
- **NeMo Models:** Potential use for domain-specific language understanding in scientific papers
- **cuOpt:** Could optimize research discovery pathways and citation flow analysis
- **TensorRT:** Optimize custom ML models for maximum inference performance

## Data Processing & Storage

### Database & Storage
- **Vector Database:** Chroma or FAISS (with GPU acceleration) for semantic search across 20M papers
- **Graph Database:** RAPIDS cuGraph in-memory graph representation for citation networks
- **Metadata Storage:** Parquet files (columnar format) for efficient GPU loading with cuDF
- **Caching:** In-memory caching with GPU memory pools for frequently accessed subgraphs

### Data Processing Pipeline
- **ETL Framework:** Custom Python pipeline using RAPIDS cuDF for parallel data transformation
- **Paper Parsing:** PyMuPDF or pdfplumber for PDF text extraction (if needed)
- **Citation Extraction:** Regular expressions + ML classifiers for citation parsing
- **Parallel Processing:** Dask with GPU support for distributed computation

## Machine Learning & AI

### ML/AI Frameworks
- **Deep Learning:** PyTorch with CUDA support for custom neural networks
- **GPU Acceleration:** All models must run with CUDA/cuDNN optimization
- **Vector Embeddings:** Sentence Transformers (optimized for GPU) for semantic paper similarity
- **LLM Framework:** LangChain or LlamaIndex for RAG pipelines using local NIMs (not cloud APIs)

### ML Techniques
- **Classification:** cuML Random Forest or XGBoost (GPU) for ML adoption detection
- **Clustering:** cuML HDBSCAN for identifying research communities and citation patterns
- **Embeddings:** GPU-accelerated sentence transformers for semantic paper analysis
- **Time Series:** Custom temporal analysis for adoption curves and acceleration metrics

## Graph & Network Analysis

### Citation Network Analysis
- **Primary:** RAPIDS cuGraph for GPU-accelerated graph algorithms
- **Algorithms:** PageRank (impact scoring), community detection (research clusters), shortest path (discovery journeys), centrality metrics (key papers)
- **Temporal Graphs:** Custom implementation for analyzing citation network evolution (2016-2024)
- **Justification:** NetworkX (CPU) cannot handle 20M node graphs efficiently; cuGraph enables interactive exploration

## Visualization & Frontend

### Interactive Dashboards
- **Framework:** Plotly Dash or Streamlit for web-based dashboards
- **Visualization Libraries:**
  - Plotly (interactive charts, 3D graphs, animations)
  - NetworkX + Plotly for citation network visualizations
  - Matplotlib/Seaborn for statistical plots
- **Performance:** Server-side rendering with GPU-accelerated data queries
- **Features:** Responsive design, real-time filtering, temporal animations, exportable visualizations

### Visualization Types
- **S-curves:** ML adoption over time by discipline
- **Network Graphs:** Citation flows with temporal animation
- **Heatmaps:** Cross-discipline ML technique adoption
- **Timeline Views:** Discovery journey mapping
- **Statistical Dashboards:** Reproducibility correlations and quality metrics

## Testing & Quality

### Test Framework
- **Unit Testing:** pytest for component testing
- **Integration Testing:** pytest with fixtures for pipeline testing
- **Performance Testing:** Custom benchmarks for GPU vs CPU comparison
- **Data Validation:** Great Expectations or custom validators for data quality

### Code Quality
- **Linting:** ruff (fast Python linter)
- **Formatting:** black (code formatter)
- **Type Checking:** mypy for static type analysis
- **Documentation:** docstrings with Google style

## Deployment & Infrastructure

### Deployment
- **Environment:** Local deployment on NVIDIA DGX Spark (no cloud hosting)
- **Containerization:** Docker with NVIDIA Container Toolkit (optional for reproducibility)
- **Dependency Management:** conda environment.yml + pip requirements.txt

### Monitoring & Logging
- **Logging:** Python logging module with structured output
- **Performance Profiling:** NVIDIA Nsight Systems for GPU profiling
- **Memory Monitoring:** nvidia-smi and RAPIDS memory profiler
- **Pipeline Monitoring:** Custom progress tracking for long-running analyses

## Key Dependencies (Python)

### NVIDIA RAPIDS Ecosystem
```
rapids=24.10
cudf
cuml
cugraph
```

### Machine Learning & NLP
```
torch>=2.0 (with CUDA)
transformers
sentence-transformers
langchain
llama-index
```

### Data Processing
```
pandas
numpy
pyarrow (for parquet)
dask (with GPU support)
```

### Visualization
```
plotly
dash or streamlit
matplotlib
seaborn
networkx (for visualization compatibility)
```

### Utilities
```
pytest
ruff
black
pydantic (data validation)
tqdm (progress bars)
```

## Performance Targets

### Benchmarks to Document (for Competition Scoring)
- **Graph Query Performance:** cuGraph vs NetworkX on citation network traversal
- **Data Processing:** cuDF vs pandas on 20M paper dataset
- **Memory Efficiency:** Unified memory utilization for large graph analytics
- **End-to-End Pipeline:** Time to process validation set (81K papers) and production set (20M papers)

### Success Metrics
- Process 81K validation papers in < 30 minutes
- Build complete citation graph in < 1 hour
- Interactive dashboard queries respond in < 5 seconds
- Scale to 20M papers without code changes (only configuration)
