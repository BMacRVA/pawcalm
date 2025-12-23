import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'PawCalm - AI Dog Separation Anxiety Training'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: '#FDFBF7',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 20 }}>🐾</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#451a03',
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          Calm your anxious dog
        </div>
        <div
          style={{
            fontSize: 48,
            color: '#d97706',
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          in 5 minutes a day
        </div>
        <div
          style={{
            fontSize: 28,
            color: '#92400e',
            textAlign: 'center',
          }}
        >
          AI-powered daily missions • Free during beta
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#b45309',
          }}
        >
          pawcalm.ai
        </div>
      </div>
    ),
    { ...size }
  )
}