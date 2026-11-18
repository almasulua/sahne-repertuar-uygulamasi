export type UserLevel = 'beginner' | 'intermediate' | 'advanced' | 'professional';

export interface User {
  id: string;
  /**
   * Yalnızca kendi profilinde ve auth session'ından (auth.users) gelir.
   * Güvenlik: public.users.email kolonu anon/authenticated rollerinden REVOKE edildi
   * (017_security_hardening), bu yüzden başkalarının profili için undefined olur.
   */
  email?: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  instruments: string[];
  genres: string[];
  level: UserLevel | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  push_token?: string | null;
  notification_preferences?: import('./notification').NotificationPreferences;
  // computed
  stats?: {
    songCount: number;
    groupCount: number;
  };
}
