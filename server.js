
const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

app.post("/generate-pdf", async (req, res) => {
  const tuote = req.body;
  const template = fs.readFileSync("template.html", "utf8");

  let ominaisuudetHTML = "";
  for (const [key, val] of Object.entries(tuote)) {
    if (
      !["Päivitä", "ID", "Tyyppi", "SKU", "Hinta", "Kategoriat", "Nimi", "Pääkuva", "Lisäkuvat"].includes(key) &&
      val
    ) {
      ominaisuudetHTML += `<tr><td><strong>${key}</strong></td><td>${val}</td></tr>`;
    }
  }

  const lisakuvat = (tuote["Lisäkuvat"] || "")
    .split(",")
    .filter(url => url.trim())
    .map(url => `<img src="${url.trim()}" style="margin-bottom: 10px; max-width: 100%;" />`)
    .join("");

  let html = template
    .replace(/{{nimi}}/g, tuote["Nimi"] || "Tuote")
    .replace(/{{paakuva}}/g, tuote["Pääkuva"] || "")
    .replace(/{{ominaisuudet}}/g, ominaisuudetHTML)
    .replace(/{{lisakuvat}}/g, lisakuvat);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true
  });

  await browser.close();

  res.set("Content-Type", "application/pdf");
  res.send(pdfBuffer);
});

app.listen(3000, () => {
  console.log("🚀 Palvelin käynnissä portissa 3000");
});
