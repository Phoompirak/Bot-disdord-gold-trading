import dotenv from "dotenv";
import express from "express";
import axios from "axios";
import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import * as webScrapping from "./webScrapping.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// ดึงราคาทอง
async function getGoldPrice() {
  try {
    const res = await axios.get("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": process.env.GOLD_API_KEY },
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

// ส่งสรุปทุกๆ 07:00, 12:00, 18:30
function scheduleDailySend(channel, hour, minute) {
  const now = new Date();
  let target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hour,
    minute,
    0,
    0
  );

  // ถ้าเวลานั้นผ่านไปแล้ว ให้ตั้งเป็นวันพรุ่งนี้
  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target - now;

  setTimeout(() => {
    sendDailyGoldSummary(channel); // ส่งครั้งแรก
    setInterval(() => sendDailyGoldSummary(channel), 24 * 60 * 60 * 1000); // ส่งซ้ำทุกวัน
  }, delay);
}

client.on("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
  if (!channel) return console.error("❌ ไม่พบ Channel ID");

  // ตัวอย่าง: ส่งที่ 07:00, 12:00, 18:30
  scheduleDailySend(channel, 7, 0);
  scheduleDailySend(channel, 12, 0);
  scheduleDailySend(channel, 18, 30);
});

// คำสั่ง !testsummary
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content === "!testsummary") {
    await sendDailyGoldSummary(message.channel);
    message.reply("✅ ส่งสรุปข่าวทองเรียบร้อยแล้ว!");
  }
});

app.get("/", (req, res) => res.send("Bot is running!"));

client.login(process.env.BOT_TOKEN);
app.listen(PORT, () => console.log(`🌐 Web server running on port ${PORT}`));
