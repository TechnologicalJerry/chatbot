'use client';

import React, { useState, useEffect } from 'react';
import { KnowledgeDocument, ScoredChunk } from '../../types';
import { useServer } from '../../context/ServerContext';
import { apiFetch } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BookOpen, UploadCloud, Search, Trash2, FileText } from 'lucide-react';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({ isOpen, onClose }) => {
  const { activeServer } = useServer();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ScoredChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const data = await apiFetch<KnowledgeDocument[]>(activeServer.url, '/api/v1/knowledge');
      setDocuments(data);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) fetchDocuments();
  }, [isOpen, activeServer]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    setLoading(true);
    try {
      await apiFetch(activeServer.url, '/api/v1/knowledge', {
        method: 'POST',
        body: JSON.stringify({ title, content }),
      });
      setTitle('');
      setContent('');
      await fetchDocuments();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setSearchLoading(true);
    try {
      const results = await apiFetch<ScoredChunk[]>(
        activeServer.url,
        `/api/v1/knowledge/search?q=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(results);
    } catch {} finally {
      setSearchLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(activeServer.url, `/api/v1/knowledge/${id}`, { method: 'DELETE' });
      await fetchDocuments();
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="RAG Knowledge Base Manager">
      <div className="space-y-6">
        {/* Document Ingestion Form */}
        <form onSubmit={handleUpload} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <UploadCloud className="w-4 h-4" />
            <span>Ingest New Document</span>
          </div>

          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document Title (e.g. Return Policy v2.pdf)"
            className="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
          />

          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste document text content here..."
            className="w-full px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-cyan-500"
          />

          <Button type="submit" isLoading={loading} size="sm" className="w-full">
            Process & Compute Embeddings
          </Button>
        </form>

        {/* Vector Similarity Search Test */}
        <form onSubmit={handleSearch} className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-300">
            <Search className="w-4 h-4" />
            <span>Vector Similarity Search Tester</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter search query..."
              className="flex-1 px-3 py-2 text-xs text-white bg-slate-900/80 border border-slate-700 rounded-lg focus:outline-none focus:border-purple-500"
            />
            <Button type="submit" isLoading={searchLoading} size="sm" variant="secondary">
              Search
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-[11px] font-semibold text-slate-400">Top Matches:</div>
              {searchResults.map((result, i) => (
                <div key={i} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <Badge variant="emerald">Score: {(result.score * 100).toFixed(1)}%</Badge>
                  </div>
                  <p className="text-slate-300 text-[11px] font-mono">{result.content}</p>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Uploaded Documents List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Ingested Documents ({documents.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {documents.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No documents in knowledge base.</div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs font-medium text-slate-200 truncate">{doc.title}</div>
                      <div className="text-[10px] text-slate-500">{doc.chunkCount} Vector Chunks</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
