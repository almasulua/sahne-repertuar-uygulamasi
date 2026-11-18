export const Config = {
  // Feature flags
  features: {
    googleAuth: false,       // Google ile giriş (EAS build gerektirir)
    appleAuth: false,        // Apple ile giriş (iOS + EAS)
    audioPlayer: false,      // Ses oynatıcı (MVP sonrası)
    chordDiagrams: true,     // Gitar/piyano akor diyagramları
    autoScroll: true,        // Otomatik kaydırma
    offlineSync: true,       // Çevrimdışı senkronizasyon
    stageMode: true,         // Sahne modu (setlist)
    polls: true,             // Oylama sistemi
    events: true,            // Takvim/etkinlik planlama
    pushNotifications: true, // Push bildirimler
    webBrowser: true,        // Web'den akor çekme
  },

  // Cache / offline
  cache: {
    staleTime: 1000 * 60 * 5,          // 5 dakika
    gcTime: 1000 * 60 * 60 * 24 * 7,   // 7 gün
    maxOfflineDays: 7,
  },

  // Chat
  chat: {
    messagePageSize: 30,
    realtimeChannel: 'group_chat',
  },

  // Autoscroll
  autoscroll: {
    defaultSpeed: 3, // px/s
    minSpeed: 1,
    maxSpeed: 10,
  },

  // Transpose
  transpose: {
    min: -6,
    max: 6,
  },

  // Capo (perde)
  capo: {
    min: 0,
    max: 11,
  },

  // Stage Mode
  stageMode: {
    defaultFontSize: 22,
    minFontSize: 16,
    maxFontSize: 40,
    darkBackground: '#0a0a0a',
  },
} as const;
