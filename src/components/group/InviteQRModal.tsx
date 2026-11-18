import React from 'react';
import { View, Text, Modal, TouchableOpacity, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useUIStore } from '../../stores/uiStore';

interface Props {
  visible: boolean;
  inviteUrl: string;
  groupName: string;
  onClose: () => void;
}

export function InviteQRModal({ visible, inviteUrl, groupName, onClose }: Props) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteUrl);
    showToast({ message: t('groups.inviteCopied'), type: 'success' });
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('groups.inviteShareText', '{{group}} grubuna katılmak için tıkla: {{url}}', {
          group: groupName,
          url: inviteUrl,
        }),
        title: groupName,
      });
    } catch (e) {
      if (__DEV__) console.warn('[invite share]', e);
      Alert.alert(t('common.error'), String(e));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <SafeAreaView className="bg-light-surface dark:bg-surface rounded-3xl w-full max-w-sm p-6 items-center">
          <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold mb-1 text-center">
            {t('groups.inviteQrTitle', 'Grup Davet QR')}
          </Text>
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center mb-5" numberOfLines={2}>
            {t(
              'groups.inviteQrSubtitle',
              'Üye olmak isteyen kişi telefon kamerasıyla bu QR\'ı taratabilir.',
            )}
          </Text>

          <View className="bg-white p-4 rounded-2xl mb-5">
            <QRCode value={inviteUrl} size={200} backgroundColor="#fff" color="#000" />
          </View>

          <Text className="text-light-text-muted dark:text-text-muted text-xs font-mono mb-4 text-center" numberOfLines={1}>
            {inviteUrl}
          </Text>

          <View className="flex-row gap-2 w-full mb-2">
            <TouchableOpacity
              onPress={handleCopy}
              className="flex-1 bg-light-surface-2 dark:bg-surface-2 py-3 rounded-xl items-center border border-light-border dark:border-border"
            >
              <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">{t('common.copy')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white text-sm font-semibold">{t('common.share', 'Paylaş')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={onClose} className="mt-2 py-2">
            <Text className="text-light-text-muted dark:text-text-muted text-sm">{t('common.done')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
