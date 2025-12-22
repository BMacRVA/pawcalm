export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: December 22, 2025</p>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using PawCalm ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">2. Description of Service</h2>
            <p>PawCalm provides AI-generated suggestions and tools for dog separation anxiety training. The Service is provided for informational and educational purposes only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">3. Not Professional Advice</h2>
            <p><strong>IMPORTANT:</strong> PawCalm does NOT provide professional veterinary, medical, or certified dog training advice. The AI-generated content is for informational purposes only and should not be considered a substitute for professional consultation.</p>
            <p className="mt-2">You should always consult with a qualified veterinarian or certified animal behaviorist for serious behavioral issues. If your dog shows signs of aggression, self-harm, or severe anxiety, seek professional help immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">4. User Responsibilities</h2>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The safety and wellbeing of your pet</li>
              <li>Determining whether any suggestions are appropriate for your specific situation</li>
              <li>Supervising your pet during any training activities</li>
              <li>Providing accurate information about your pet</li>
              <li>Maintaining the confidentiality of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">5. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAWCALM AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Injury to you, your pet, or any third party</li>
              <li>Property damage</li>
              <li>Loss of data</li>
              <li>Loss of profits or revenue</li>
              <li>Any damages resulting from your use of or inability to use the Service</li>
            </ul>
            <p className="mt-2">You use this Service entirely at your own risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">6. Disclaimer of Warranties</h2>
            <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT ANY CONTENT OR SUGGESTIONS WILL BE ACCURATE OR RELIABLE.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">7. Indemnification</h2>
            <p>You agree to indemnify and hold harmless PawCalm, its operators, and affiliates from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">8. User Content</h2>
            <p>By uploading videos or other content, you grant PawCalm a non-exclusive license to use this content for providing and improving the Service. You retain ownership of your content and can delete it at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">9. Beta Service</h2>
            <p>PawCalm is currently in beta. Features may change, be removed, or malfunction. We make no guarantees about the availability or functionality of any feature.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">10. Termination</h2>
            <p>We reserve the right to terminate or suspend your access to the Service at any time, for any reason, without notice.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">11. Changes to Terms</h2>
            <p>We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">12. Governing Law</h2>
            <p>These Terms shall be governed by the laws of the Commonwealth of Massachusetts, United States, without regard to conflict of law principles.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">13. Contact</h2>
            <p>For questions about these Terms, contact us at: legal@pawcalm.ai</p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-emerald-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}