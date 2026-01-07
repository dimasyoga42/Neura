import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Bosdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "");
    // Input validation
    if (!name || typeof name !== "string") {
      await sock.sendMessage(
        chatId,
        { text: " Please provide a valid boss name." },
        { quoted: msg }
      );
      return;
    }

    // Encode the name for URL safety
    const encodedName = encodeURIComponent(name.trim());
    const url = `https://coryn.club/monster.php?name=${encodedName}`;

    console.log(`Fetching boss data for: ${name} from ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const body = await response.text();
    const $ = cheerio.load(body);
    const data = [];
    const nameElements = $("div.card-container");
    if (nameElements.length === 0) {
      await sock.sendMessage(
        chatId,
        {
          text: `No boss found with name: "${name}"\n\nTry checking the spelling or use a different name.`,
        },
        { quoted: msg }
      );
      return;
    }

    // Process each boss card
    nameElements.each((i, element) => {
      try {
        // Get boss name from card title
        const bossNameElement = $(element).find("div.card-title-inverse");
        const fullBossName = bossNameElement.text().trim();
        const bossName = fullBossName.split(/\s+/).filter(Boolean)[0] || "Unknown";

        // Get all text from card body
        const detailText = $(element).find("p").text().replace(/\s+/g, "").trim();

        if (!detailText) return; // Skip if no detail text

        console.log(`Processing boss: ${bossName}, Detail: ${detailText}`);

        // Split text based on "Lv" pattern to separate variants
        const variants = detailText.split(/(?=Lv\d+Type)/).filter((v) => v.trim());

        variants.forEach((variant, variantIndex) => {
          const parsedData = parseVariantData(variant, bossName);
          if (parsedData.hasValidData) {
            data.push(parsedData);
          }
        });
      } catch (error) {
        console.error(`Error processing boss element ${i}:`, error);
      }
    });

    // Send formatted message
    const caption = formatBossMessage(data, name);
    await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
  } catch (error) {
    console.error("Bosdef Error:", error);
    await sock.sendMessage(
      chatId,
      {
        text: `Error fetching boss data: ${error.message}\n\nPlease try again later.`,
      },
      { quoted: msg }
    );
  }
};

// Helper function to parse variant data
function parseVariantData(variant, bossName) {
  const data = {
    bossName,
    lvl: "",
    type: "",
    hp: "",
    element: "",
    exp: "",
    tamable: "",
    originalText: variant,
    hasValidData: false,
  };

  try {
    // Extract Level
    const lvlMatch = variant.match(/Lv(\d+)/);
    if (lvlMatch) data.lvl = lvlMatch[1];

    // Extract Type (in parentheses)
    const typeMatch = variant.match(/Type\(([^)]+)\)/);
    if (typeMatch) data.type = `Type(${typeMatch[1]})`;

    // Extract HP - get number after HP before Element
    const hpMatch = variant.match(/HP(\d+)(?=Element)/);
    if (hpMatch) data.hp = parseInt(hpMatch[1]).toLocaleString(); // Format with commas

    // Extract Element - get text after Element before Exp
    const elementMatch = variant.match(/Element([A-Za-z]+)(?=Exp)/);
    if (elementMatch) data.element = elementMatch[1];

    // Extract Experience - get number after Exp before Tamable
    const expMatch = variant.match(/Exp(\d+)(?=Tamable)/);
    if (expMatch) data.exp = parseInt(expMatch[1]).toLocaleString(); // Format with commas

    // Extract Tamable - get text after Tamable
    const tamableMatch = variant.match(/Tamable([A-Za-z]+)/);
    if (tamableMatch) data.tamable = tamableMatch[1];

    // Check if we have valid data
    data.hasValidData = !!(
      data.lvl ||
      data.type ||
      data.hp ||
      data.element ||
      data.exp ||
      data.tamable
    );
  } catch (error) {
    console.error("Error parsing variant data:", error);
    data.raw = variant; // Store raw data if parsing fails
  }

  return data;
}

// Helper function to format the message
function formatBossMessage(data, searchName) {
  let caption = "*Boss Information*\n";
  caption += ` *Search:* ${searchName}\n`;
  caption += "━━━━━━━━━━━━━━━━━━━━\n";

  if (data.length === 0) {
    caption += " No boss data found.";
    return caption;
  }

  // Define type order for sorting
  const typeOrder = [
    "Type(Easy)",
    "Type(Normal)",
    "Type(Hard)",
    "Type(Nightmare)",
    "Type(Ultimate)",
  ];

  // Group by boss name
  const grouped = {};
  data.forEach((item) => {
    const key = item.bossName;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  // Format each boss group
  Object.keys(grouped).forEach((boss, bossIndex) => {
    caption += `\n*${boss}*\n`;

    // Sort variants by type order
    const sortedStats = grouped[boss].sort((a, b) => {
      const idxA = typeOrder.indexOf(a.type);
      const idxB = typeOrder.indexOf(b.type);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    sortedStats.forEach((item, index) => {
      // Display element if available
      if (item.element) {
        caption += `*Element:* ${item.element}\n`;
      }

      // Display basic info
      const basicInfo = [];
      if (item.lvl) basicInfo.push(` Level ${item.lvl}`);
      if (item.type) basicInfo.push(` ${item.type.replace("Type(", "").replace(")", "")}`);

      if (basicInfo.length > 0) {
        caption += `${basicInfo.join(" | ")}\n`;
      }

      // Display stats
      if (item.hp) caption += `HP: ${item.hp}\n`;
      if (item.exp) caption += `EXP: ${item.exp}\n`;
      if (item.tamable) caption += `Tamable: ${item.tamable}\n`;

      // If parsing failed, show raw data
      if (item.raw) {
        caption += ` Raw: ${item.raw}\n`;
      }

      // Add separator between variants
      if (index < sortedStats.length - 1) {
        caption += "━━━━━━━━━━━━━━━━━━━━\n";
      }
    });

    // Add separator between different bosses
    if (bossIndex < Object.keys(grouped).length - 1) {
      caption += "\n━━━━━━━━━━━━━━━━━━━━\n";
    }
  });

  caption += "\n *Data from coryn.club*";
  return caption.trim();
}
