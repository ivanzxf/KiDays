import { supabase } from '@/lib/supabase';

const SESSION_FLAG = 'kidays_activity_session';

/**
 * 記錄一次使用者活動（用於後台日活統計）。
 * 同一個瀏覽器 session 只記錄一次，避免重新整理頁面時灌入大量重複資料。
 */
export async function logSessionStart(userId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    if (sessionStorage.getItem(SESSION_FLAG) === '1') return;
    sessionStorage.setItem(SESSION_FLAG, '1');
  } catch {
    // sessionStorage 不可用時（例如部分無痕模式）仍記錄一次
  }

  const { error } = await supabase.from('user_activity').insert({
    user_id: userId,
    event_type: 'session_start',
    path: window.location.pathname,
  });

  if (error) {
    console.error('Error logging user activity:', error);
  }
}
