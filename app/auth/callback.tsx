import { Redirect } from 'expo-router';

/**
 * OAuth dönüş adresi (muzikapp://auth/callback).
 * Kod → oturum değişimini authApi.signInWithOAuth yapar; bu rota yalnızca
 * bazı Android cihazlarda deep link'in router'a da düşmesi durumunda
 * "Sayfa bulunamadı" ekranı yerine kullanıcıyı ana akışa geri gönderir.
 * Auth gate oturuma göre doğru ekrana yönlendirir.
 */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
