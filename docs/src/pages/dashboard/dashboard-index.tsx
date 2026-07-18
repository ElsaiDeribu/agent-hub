export default function DashboardIndexPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Placeholder stats */}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
          <div className="aspect-video rounded-xl bg-muted/50" />
        </div>
        <div className="min-h-48 flex-1 rounded-xl bg-muted/50" />
    </div>
  );
}
