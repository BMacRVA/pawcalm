export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚠️ Important Disclaimer</h1>
        <p className="text-gray-500 text-sm mb-8">Last updated: December 22, 2025</p>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-amber-800 mb-3">PawCalm is NOT a Substitute for Professional Help</h2>
            <p className="text-amber-900">
              PawCalm uses artificial intelligence to provide general suggestions for dog separation anxiety training. 
              This is NOT veterinary advice, medical advice, or professional dog training advice.
            </p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-blue-800 mb-3">Beta Service</h2>
            <p className="text-blue-900">
              PawCalm is currently in BETA. This means the service is provided on an "as-is" and "as-available" basis. 
              Features may change, break, or be removed without notice. Data may be lost. 
              By using this beta service, you accept these risks.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">When to Seek Professional Help</h2>
            <p>You should consult a veterinarian or certified animal behaviorist if your dog:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Shows signs of aggression</li>
              <li>Injures themselves when alone</li>
              <li>Has severe anxiety that doesn't improve</li>
              <li>Stops eating or drinking</li>
              <li>Shows signs of depression</li>
              <li>Has any sudden behavioral changes</li>
              <li>Has underlying health conditions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">AI Limitations</h2>
            <p>Our AI:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cannot see or assess your dog in person</li>
              <li>Cannot diagnose medical or behavioral conditions</li>
              <li>May generate suggestions that are not appropriate for your specific situation</li>
              <li>May produce inaccurate, incomplete, or harmful information</li>
              <li>Is not a replacement for professional training or veterinary care</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Your Responsibility</h2>
            <p>By using PawCalm, you acknowledge that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You are solely responsible for your pet's safety and wellbeing</li>
              <li>You will use your own judgment before following any suggestions</li>
              <li>You will supervise your pet during all training activities</li>
              <li>You will seek professional help when needed</li>
              <li>You assume all risks associated with training your pet</li>
              <li>You are responsible for any property damage or injuries that may occur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">No Guarantees</h2>
            <p>We make no guarantees about:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The effectiveness of any training suggestions</li>
              <li>Improvement in your dog's behavior</li>
              <li>The accuracy of AI-generated content</li>
              <li>Results within any specific timeframe</li>
              <li>The availability or reliability of the service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PAWCALM AND ITS OWNERS, OPERATORS, EMPLOYEES, AND AGENTS 
              SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Injury to you, your pet, or any third party</li>
              <li>Property damage</li>
              <li>Loss of data</li>
              <li>Loss of income or profits</li>
              <li>Emotional distress</li>
              <li>Any other damages arising from your use of PawCalm</li>
            </ul>
            <p className="mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO USE PAWCALM IN THE 
              TWELVE (12) MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS LESS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Assumption of Risk</h2>
            <p>
              You expressly acknowledge and agree that your use of PawCalm and any training activities 
              you undertake based on information from PawCalm are at your sole risk. Dog training involves 
              inherent risks including but not limited to bites, scratches, property damage, and unpredictable 
              animal behavior. You voluntarily assume all such risks.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless PawCalm and its owners, operators, employees, 
              and agents from any claims, damages, losses, or expenses (including reasonable attorney fees) 
              arising from your use of the service, your violation of these terms, or your violation of any 
              rights of a third party.
            </p>
          </section>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold text-red-800 mb-3">Emergency Situations</h2>
            <p className="text-red-900">
              If your pet is in immediate danger or experiencing a medical emergency, 
              contact your veterinarian or emergency animal hospital immediately. 
              Do not rely on PawCalm for emergency situations.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Third-Party Content</h2>
            <p>
              PawCalm may include videos and content from third-party trainers. We do not endorse, guarantee, 
              or assume responsibility for any third-party content. Your interactions with trainers through 
              our marketplace are solely between you and the trainer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3">Changes to This Disclaimer</h2>
            <p>
              We may update this disclaimer at any time. Continued use of PawCalm after changes constitutes 
              acceptance of the updated terms. We encourage you to review this page periodically.
            </p>
          </section>

        </div>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-amber-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}