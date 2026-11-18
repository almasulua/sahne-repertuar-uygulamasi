import { useMutation } from '@tanstack/react-query';
import { pushApi, type SendPushParams, type SendPushResult } from '../api/push';

/**
 * Edge function üzerinden push notification gönderir.
 * Manuel kullanım için (admin paneli, test, vs.).
 * Triggerlar zaten DB tarafından otomatik gönderiyor — bu hook
 * ad-hoc bildirim göndermek için ya da `persist: false` ile sadece push
 * göndermek için.
 */
export function useSendPushNotification() {
  return useMutation<SendPushResult, Error, SendPushParams>({
    mutationFn: (params) => pushApi.send(params),
  });
}
