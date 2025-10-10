import { redirect } from 'next/navigation';

export default function DocsPage() {
  // Redirect to the docs app
  // Note: In production, this would redirect to the actual docs app URL
  // For now, we'll show a placeholder page
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">DDPC Documentation</h1>
          <p className="text-xl text-gray-300 mb-8">
            Comprehensive documentation for the DDPC platform, including API references, guides, and schema documentation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">🚀 Getting Started</h3>
            <p className="text-gray-300 mb-4">
              Learn how to set up your account and get started with DDPC.
            </p>
            <span className="text-blue-400">Coming Soon</span>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">📊 Database Schema</h3>
            <p className="text-gray-300 mb-4">
              Complete reference for our database structure and relationships.
            </p>
            <span className="text-blue-400">Coming Soon</span>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">🔌 API Reference</h3>
            <p className="text-gray-300 mb-4">
              Detailed API documentation for integrations and development.
            </p>
            <span className="text-blue-400">Coming Soon</span>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Development Documentation</h2>
          <p className="text-gray-300 mb-4">
            Access our comprehensive developer documentation including database schemas, API references,
            and integration guides.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View Full Documentation (Coming Soon)
            </a>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
