import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';

/**
 * Scraping & kirim info Live Stream Toram Online
 */
export const liveStream = async (sock, chatId, msg) => {
  const TORAM_EVENT_URL = 'https://en.toram.jp/?type_code=event#contentArea';
  const TIMEZONE = 'Asia/Jakarta';

  const LIVE_KEYWORDS = [
    'live', 'livestream', 'live stream', 'viewer present',
    'bemmo', 'youtube', 'watch'
  ];

  try {
    await sock.sendMessage(chatId, {
      text: 'Mengecek live streaming Toram Online terbaru...',
      quoted: msg
    });

    // Scraping halaman event
    const response = await axios.get(TORAM_EVENT_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const liveStreamNews = [];

    $('a[href*="/information/detail/"]').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.text().trim();
      const url = $elem.attr('href');

      let dateText = $elem.find('[class*="date"], time').first().text().trim();
      if (!dateText) {
        dateText = $elem.closest('li').find('[class*="date"], time').first().text().trim();
      }

      const isLiveRelated = LIVE_KEYWORDS.some(keyword =>
        title.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isLiveRelated && title) {
        const infoId = url.match(/information_id=(\d+)/)?.[1];

        liveStreamNews.push({
          title: title.replace(/\s+/g, ' ').trim(),
          url: url.startsWith('http') ? url : `https://en.toram.jp${url}`,
          date: dateText,
          infoId,
        });
      }
    });

    if (liveStreamNews.length === 0) {
      await sock.sendMessage(chatId, {
        text: 'Tidak ada live streaming terbaru\n\nCoba lagi nanti atau cek website resmi Toram Online\n\nhttps://en.toram.jp/?type_code=event',
        quoted: msg
      });
      return;
    }

    const latestLive = liveStreamNews[0];
    console.log('Live stream ditemukan:', latestLive.title);

    // Scraping detail live stream
    const detailResponse = await axios.get(latestLive.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    const $detail = cheerio.load(detailResponse.data);
    const content = $detail.text();

    const liveDetail = {
      title: latestLive.title,
      date: latestLive.date,
      time: '',
      youtubeUrl: '',
      thumbnailUrl: '',
      programs: [],
      presents: false,
    };

    // Extract waktu live stream
    const timePatterns = [
      /(\d{1,2}\/\d{1,2}\([A-Za-z]+\)\s+\d{1,2}:\d{2}\s+[AP]M\s+\(JST\/?\s*GMT\+9\))/i,
      /(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}\s+[AP]M)/i,
      /Start:\s*(.+?(?:JST|GMT\+9))/i,
      /Time:\s*(.+?(?:JST|GMT\+9))/i,
    ];

    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        liveDetail.time = match[1].trim();
        break;
      }
    }

    // Extract YouTube URL dari iframe
    const iframe = $detail('iframe[src*="youtube"]').first();
    if (iframe.length > 0) {
      liveDetail.youtubeUrl = iframe.attr('src');

      const videoIdMatch = liveDetail.youtubeUrl.match(/embed\/([a-zA-Z0-9_-]+)/);
      if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        liveDetail.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // Extract YouTube URL dari link
    if (!liveDetail.youtubeUrl) {
      $detail('a[href*="youtube.com"], a[href*="youtu.be"]').each((i, elem) => {
        const href = $detail(elem).attr('href');
        if (href && !liveDetail.youtubeUrl) {
          liveDetail.youtubeUrl = href;

          const videoIdMatch = href.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          if (videoIdMatch) {
            const videoId = videoIdMatch[1];
            liveDetail.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          }
        }
      });
    }

    // Extract YouTube URL dari text
    if (!liveDetail.youtubeUrl) {
      const urlMatch = content.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        liveDetail.youtubeUrl = urlMatch[0];
        liveDetail.thumbnailUrl = `https://img.youtube.com/vi/${urlMatch[1]}/maxresdefault.jpg`;
      }
    }

    // Extract gambar banner jika tidak ada thumbnail YouTube
    if (!liveDetail.thumbnailUrl) {
      const bannerImg = $detail('img[src*="banner"], img[src*="live"], .live-banner img').first();
      if (bannerImg.length > 0) {
        let imgSrc = bannerImg.attr('src');
        if (imgSrc && !imgSrc.startsWith('http')) {
          imgSrc = `https://en.toram.jp${imgSrc}`;
        }
        liveDetail.thumbnailUrl = imgSrc;
      }
    }

    // Extract program acara
    const programSection = content.match(/★:Live Contents([\s\S]*?)(?:Live Viewer Present|BeMMO Show|\*Only the players)/i);
    if (programSection) {
      const programs = programSection[1]
        .split('\n')
        .filter(line => line.trim().startsWith('★:') || line.trim().startsWith('・'))
        .map(line => line.replace(/^[★・]\s*:?\s*/, '').trim())
        .filter(line => line.length > 0);

      liveDetail.programs = programs;
    }

    // Check viewer present
    liveDetail.presents = content.toLowerCase().includes('viewer present') ||
      content.toLowerCase().includes('lucky draw') ||
      content.toLowerCase().includes('keyword');

    // Format pesan WhatsApp
    const now = moment().tz(TIMEZONE);
    let message = `TORAM LIVE STREAM

${liveDetail.title}

`;

    if (liveDetail.time) {
      message += `Waktu Live:\n${liveDetail.time}\n\n`;
    }

    if (liveDetail.youtubeUrl) {
      message += `YouTube Link:\n${liveDetail.youtubeUrl}\n\n`;
    }

    if (liveDetail.programs.length > 0) {
      message += `Program Acara:\n`;
      liveDetail.programs.forEach((program, i) => {
        message += `${i + 1}. ${program}\n`;
      });
      message += '\n';
    }

    if (liveDetail.presents) {
      message += `Viewer Present: Ada\nJangan lupa ikuti live stream untuk mendapatkan hadiah in-game\n\n`;
    }

    message += `Dicek: ${now.format('DD/MM/YYYY HH:mm')} WIB\n`;
    message += `Info: ${latestLive.url}\n\n`;
    message += `Kirim !live untuk cek lagi`;

    // Kirim pesan dengan gambar jika ada thumbnail
    if (liveDetail.thumbnailUrl) {
      try {
        await sock.sendMessage(chatId, {
          image: { url: liveDetail.thumbnailUrl },
          caption: message,
        }, { quoted: msg });

        console.log('Live stream info (dengan gambar) terkirim');
      } catch (imgError) {
        console.log('Gagal kirim gambar, kirim text saja:', imgError.message);
        await sock.sendMessage(chatId, { text: message, quoted: msg });
      }
    } else {
      await sock.sendMessage(chatId, { text: message, quoted: msg });
      console.log('Live stream info (tanpa gambar) terkirim');
    }

  } catch (error) {
    console.error('Error in liveStream:', error.message);

    let errorMsg = 'Terjadi kesalahan\n\n';

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      errorMsg += 'Koneksi timeout. Website mungkin sedang lambat.';
    } else if (error.response?.status === 404) {
      errorMsg += 'Halaman tidak ditemukan.';
    } else if (error.response?.status >= 500) {
      errorMsg += 'Server sedang bermasalah.';
    } else {
      errorMsg += `${error.message}`;
    }

    errorMsg += '\n\nCek langsung di:\nhttps://en.toram.jp/?type_code=event';

    await sock.sendMessage(chatId, { text: errorMsg, quoted: msg });
  }
}

/**
 * Daftar semua live streaming
 */
export async function liveStreamList(sock, chatId, msg, limit = 3) {
  try {
    await sock.sendMessage(chatId, {
      text: 'Mengambil daftar live streaming...',
      quoted: msg
    });

    const response = await axios.get('https://en.toram.jp/?type_code=event', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    const liveList = [];

    $('a[href*="/information/detail/"]').each((i, elem) => {
      const title = $(elem).text().trim();
      const url = $(elem).attr('href');

      const isLive = /live|livestream|viewer present|bemmo/i.test(title);

      if (isLive && liveList.length < limit) {
        const dateText = $(elem).closest('li').find('[class*="date"], time').first().text().trim();

        liveList.push({
          title: title.replace(/\s+/g, ' ').trim(),
          url: url.startsWith('http') ? url : `https://en.toram.jp${url}`,
          date: dateText,
        });
      }
    });

    if (liveList.length === 0) {
      await sock.sendMessage(chatId, {
        text: 'Tidak ada live streaming ditemukan',
        quoted: msg
      });
      return;
    }

    let message = `DAFTAR LIVE STREAM\n\n`;

    liveList.forEach((live, i) => {
      message += `${i + 1}. ${live.title}\n`;
      if (live.date) message += `   Tanggal: ${live.date}\n`;
      message += `   Link: ${live.url}\n\n`;
    });

    message += `Kirim !live untuk detail live terbaru`;

    await sock.sendMessage(chatId, { text: message, quoted: msg });
    console.log('Daftar live stream terkirim');

  } catch (error) {
    console.error('Error in liveStreamList:', error.message);
    await sock.sendMessage(chatId, {
      text: 'Gagal mengambil daftar live streaming',
      quoted: msg
    });
  }
}
