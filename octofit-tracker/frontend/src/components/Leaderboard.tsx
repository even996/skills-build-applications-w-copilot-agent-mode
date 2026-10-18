import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (!active) return;
        setLeaderboard(response.leaderboard ?? []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Unknown error');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      isLoading={loading}
      error={error}
      isEmpty={leaderboard.length === 0}
      emptyMessage="No leaderboard yet."
    >
      <ol className="mb-0 ps-3">
        {leaderboard.map((entry) => (
          <li key={`${entry.teamName}-${entry.rank}`}>
            {entry.teamName}: {entry.totalPoints} pts
          </li>
        ))}
      </ol>
    </CapabilityCard>
  );
}
