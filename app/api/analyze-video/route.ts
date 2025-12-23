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
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true })
  }

  const { stdout: durationOutput } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  )
  const duration = parseFloat(durationOutput.trim())
  
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

async function analyzeFrames(frames: string[], dogName: string): Promise<{ isDog: boolean; analysis: string | null; triggers: string[] }> {
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
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    verificationResult = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
  } catch {
    verificationResult = { isDog: false, reason: 'Could not verify content' }
  }

  // If no dog detected, return null analysis (will be deleted)
  if (!verificationResult.isDog) {
    return {
      isDog: false,
      analysis: null,
      triggers: []
    }
  }

  // Behavior analysis with fun personality
  const analysisResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert dog behaviorist with a warm, encouraging personality. You're analyzing video frames of ${dogName || 'a dog'} during a separation period.

IMPORTANT: Be accurate and don't over-diagnose. Many normal dog behaviors are NOT signs of anxiety:

**NORMAL behaviors (NOT anxiety):**
- Calmly walking around exploring
- Sniffing the environment
- Lying down relaxed (soft body, normal breathing)
- Looking out windows casually
- Tail wagging with relaxed body
- Sitting or standing calmly
- Playing with toys
- Eating or drinking normally
- Stretching or yawning once (not repeatedly)

**ACTUAL anxiety signs (only flag if clearly present):**
- Pacing in repetitive patterns (same path over and over)
- Excessive panting when not hot or after exercise
- Drooling excessively
- Trembling or shaking visibly
- Whale eye (whites of eyes showing with tense face)
- Ears pinned flat back against head
- Tail tucked tightly between legs
- Lowered, cowering body posture
- Lip licking repeatedly (not after eating)
- Yawning repeatedly (stress signal)
- Scratching at doors/windows frantically
- Destructive behavior
- Frozen/statue-like stillness with tense body
- Attempting to escape

**Your response style:**
- Be warm, friendly, and encouraging
- Use ${dogName}'s name throughout
- Add fun observations about their personality
- Use emojis sparingly but effectively
- Celebrate calm behavior enthusiastically
- If there IS anxiety, be compassionate and hopeful

Format your response like this:

## ${dogName}'s Vibe Check 🐕
(A fun, 1-2 sentence summary of their overall mood - be creative and specific to what you see!)

## What I Spotted
(Frame-by-frame observations, written in an engaging way. Note specific behaviors you actually see.)

## The Verdict
**Anxiety Level: [None 😎 / Mild 😊 / Moderate 😟 / Severe 😰]**
(Brief explanation of why you chose this level based on what you observed)

## The Good Stuff ✨
(Positive behaviors - celebrate these! Be specific about what ${dogName} is doing well.)

## Tips for ${dogName}
(If anxiety detected: compassionate, specific recommendations)
(If calm: encouragement and maybe fun enrichment ideas to keep them happy)`
      },
      {
        role: 'user',
        content: [
          { 
            type: 'text', 
            text: `Analyze these ${frames.length} frames of ${dogName}. Be accurate - don't assume anxiety if the dog looks calm. Make it fun and personalized to what you actually observe!` 
          },
          ...frameImages.map((base64) => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${base64}` }
          }))
        ]
      }
    ],
    max_tokens: 1500
  })

  const analysis = analysisResponse.choices[0]?.message?.content || 'Analysis could not be completed.'

  // Only extract triggers if there's actual anxiety detected
  const analysisLower = analysis.toLowerCase()
  const hasAnxiety = analysisLower.includes('mild 😊') || 
                     analysisLower.includes('moderate 😟') || 
                     analysisLower.includes('severe 😰')

  let triggers: string[] = []
  
  if (hasAnxiety) {
    const triggerKeywords = [
      'pacing', 'panting', 'drooling', 'trembling', 'shaking',
      'whining', 'barking', 'howling', 'scratching', 'destruction',
      'whale eye', 'tucked tail', 'cowering', 'escape'
    ]
    
    triggers = triggerKeywords.filter(keyword => 
      analysisLower.includes(keyword)
    )
  }

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

    const tempDir = path.join('/tmp', `video-analysis-${videoId}`)
    const videoPath = path.join(tempDir, 'video.mp4')
    const framesDir = path.join(tempDir, 'frames')
    
    tempDirs.push(tempDir)
    tempFiles.push(videoPath)

    console.log('Downloading video...')
    await mkdir(tempDir, { recursive: true })
    await downloadVideo(videoUrl, videoPath)

    console.log('Extracting frames...')
    const frames = await extractFrames(videoPath, framesDir, 5)
    tempFiles.push(...frames)
    tempDirs.push(framesDir)

    console.log('Analyzing frames with AI...')
    const { isDog, analysis, triggers } = await analyzeFrames(frames, dogName)

    // If no dog detected, delete the record
    if (!isDog) {
      console.log('No dog detected - deleting video record')
      
      await supabase
        .from('video_analyses')
        .delete()
        .eq('id', videoId)
      
      await cleanup(tempFiles, tempDirs)
      
      return NextResponse.json({ 
        success: false, 
        isDog: false, 
        message: 'No dog detected in video. Please upload a video that shows your dog.' 
      })
    }

    // Update database with analysis
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

    await cleanup(tempFiles, tempDirs)

    console.log('Analysis complete: Dog detected and analyzed')

    return NextResponse.json({ success: true, isDog: true, triggers })
  } catch (error) {
    console.error('Video analysis error:', error)

    await cleanup(tempFiles, tempDirs)

    if (videoId) {
      // Delete failed records instead of marking as failed
      await supabase
        .from('video_analyses')
        .delete()
        .eq('id', videoId)
    }

    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}