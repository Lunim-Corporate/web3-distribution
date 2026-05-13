import { NextResponse } from 'next/server';
import { getNotifications, markAsRead } from '@/lib/notifications';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const notifications = await getNotifications(userId);
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });

    const success = await markAsRead(id);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
