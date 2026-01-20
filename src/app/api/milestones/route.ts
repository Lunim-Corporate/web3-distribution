import { NextResponse } from 'next/server';
import { mockMilestones } from '@/data/mockData';

export async function GET() {
  return NextResponse.json(mockMilestones);
}


