import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { INTERVIEW_MODES } from "@/lib/constants";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-2/3 left-1/3 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm text-blue-400">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
            AI-Powered Interview Training
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            Ace your next{" "}
            <span className="gradient-text">interview</span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your CV, pick an interview mode, and practice with a personalised AI interviewer.
            Get detailed feedback and scores after every session.
          </p>

          <div className="flex flex-wrap gap-4 justify-center pt-4">
            <Link href="/setup">
              <Button size="lg">Start Practicing</Button>
            </Link>
          </div>

          <div className="flex gap-8 justify-center text-sm text-gray-500 pt-2">
            <span>✓ Personalised to your CV</span>
            <span>✓ Real-time speech recognition</span>
            <span>✓ Detailed feedback report</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Interview Modes</h2>
          <p className="text-gray-400 text-center mb-12">Choose the mode that matches your target interview</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(INTERVIEW_MODES).map(([key, mode]) => (
              <Card key={key} glass className="hover:border-white/20 transition-colors">
                <div className="text-3xl mb-3">{mode.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{mode.label}</h3>
                <p className="text-gray-400 text-sm">{mode.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Upload your CV", desc: "We parse your experience and skills to personalise questions." },
              { step: "2", title: "Practice live", desc: "AI asks questions aloud. You answer with your microphone." },
              { step: "3", title: "Get your report", desc: "Receive a scored report with strengths, improvements, and tips." },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center mx-auto">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Link href="/setup">
              <Button size="lg">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-sm text-gray-600 border-t border-white/5">
        Interview AI — Built with Next.js + FastAPI + Claude
      </footer>
    </main>
  );
}
