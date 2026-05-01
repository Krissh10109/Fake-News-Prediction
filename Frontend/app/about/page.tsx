import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">About Our Tool</h1>

        <div className="space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-700">
              Our mission is to combat the spread of misinformation by providing a reliable, accessible tool that helps
              people verify the authenticity of news articles before sharing them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">How It Works</h2>
            <p className="text-gray-700 mb-4">
              Our fake news detection tool uses advanced machine learning algorithms trained on thousands of verified
              and fake news articles. The system analyzes various aspects of the text:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Linguistic patterns and writing style</li>
              <li>Factual consistency with trusted sources</li>
              <li>Source credibility assessment</li>
              <li>Contextual analysis and cross-referencing</li>
              <li>Sentiment and emotional manipulation detection</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Our Technology</h2>
            <p className="text-gray-700">
              We use a combination of natural language processing (NLP), deep learning, and traditional machine learning
              techniques. Our models are continuously updated and improved to adapt to evolving misinformation tactics.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Limitations</h2>
            <p className="text-gray-700">
              While our tool is highly accurate, no automated system is perfect. We recommend using our tool as one of
              several methods to verify information, alongside checking multiple reputable sources and consulting
              fact-checking websites.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
