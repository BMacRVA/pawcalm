import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    console.log('Mux webhook:', type)

    if (type === 'video.asset.ready') {
      const assetId = data.id
      const playbackId = data.playback_ids?.[0]?.id
      const duration = data.duration

      await supabase
        .from('videos')
        .update({
          status: 'ready',
          mux_playback_id: playbackId,
          duration_seconds: Math.round(duration),
        })
        .eq('mux_asset_id', assetId)

      console.log('Video ready:', assetId)
    }

    if (type === 'video.asset.errored') {
      const assetId = data.id

      await supabase
        .from('videos')
        .update({ status: 'error' })
        .eq('mux_asset_id', assetId)

      console.log('Video error:', assetId)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}