import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (!active) return;
        setActivities(response.activities ?? []);
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
      title="Activities"
      description="Track student activity minutes and points."
      isLoading={loading}
      error={error}
      isEmpty={activities.length === 0}
      emptyMessage="No activities yet."
    >
      <ul className="list-unstyled mb-0">
        {activities.map((activity, index) => (
          <li key={`${activity.type}-${activity.minutes}-${index}`}>
            {activity.type} — {activity.minutes} min • {activity.points} pts
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
