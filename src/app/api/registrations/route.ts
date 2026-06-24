import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const registration = await request.json();
    
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('registrations')
      .insert([
        {
          name: registration.name,
          category: registration.category,
          photo_data: registration.photoData,
          reg_number: registration.regNumber,
          reg_type: registration.regType || 'student',
          is_parent: registration.isParent || false,
          children: registration.children || null,
          attendance_mode: registration.attendanceMode || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to save registration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    let data: any, error: any;
    try {
      const result: any = await Promise.race([
        supabase
          .from('registrations')
          .select('*')
          .order('created_at', { ascending: false }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Supabase timeout')), 8000)
        )
      ]);
      
      data = result.data;
      error = result.error;
    } catch (timeoutError: any) {
      console.error('Supabase timeout or connection error:', timeoutError.message);
      // Return empty array on timeout/connection error with 200 status
      return NextResponse.json([], { 
        status: 200,
        headers: { 'X-Warning': 'Database temporarily unavailable' }
      });
    }

    if (error) {
      console.error('Supabase query error:', error);
      // If it's a connection/timeout error, return empty array
      if (error.message?.includes('timeout') || error.message?.includes('connection')) {
        return NextResponse.json([], { 
          status: 200,
          headers: { 'X-Warning': 'Database temporarily unavailable' }
        });
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to fetch registrations' },
        { status: 400 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Registration fetch error:', error?.message || error);
    
    // Return empty array on any error to prevent 522 HTML from being returned
    return NextResponse.json([], { 
      status: 200,
      headers: { 'X-Warning': 'Database service temporarily unavailable' }
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    );
  }
}
