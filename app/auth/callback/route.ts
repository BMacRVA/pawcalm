import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  // Redirect to a client-side page that can handle the hash
  return NextResponse.redirect(new URL('/auth/confirm', requestUrl.origin))
}