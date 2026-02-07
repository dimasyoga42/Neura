import { ColdownUser } from "../admin/coldownChat.js";
import { hidetag } from "../admin/hidetag.js";
import { guide, listLeveling, menuMessage, messagePembolong, mq, stat, upbagId } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
import { Banner } from "../plugins/fitur/benner.js";
import { setMenu } from "../plugins/fitur/img.js";
import { getMt } from "../plugins/fitur/mt.js";
import { getAllReport, report } from "../plugins/fitur/report.js";
import Smeme from "../plugins/fitur/smeme.js";
import sticker from "../plugins/fitur/stiker.js";
import { cek } from "../plugins/fun/cek.js";
import { husbu, waifu } from "../plugins/fun/waifu.js";
import { setAfk } from "../plugins/sosial/afk.js";
import { cekProfile, myBio, myProfile, setDesc, setidBuff, setPP } from "../plugins/sosial/bio.js";
import { getNews, setNews } from "../plugins/sosial/news.js";
import { qc } from "../plugins/sosial/qc.js";
import { getRules, setrules } from "../plugins/sosial/rules.js";
import { ability, searchAbility, searchApp, searchItem, searchRegist, searchXtall, Xtall } from "../plugins/toram/anyitems.js";
import Bossdef, { listboss } from "../plugins/toram/bos.js";
import { dyePredictor } from "../plugins/toram/dye.js";
import { leveling } from "../plugins/toram/lv.js";
import { clearRaid, createRaid, joinRaid, leaveRaid, viewRaid } from "../plugins/toram/raidControl.js";
import fs from "fs";
import { Remini } from "../plugins/vip/tools/remini.js";
import { play, ytmp3 } from "../plugins/vip/downloader/play.js";
import { pin } from "../plugins/vip/downloader/pinterst.js";
import { Caklontong, Family100, tebakGambar } from "../plugins/fun/caklontong.js";
import { autoGempa } from "../plugins/vip/tools/bmkg.js";
import { listSkill, skill } from "../plugins/toram/skill.js";
import { Spotifysearch } from "../plugins/vip/downloader/spotify.js";
import { bosboost } from "../plugins/toram/boost.js";
import { buff, getAllBuff, setBuff } from "../plugins/toram/buff.js";
import { searchMonster } from "../plugins/toram/monster.js";
import { pet } from "../plugins/toram/pet.js";
import { spmadv } from "../plugins/toram/adv.js";
import { formatResultMessage, parseCommand, tanaka, validateStatConfig } from "../plugins/toram/tanaka.js"
import { hd } from "../plugins/vip/tools/hd.js";
import { liveStream } from "../plugins/toram/live.js";
import { farm } from "../plugins/toram/farm.js";
import { khodam } from "../plugins/vip/tools/khodam.js";
import { searchHdb } from "../plugins/toram/hdb.js";
import { lvl } from "../plugins/toram/lvl.js";
import { brat } from "../plugins/vip/tools/brat.js";
import { mix } from "../plugins/vip/tools/mix.js";
import { artiNama } from "../plugins/vip/tools/prim.js";
import { supabase } from "../model/supabase.js";
import { note, notelist, setNote } from "../plugins/fitur/note.js";
import { bosTesting } from "../plugins/testing/bos.js";
import { bacaBuku, listperpus } from "../plugins/fitur/perpus.js";
import { itemStat } from "../plugins/toram/filter.js";
import { Loli } from "../plugins/fun/loli.js";
import { commands, registerCommand } from "../../setting.js";
export const cmdMenucontrol = async (sock, chatId, msg, text) => {
  if (text.startsWith(".menu")) {
    if (isBan(sock, chatId, msg)) return;
    setMenu(sock, chatId, msg, text);
  }
  if (text.startsWith(".Buff")) {
    if (isBan(sock, chatId, msg)) return;
    getAllBuff(sock, chatId, msg, text)
  }


  if (text.startsWith(".join")) {
    if (isBan(sock, chatId, msg)) return;

    const args = text.split(" ");
    if (args.length < 3) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> .join <pt1-pt4> <ign>" },
        { quoted: msg }
      );
    }

    joinRaid(sock, chatId, msg, text);
  }
  if (text.startsWith(".raid")) {
    if (isBan(sock, chatId, msg)) return;
    viewRaid(sock, chatId, msg);
  }
  if (text.startsWith(".leave")) {
    if (isBan(sock, chatId, msg)) return;
    leaveRaid(sock, chatId, msg)
  }
  if (text.startsWith(".appview")) {
    if (isBan(sock, chatId, msg)) return;
    searchApp(sock, chatId, msg, text);
  }
  if (text.startsWith(".xtall")) {
    if (isBan(sock, chatId, msg)) return;
    searchXtall(sock, chatId, msg, text);
  }
  if (text.startsWith(".item")) {
    if (isBan(sock, chatId, msg)) return;
    searchItem(sock, chatId, msg, text);
  }
  if (text.startsWith(".regist")) {
    if (isBan(sock, chatId, msg)) return;
    searchRegist(sock, chatId, msg, text);
  }
  if (text.startsWith(".ability")) {
    if (isBan(sock, chatId, msg)) return;
    searchAbility(sock, chatId, msg, text);
  }
  if (text.startsWith(".news")) {
    if (isBan(sock, chatId, msg)) return;
    getNews(sock, chatId, msg);
  }
  if (text.startsWith(".lv")) {
    if (isBan(sock, chatId, msg)) return;
    lvl(sock, chatId, msg, text);
  }

  if (text.startsWith(".bos")) {
    if (isBan(sock, chatId, msg)) return;
    Bossdef(sock, chatId, msg, text)
  }
  if (text.startsWith(".mybio")) {
    if (isBan(sock, chatId, msg)) return;
    myProfile(sock, chatId, msg);
  }
  if (text.startsWith(".setpp") || msg.message.imageMessage?.caption === ".setpp") {
    if (isBan(sock, chatId, msg)) return;
    setPP(sock, chatId, msg);
  }
  if (text.startsWith(".profil")) {
    if (isBan(sock, chatId, msg)) return;
    cekProfile(sock, chatId, msg);
  }
  if (text.startsWith(".setdesc")) {
    if (isBan(sock, chatId, msg)) return;
    setDesc(sock, chatId, msg, text);
  }
  if (text.startsWith(".pembolong")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: messagePembolong }, { quoted: msg })
  }
  if (text.startsWith(".rules")) {
    if (isBan(sock, chatId, msg)) return;
    getRules(sock, chatId, msg)
  }
  if (text.startsWith(".afk")) {
    if (isBan(sock, chatId, msg)) return;
    setAfk(sock, chatId, msg, text);
  }
  if (text.startsWith(".dye")) {
    if (isBan(sock, chatId, msg)) return;
    dyePredictor(sock, chatId, msg, text);
  }
  if (text.startsWith(".qc")) {
    if (isBan(sock, chatId, msg)) return;
    qc(sock, chatId, msg, text);
  }
  if (text.startsWith(".stiker") || msg.message.imageMessage?.caption === ".stiker") {
    if (isBan(sock, chatId, msg)) return;
    const allow = await ColdownUser(sock, chatId, msg, ".stiker")
    if (!allow) return;
    Smeme(sock, chatId, msg, text);
  }
  if (text.startsWith(".setbuff")) {
    if (isBan(sock, chatId, msg)) return;
    setidBuff(sock, chatId, msg, text);
  }
  if (text.startsWith(".torambanner")) {
    if (isBan(sock, chatId, msg)) return;
    Banner(sock, msg, chatId);
  }
  if (text.startsWith(".torammt")) {
    if (isBan(sock, chatId, msg)) return;
    getMt(sock, chatId, msg)
  }
  if (text.startsWith(".report")) {
    if (isBan(sock, chatId, msg)) return;
    report(sock, chatId, msg, text)
  }
  if (text.startsWith(".grep")) {
    if (isBan(sock, chatId, msg)) return;
    getAllReport(sock, chatId, msg)
  }
  if (text.startsWith(".listleveling")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: listLeveling }, { quoted: msg });
  }
  if (text.startsWith(".waifu")) {
    const allow = await ColdownUser(sock, chatId, msg, ".waifu")
    if (!allow) return;
    if (isBan(sock, chatId, msg)) return;
    waifu(sock, chatId, msg)
  }



  if (text.startsWith(".filarm")) {
    if (isBan(sock, chatId, msg)) return;

    try {
      const args = text.split(" ").slice(1);

      if (args.length === 0) {
        return sock.sendMessage(
          chatId,
          { text: "Gunakan `.sheetfill` untuk melihat cara penggunaan" },
          { quoted: msg }
        );
      }

      // Parse command
      const statConfig = parseCommand(args);

      // Validate configuration
      const validation = validateStatConfig(statConfig);

      if (!validation.valid) {
        return sock.sendMessage(chatId, {
          text: `Konfigurasi tidak valid:\n${validation.errors.join("\n")}`
        }, { quoted: msg });
      }

      // Send processing message
      await sock.sendMessage(chatId, {
        text: `Memproses kalkulasi...`
      }, { quoted: msg });

      // Execute tanaka with optimized settings
      const result = await tanaka(statConfig, {
        headless: true,
        maxWaitTime: 90000,      // Changed from 60000 to 90000
        checkInterval: 1000,      // Added for faster checks
        enableRetry: true         // Added for reliability
      });

      // Format and send result
      const replyMessage = formatResultMessage(result);
      await sock.sendMessage(chatId, { text: replyMessage }, { quoted: msg });

    } catch (error) {
      console.error("Error .filarm:", error);

      // Better error message
      let errorMsg = `Terjadi kesalahan:\n${error.message}`;

      if (error.message.includes("timeout")) {
        errorMsg += `\n\n💡 Tips: Coba lagi dalam beberapa saat`;
      } else if (error.message.includes("CAPTCHA")) {
        errorMsg += `\n\n💡 Server memerlukan verifikasi, coba lagi nanti`;
      }

      await sock.sendMessage(chatId, {
        text: errorMsg
      }, { quoted: msg });
    }
  } if (text.startsWith(".sheetfill")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: stat }, { quoted: msg })
  }
  if (text.startsWith(".cek")) {
    if (isBan(sock, chatId, msg)) return;
    cek(sock, chatId, msg, text);
  }
  if (text.startsWith(".remini") || msg.message.imageMessage?.caption === ".remini") {
    if (isBan(sock, chatId, msg)) return;
    Remini(sock, chatId, msg);
  }
  if (text.startsWith(".upbag")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: upbagId }, { quoted: msg })
  }
  if (text.startsWith(".donet")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, {
      text: `
    dukung bot dengan berdonasi:
    nomer: 085789109095 (DANA, GOPAY)
    Sosialbuz: https://sociabuzz.com/neurabot/tribe
    nomer owner: 085664393331 (dimas)
      `}, { quoted: msg })
  }
  if (text.startsWith(".play")) {
    if (isBan(sock, chatId, msg)) return;
    play(sock, chatId, msg, text)
  }
  if (text.startsWith(".ytmp3")) {
    if (isBan(sock, chatId, msg)) return;
    ytmp3(sock, chatId, msg, text)
  }
  if (text.startsWith(".pinterest")) {
    if (isBan(sock, chatId, msg)) return;
    pin(sock, chatId, msg, text)
  }
  if (text.startsWith(".caklontong")) {
    if (isBan(sock, chatId, msg)) return;
    Caklontong(sock, chatId, msg, text)
  }

  if (text.startsWith(".tebakgambar")) {
    if (isBan(sock, chatId, msg)) return;
    tebakGambar(sock, chatId, msg, text)
  }
  if (text.startsWith(".gempa")) {
    if (isBan(sock, chatId, msg)) return;
    autoGempa(sock, chatId, msg)
  }
  if (text.startsWith(".padu")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: guide.padu }, { quoted: msg })
  }
  if (text.startsWith(".skill")) {
    if (isBan(sock, chatId, msg)) return;
    skill(sock, chatId, msg, text)
  }

  if (text.startsWith(".listskill")) {
    if (isBan(sock, chatId, msg)) return;
    listSkill(sock, chatId, msg)
  }
  if (text.startsWith(".listxtall")) {
    if (isBan(sock, chatId, msg)) return;
    Xtall(sock, chatId, msg)
  }
  if (text.startsWith(".husbu")) {
    if (isBan(sock, chatId, msg)) return;
    husbu(sock, chatId, msg)
  }


  if (text.startsWith(".listability")) {
    if (isBan(sock, chatId, msg)) return;
    ability(sock, chatId, msg)
  }

  if (text.startsWith(".toramboost")) {
    if (isBan(sock, chatId, msg)) return;
    bosboost(sock, chatId, msg)
  }

  if (text.startsWith(".spotify")) {
    if (isBan(sock, chatId, msg)) return;
    Spotifysearch(sock, chatId, msg, text)
  }
  if (text.startsWith(".monster")) {
    if (isBan(sock, chatId, msg)) return;
    searchMonster(sock, chatId, msg, text)
  }

  if (text.startsWith(".pet")) {
    if (isBan(sock, chatId, msg)) return;
    pet(sock, chatId, msg, text)
  }

  if (text.startsWith(".spamadv")) {
    if (isBan(sock, chatId, msg)) return;
    spmadv(sock, chatId, msg, text)
  }

  if (text.startsWith(".hd") || msg.message.imageMessage?.caption === ".hd") {
    if (isBan(sock, chatId, msg)) return;
    hd(sock, chatId, msg);
  }


  if (text.startsWith(".toramlive")) {
    if (isBan(sock, chatId, msg)) return;
    liveStream(sock, chatId, msg)
  }

  if (text.startsWith(".listfarm")) {
    if (isBan(sock, chatId, msg)) return;
    farm(sock, chatId, msg, text)
  }

  if (text.startsWith(".khodam")) {
    if (isBan(sock, chatId, msg)) return;
    khodam(sock, chatId, msg)
  }
  if (text.startsWith(".shdb")) {
    if (isBan(sock, chatId, msg)) return;
    searchHdb(sock, chatId, msg, text)
  }
  if (text.startsWith(".listbos")) {
    if (isBan(sock, chatId, msg)) return;
    listboss(sock, chatId, msg)
  }

  if (text.startsWith(".mq")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: mq }, { quoted: msg })
  }
  if (text.startsWith(".setidbuff")) {
    if (isBan(sock, chatId, msg)) return;
    setBuff(sock, chatId, msg, text);
  }
  if (text.startsWith(".brat")) {
    if (isBan(sock, chatId, msg)) return;
    brat(sock, chatId, msg, text);
  }
  if (text.startsWith(".mix")) {
    if (isBan(sock, chatId, msg)) return;
    mix(sock, chatId, msg, text);
  }
  if (text.startsWith(".artinama")) {
    if (isBan(sock, chatId, msg)) return;
    artiNama(sock, chatId, msg, text);
  }

  if (text.startsWith(".note")) {
    if (isBan(sock, chatId, msg)) return;
    note(sock, chatId, msg, text);
  }
  if (text.startsWith(".setnote")) {
    if (isBan(sock, chatId, msg)) return;
    setNote(sock, chatId, msg, text);
  }
  if (text.startsWith(".listnote")) {
    if (isBan(sock, chatId, msg)) return;
    notelist(sock, chatId, msg);
  }
  if (text.startsWith(".bostesting")) {
    if (isBan(sock, chatId, msg)) return;
    bosTesting(sock, chatId, msg);
  }
  if (text.startsWith(".perpus")) {
    if (isBan(sock, chatId, msg)) return;
    listperpus(sock, chatId, msg);
  }

  if (text.startsWith(".baca")) {
    if (isBan(sock, chatId, msg)) return;
    bacaBuku(sock, chatId, msg, text);
  }
  if (text.startsWith(".statitem")) {
    if (isBan(sock, chatId, msg)) return;
    itemStat(sock, chatId, msg, text);
  }
  if (text.startsWith(".family100")) {
    if (isBan(sock, chatId, msg)) return;
    Family100(sock, chatId, msg);
  }
  if (text.startsWith(".loli")) {
    if (isBan(sock, chatId, msg)) return;
    Loli(sock, chatId, msg);
  }

  registerCommand({
    name: "testing",
    alias: ["test"],
    category: "menu info",
    desc: 'Mengirim gambar waifu acak',
    run: async (sock, chatId, msg) => {
      sock.sendMessage(chatId, { text: "testing" }, { quoted: msg })
    }
  })
  registerCommand({
    name: "help",
    alias: ["menu"],
    category: "menu info",
    desc: "memunculkan daftar menu",
    run: async (sock, chatId, msg) => {
      let menutext = `*Neura Sama Menu*\n`

      commands.forEach((val, key) => {
        // Menghindari duplikasi alias di daftar help
        console.log(val.name)
        console.log(key.category)
        menutext += `${key.category}\n*.${val.name}*: ${key.desc}\n`;
      });
      await sock.sendMessage(chatId, { text: menutext });
    }
  })









}
