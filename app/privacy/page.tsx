export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: December 22, 2025</p>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">1. Information We Collect</h2>
            <p><strong>Account Information:</strong> Email address and password when you create an account.</p>
            <p className="mt-2"><strong>Pet Information:</strong> Information you provide about your dog including name, breed, age, and behavioral notes.</p>
            <p className="mt-2"><strong>Usage Data:</strong> Training session logs, progress data, and interactions with the Service.</p>
            <p className="mt-2"><strong>Video Content:</strong> Videos you choose to upload for training purposes.</p>
            <p className="mt-2"><strong>Analytics:</strong> Anonymous usage statistics through Vercel Analytics (page views, device type, country).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To provide and personalize the Service</li>
              <li>To generate AI-powered training recommendations</li>
              <li>To track your dog's progress over time</li>
              <li>To improve and develop new features</li>
              <li>To communicate with you about the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">3. Data Storage and Security</h2>
            <p>Your data is stored securely using:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase:</strong> For account and application data (encrypted at rest)</li>
              <li><strong>Mux:</strong> For video storage and streaming (with DRM protection)</li>
            </ul>
            <p className="mt-2">We implement industry-standard security measures, but no system is 100% secure. You use the Service at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">4. Data Sharing</h2>
            <p>We do NOT sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Service Providers:</strong> Third parties that help us operate the Service (Supabase, Mux, Vercel, OpenAI)</li>
              <li><strong>Trainers:</strong> Only the specific videos/data you explicitly choose to share</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">5. AI and OpenAI</h2>
            <p>We use OpenAI's API to generate training recommendations. Information about your dog is sent to OpenAI to generate personalized content. OpenAI's privacy policy applies to their processing of this data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Delete:</strong> Request deletion of your account and data</li>
              <li><strong>Correct:</strong> Update inaccurate information</li>
              <li><strong>Export:</strong> Download your data in a portable format</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at privacy@pawcalm.ai</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">7. Cookies and Tracking</h2>
            <p>We use essential cookies for authentication and session management. We use Vercel Analytics for anonymous usage statistics. You can disable cookies in your browser settings, but some features may not work properly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">8. Children's Privacy</h2>
            <p>The Service is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">9. International Users</h2>
            <p>Your data may be transferred to and processed in the United States. By using the Service, you consent to this transfer.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">10. California Residents (CCPA)</h2>
            <p>California residents have additional rights under the CCPA, including the right to know what personal information is collected and the right to request deletion. We do not sell personal information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">11. European Users (GDPR)</h2>
            <p>If you are in the European Economic Area, you have additional rights under GDPR including data portability and the right to lodge a complaint with a supervisory authority.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">13. Contact Us</h2>
            <p>For privacy-related questions or requests:</p>
            <p className="mt-2">Email: privacy@pawcalm.ai</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-emerald-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}