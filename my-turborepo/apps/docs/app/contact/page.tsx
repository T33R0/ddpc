export default function Contact() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Contact Us</h1>

          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-8">
              Have questions, feedback, or want to get in touch? We'd love to hear from you.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Get In Touch</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Email</h3>
                    <p className="text-gray-300">hello@ddpc.com</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Support</h3>
                    <p className="text-gray-300">support@ddpc.com</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Business Inquiries</h3>
                    <p className="text-gray-300">business@ddpc.com</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold mb-4">Follow Us</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Twitter</h3>
                    <p className="text-gray-300">@ddpc_official</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Instagram</h3>
                    <p className="text-gray-300">@ddpc_automotive</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">YouTube</h3>
                    <p className="text-gray-300">DDPC Channel</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-900 rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">Send us a Message</h2>
              <p className="text-gray-300 mb-4">
                For general inquiries, partnership opportunities, or feedback about the platform.
              </p>
              <p className="text-gray-400 text-sm">
                We typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
