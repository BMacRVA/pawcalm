import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { writeFile, mkdir, readFile, unlink, rmdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

async function downloadVideo(url: string, filepath: string): Promise<void> {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()
  await writeFile(filepath, Buffer.from(buffer))
}

async function extractFrames(videoPath: string, outputDir: string, numFrames: number = 5): Promise<string[]> {
  // Create output directory
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  // Get video duration
  const { stdout: durationOutput } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  )
  const duration = parseFloat(durationOutput.trim())
  
  // Calculate intervals
  const interval = duration / (numFrames + 1)
  const frames: string[] = []

  for (let i = 1; i <= numFrames; i++) {
    const timestamp = interval * i
    const outputPath = path.join(outputDir, `frame_${i}.jpg`)
    
    await execAsync(
      `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`
    )
    
    frames.push(outputPath)
  }

  return frames
}

async function analyzeFrames(frames: string[], dogName: string): Promise<{ isDog: boolean; analysis: string; triggers: string[] }> {
  // Read frames and convert to base64
  const frameImages = await Promise.all(
    frames.map(async (framePath) => {
      const buffer = await readFile(framePath)
      return buffer.toString('base64')
    })
  )

  // First, verify there's a dog in the video
  const verificationResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are analyzing video frames to verify they contain a dog. 
Respond with JSON only: { "isDog": true/false, "confidence": "high/medium/low", "reason": "brief explanation" }
If you see a dog, isDog is true. If you see no dog, or only humans/other animals/random content, isDog is false.`
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Do these video frames contain a dog? Respond with JSON only.' },
          ...frameImages.map(base64 => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          }))
        ]
      }
    ],
    max_tokens: 200
  })

  let verificationResult
  try {
    const content = verificationResponse.choices[0]?.message?.content || '{}'
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    verificationResult = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
  } catch {
    verificationResult = { isDog: false, reason: 'Could not verify content' }
  }

  if (!verificationResult.isDog) {
    return {
      isDog: false,
      analysis: `## Unable to Analyze Video

We couldn't detect a dog in this video. Please upload a video that clearly shows ${dogName || 'your dog'} during a separation period.

**Tips for a good video:**
- Make sure ${dogName || 'your dog'} is visible in the frame
- Record from an angle that captures their full body
- Ensure adequate lighting

Reason: ${verificationResult.reason || 'No dog detected in video frames'}`,
      triggers: []
    }
  }

  // Now analyze the dog's behavior
  const analysisResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert dog behaviorist specializing in separation anxiety. You're analyzing video frames of a dog named ${dogName || 'a dog'} who was left alone.

Analyze the frames carefully for:

1. **Body Language Signs:**
   - Pacing or restlessness
   - Panting (when not hot)
   - Drooling
   - Trembling or shaking
   - Lip licking or yawning (stress signals)
   - Whale eye (showing whites of eyes)
   - Ears pinned back
   - Tail tucked or stiff
   - Lowered body posture

2. **Position & Movement:**
   - Staying near door/exit
   - Pacing patterns
   - Hiding behavior
   - Destructive positioning (near doors, furniture)
   - Settled vs. unsettled

3. **Overall Assessment:**
   - Anxiety level: None / Mild / Moderate / Severe
   - Key concerns observed
   - Positive signs (if any)

4. **Specific Recommendations:**
   - Based on what you observe, provide 2-3 specific training recommendations

Be specific about what you actually see in the frames. If the dog appears calm, say so. Don't invent problems that aren't visible.

Format your response with clear headers and bullet points.`
      },
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: `Please analyze these ${frames.length} frames from a video of ${dogName || 'a dog'} during a separation period. What behaviors and body language do you observe? Provide specific, actionable insights.` 
          },
          ...frameImages.map((base64, i) => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          }))
        ]
      }
    ],
    max_tokens: 1500
  })

  const analysis = analysisResponse.choices[0]?.message?.content || 'Analysis could not be completed.'

  // Extract triggers from the analysis
  const triggerKeywords = [
    'pacing', 'panting', 'drooling', 'trembling', 'shaking',
    'whining', 'barking', 'howling', 'scratching', 'destruction',
    'door', 'exit', 'anxious', 'stressed', 'restless', 'unsettled'
  ]
  
  const analysisLower = analysis.toLowerCase()
  const triggers = triggerKeywords.filter(keyword => 
    analysisLower.includes(keyword)
  )

  return { isDog: true, analysis, triggers }
}

async function cleanup(files: string[], dirs: string[]): Promise<void> {
  for (const file of files) {
    try {
      if (existsSync(file)) await unlink(file)
    } catch (e) {
      console.error('Cleanup file error:', e)
    }
  }
  for (const dir of dirs) {
    try {
      if (existsSync(dir)) await rmdir(dir, { recursive: true } as any)
    } catch (e) {
      console.error('Cleanup dir error:', e)
    }
  }
}

export async function POST(request: Request) {
  let videoId: string | null = null
  const tempFiles: string[] = []
  const tempDirs: string[] = []
  
  try {
    const body = await request.json()
    videoId = body.videoId
    const videoUrl = body.videoUrl
    const dogName = body.dogName || 'your dog'

    console.log('Analyzing video:', videoId, 'for dog:', dogName)

    if (!videoId || !videoUrl) {
      return NextResponse.json({ error: 'Missing videoId or videoUrl' }, { status: 400 })
    }

    // Create temp directory for this analysis
    const tempDir = path.join('/tmp', `video-analysis-${videoId}`)
    const videoPath = path.join(tempDir, 'video.mp4')
    const framesDir = path.join(tempDir, 'frames')
    
    tempDirs.push(tempDir)
    tempFiles.push(videoPath)

    // Download video
    console.log('Downloading video...')
    await mkdir(tempDir, { recursive: true })
    await downloadVideo(videoUrl, videoPath)

    // Extract frames
    console.log('Extracting frames...')
    const frames = await extractFrames(videoPath, framesDir, 5)
    tempFiles.push(...frames)
    tempDirs.push(framesDir)

    // Analyze frames
    console.log('Analyzing frames with AI...')
    const { isDog, analysis, triggers } = await analyzeFrames(frames, dogName)

    // Update database
    const { error } = await supabase
      .from('video_analyses')
      .update({
        analysis: analysis,
        triggers_detected: triggers,
        status: 'analyzed'
      })
      .eq('id', videoId)

    if (error) {
      console.error('Database update error:', error)
      throw error
    }

    // Cleanup temp files
    await cleanup(tempFiles, tempDirs)

    console.log('Analysis complete:', isDog ? 'Dog detected' : 'No dog detected')

    return NextResponse.json({ success: true, isDog, triggers })
  } catch (error) {
    console.error('Video analysis error:', error)

    // Cleanup on error
    await cleanup(tempFiles, tempDirs)

    // Update status to failed
    if (videoId) {
      await supabase
        .from('video_analyses')
        .update({ 
          status: 'failed',
          analysis: 'Analysis failed. Please try uploading again. Make sure the video is a valid format (MP4, MOV, WebM) and under 100MB.'
        })
        .eq('id', videoId)
    }

    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}