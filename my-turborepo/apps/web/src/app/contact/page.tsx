export default function ContactPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300 mb-8">
            Get in touch with the DDPC team. We're here to help with your vehicle management needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Support</h2>
            <p className="text-gray-300 mb-4">
              Need help with your account or have questions about DDPC features?
            </p>
            <p className="text-gray-300">
              Email: <a href="mailto:support@ddpc.com" className="text-blue-400 hover:text-blue-300">support@ddpc.com</a>
            </p>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4">Business Inquiries</h2>
            <p className="text-gray-300 mb-4">
              Interested in partnerships, API access, or enterprise solutions?
            </p>
            <p className="text-gray-300">
              Email: <a href="mailto:business@ddpc.com" className="text-blue-400 hover:text-blue-300">business@ddpc.com</a>
            </p>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Community</h2>
          <p className="text-gray-300 mb-4">
            Join our community of automotive enthusiasts to share builds, get advice, and connect with fellow vehicle owners.
          </p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Community Forum (Coming Soon)
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
