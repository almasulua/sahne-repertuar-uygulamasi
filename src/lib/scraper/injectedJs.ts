/**
 * WebView'a enjekte edilen JavaScript.
 * Sayfanın metin içeriğini çeker ve postMessage ile React Native'e gönderir.
 */
export const EXTRACT_CONTENT_JS = `
(function() {
  try {
    // Akor sitelerinde yaygın selector'lar
    var selectors = [
      'pre',
      '.chord-pro', '.chordpro',
      '.song-text', '.song-content', '.song-body',
      '.lyrics', '.lyrics-body', '.lyric',
      '.chord-sheet', '.chord_sheet',
      '.tablature', '.tab-content',
      '[data-content="chord"]',
      '.cnt', '.content_cnt',
    ];

    var content = '';
    var title = document.title || '';

    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.innerText && el.innerText.trim().length > 50) {
        content = el.innerText;
        break;
      }
    }

    // Fallback: body'nin metin içeriği
    if (!content) {
      var main = document.querySelector('main') || document.querySelector('article') || document.body;
      content = main ? main.innerText : '';
    }

    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'content',
      title: title,
      content: content.substring(0, 50000),
      url: window.location.href
    }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'error',
      message: e.message
    }));
  }
})();
`;
