import { PageTransition } from "../components/PageTransition";

export function Habits() {
  return (
    <PageTransition>
      <div className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-1 gap-4 items-center justify-center min-h-[60vh] text-center">
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-test-500 to-orange-test-500 bg-clip-text text-transparent">
              Habits
            </h1>
            <p className="text-4xl text-neu-gre-800">is not available yet.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
