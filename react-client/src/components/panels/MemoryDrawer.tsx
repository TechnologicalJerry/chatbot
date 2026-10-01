'use client';

import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../../types';
import { useServer } from '../../context/ServerContext';
import { apiFetch } from '../../lib/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BrainCircuit, Plus, Trash2 } from 'lucide-react';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({ isOpen, onClose }) => {
  const { activeServer } = useServer();
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [fact, setFact] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchMemories = async () => {
    try {
      const data = await apiFetch<MemoryItem[]>(activeServer.url, '/api/v1/memory');
      setMemories(data);
    } catch {}
  };

  useEffect(() => {
    if (isOpen) fetchMemories();
  }, [isOpen, activeServer]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fact) return;
    setLoading(true);
    try {
      await apiFetch(activeServer.url, '/api/v1/memory', {
        method: 'POST',
        body: JSON.stringify({ fact }),
      });
      setFact('');
      await fetchMemories();
    } catch (err: any) {
      alert(err.message || 'Failed to add memory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(activeServer.url, `/api/v1/memory/${id}`, { method: 'DELETE' });
      await fetchMemories();
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Long-Term User Memory">
      <div className="space-y-6">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            required
            value={fact}
            onChange={(e) => setFact(e.target.value)}
            placeholder="Add memory fact (e.g. User prefers Python over JS)"
            className="flex-1 px-3 py-2 text-xs text-white bg-slate-800/70 border border-slate-700/80 rounded-xl focus:outline-none focus:border-purple-500"
          />
          <Button type="submit" isLoading={loading} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Save Fact
          </Button>
        </form>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Stored Memories ({memories.length})
          </h4>

          {memories.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
              No memory facts stored yet. The AI automatically extracts facts during conversation or you can add them manually above.
            </div>
          ) : (
            memories.map((mem) => (
              <div
                key={mem._id}
                className="flex items-center justify-between p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-2.5">
                  <BrainCircuit className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">{mem.fact}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={mem.source === 'extracted' ? 'indigo' : 'emerald'} size="sm">
                        {mem.source}
                      </Badge>
                      <span className="text-[10px] text-slate-500">
                        Confidence: {(mem.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(mem._id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
