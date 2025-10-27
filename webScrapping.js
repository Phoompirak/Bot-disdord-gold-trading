const axios = require("axios");
const cheerio = require("cheerio");

async function getGoldNews() {
  try {
    const url = "https://th.investing.com/currencies/xau-usd-news?utm_source=chatgpt.com";
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const $ = cheerio.load(data);
    const news = [];

    $('ul[data-test="news-list"] li').each((i, el) => {
      const title = $(el).find('a[data-test="article-title-link"]').text().trim();
      const link = $(el).find('a[data-test="article-title-link"]').attr('href');
      const desc = $(el).find('p[data-test="article-description"]').text().trim();
      const date = $(el).find('time[data-test="article-publish-date"]').attr('datetime');
      // ตรวจสอบ effect แบบง่าย
      const effect = title.includes("ลด") || title.includes("ร่วง") ? "Down" :
                     title.includes("พุ่ง") || title.includes("เพิ่ม") ? "Up" : "Neutral";

      news.push({ title, link: `https://th.investing.com${link}`, desc, date, effect });
    });

    return news;
  } catch (err) {
    console.error("WebScraping error:", err.message);
    return [];
  }
}

module.exports = { getGoldNews };

// ตัวอย่างเรียกใช้งาน
// (async () => {
//   const news = await getGoldNews();
//   console.log(news);
// })();