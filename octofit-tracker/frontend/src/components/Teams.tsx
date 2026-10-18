import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (!active) return;
        setTeams(response.teams ?? []);
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
      title="Teams"
      description="Manage teams and members."
      isLoading={loading}
      error={error}
      isEmpty={teams.length === 0}
      emptyMessage="No teams yet."
    >
      <ul className="list-unstyled mb-0">
        {teams.map((team, index) => (
          <li key={`${team.name}-${index}`}>
            {team.name} — {team.members.length} members
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
