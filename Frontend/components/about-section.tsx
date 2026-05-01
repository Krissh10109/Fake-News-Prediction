import { Shield, Brain, Zap, Sparkles } from "lucide-react"

export default function AboutSection() {
  const features = [
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Reliable Detection",
      description:
        "Advanced algorithms analyze text patterns, source credibility, and factual consistency to identify fake news with high accuracy.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Brain className="h-8 w-8" />,
      title: "Machine Learning",
      description:
        "Powered by TF-IDF and Logistic Regression models trained on thousands of verified and fake news articles.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Instant Results",
      description:
        "Get immediate verification results with confidence scores and key indicator explanations.",
      gradient: "from-orange-500 to-yellow-500",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-sm font-medium bg-primary/10 rounded-full text-primary">
            <Sparkles className="w-4 h-4" />
            How It Works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Powered by <span className="gradient-text">Artificial Intelligence</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our fake news detection tool uses advanced natural language processing to help you identify
            misinformation and verify the authenticity of news articles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group glass-card p-6 md:p-8 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`mb-5 p-4 rounded-xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { value: "91.84%", label: "Model Accuracy" },
            { value: "97.6%", label: "ROC-AUC Score" },
            { value: "50K+", label: "Articles Trained" },
            { value: "<1s", label: "Response Time" },
          ].map((stat, index) => (
            <div
              key={index}
              className="glass-card p-4 md:p-6 rounded-xl text-center"
            >
              <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
