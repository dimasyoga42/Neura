import { ColdownUser } from "../admin/coldownChat.js";
import { hidetag } from "../admin/hidetag.js";
import { guide, listLeveling, menuMessage, messagePembolong, mq, stat, upbagId } from "../config/variabel.js";
import { isBan, isOwner } from "../plugins/fitur/ban.js"
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
import { commands, fetchdata, message, registerCommand } from "../../setting.js";
import { addOverlayFromUrl } from "../config/overlay.js";

export const cmdMenucontrol = async (sock, chatId, msg, text) => {
  registerCommand({
    name: "help",
    alias: ["menu"],
    category: "menu info",
    desc: "memunculkan daftar menu",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      let menutext = `*Neura Sama Menu*\n\n`
      const grouped = {}
      // const key = Math.floor(Math.random() * 4) + 1
      // const data = await fetchdata("https://raw.githubusercontent.com/dimasyoga42/dataset/main/image/menu/menu.json")
      const key = Math.floor(Math.random() * message.length) + 1
      const messages = message[key]

      commands.forEach((cmd, key) => {
        // skip alias
        if (cmd.name !== key) return

        // normalisasi kategori
        let cat = (cmd.category || "other").toLowerCase().trim()

        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(cmd)
      })

      // sort kategori A-Z
      const sortedCategory = Object.keys(grouped).sort()
      const imageoverlay = await addOverlayFromUrl(`https://i.pinimg.com/1200x/5f/0e/1b/5f0e1ba67378d5a770f60d9a689f0f31.jpg`, `${messages}`)
      sortedCategory.forEach((cat) => {
        menutext += `*${cat}*\n`
        // sort command A-Z
        grouped[cat]
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((cmd) => {
            const alias = cmd.alias.length ? ` (${cmd.alias.join(", ")})` : ""
            menutext += `- .${cmd.name} - ${cmd.desc}\n`
          })

        menutext += `\n`
      })

      await sock.sendMessage(chatId, { image: imageoverlay, caption: menutext })
    }
  })

  registerCommand({
    name: "Buff",
    alias: ["buff"],
    category: "Toram Tools",
    desc: "melihat daftar buff yang tersedia",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      getAllBuff(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "join",
    alias: ["join"],
    category: "Toram Raid",
    desc: "bergabung ke raid",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      const argsList = text.split(" ");
      if (argsList.length < 3) {
        return sock.sendMessage(
          chatId,
          { text: "Format salah\n> .join <raid_id> <role>" },
          { quoted: msg }
        );
      }
      joinRaid(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "raid",
    alias: ["raid"],
    category: "Toram Raid",
    desc: "melihat daftar raid yang tersedia",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      viewRaid(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "leave",
    alias: ["leave"],
    category: "Toram Raid",
    desc: "keluar dari raid",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      leaveRaid(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "appview",
    alias: ["appview"],
    category: "Toram Tools",
    desc: "mencari appearance item",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchApp(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "xtall",
    alias: ["xtall"],
    category: "Toram Tools",
    desc: "mencari crystal",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchXtall(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "item",
    alias: ["item"],
    category: "Toram Tools",
    desc: "mencari item toram",
    run: async (sock, chatId, msg, args, text) => {
      searchItem(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "regist",
    alias: ["regist"],
    category: "Toram Tools",
    desc: "mencari registlet",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchRegist(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "ability",
    alias: ["ability"],
    category: "Toram Tools",
    desc: "mencari ability detail",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchAbility(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "news",
    alias: ["news"],
    category: "Toram Info",
    desc: "melihat berita terbaru toram",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      getNews(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "lv",
    alias: ["lv"],
    category: "Toram Tools",
    desc: "memberikan rekomendasi spot leveling",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      lvl(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "bos",
    alias: ["bos"],
    category: "Toram Info",
    desc: "melihat informasi boss",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      Bossdef(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "mybio",
    alias: ["profil"],
    category: "Menu Profile",
    desc: "melihat profil sendiri",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      myProfile(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "setpp",
    alias: ["setpp"],
    category: "Menu Profile",
    desc: "mengatur foto profil (replay) foto untuk menggunakan nya",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      await setPP(sock, chatId, msg);

    }
  });

  registerCommand({
    name: "profil",
    alias: ["profile"],
    category: "Menu Profile",
    desc: "melihat profil user lain",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      cekProfile(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "setdesc",
    alias: ["setdesc"],
    category: "Menu Profile",
    desc: "mengatur deskripsi profil",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      setDesc(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "pembolong",
    alias: ["pembolong"],
    category: "Toram Info",
    desc: "informasi harga pembolong equipment",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: messagePembolong }, { quoted: msg });
    }
  });

  registerCommand({
    name: "rules",
    alias: ["rules"],
    category: "Menu Info",
    desc: "melihat rules bot",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      getRules(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "afk",
    alias: ["afk"],
    category: "Menu Social",
    desc: "mengatur status afk",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      setAfk(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "dye",
    alias: ["dye"],
    category: "Toram Tools",
    desc: "memprediksi hasil dye",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      dyePredictor(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "qc",
    alias: ["qc"],
    category: "Menu Tools",
    desc: "membuat quoted sticker",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      qc(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "stiker",
    alias: ["sticker", "s"],
    category: "Menu Tools",
    desc: "membuat stiker dari gambar",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      const allow = await ColdownUser(sock, chatId, msg, ".stiker");
      if (!allow) return;
      Smeme(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "setbuff",
    alias: ["setbuff"],
    category: "Menu Profile",
    desc: "mengatur id buff di profil",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      setidBuff(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "torambanner",
    alias: ["banner"],
    category: "Toram Info",
    desc: "melihat banner toram terkini",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      Banner(sock, msg, chatId);
    }
  });

  registerCommand({
    name: "torammt",
    alias: ["mt"],
    category: "Toram Info",
    desc: "melihat jadwal maintenance toram",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      getMt(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "report",
    alias: ["report"],
    category: "Menu Info",
    desc: "melaporkan bug atau masalah",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      report(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "grep",
    alias: ["grep"],
    category: "Menu Info",
    desc: "melihat daftar report",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      getAllReport(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "listleveling",
    alias: ["listlevel"],
    category: "Toram Info",
    desc: "melihat daftar spot leveling",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: listLeveling }, { quoted: msg });
    }
  });



  registerCommand({
    name: "filarm",
    alias: ["filarm"],
    category: "Toram Tools",
    desc: "filstat armor dengan tanaka",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      try {
        const argsList = text.split(" ").slice(1);
        if (argsList.length === 0) {
          return sock.sendMessage(
            chatId,
            { text: "Gunakan `.sheetfill` untuk melihat cara penggunaan" },
            { quoted: msg }
          );
        }

        const statConfig = parseCommand(argsList);
        const validation = validateStatConfig(statConfig);

        if (!validation.valid) {
          return sock.sendMessage(
            chatId,
            { text: `Konfigurasi tidak valid:\n${validation.errors.join("\n")}` },
            { quoted: msg }
          );
        }

        await sock.sendMessage(chatId, { text: `Memproses kalkulasi...` }, { quoted: msg });

        const result = await tanaka(statConfig, {
          headless: true,
          maxWaitTime: 90000,
          checkInterval: 1000,
          enableRetry: true
        });

        const replyMessage = formatResultMessage(result);
        await sock.sendMessage(chatId, { text: replyMessage }, { quoted: msg });
      } catch (error) {
        console.error("Error .filarm:", error);
        let errorMsg = `Terjadi kesalahan:\n${error.message}`;

        if (error.message.includes("timeout")) {
          errorMsg += `\n\n💡 Tips: Coba lagi dalam beberapa saat`;
        } else if (error.message.includes("CAPTCHA")) {
          errorMsg += `\n\n💡 Server memerlukan verifikasi, coba lagi nanti`;
        }

        await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
      }
    }
  });

  registerCommand({
    name: "sheetfill",
    alias: ["sheetfill"],
    category: "Toram Info",
    desc: "melihat cara penggunaan filarm",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: stat }, { quoted: msg });
    }
  });

  registerCommand({
    name: "cek",
    alias: ["cek"],
    category: "Menu Fun",
    desc: "mengecek sesuatu secara random",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      cek(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "remini",
    alias: ["enhance"],
    category: "Menu Tools",
    desc: "meningkatkan kualitas gambar",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      Remini(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "upbag",
    alias: ["upbag"],
    category: "Toram Info",
    desc: "informasi upgrade bag",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: upbagId }, { quoted: msg });
    }
  });

  registerCommand({
    name: "donet",
    alias: ["donate", "donasi"],
    category: "Menu Info",
    desc: "informasi donasi untuk bot",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(
        chatId,
        {
          text: `dukung bot dengan berdonasi:
nomer: 085789109095 (DANA, GOPAY)
Sosialbuz: https://sociabuzz.com/neurabot/tribe
nomer owner: 085664393331 (dimas)`
        },
        { quoted: msg }
      );
    }
  });

  registerCommand({
    name: "play",
    alias: ["play"],
    category: "Menu Downloader",
    desc: "memutar lagu dari youtube",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      play(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "ytmp3",
    alias: ["ytmp3"],
    category: "Menu Downloader",
    desc: "download audio dari youtube",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      ytmp3(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "pinterest",
    alias: ["pin"],
    category: "Menu Downloader",
    desc: "mencari gambar dari pinterest",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      pin(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "caklontong",
    alias: ["caklontong"],
    category: "Menu Fun",
    desc: "permainan cak lontong",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      Caklontong(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "tebakgambar",
    alias: ["tebakgambar"],
    category: "Menu Fun",
    desc: "permainan tebak gambar",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      tebakGambar(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "padu",
    alias: ["padu"],
    category: "Toram Info",
    desc: "panduan padu",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: guide.padu }, { quoted: msg });
    }
  });

  registerCommand({
    name: "skill",
    alias: ["skill"],
    category: "Toram Tools",
    desc: "mencari informasi skill",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      skill(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "listskill",
    alias: ["listskill"],
    category: "Toram Info",
    desc: "melihat daftar skill",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      listSkill(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "listxtall",
    alias: ["listxtall"],
    category: "Toram Info",
    desc: "melihat daftar crystal",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      Xtall(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "husbu",
    alias: ["husbando"],
    category: "Menu Fun",
    desc: "mendapatkan gambar husbando random",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      husbu(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "listability",
    alias: ["listability"],
    category: "Toram Info",
    desc: "melihat daftar ability",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      ability(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "toramboost",
    alias: ["boost"],
    category: "Toram Tools",
    desc: "informasi boss boost",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      bosboost(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "spotify",
    alias: ["spotify"],
    category: "Menu Downloader",
    desc: "mencari lagu di spotify",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      Spotifysearch(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "monster",
    alias: ["monster"],
    category: "Toram Tools",
    desc: "mencari informasi monster",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchMonster(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "pet",
    alias: ["pet"],
    category: "Toram Tools",
    desc: "mencari informasi pet",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      pet(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "spamadv",
    alias: ["spamadv"],
    category: "Toram Tools",
    desc: "kalkulasi spam adv toram",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      spmadv(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "hd",
    alias: ["hd"],
    category: "Menu Tools",
    desc: "meningkatkan kualitas gambar (hd)",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      hd(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "toramlive",
    alias: ["live"],
    category: "Toram Info",
    desc: "melihat live stream toram",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      liveStream(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "listfarm",
    alias: ["farm"],
    category: "Toram Info",
    desc: "melihat daftar spot farming",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      farm(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "khodam",
    alias: ["khodam"],
    category: "Menu Fun",
    desc: "ghaca khodam",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      khodam(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "shdb",
    alias: ["shdb"],
    category: "Toram Tools",
    desc: "untuk mencari detail bos hdb / event",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      searchHdb(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "listbos",
    alias: ["daftarbos"],
    category: "Toram Info",
    desc: "memunculkan daftar bos dan minibos yang tersedia",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      listboss(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "mq",
    alias: ["bahanmq"],
    category: "Toram Info",
    desc: "memunculkan daftar bahan mq",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      sock.sendMessage(chatId, { text: mq }, { quoted: msg });
    }
  });

  registerCommand({
    name: "setidbuff",
    alias: ["setidbuff"],
    category: "Menu Toram",
    desc: "untuk menambahkan code buff ke dalam database",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      setBuff(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "brat",
    alias: ["brt"],
    category: "Menu Tools",
    desc: "membuat stiker brat",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      brat(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "mix",
    alias: ["mix"],
    category: "Menu Tools",
    desc: "memadukan emot menjadi stiker",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      mix(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "artinama",
    alias: ["artinama"],
    category: "Menu Fun",
    desc: "melihat arti nama",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      artiNama(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "note",
    alias: ["note"],
    category: "Menu Tools",
    desc: "melihat catatan",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      note(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "setnote",
    alias: ["setnote"],
    category: "Menu Tools",
    desc: "membuat catatan baru",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      setNote(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "listnote",
    alias: ["listnote"],
    category: "Menu Tools",
    desc: "melihat daftar catatan",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      notelist(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "bostesting",
    alias: ["bostesting"],
    category: "Testing",
    desc: "testing boss command",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      bosTesting(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "statitem",
    alias: ["statitem"],
    category: "Toram Tools",
    desc: "mencari item berdasarkan stat",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      itemStat(sock, chatId, msg, text);
    }
  });

  registerCommand({
    name: "family100",
    alias: ["fmly"],
    category: "Menu Fun",
    desc: "permainan family 100",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      Family100(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "loli",
    alias: ["pdf"],
    category: "Menu Fun",
    desc: "memunculkan foto loli random",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      Loli(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "perpus",
    alias: ["perpus"],
    category: "Toram Info",
    desc: "memunculkan daftar Guide",
    run: async (sock, chatId, msg) => {
      if (isBan(sock, chatId, msg)) return;
      listperpus(sock, chatId, msg);
    }
  });

  registerCommand({
    name: "baca",
    alias: ["baca"],
    category: "Toram Info",
    desc: "memunculkan detail Guide",
    run: async (sock, chatId, msg, args, text) => {
      if (isBan(sock, chatId, msg)) return;
      bacaBuku(sock, chatId, msg, text);
    }
  });

};
