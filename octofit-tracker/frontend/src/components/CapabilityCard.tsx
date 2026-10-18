type Props = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  children?: React.ReactNode;
};

export function CapabilityCard({
  title,
  description,
  isLoading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data available.',
  children,
}: Props) {
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p> : null}
        {isLoading ? <p role="status">Loading {title.toLowerCase()}…</p> : null}
        {!isLoading && !error && isEmpty ? <p>{emptyMessage}</p> : null}
        {!isLoading && !error && !isEmpty ? <div>{children}</div> : null}
      </div>
    </section>
  );
}
