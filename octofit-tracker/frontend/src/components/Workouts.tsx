import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (!active) return;
        setSuggestions(response.suggestions ?? []);
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
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      isLoading={loading}
      error={error}
      isEmpty={suggestions.length === 0}
      emptyMessage="No workout suggestions yet."
    >
      <ul className="list-unstyled mb-0">
        {suggestions.map((suggestion, index) => (
          <li key={`${suggestion.title}-${index}`}>
            {suggestion.title}
            {suggestion.reason ? ` — ${suggestion.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
