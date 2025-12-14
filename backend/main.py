"""
FastAPI backend for research paper dataset Q&A using Ollama.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json
from pathlib import Path
from typing import Optional, List
import PyPDF2
import io
import re
from datetime import datetime, timedelta

app = FastAPI(title="Research Paper Dataset API")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load dataset at startup
DATASET_PATH = Path(__file__).parent.parent / "data" / "validation_metrics_summary.json"
dataset = None


@app.on_event("startup")
async def load_dataset():
    """Load the validation metrics dataset."""
    global dataset
    try:
        with open(DATASET_PATH, "r") as f:
            dataset = json.load(f)
        print("✓ Dataset loaded successfully")
    except Exception as e:
        print(f"✗ Error loading dataset: {e}")
        dataset = None


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[list] = []


class ChatResponse(BaseModel):
    response: str
    error: Optional[str] = None


def construct_prompt(user_query: str, dataset_data: dict) -> str:
    """
    Construct a prompt for Ollama that includes relevant dataset context.
    Intelligently detects which field(s) the query is about and prioritizes that data.
    """
    # Extract key information from the dataset
    metadata = dataset_data.get("metadata", {})
    aggregate = dataset_data.get("aggregate_metrics", {})
    fields = dataset_data.get("field_analyses", {})

    # Detect which field the user is asking about
    query_lower = user_query.lower()
    mentioned_fields = []
    field_mapping = {
        "biology": "Biology",
        "computer science": "ComputerScience",
        "cs": "ComputerScience",
        "physics": "Physics",
        "psychology": "Psychology",
        "medicine": "Medicine",
        "engineering": "Engineering",
        "mathematics": "Mathematics",
        "math": "Mathematics",
        "economics": "Economics",
        "business": "Business",
        "environmental science": "EnvironmentalScience",
        "materials science": "MaterialsScience",
        "agricultural": "AgriculturalAndFoodSciences",
        "agriculture": "AgriculturalAndFoodSciences",
    }

    for keyword, field_name in field_mapping.items():
        if keyword in query_lower and field_name in fields:
            mentioned_fields.append(field_name)

    # Build a quick reference table for all fields
    quick_reference = []
    for field_name, field_data in fields.items():
        ml_impact = field_data.get("ml_impact", {})
        reproducibility = field_data.get("reproducibility", {})
        total_papers = ml_impact.get('total_papers', 0)
        ml_rate = ml_impact.get('ml_adoption_rate', 0)
        ml_papers = int(total_papers * ml_rate / 100)

        quick_reference.append(
            f"  • {field_name}: {total_papers} papers, {ml_papers} with ML ({ml_rate}%), "
            f"{reproducibility.get('papers_with_code', 0)} with code"
        )

    # Build detailed data for mentioned fields or all fields if none mentioned
    detailed_fields = mentioned_fields if mentioned_fields else list(fields.keys())

    detailed_data = []
    for field_name in detailed_fields:
        if field_name not in fields:
            continue

        field_data = fields[field_name]
        ml_impact = field_data.get("ml_impact", {})
        reproducibility = field_data.get("reproducibility", {})
        temporal = field_data.get("temporal", {})
        methodology = field_data.get("methodology", {})

        total_papers = ml_impact.get('total_papers', 0)
        ml_rate = ml_impact.get('ml_adoption_rate', 0)
        ml_papers = int(total_papers * ml_rate / 100)

        detail = f"""
{field_name}:
  Total Papers: {total_papers}
  ML/AI Papers: {ml_papers} papers ({ml_rate}% adoption rate)
  ML Distribution:
{json.dumps(ml_impact.get('ml_distribution', {}), indent=4)}

  Code Availability: {reproducibility.get('code_availability_rate', 0)}%
  Papers with Code: {reproducibility.get('papers_with_code', 0)}

  Statistical Methods Usage: {methodology.get('statistical_methods_usage_rate', 0)}%
  Year Range: {temporal.get('year_range', 'N/A')}"""

        detailed_data.append(detail)

    dataset_summary = f"""You are an expert research data analyst. Answer questions about research paper statistics with precision and accuracy.

DATASET OVERVIEW:
• Total Papers: {metadata.get('total_papers', 'N/A')}
• Fields Analyzed: {metadata.get('total_fields', 'N/A')}
• Overall ML Adoption: {aggregate.get('aggregate_ml_adoption_rate', 'N/A')}%
• Overall Code Availability: {aggregate.get('aggregate_code_availability_rate', 'N/A')}%

QUICK REFERENCE - ALL FIELDS:
{chr(10).join(quick_reference)}

DETAILED DATA FOR RELEVANT FIELD(S):
{chr(10).join(detailed_data)}

USER QUESTION: {user_query}

CRITICAL INSTRUCTIONS:
1. The data above is AUTHORITATIVE - Biology and all other fields ARE present in the dataset
2. Look at the QUICK REFERENCE or DETAILED DATA sections - the field data is RIGHT THERE
3. When asked about ML/AI papers, use the "ML/AI Papers" number directly
4. Be specific with numbers - cite exactly what you see in the data
5. DO NOT say a field doesn't exist - it's in the data above
6. Answer concisely but accurately

Now answer the question using ONLY the data provided above:"""

    return dataset_summary


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle chat requests and query Ollama with dataset context.
    """
    if dataset is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    try:
        # Construct prompt with dataset context
        prompt = construct_prompt(request.message, dataset)

        # Call Ollama API
        ollama_response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False,  # Get full response at once
            },
            timeout=60,  # 60 second timeout
        )

        if ollama_response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Ollama API error: {ollama_response.text}"
            )

        # Extract response from Ollama
        ollama_data = ollama_response.json()
        response_text = ollama_data.get("response", "")

        return ChatResponse(response=response_text)

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Request to Ollama timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama server. Make sure it's running at http://127.0.0.1:11434"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "dataset_loaded": dataset is not None,
        "ollama_reachable": check_ollama_connection()
    }


def check_ollama_connection() -> bool:
    """Check if Ollama server is reachable."""
    try:
        response = requests.get("http://127.0.0.1:11434/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False


def extract_text_from_pdf(pdf_file: bytes) -> str:
    """Extract text content from a PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting PDF text: {str(e)}")


def extract_paper_metadata(text: str) -> dict:
    """
    Extract basic metadata from the paper text.
    This is a simple heuristic-based extraction.
    """
    lines = text.split('\n')[:50]  # Check first 50 lines for metadata

    metadata = {
        "title": "",
        "abstract": "",
        "year": "",
    }

    # Simple heuristic: title is usually one of the first few non-empty lines
    for line in lines[:10]:
        if len(line.strip()) > 10 and not line.strip().isdigit():
            metadata["title"] = line.strip()
            break

    # Look for abstract
    abstract_start = -1
    for i, line in enumerate(lines):
        if re.search(r'\babstract\b', line, re.IGNORECASE):
            abstract_start = i
            break

    if abstract_start >= 0:
        abstract_lines = []
        for line in lines[abstract_start:abstract_start + 20]:
            if line.strip() and not re.search(r'\b(introduction|keywords)\b', line, re.IGNORECASE):
                abstract_lines.append(line.strip())
            elif re.search(r'\b(introduction|keywords)\b', line, re.IGNORECASE):
                break
        metadata["abstract"] = " ".join(abstract_lines)

    # Look for year (4 consecutive digits, typically 19xx or 20xx)
    year_match = re.search(r'\b(19|20)\d{2}\b', text[:5000])
    if year_match:
        metadata["year"] = year_match.group()

    return metadata


def construct_paper_analysis_prompt(paper_text: str, paper_metadata: dict, dataset_data: dict) -> str:
    """
    Construct a specialized prompt for analyzing an uploaded research paper
    and comparing it to the dataset.
    """
    metadata = dataset_data.get("metadata", {})
    aggregate = dataset_data.get("aggregate_metrics", {})
    fields = dataset_data.get("field_analyses", {})

    # Build a concise summary of all fields
    field_summaries = []
    for field_name, field_data in fields.items():
        ml_impact = field_data.get("ml_impact", {})
        total_papers = ml_impact.get('total_papers', 0)
        ml_rate = ml_impact.get('ml_adoption_rate', 0)
        ml_papers = int(total_papers * ml_rate / 100)

        field_summaries.append(
            f"  • {field_name}: {ml_rate}% ML adoption ({ml_papers}/{total_papers} papers)"
        )

    # Truncate paper text to avoid token limits (use first ~8000 chars)
    truncated_text = paper_text[:8000]
    if len(paper_text) > 8000:
        truncated_text += "\n[... paper continues ...]"

    prompt = f"""You are an expert research analyst specializing in ML/AI impact assessment in academic research.

UPLOADED PAPER ANALYSIS TASK:
A user has uploaded their research paper. Your job is to:
1. Identify the paper's research field
2. Assess the ML/AI usage level in this paper
3. Compare it to the general trends in that field from our dataset
4. Provide insights about how this paper's ML usage compares to peers

DATASET CONTEXT (All Fields ML Adoption Rates):
{chr(10).join(field_summaries)}

Overall ML Adoption Across All Fields: {aggregate.get('aggregate_ml_adoption_rate', 'N/A')}%

PAPER CONTENT:
Title: {paper_metadata.get('title', 'Not detected')}
Year: {paper_metadata.get('year', 'Not detected')}

Full Text:
{truncated_text}

ANALYSIS INSTRUCTIONS:
1. **Identify the Field**: Determine which research field this paper belongs to (Biology, Computer Science, Physics, etc.)

2. **Assess ML Impact Level**: Classify the paper's ML usage as:
   - NONE: No ML/AI methods used
   - MINIMAL: ML mentioned but not central (e.g., using basic statistical software)
   - MODERATE: ML methods used for analysis but not the main focus
   - SUBSTANTIAL: ML is a significant part of the methodology
   - CORE: ML/AI is the central focus of the research

3. **Compare to Field Average**: Compare this paper's ML usage to the field's average from the dataset above

4. **Provide Insights**:
   - How does this paper compare to peers in the same field?
   - Is this paper ahead/behind the curve in ML adoption?
   - What ML techniques or tools are used (if any)?

OUTPUT FORMAT:
Provide a clear, structured analysis in this format:

📄 **Paper Overview**
- Field: [identified field]
- Estimated Year: [year if found]
- Topic Summary: [1-2 sentences about what the paper is about]

🤖 **ML/AI Impact Assessment**
- ML Usage Level: [NONE/MINIMAL/MODERATE/SUBSTANTIAL/CORE]
- ML Techniques Identified: [list techniques, or "None detected"]
- ML Tools/Frameworks Mentioned: [list if found, or "None mentioned"]

📊 **Comparison to Field Average**
- Your Field's Average ML Adoption: [X]%
- Your Paper's Position: [Above/Below/At average]
- Context: [2-3 sentences comparing to the field]

💡 **Key Insights**
[2-4 bullet points about:
- How this paper's ML usage compares to the field
- Whether this is typical/advanced/basic for the field
- Any notable aspects of the ML implementation
- Recommendations (if applicable)]

Now provide the analysis:"""

    return prompt


@app.post("/api/upload-paper", response_model=ChatResponse)
async def upload_paper(file: UploadFile = File(...)):
    """
    Upload a research paper PDF and get an automatic ML impact analysis.
    """
    if dataset is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Read the PDF file
        pdf_content = await file.read()

        # Extract text from PDF
        paper_text = extract_text_from_pdf(pdf_content)

        if not paper_text or len(paper_text) < 100:
            raise HTTPException(
                status_code=400,
                detail="Could not extract sufficient text from PDF. The file may be image-based or corrupted."
            )

        # Extract basic metadata
        paper_metadata = extract_paper_metadata(paper_text)

        # Construct analysis prompt
        prompt = construct_paper_analysis_prompt(paper_text, paper_metadata, dataset)

        # Call Ollama API
        ollama_response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3.1:8b",
                "prompt": prompt,
                "stream": False,
            },
            timeout=120,  # 2 minute timeout for paper analysis
        )

        if ollama_response.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Ollama API error: {ollama_response.text}"
            )

        # Extract response from Ollama
        ollama_data = ollama_response.json()
        response_text = ollama_data.get("response", "")

        return ChatResponse(response=response_text)

    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=504,
            detail="Analysis timed out. The paper might be too long."
        )
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Ollama server. Make sure it's running at http://127.0.0.1:11434"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing paper: {str(e)}")


@app.get("/api/dataset/summary")
async def get_dataset_summary():
    """Get a summary of the dataset."""
    if dataset is None:
        raise HTTPException(status_code=500, detail="Dataset not loaded")

    return {
        "metadata": dataset.get("metadata", {}),
        "aggregate_metrics": dataset.get("aggregate_metrics", {}),
        "available_fields": list(dataset.get("field_analyses", {}).keys())
    }


class PaperSearchResult(BaseModel):
    """Model for search results from Semantic Scholar."""
    paperId: str
    title: str
    authors: List[dict]
    year: Optional[int] = None
    abstract: Optional[str] = None
    citationCount: Optional[int] = 0
    url: Optional[str] = None
    venue: Optional[str] = None
    publicationDate: Optional[str] = None
    fieldsOfStudy: Optional[List[str]] = []
    influentialCitationCount: Optional[int] = 0
    isOpenAccess: Optional[bool] = False
    openAccessPdf: Optional[dict] = None


def map_field_to_dataset(paper_fields: List[str]) -> Optional[str]:
    """Map Semantic Scholar fields to our dataset fields."""
    field_mapping = {
        "Biology": ["Biology", "Molecular Biology", "Cell Biology", "Genetics"],
        "ComputerScience": ["Computer Science"],
        "Physics": ["Physics"],
        "Psychology": ["Psychology"],
        "Medicine": ["Medicine"],
        "Engineering": ["Engineering"],
        "Mathematics": ["Mathematics"],
        "Economics": ["Economics"],
        "Business": ["Business"],
        "EnvironmentalScience": ["Environmental Science", "Ecology", "Geography"],
        "MaterialsScience": ["Materials Science", "Chemistry"],
        "AgriculturalAndFoodSciences": ["Agricultural and Food Sciences"],
    }

    for dataset_field, ss_fields in field_mapping.items():
        for paper_field in paper_fields:
            if any(ss_field.lower() in paper_field.lower() for ss_field in ss_fields):
                return dataset_field

    return None


def analyze_paper_against_trends(paper: dict, field: Optional[str]) -> dict:
    """Analyze how a paper compares to dataset trends."""
    if not dataset or not field or field not in dataset.get("field_analyses", {}):
        return {
            "field": field or "Unknown",
            "ml_adoption_rate": None,
            "has_ml": False,
            "comparison": "No data available for this field",
            "prediction": None,
            "citation_percentile": "Unknown"
        }

    field_data = dataset["field_analyses"][field]
    ml_impact = field_data.get("ml_impact", {})

    # Simple heuristic: check if title/abstract mentions ML/AI keywords
    text = f"{paper.get('title', '')} {paper.get('abstract', '')}".lower()
    ml_keywords = ["machine learning", "deep learning", "neural network", "artificial intelligence",
                   "ai", "ml", "transformer", "reinforcement learning", "supervised learning"]

    has_ml = any(keyword in text for keyword in ml_keywords)

    ml_adoption = ml_impact.get("ml_adoption_rate", 0)
    citation_count = paper.get("citationCount", 0)
    year = paper.get("year", 0)

    # Predict potential impact
    prediction = "Average"
    if has_ml and ml_adoption > 50:
        if citation_count > 50 or year >= 2023:
            prediction = "High Impact"
        else:
            prediction = "Above Average"
    elif has_ml and ml_adoption < 30:
        prediction = "Pioneering"
    elif not has_ml and ml_adoption > 60:
        prediction = "Traditional Approach"

    comparison = f"This field has {ml_adoption:.1f}% ML adoption rate."
    if has_ml:
        comparison += f" This paper uses ML methods, placing it {'above' if ml_adoption < 50 else 'within'} the field average."
    else:
        comparison += f" This paper does not appear to use ML methods."

    return {
        "field": field,
        "ml_adoption_rate": ml_adoption,
        "has_ml": has_ml,
        "comparison": comparison,
        "prediction": prediction,
        "citation_percentile": "High" if citation_count > 100 else "Medium" if citation_count > 10 else "Low"
    }


@app.get("/api/search")
async def search_papers(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100),
    year: Optional[str] = Query(None, description="Filter by year (e.g., '2023' or '2020-2023')"),
    fields: Optional[str] = Query(None, description="Filter by fields of study (comma-separated)"),
    min_citations: Optional[int] = Query(None, ge=0),
    open_access: Optional[bool] = Query(None)
):
    """
    Search for papers using OpenAlex API (free, no key required) and analyze against our dataset trends.
    """
    try:
        # Build OpenAlex API query - completely free!
        filter_parts = []

        if year:
            if '-' in year:
                start, end = year.split('-')
                filter_parts.append(f"publication_year:{start}-{end}")
            else:
                filter_parts.append(f"publication_year:{year}")

        if min_citations:
            filter_parts.append(f"cited_by_count:>{min_citations}")

        if open_access:
            filter_parts.append("is_oa:true")

        # OpenAlex API endpoint
        params = {
            "search": q,
            "per-page": min(limit, 100),
            "mailto": "research@example.com"  # Polite pool for faster responses
        }

        if filter_parts:
            params["filter"] = ",".join(filter_parts)

        # Call OpenAlex API - free and open!
        response = requests.get(
            "https://api.openalex.org/works",
            params=params,
            timeout=30
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenAlex API error: {response.text}"
            )

        data = response.json()
        papers = data.get("results", [])

        # Analyze each paper against our trends
        results = []
        for paper in papers:
            if not paper:
                continue

            # Extract paper details from OpenAlex format
            title = paper.get("title", "")
            paper_id = paper.get("id", "").split("/")[-1] if paper.get("id") else ""

            # Get publication year
            pub_year = paper.get("publication_year")

            # Get abstract (OpenAlex uses inverted_abstract)
            abstract = ""
            inverted_abstract = paper.get("abstract_inverted_index", {})
            if inverted_abstract:
                # Reconstruct abstract from inverted index
                word_positions = []
                for word, positions in inverted_abstract.items():
                    for pos in positions:
                        word_positions.append((pos, word))
                word_positions.sort()
                abstract = " ".join([word for _, word in word_positions])

            # Get authors
            authorships = paper.get("authorships", [])
            authors = [a.get("author", {}).get("display_name", "Unknown") for a in authorships]

            # Get citations
            citation_count = paper.get("cited_by_count", 0)

            # Get concepts (fields of study)
            concepts = paper.get("concepts", [])
            paper_fields = [c.get("display_name", "") for c in concepts if c.get("level") <= 1]

            # Map fields to our dataset
            mapped_field = map_field_to_dataset(paper_fields)

            # Analyze against trends
            trend_analysis = analyze_paper_against_trends({
                "title": title,
                "abstract": abstract,
                "citationCount": citation_count,
                "year": pub_year
            }, mapped_field)

            # Get venue/journal
            venue = ""
            primary_location = paper.get("primary_location", {})
            if primary_location:
                source = primary_location.get("source", {})
                venue = source.get("display_name", "") if source else ""

            # Get URL
            paper_url = paper.get("doi", "")
            if paper_url and not paper_url.startswith("http"):
                paper_url = f"https://doi.org/{paper_url}"
            if not paper_url:
                paper_url = paper.get("id", "")

            # Check if open access
            is_oa = paper.get("open_access", {}).get("is_oa", False)
            oa_url = paper.get("open_access", {}).get("oa_url")

            results.append({
                "id": paper_id,
                "title": title,
                "authors": authors[:10],  # Limit to first 10 authors
                "year": pub_year,
                "abstract": abstract[:500] if abstract else "",  # Limit abstract length
                "citations": citation_count,
                "influentialCitations": citation_count,  # OpenAlex doesn't have this metric
                "url": paper_url,
                "venue": venue,
                "publicationDate": str(pub_year) if pub_year else "",
                "fieldsOfStudy": paper_fields,
                "isOpenAccess": is_oa,
                "openAccessPdf": {"url": oa_url} if oa_url else None,
                "trendAnalysis": trend_analysis
            })

        return {
            "total": data.get("meta", {}).get("count", 0),
            "papers": results,
            "query": q
        }

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Search request timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to OpenAlex API. Please check your internet connection."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@app.get("/api/trending")
async def get_trending_papers(
    field: Optional[str] = Query(None, description="Filter by field"),
    days: int = Query(30, ge=1, le=365, description="Papers from last N days"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get trending/recent papers with high citation velocity using OpenAlex (free API).
    """
    try:
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # Build filter for recent high-impact papers
        filter_parts = [
            f"publication_year:{start_date.year}-{end_date.year}",
            "cited_by_count:>10"  # At least 10 citations
        ]

        # Build query
        query = "machine learning" if not field else field

        params = {
            "search": query,
            "filter": ",".join(filter_parts),
            "per-page": min(limit, 100),
            "sort": "cited_by_count:desc",
            "mailto": "research@example.com"
        }

        response = requests.get(
            "https://api.openalex.org/works",
            params=params,
            timeout=30
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenAlex API error: {response.text}"
            )

        data = response.json()
        papers = data.get("results", [])

        # Analyze and format results
        results = []
        for paper in papers:
            if not paper:
                continue

            # Extract paper details from OpenAlex format
            title = paper.get("title", "")
            paper_id = paper.get("id", "").split("/")[-1] if paper.get("id") else ""
            pub_year = paper.get("publication_year")

            # Get abstract
            abstract = ""
            inverted_abstract = paper.get("abstract_inverted_index", {})
            if inverted_abstract:
                word_positions = []
                for word, positions in inverted_abstract.items():
                    for pos in positions:
                        word_positions.append((pos, word))
                word_positions.sort()
                abstract = " ".join([word for _, word in word_positions])

            # Get authors
            authorships = paper.get("authorships", [])
            authors = [a.get("author", {}).get("display_name", "Unknown") for a in authorships]

            # Get citations
            citation_count = paper.get("cited_by_count", 0)

            # Get concepts (fields of study)
            concepts = paper.get("concepts", [])
            paper_fields = [c.get("display_name", "") for c in concepts if c.get("level") <= 1]
            mapped_field = map_field_to_dataset(paper_fields)

            # Analyze against trends
            trend_analysis = analyze_paper_against_trends({
                "title": title,
                "abstract": abstract,
                "citationCount": citation_count,
                "year": pub_year
            }, mapped_field)

            # Calculate citation velocity (citations per month since publication)
            citation_velocity = 0
            pub_date = paper.get("publication_date")
            if pub_date:
                try:
                    pub_datetime = datetime.strptime(pub_date, "%Y-%m-%d")
                    months_old = max(1, (datetime.now() - pub_datetime).days / 30)
                    citation_velocity = citation_count / months_old
                except:
                    pass

            # Get venue
            venue = ""
            primary_location = paper.get("primary_location", {})
            if primary_location:
                source = primary_location.get("source", {})
                venue = source.get("display_name", "") if source else ""

            # Get URL
            paper_url = paper.get("doi", "")
            if paper_url and not paper_url.startswith("http"):
                paper_url = f"https://doi.org/{paper_url}"
            if not paper_url:
                paper_url = paper.get("id", "")

            # Check if open access
            is_oa = paper.get("open_access", {}).get("is_oa", False)
            oa_url = paper.get("open_access", {}).get("oa_url")

            results.append({
                "id": paper_id,
                "title": title,
                "authors": authors[:10],
                "year": pub_year,
                "abstract": abstract[:500] if abstract else "",
                "citations": citation_count,
                "influentialCitations": citation_count,
                "citationVelocity": round(citation_velocity, 2),
                "url": paper_url,
                "venue": venue,
                "publicationDate": pub_date or (str(pub_year) if pub_year else ""),
                "fieldsOfStudy": paper_fields,
                "isOpenAccess": is_oa,
                "openAccessPdf": {"url": oa_url} if oa_url else None,
                "trendAnalysis": trend_analysis
            })

        # Sort by citation velocity
        results.sort(key=lambda x: x["citationVelocity"], reverse=True)

        return {
            "papers": results,
            "dateRange": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "field": field
        }

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Trending papers request timed out")
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to OpenAlex API. Please check your internet connection."
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching trending papers: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
