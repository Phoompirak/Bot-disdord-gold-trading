import axios from "axios";
import * as cheerio from "cheerio";

export async function getGoldNews() {
  try {
    const url = "https://th.investing.com/currencies/xau-usd-news?utm_source=chatgpt.com";
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const $ = cheerio.load(data);
    const news = [];

    $('ul[data-test="news-list"] li').each((i, el) => {
      const title = $(el).find('a[data-test="article-title-link"]').text().trim();
      const link = $(el).find('a[data-test="article-title-link"]').attr('href');
      const desc = $(el).find('p[data-test="article-description"]').text().trim();
      const date = $(el).find('time[data-test="article-publish-date"]').attr('datetime');

      // ตรวจสอบแนวโน้มของข่าว (พุ่ง / ลด / เป็นกลาง)
      const effect = title.includes("ลด") || title.includes("ร่วง")
        ? "Down"
        : title.includes("พุ่ง") || title.includes("เพิ่ม")
        ? "Up"
        : "Neutral";

      news.push({
        title,
        link: `https://th.investing.com${link}`,
        desc,
        date,
        effect,
      });
    });

    return news;
  } catch (err) {
    console.error("WebScraping error:", err.message);
    return [];
  }
}

// ตัวอย่างเรียกใช้ทดสอบ
// (async () => {
//   const news = await getGoldNews();
//   console.log(news);
// })();
