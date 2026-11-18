import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { SetlistWithItems } from '../../types/setlist';

/** Setlist'i PDF olarak oluştur ve paylaş */
export async function exportSetlistPdf(setlist: SetlistWithItems): Promise<void> {
  const rows = setlist.items
    .map((item, idx) => {
      if (item.item_type === 'break') {
        return `<tr style="background:#f5f5f5">
          <td style="padding:8px;text-align:center">${idx + 1}</td>
          <td colspan="3" style="padding:8px;text-align:center;font-style:italic">
            Mola ${item.break_duration ? `(${item.break_duration} dk)` : ''}
          </td>
        </tr>`;
      }
      const song = item.song;
      return `<tr>
        <td style="padding:8px;text-align:center">${idx + 1}</td>
        <td style="padding:8px">${song?.title ?? 'Bilinmeyen Şarkı'}</td>
        <td style="padding:8px">${song?.artist ?? '-'}</td>
        <td style="padding:8px;text-align:center">${item.custom_key ?? song?.key ?? '-'}</td>
      </tr>`;
    })
    .join('');

  const html = `
    <html>
      <head><meta charset="utf-8"/></head>
      <body style="font-family:sans-serif;padding:24px">
        <h1 style="margin-bottom:4px">${setlist.name}</h1>
        ${setlist.description ? `<p style="color:#666">${setlist.description}</p>` : ''}
        ${setlist.venue ? `<p><strong>Mekan:</strong> ${setlist.venue}</p>` : ''}
        ${setlist.event_date ? `<p><strong>Tarih:</strong> ${new Date(setlist.event_date).toLocaleDateString('tr-TR')}</p>` : ''}
        <table style="width:100%;border-collapse:collapse;margin-top:16px" border="1" bordercolor="#ddd">
          <thead><tr style="background:#333;color:#fff">
            <th style="padding:8px;width:40px">#</th>
            <th style="padding:8px">Şarkı</th>
            <th style="padding:8px">Sanatçı</th>
            <th style="padding:8px;width:60px">Ton</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
}
