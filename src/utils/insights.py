import os
import re
import json
from typing import Optional, Dict, Any

ML_KEYWORDS = [
    'deep learning', 'neural network', 'transformer', 'bert', 'gpt', 'reinforcement learning',
    'convolutional', 'rnn', 'lstm', 'attention', 'state-of-the-art', 'sota', 'pretrained'
]

DATASET_KEYWORDS = ['imagenet', 'coco', 'mnist', 'glue', 'squad', 'wikitext']


def _score_ml_impact(text: str) -> Dict[str, Any]:
    t = text.lower()
    kws_found = [k for k in ML_KEYWORDS if k in t]
    datasets = [d for d in DATASET_KEYWORDS if d in t]
    count = len(kws_found)
    score = min(1.0, count / 6.0 + 0.1 * len(datasets))
    reasons = []
    if kws_found:
        reasons.append(f"ML keywords: {', '.join(kws_found[:8])}")
    if datasets:
        reasons.append(f"Mentions datasets: {', '.join(datasets)}")
    if 'benchmark' in t or 'state-of-the-art' in t or 'sota' in t:
        reasons.append('Claims or evaluates against benchmarks')
    return {'score': round(score, 3), 'reasons': reasons}


def _score_reproducibility(text: str) -> Dict[str, Any]:
    t = text.lower()
    repo_present = 'github.com' in t or 'gitlab.com' in t
    has_code_text = any(w in t for w in ['implementation', 'source code', 'we release', 'open-source', 'code available', 'repository'])
    has_eval = any(w in t for w in ['experimental setup', 'hyperparameter', 'training details', 'seed'])
    score = 0.0
    if repo_present:
        score += 0.6
    if has_code_text:
        score += 0.2
    if has_eval:
        score += 0.2
    reasons = []
    if repo_present:
        reasons.append('Repository link found')
    if has_code_text:
        reasons.append('Mentions code/implementation')
    if has_eval:
        reasons.append('Mentions experimental/hyperparameter details')
    return {'score': round(min(1.0, score), 3), 'reasons': reasons}


def _extract_identifiers(text: str) -> Dict[str, Any]:
    ids = {}
    arxiv = re.findall(r'arXiv:?(\d{4}\.\d{4,5})', text, flags=re.I)
    doi = re.findall(r'doi:\s*(10.\d{4,9}/[^\s,]+)', text, flags=re.I)
    ids['arxiv'] = list(set(arxiv))
    ids['doi'] = list(set(doi))
    return ids


def analyze_text(text: str, graph_path: Optional[str] = None) -> Dict[str, Any]:
    ml = _score_ml_impact(text)
    repro = _score_reproducibility(text)
    identifiers = _extract_identifiers(text)

    graph_info = None
    if graph_path and os.path.exists(graph_path):
        try:
            with open(graph_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            graph_info = {'graph_loaded': True, 'nodes': len(data) if isinstance(data, list) else 'unknown'}
        except Exception:
            graph_info = {'graph_loaded': False, 'error': 'could not parse graph file'}

    suggestions = []
    if repro['score'] < 0.5:
        suggestions.append('Add a public repository link and a reproducibility checklist (training details, seeds).')
    if ml['score'] >= 0.5:
        suggestions.append('Highlight benchmark comparisons and provide code for main baselines.')
    if not identifiers['doi'] and not identifiers['arxiv']:
        suggestions.append('Add an arXiv or DOI identifier if available to link into citation networks.')

    return {
        'ml_impact': ml,
        'reproducibility': repro,
        'identifiers': identifiers,
        'graph': graph_info,
        'suggestions': suggestions
    }
