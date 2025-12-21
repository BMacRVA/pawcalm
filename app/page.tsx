'use client'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-emerald-800 mb-4">
          🐾 PawCalm
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-Assisted Separation Anxiety Training
        </p>
        
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/signup'}
            className="w-64 bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition font-semibold"
          >
            Get Started
          </button>
          
          <p className="text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-emerald-600 font-semibold hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}