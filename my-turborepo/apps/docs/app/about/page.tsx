export default function About() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About DDPC</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-6">
              DDPC (Don't Drive Poor Cars) is your ultimate destination for automotive enthusiasts who refuse to settle for anything less than exceptional.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-300 mb-6">
              We're building the world's most comprehensive platform for car enthusiasts, collectors, and builders. Whether you're looking to discover rare vehicles, connect with fellow enthusiasts, or showcase your own collection, DDPC is your home.
            </p>

            <h2 className="text-2xl font-semibold mb-4">What We Offer</h2>
            <ul className="text-gray-300 mb-6 list-disc list-inside space-y-2">
              <li>Extensive vehicle database with detailed specifications</li>
              <li>Personal garage management for tracking your collection</li>
              <li>Community features for sharing builds and connecting with others</li>
              <li>Advanced search and filtering tools</li>
              <li>Expert insights and automotive industry news</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">Join Our Community</h2>
            <p className="text-gray-300 mb-6">
              Become part of a passionate community of automotive enthusiasts. Share your knowledge, discover new vehicles, and connect with like-minded individuals who share your passion for exceptional automobiles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
