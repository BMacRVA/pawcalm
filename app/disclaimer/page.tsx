export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">⚠️ Important Disclaimer</h1>
        <p className="text-gray-500 text-sm mb-8">Please read this carefully before using PawCalm</p>
        
        <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-amber-800 mb-3">PawCalm is NOT a Substitute for Professional Help</h2>
            <p className="text-amber-900">
              PawCalm uses artificial intelligence to provide general suggestions for dog separation anxiety training. 
              This is NOT veterinary advice, medical advice, or professional dog training advice.
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
            </ul>
          </section>

          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mt-6">
            <h2 className="text-xl font-bold text-red-800 mb-3">Emergency Situations</h2>
            <p className="text-red-900">
              If your pet is in immediate danger or experiencing a medical emergency, 
              contact your veterinarian or emergency animal hospital immediately. 
              Do not rely on PawCalm for emergency situations.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <a href="/" className="text-emerald-600 hover:underline">← Back to Home</a>
        </div>
      </div>
    </div>
  )
}