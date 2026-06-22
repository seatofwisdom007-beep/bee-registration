import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    console.log('Auth attempt - received password:', password);
    console.log('Auth attempt - env password:', adminPassword);
    console.log('Auth attempt - passwords match:', password === adminPassword);
    
    if (!adminPassword) {
      console.log('Admin password not configured');
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }
    
    // Normalize and compare
    const trimmedReceived = String(password).trim();
    const trimmedEnv = String(adminPassword).trim();
    
    console.log('Trimmed received:', trimmedReceived);
    console.log('Trimmed env:', trimmedEnv);
    console.log('Trimmed match:', trimmedReceived === trimmedEnv);
    
    if (trimmedReceived === trimmedEnv) {
      console.log('Authentication successful');
      return NextResponse.json({ authenticated: true }, { status: 200 });
    } else {
      console.log('Authentication failed - password mismatch');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
