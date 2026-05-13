import { supabaseAdmin } from './supabaseServer';

export interface Notification {
  id: string;
  user_id: string;
  project_id: string;
  type: 'revenue' | 'system' | 'rights';
  title: string;
  message: string;
  amount?: number;
  is_read: boolean;
  created_at: string;
}

/**
 * Dispatches a revenue notification to a user.
 * In a real-world scenario, this would also trigger an email (e.g., via Resend).
 */
export async function sendRevenueNotification(
  userId: string,
  projectId: string,
  amountUSD: number,
  projectName: string
) {
  try {
    const amountFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountUSD);

    const notificationData = {
      user_id: userId,
      project_id: projectId,
      type: 'revenue',
      title: 'New Revenue Received',
      message: `You have received a distribution of ${amountFormatted} from project "${projectName}".`,
      amount: amountUSD,
      is_read: false,
    };

    // We try to insert into 'notifications' table. 
    // Fallback to 'activities' if 'notifications' doesn't exist yet in the user's specific Supabase instance.
    const { error: nError } = await supabaseAdmin.from('notifications').insert([notificationData]);

    if (nError) {
      console.warn('Notifications table likely missing, logging to activities instead:', nError.message);
      await supabaseAdmin.from('activities').insert([{
        user_id: userId,
        project_id: projectId,
        activity_type: 'revenue_alert',
        description: notificationData.message
      }]);
    }

    // SIMULATED EMAIL DISPATCH
    console.log(`[EMAIL DISPATCH] To: ${userId} | Subject: New Revenue | Body: ${notificationData.message}`);

    return true;
  } catch (error) {
    console.error('Failed to dispatch notification:', error);
    return false;
  }
}

export async function getNotifications(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    // Fallback to activities if notifications table missing
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    return (activities || []).map(a => ({
      id: a.id,
      type: 'revenue',
      title: 'Activity Alert',
      message: a.description,
      is_read: false,
      created_at: a.created_at
    }));
  }

  return data || [];
}

export async function markAsRead(notificationId: string) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  return !error;
}
