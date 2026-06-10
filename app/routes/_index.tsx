import { useConfigurables } from "~/modules/configurables";
import { CoachChat } from "~/components/coach-chat";

export default function IndexPage() {
  const { loading } = useConfigurables();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-accent border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading your coach...</p>
        </div>
      </div>
    );
  }

  return <CoachChat />;
}
