import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

type FirestoreStats = {
  uptime: string;
  totalOperations: number;
  dailyStats: {
    reads: number;
    writes: number;
    lastReset: number;
  };
  operationsByType: Record<string, number>;
  operationsByCollection: Record<string, number>;
};

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal = ({ isOpen, onClose }: StatsModalProps) => {
  const [stats, setStats] = useState<FirestoreStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = () => {
    try {
      const tracker = (window as any).tracker;
      if (!tracker) {
        setError("Stats tracker not available. Please refresh the page.");
        return;
      }
      const currentStats = tracker.getStats() as FirestoreStats;
      setStats(currentStats);
      setError(null);
    } catch (err) {
      setError("Error loading stats. Please try again.");
      console.error("Error loading stats:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-neu-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-inter font-semibold text-neu-100">
            Firestore Operations Stats
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshStats}
              className="text-neu-400 hover:text-neu-100 transition-colors p-2"
              title="Refresh stats"
            >
              <Icon icon="mingcute:refresh-fill" className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-neu-400 hover:text-neu-100 transition-colors p-2"
            >
              <Icon icon="mingcute:close-fill" className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-500">
            {error}
          </div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neu-900 p-4 rounded-lg">
                <h3 className="text-neu-400 text-sm font-inter mb-2">Uptime</h3>
                <p className="text-neu-100 font-inter">{stats.uptime}</p>
              </div>
              <div className="bg-neu-900 p-4 rounded-lg">
                <h3 className="text-neu-400 text-sm font-inter mb-2">
                  Total Operations
                </h3>
                <p className="text-neu-100 font-inter">
                  {stats.totalOperations}
                </p>
              </div>
            </div>

            <div className="bg-neu-900 p-4 rounded-lg">
              <h3 className="text-neu-400 text-sm font-inter mb-2">
                Daily Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-neu-100 font-inter">
                    Reads: {stats.dailyStats.reads}
                  </p>
                </div>
                <div>
                  <p className="text-neu-100 font-inter">
                    Writes: {stats.dailyStats.writes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-neu-900 p-4 rounded-lg">
              <h3 className="text-neu-400 text-sm font-inter mb-2">
                Operations by Type
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.operationsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-neu-400 font-inter capitalize">
                      {type}
                    </span>
                    <span className="text-neu-100 font-inter">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neu-900 p-4 rounded-lg">
              <h3 className="text-neu-400 text-sm font-inter mb-2">
                Operations by Collection
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.operationsByCollection).map(
                  ([collection, count]) => (
                    <div key={collection} className="flex justify-between">
                      <span className="text-neu-400 font-inter">
                        {collection}
                      </span>
                      <span className="text-neu-100 font-inter">{count}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-neu-400 text-center py-4">Loading stats...</div>
        )}
      </div>
    </div>
  );
};
