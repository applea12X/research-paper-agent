'use client';

import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Filter, ExternalLink, Calendar, BookOpen, Sparkles } from 'lucide-react';

type TrendAnalysis = {
    field: string;
    ml_adoption_rate: number | null;
    has_ml: boolean;
    comparison: string;
    prediction: string;
    citation_percentile: string;
};

type Paper = {
    id: string;
    title: string;
    authors: string[];
    year: number | null;
    abstract: string;
    citations: number;
    influentialCitations: number;
    citationVelocity?: number;
    url: string;
    venue: string;
    publicationDate: string;
    fieldsOfStudy: string[];
    isOpenAccess: boolean;
    openAccessPdf?: any;
    trendAnalysis: TrendAnalysis;
};

type SearchFilters = {
    year: string;
    minCitations: string;
    openAccess: boolean;
    field: string;
};

const SearchPage = () => {
    const [activeTab, setActiveTab] = useState<'search' | 'trending'>('search');
    const [query, setQuery] = useState('');
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({
        year: '',
        minCitations: '',
        openAccess: false,
        field: '',
    });
    const [expandedPaper, setExpandedPaper] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysis, setAnalysis] = useState<string>('');

    useEffect(() => {
        if (activeTab === 'trending') {
            fetchTrendingPapers();
        }
    }, [activeTab]);

    const fetchPapers = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                q: query,
                limit: '20',
            });

            if (filters.year) params.append('year', filters.year);
            if (filters.minCitations) params.append('min_citations', filters.minCitations);
            if (filters.openAccess) params.append('open_access', 'true');
            if (filters.field) params.append('fields', filters.field);

            const response = await fetch(
                `http://localhost:8000/api/search?${params.toString()}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch papers' }));
                throw new Error(errorData.detail || 'Failed to fetch papers');
            }

            const data = await response.json();
            setPapers(data.papers || []);
        } catch (error) {
            console.error('Error fetching papers:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch papers. Please make sure the backend is running.');
            setPapers([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTrendingPapers = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                days: '30',
                limit: '20',
            });

            if (filters.field) params.append('field', filters.field);

            const response = await fetch(
                `http://localhost:8000/api/trending?${params.toString()}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch trending papers' }));
                throw new Error(errorData.detail || 'Failed to fetch trending papers');
            }

            const data = await response.json();
            setPapers(data.papers || []);
        } catch (error) {
            console.error('Error fetching trending papers:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch trending papers. Please make sure the backend is running.');
            setPapers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPapers();
    };

    const analyzePaper = async (paper: Paper) => {
        setSelectedPaper(paper);
        setAnalysisLoading(true);
        setAnalysis('');

        try {
            const message = `I found this paper in my search: "${paper.title}" by ${paper.authors.slice(0, 3).join(', ')} (${paper.year}).

Field: ${paper.trendAnalysis.field}
Citations: ${paper.citations}
Abstract: ${paper.abstract}

Can you analyze:
1. How does this paper's approach compare to the ML adoption trends in ${paper.trendAnalysis.field}?
2. Based on the field's metrics, what makes this paper significant or unique?
3. What does the citation count (${paper.citations}) tell us about its impact in this field?
4. How does this relate to the overall trends we've identified in the validation metrics?
5. What future directions or implications does this suggest for ${paper.trendAnalysis.field}?

Please provide a detailed analysis based on our dataset insights.`;

            const response = await fetch('http://localhost:8000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversation_history: []
                })
            });

            if (!response.ok) {
                throw new Error('Failed to analyze paper');
            }

            const data = await response.json();
            setAnalysis(data.response);
        } catch (error) {
            console.error('Error analyzing paper:', error);
            setAnalysis('Failed to analyze paper. Please make sure the backend and Ollama are running.');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedPaper(null);
        setAnalysis('');
    };

    const getPredictionColor = (prediction: string) => {
        switch (prediction) {
            case 'High Impact':
                return 'text-green-400 bg-green-500/10 border-green-500/30';
            case 'Pioneering':
                return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
            case 'Above Average':
                return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            case 'Traditional Approach':
                return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
            default:
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
        }
    };

    const getFieldColor = (field: string) => {
        const colors: Record<string, string> = {
            'ComputerScience': 'bg-blue-500/20 text-blue-300',
            'Biology': 'bg-green-500/20 text-green-300',
            'Physics': 'bg-purple-500/20 text-purple-300',
            'Medicine': 'bg-red-500/20 text-red-300',
            'Mathematics': 'bg-yellow-500/20 text-yellow-300',
            'Engineering': 'bg-orange-500/20 text-orange-300',
        };
        return colors[field] || 'bg-gray-500/20 text-gray-300';
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 pt-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Research Paper Discovery
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Search and analyze papers with AI-powered trend insights from our dataset
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`px-6 py-3 font-medium transition-all ${
                            activeTab === 'search'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            <span>Search Papers</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`px-6 py-3 font-medium transition-all ${
                            activeTab === 'trending'
                                ? 'text-blue-400 border-b-2 border-blue-400'
                                : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            <span>Trending Papers</span>
                        </div>
                    </button>
                </div>

                {/* Search Form */}
                {activeTab === 'search' && (
                    <form onSubmit={handleSearch} className="mb-8">
                        <div className="flex gap-3 mb-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search for papers, topics, or keywords..."
                                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`px-6 py-4 rounded-xl border transition-all ${
                                    showFilters
                                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                <Filter className="w-5 h-5" />
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {/* Filters */}
                        {showFilters && (
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Year Range</label>
                                    <input
                                        type="text"
                                        value={filters.year}
                                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                                        placeholder="e.g., 2020-2024"
                                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Min Citations</label>
                                    <input
                                        type="number"
                                        value={filters.minCitations}
                                        onChange={(e) => setFilters({ ...filters, minCitations: e.target.value })}
                                        placeholder="e.g., 10"
                                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Field</label>
                                    <select
                                        value={filters.field}
                                        onChange={(e) => setFilters({ ...filters, field: e.target.value })}
                                        className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    >
                                        <option value="">All Fields</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Biology">Biology</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Medicine">Medicine</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Mathematics">Mathematics</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filters.openAccess}
                                            onChange={(e) => setFilters({ ...filters, openAccess: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/10 bg-black/50 text-blue-500 focus:ring-blue-500/50"
                                        />
                                        <span className="text-sm text-gray-400">Open Access Only</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                                <span className="text-red-400 text-xs">!</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-red-300 font-medium mb-1">Error</p>
                                <p className="text-red-200 text-sm">{error}</p>
                                {error.includes('backend') && (
                                    <p className="text-red-200/70 text-xs mt-2">
                                        Make sure the backend server is running on http://localhost:8000
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="flex-shrink-0 text-red-400 hover:text-red-300"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                <div className="space-y-4">
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="text-gray-400">
                                    {activeTab === 'search' ? 'Searching papers...' : 'Loading trending papers...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {!loading && papers.length === 0 && activeTab === 'search' && (
                        <div className="text-center py-20">
                            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 text-lg">
                                Enter a search query to find research papers
                            </p>
                            <p className="text-gray-500 text-sm mt-2">
                                Try searching for topics like "machine learning", "climate modeling", or "drug discovery"
                            </p>
                        </div>
                    )}

                    {!loading && papers.map((paper) => (
                        <div
                            key={paper.id}
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group relative"
                            onClick={() => analyzePaper(paper)}
                        >
                            {/* Click to analyze hint */}
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                                    <Sparkles className="w-3 h-3" />
                                    <span>Click to analyze with AI</span>
                                </div>
                            </div>

                            {/* Paper Header */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex-1">
                                    <h3 className="text-xl font-semibold text-white mb-2 leading-tight">
                                        {paper.title}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {paper.year || 'N/A'}
                                        </span>
                                        {paper.venue && (
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="w-4 h-4" />
                                                {paper.venue}
                                            </span>
                                        )}
                                        <span>{paper.citations} citations</span>
                                        {paper.citationVelocity && (
                                            <span className="text-green-400">
                                                {paper.citationVelocity.toFixed(1)} cites/month
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <a
                                    href={paper.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <ExternalLink className="w-5 h-5 text-gray-400" />
                                </a>
                            </div>

                            {/* Authors */}
                            <p className="text-sm text-gray-400 mb-3">
                                <span className="font-medium">Authors:</span> {paper.authors.slice(0, 5).join(', ')}
                                {paper.authors.length > 5 && ` +${paper.authors.length - 5} more`}
                            </p>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {paper.trendAnalysis.field && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFieldColor(paper.trendAnalysis.field)}`}>
                                        {paper.trendAnalysis.field}
                                    </span>
                                )}
                                {paper.trendAnalysis.prediction && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPredictionColor(paper.trendAnalysis.prediction)}`}>
                                        <Sparkles className="w-3 h-3 inline mr-1" />
                                        {paper.trendAnalysis.prediction}
                                    </span>
                                )}
                                {paper.trendAnalysis.has_ml && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        ML/AI Methods
                                    </span>
                                )}
                                {paper.isOpenAccess && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                                        Open Access
                                    </span>
                                )}
                            </div>

                            {/* Trend Analysis */}
                            {paper.trendAnalysis.comparison && (
                                <div className="mb-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <p className="text-sm text-blue-200 flex items-start gap-2">
                                        <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>{paper.trendAnalysis.comparison}</span>
                                    </p>
                                </div>
                            )}

                            {/* Abstract */}
                            {paper.abstract && (
                                <div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedPaper(expandedPaper === paper.id ? null : paper.id);
                                        }}
                                        className="text-sm text-blue-400 hover:text-blue-300 mb-2"
                                    >
                                        {expandedPaper === paper.id ? 'Hide' : 'Show'} abstract
                                    </button>
                                    {expandedPaper === paper.id && (
                                        <p className="text-sm text-gray-300 leading-relaxed">
                                            {paper.abstract}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Analysis Modal */}
                {selectedPaper && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h2 className="text-2xl font-bold text-white mb-2">
                                            {selectedPaper.title}
                                        </h2>
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                                            <span>{selectedPaper.authors.slice(0, 3).join(', ')}</span>
                                            <span>•</span>
                                            <span>{selectedPaper.year}</span>
                                            <span>•</span>
                                            <span>{selectedPaper.citations} citations</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {selectedPaper.trendAnalysis.field && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getFieldColor(selectedPaper.trendAnalysis.field)}`}>
                                                    {selectedPaper.trendAnalysis.field}
                                                </span>
                                            )}
                                            {selectedPaper.trendAnalysis.prediction && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPredictionColor(selectedPaper.trendAnalysis.prediction)}`}>
                                                    {selectedPaper.trendAnalysis.prediction}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={closeModal}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <span className="text-2xl text-gray-400 hover:text-white">×</span>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    AI Analysis Against Dataset Trends
                                </h3>

                                {analysisLoading && (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                                        <p className="text-gray-400">Analyzing paper against field trends...</p>
                                        <p className="text-gray-500 text-sm mt-2">Using Ollama to compare with dataset insights</p>
                                    </div>
                                )}

                                {!analysisLoading && analysis && (
                                    <div className="prose prose-invert max-w-none">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                            <pre className="whitespace-pre-wrap text-sm text-gray-300 font-sans leading-relaxed">
                                                {analysis}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {!analysisLoading && !analysis && (
                                    <div className="text-center py-8 text-gray-400">
                                        <p>Click "Analyze" to see how this paper compares to field trends</p>
                                    </div>
                                )}

                                {/* Quick Stats */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                                        <div className="text-sm text-blue-300 mb-1">ML Adoption in Field</div>
                                        <div className="text-2xl font-bold text-blue-400">
                                            {selectedPaper.trendAnalysis.ml_adoption_rate?.toFixed(1) || 'N/A'}%
                                        </div>
                                    </div>
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="text-sm text-green-300 mb-1">Citation Percentile</div>
                                        <div className="text-2xl font-bold text-green-400">
                                            {selectedPaper.trendAnalysis.citation_percentile}
                                        </div>
                                    </div>
                                </div>

                                {/* Trend Comparison */}
                                {selectedPaper.trendAnalysis.comparison && (
                                    <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <div className="text-sm font-medium text-purple-300 mb-2">Field Context</div>
                                        <p className="text-sm text-purple-200">{selectedPaper.trendAnalysis.comparison}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
