
const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const webScrapping = require("./webScrapping");
const axios = require("axios");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config(); // โหลดก่อนใช้งานตัวแปร


const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ดึงราคาทอง
async function getGoldPrice() {
  try {
    const res = await axios.get("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": process.env.GOLD_API_KEY } // ใช้ dotenv
    });
    return res.data.price;
  } catch (err) {
    console.error("GoldAPI error:", err.message);
    return null;
  }
}

// ฟังก์ชันส่งสรุปข่าว
async function sendDailyGoldSummary(channel) {
  const goldPrice = await getGoldPrice();
  const news = await webScrapping.getGoldNews();
  const latestNews = news.slice(0, 5);

  if (!goldPrice) return channel.send("❌ ไม่สามารถดึงราคาทองได้");

  const embed = new EmbedBuilder()
    .setTitle(`💰 ราคาทองล่าสุด: $${goldPrice.toLocaleString()}`)
    .setColor("#FFD700");

  latestNews.forEach(item => {
    const arrow = item.effect === "Up" ? "📈" : item.effect === "Down" ? "📉" : "➡️";
    embed.addFields({
      name: `${arrow} ${item.title}`,
      value: `[อ่านต่อ](${item.link})\n${item.desc}`,
    });
  });

  channel.send({ embeds: [embed] });
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// คำสั่งทดสอบ
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content === "!testsummary") {
    await sendDailyGoldSummary(message.channel);
    message.reply("✅ ส่งสรุปข่าวทองเรียบร้อยแล้ว!");
  }
});

// Login Discord
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

client.login(process.env.BOT_TOKEN);
app.listen(PORT, () => console.log(`Web server running on port ${PORT}`));
