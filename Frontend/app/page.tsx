import Navbar from "@/components/navbar";
import NewsVerificationForm from "@/components/news-verification-form";
import AboutSection from "@/components/about-section";
import Footer from "@/components/footer";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section with Gradient */}
        <section className="relative py-16 md:py-24 px-4 overflow-hidden gradient-hero dark:gradient-hero-dark">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-float" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="animate-fadeIn">
              <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium bg-white/20 backdrop-blur-sm rounded-full text-white border border-white/30">
                🔍 AI-Powered Verification
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              Fake News Detection
              <span className="block mt-2 text-3xl md:text-5xl font-normal opacity-90">
                Powered by Machine Learning
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/90 mb-12 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              Verify the authenticity of news articles using advanced NLP algorithms
              and linguistic pattern analysis. Get instant results with confidence scores.
            </p>

            {/* News Verification Form */}
            <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <NewsVerificationForm />

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/live-dashboard"
                  className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg shadow-xl hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                >
                  <span className="material-symbols-outlined group-hover:animate-pulse">dashboard</span>
                  Explore Intelligence Suite
                </Link>
                <Link
                  href="/heatmap"
                  className="px-8 py-3 bg-transparent border border-white/40 text-white font-bold rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">public</span>
                  View Heatmap
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <AboutSection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
