import { Link } from "react-router-dom";
import {
  Shield,
  TrendingUp,
  Users,
  ChevronRight,
  Star,
  Zap,
  Target,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-primary-50 to-accent-50">
      {/* Header */}
      <header className="glass border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                RiskWorks
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="btn-ghost text-secondary-600 hover:text-secondary-900"
              >
                Sign In
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-20 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-800 bg-clip-text text-transparent">
                Risk Management
              </span>
              <br />
              <span className="text-secondary-900">Reimagined</span>
            </h1>

            <p className="text-xl md:text-2xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform how your organization identifies, assesses, and
              mitigates risks with our modern, intuitive platform designed for
              today's fast-paced business environment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-4 group"
              >
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="btn-ghost text-lg px-8 py-4 group">
                Watch Demo
                <Star className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 animate-slide-up">
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Lightning Fast"
              description="Streamlined workflows that get you from risk identification to mitigation in minutes, not hours."
            />
            <FeatureCard
              icon={<Target className="h-8 w-8" />}
              title="Precision Analytics"
              description="Advanced algorithms and real-time insights help you focus on what matters most."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Team Collaboration"
              description="Built-in collaboration tools ensure everyone stays aligned on risk management strategies."
            />
          </div>

          {/* Stats Section */}
          <div className="mt-20 py-16">
            <div className="card-glass mx-auto max-w-4xl">
              <h3 className="text-2xl font-semibold text-secondary-900 mb-8">
                Trusted by Organizations Worldwide
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard number="10,000+" label="Risks Assessed" />
                <StatCard number="500+" label="Organizations" />
                <StatCard number="99.9%" label="Uptime" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-secondary-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-secondary-900">
                RiskWorks
              </span>
            </div>
            <div className="text-secondary-600 text-sm">
              © 2024 RiskWorks. Built with modern technology for modern teams.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card-glass group hover:scale-105 transition-all duration-300">
      <div className="text-primary-600 mb-4 flex justify-center group-hover:text-accent-600 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-secondary-900 mb-3">{title}</h3>
      <p className="text-secondary-600 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
        {number}
      </div>
      <div className="text-secondary-600">{label}</div>
    </div>
  );
}
