'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Key, 
  Settings2, 
  ExternalLink, 
  Copy, 
  Check, 
  Mail, 
  Phone, 
  Briefcase, 
  Clock, 
  User, 
  Sparkles, 
  Globe, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FileText,
  ShieldCheck,
  Server
} from 'lucide-react';
import { ExtractedLead, ExtractionResponse } from '@/types';

export default function LeadExtractorDashboard() {
  const [keyword, setKeyword] = useState('Senior React Developer');
  const [maxResults, setMaxResults] = useState(10);
  const [apiToken, setApiToken] = useState('');
  const [actorId, setActorId] = useState('apify/google-search-scraper');
  const [provider, setProvider] = useState<'apify' | 'serpapi'>('apify');
  const [serpApiKey, setSerpApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [results, setResults] = useState<ExtractedLead[]>([]);
  const [sourceType, setSourceType] = useState<'apify' | 'serpapi' | 'fallback_simulation' | null>(null);
  const [actorUsed, setActorUsed] = useState<string>('');
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tableFilter, setTableFilter] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load saved token from localStorage if available
  useEffect(() => {
    const savedToken = localStorage.getItem('APIFY_API_TOKEN');
    if (savedToken) setApiToken(savedToken);
    const savedSerpKey = localStorage.getItem('SERPAPI_API_KEY');
    if (savedSerpKey) setSerpApiKey(savedSerpKey);
    const savedProvider = localStorage.getItem('SEARCH_PROVIDER') as any;
    if (savedProvider) setProvider(savedProvider);
  }, []);

  const handleSaveToken = (val: string) => {
    setApiToken(val);
    if (val) {
      localStorage.setItem('APIFY_API_TOKEN', val);
    } else {
      localStorage.removeItem('APIFY_API_TOKEN');
    }
  };

  const handleSaveSerpKey = (val: string) => {
    setSerpApiKey(val);
    if (val) {
      localStorage.setItem('SERPAPI_API_KEY', val);
    } else {
      localStorage.removeItem('SERPAPI_API_KEY');
    }
  };

  const handleSetProvider = (p: 'apify' | 'serpapi') => {
    setProvider(p);
    localStorage.setItem('SEARCH_PROVIDER', p);
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text || text.includes('Not') || text.includes('Available')) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!keyword.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    setStatusStep('Initializing agent request...');

    try {
      const providerLabel = provider === 'serpapi' ? 'SerpAPI (Google Engine)' : 'Apify Actor';
      setTimeout(() => setStatusStep(`Querying ${providerLabel} and harvesting profile data...`), 700);
      setTimeout(() => setStatusStep('Normalizing entities (Name, Email, Phone, Designation, Experience, Resume)...'), 2200);

      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          maxResults,
          provider,
          apiToken: apiToken.trim() || undefined,
          actorId,
          serpApiKey: serpApiKey.trim() || undefined,
        }),
      });

      const data: ExtractionResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to extract leads.');
      }

      setResults(data.leads || []);
      setSourceType(data.source);
      setActorUsed(data.actorUsed || actorId);
      setExecutionTime(data.executionTimeMs);
      setStatusStep('');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred during extraction.');
      setStatusStep('');
    } finally {
      setIsLoading(false);
    }
  };

  // Export handlers
  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = ['Name', 'Phone Number', 'Email', 'Designation', 'Experience', 'Resume / CV URL', 'Company', 'Location', 'Source URL'];
    const rows = results.map(r => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.phoneNumber || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.designation || '').replace(/"/g, '""')}"`,
      `"${(r.experience || '').replace(/"/g, '""')}"`,
      `"${(r.resumeUrl || 'Not attached').replace(/"/g, '""')}"`,
      `"${(r.company || '').replace(/"/g, '""')}"`,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.sourceUrl || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leads_${keyword.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (results.length === 0) return;
    const jsonContent = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(results, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonContent);
    link.setAttribute('download', `leads_${keyword.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results.filter(lead => {
    const q = tableFilter.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.designation.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.phoneNumber.toLowerCase().includes(q) ||
      lead.experience.toLowerCase().includes(q)
    );
  });

  // Suggested keywords
  const presets = [
    'Senior React Developer',
    'AI Solutions Architect San Francisco',
    'VP of Growth & Marketing',
    'DevOps Cloud Engineer',
    'Product Lead Healthcare',
  ];

  return (
    <div className="space-y-8">
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Apify Lead Extractor Agent
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Extract <span className="text-indigo-400 font-medium">Name, Phone, Email, Designation, Experience & Resume</span> by keyword
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="settings-toggle-button"
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg glass-card hover:bg-slate-800 transition text-slate-300 hover:text-white border border-slate-700/60"
          >
            <Settings2 className="w-4 h-4 text-indigo-400" />
            Engine Settings
            {(apiToken || serpApiKey) && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
          </button>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-300 font-mono">
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            Vercel Ready
          </div>
        </div>
      </header>

      {/* Settings Drawer / Popover */}
      {showSettings && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 glow-effect space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              Extraction Engine & API Settings
            </h3>
            <span className="text-xs text-slate-400">Client-side & Serverless compatible</span>
          </div>

          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Select Extraction Provider
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetProvider('apify')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                  provider === 'apify'
                    ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Apify Scraper
              </button>
              <button
                type="button"
                onClick={() => handleSetProvider('serpapi')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition border ${
                  provider === 'serpapi'
                    ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-900/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                SerpAPI (100 Free Google Searches/mo)
              </button>
            </div>
          </div>

          {provider === 'apify' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Apify API Token (Optional if set in Vercel .env)
                </label>
                <div className="relative">
                  <input
                    id="apify-token-input"
                    type="password"
                    value={apiToken}
                    onChange={(e) => handleSaveToken(e.target.value)}
                    placeholder="apify_api_..."
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave empty for preview sandbox, or get token from <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Apify Console</a>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Apify Actor ID
                </label>
                <select
                  id="actor-select"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="apify/google-search-scraper">apify/google-search-scraper (Public Profiles X-Ray)</option>
                  <option value="curious_coder/linkedin-profile-scraper">curious_coder/linkedin-profile-scraper</option>
                  <option value="dev_rohit/linkedin-profile-data-extractor">dev_rohit/linkedin-profile-data-extractor</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Google Search Scraper provides universal access with zero cookie restrictions.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm pt-1">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                SerpAPI Key (Free 100 searches/mo)
              </label>
              <div className="relative max-w-lg">
                <input
                  id="serpapi-key-input"
                  type="password"
                  value={serpApiKey}
                  onChange={(e) => handleSaveSerpKey(e.target.value)}
                  placeholder="Paste your SerpAPI key..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Get your free API key at <a href="https://serpapi.com/users/sign_up" target="_blank" rel="noreferrer" className="text-indigo-400 underline">serpapi.com</a> (Includes 100 free Google searches every month).
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search and extraction form */}
      <section className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <form onSubmit={handleExtract} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                id="keyword-input"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter role, skills, or location (e.g., 'Full Stack Developer London', 'VP Sales SaaS')..."
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                id="max-results-select"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="h-full bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                title="Max Results"
              >
                <option value={5}>5 leads</option>
                <option value={10}>10 leads</option>
                <option value={20}>20 leads</option>
              </select>

              <button
                id="extract-button"
                type="submit"
                disabled={isLoading || !keyword.trim()}
                className="glow-button flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Run Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
            <span className="text-slate-500 font-medium">Quick suggestions:</span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setKeyword(preset)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/40 transition"
              >
                {preset}
              </button>
            ))}
          </div>
        </form>

        {/* Live progress banner */}
        {isLoading && (
          <div className="mt-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-3 text-indigo-300 text-sm animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <div>
              <p className="font-medium text-white">{statusStep}</p>
              <p className="text-xs text-indigo-400/80">Scanning target profiles, resolving contact channels, calculating experience & fetching resumes...</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="space-y-6">
          {/* Summary & Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Total Extracted</span>
              <p className="text-2xl font-bold text-white mt-1">{results.length}</p>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Structured output ready
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Emails Found</span>
              <p className="text-2xl font-bold text-indigo-300 mt-1">
                {results.filter(r => r.email && !r.email.includes('Not')).length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1">
                {Math.round((results.filter(r => r.email && !r.email.includes('Not')).length / results.length) * 100)}% email rate
              </span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Phone Numbers</span>
              <p className="text-2xl font-bold text-purple-300 mt-1">
                {results.filter(r => r.phoneNumber && !r.phoneNumber.includes('Available')).length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1">Direct contact numbers</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Resumes / CVs</span>
              <p className="text-2xl font-bold text-emerald-300 mt-1">
                {results.filter(r => r.resumeUrl).length}
              </p>
              <span className="text-[11px] text-slate-400 mt-1">PDF & web portfolios</span>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-400">Execution Speed</span>
              <p className="text-2xl font-bold text-slate-200 mt-1">
                {executionTime ? `${(executionTime / 1000).toFixed(1)}s` : '< 2s'}
              </p>
              <span className="text-[11px] text-slate-400 truncate block mt-1" title={actorUsed}>
                Engine: {actorUsed.split('/')[1] || actorUsed}
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
            {/* Table Action Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  placeholder="Filter by name, designation..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/70 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  id="export-csv-button"
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  Export CSV
                </button>
                <button
                  id="export-json-button"
                  onClick={exportToJSON}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium border border-slate-700 transition"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Structured Leads Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Name</th>
                    <th className="py-3.5 px-4">Designation</th>
                    <th className="py-3.5 px-4">Experience</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Resume / CV</th>
                    <th className="py-3.5 px-4 text-right">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredResults.map((lead) => {
                    const hasRealEmail = lead.email && !lead.email.includes('Not');
                    const hasRealPhone = lead.phoneNumber && !lead.phoneNumber.includes('Available');

                    return (
                      <tr key={lead.id} className="hover:bg-slate-800/30 transition group">
                        {/* 1. Name */}
                        <td className="py-4 px-4 sm:px-6 font-medium text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs uppercase flex-shrink-0">
                              {lead.name.substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100">{lead.name}</div>
                              {lead.location && (
                                <div className="text-[11px] text-slate-400">{lead.location}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Designation */}
                        <td className="py-4 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <Briefcase className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span>{lead.designation}</span>
                          </div>
                          {lead.company && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700/50">
                              {lead.company}
                            </span>
                          )}
                        </td>

                        {/* 3. Experience */}
                        <td className="py-4 px-4 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="text-slate-300">{lead.experience}</span>
                          </div>
                        </td>

                        {/* 4. Email */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono ${hasRealEmail ? 'text-indigo-300 font-medium' : 'text-slate-500 italic'}`}>
                              {lead.email}
                            </span>
                            {hasRealEmail && (
                              <button
                                onClick={() => copyToClipboard(lead.email, `email-${lead.id}`)}
                                title="Copy email"
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              >
                                {copiedId === `email-${lead.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 5. Phone Number */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono ${hasRealPhone ? 'text-purple-300 font-medium' : 'text-slate-500 italic'}`}>
                              {lead.phoneNumber}
                            </span>
                            {hasRealPhone && (
                              <button
                                onClick={() => copyToClipboard(lead.phoneNumber, `phone-${lead.id}`)}
                                title="Copy phone number"
                                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              >
                                {copiedId === `phone-${lead.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 6. Resume / CV */}
                        <td className="py-4 px-4">
                          {lead.resumeUrl ? (
                            <a
                              href={lead.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 border border-emerald-700/50 text-[11px] font-medium transition"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View CV
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Not attached</span>
                          )}
                        </td>

                        {/* 7. Profile / Source */}
                        <td className="py-4 px-4 text-right">
                          {lead.sourceUrl ? (
                            <a
                              href={lead.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                            >
                              Profile
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-slate-500">Public Index</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Vercel Deployment Instructions Box */}
      <section className="glass-panel p-6 rounded-3xl border border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Globe className="w-4 h-4 text-indigo-400" />
            Deploying this Agent to Vercel
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            Production Ready
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          This project is built using Next.js 14 App Router and standard Serverless API endpoints. You can deploy it to Vercel in 2 minutes:
        </p>
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 flex items-center justify-between">
          <code>npx vercel --prod</code>
          <button
            onClick={() => copyToClipboard('npx vercel --prod', 'vercel-cmd')}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"
          >
            {copiedId === 'vercel-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            Copy
          </button>
        </div>
        <div className="text-[11px] text-slate-400">
          <strong>Environment Variable:</strong> In your Vercel project dashboard, add <code className="text-indigo-300 font-mono">APIFY_API_TOKEN</code> or <code className="text-indigo-300 font-mono">SERPAPI_API_KEY</code> for production access.
        </div>
      </section>
    </div>
  );
}
