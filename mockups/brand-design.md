# Prompt Clash, brand identity brief

> 🎨 Sally, UX Designer notu: Bu dosya Stitch design system input'u, logo SVG yazımı için referans, ve takım için marka kimliği özetidir. Tek kaynak.

## 1. Ürün özeti

**Prompt Clash**, etkinliklerde QR ile katılımlı 1v1 AI görsel üretme yarışmasıdır. İki oyuncu aynı hedef görseli görür, 60 saniyede en iyi prompt yazışını yapar, AI iki görseli üretir ve hangisi hedefe daha yakınsa AI kazananı seçer. Telefondan katılım, sahnede yansıtım, dakikalar içinde maç.

## 2. Marka tonu

- **Premium arcade**: Modern eSports yayıncılığı + retro pixel arcade. Twitch broadcast lower-third disipliniyle Nintendo Direct'in kompozisyon zarafetinin kesişimi.
- **Dostane ama gerilimli**: Etkinlik kalabalığını sahneye çekecek kadar enerjik, ama korkutucu değil. 1v1 düello hissi premium kalır.
- **Net, kısa, aksiyon**: Hiçbir metin oyuncuyu okumaya zorlamaz. Header `AI ÇİZİYOR`, alt `Birazdan hedefe en yakın seçilecek.` Her şey 2 satıra kadar.
- **Türkçe doğal, em-dash yok**: Türkçe ana dil, kısa cümlelerle, virgül ile akan. Em-dash karakteri kesinlikle kullanılmaz.

## 3. Renk paleti

| Token | Hex | Kullanım |
|---|---|---|
| `--pc-a` (Player A) | `#7c4dff` | Mor accent, marka birincil. Logo gölgelendirme, primary CTA, brand mor. |
| `--pc-b` (Player B) | `#aed24a` | Soft lime accent, marka ikincil. Player B kimliği, sekonder vurgular. |
| `--pc-ink` (Surface) | `#22202b` | Stage/audience dark zemin, marka baz. Dark-by-default. |
| `--pc-bone` (Bone) | `#ffffff` | Net beyaz, headlinelar ve ana metin. |
| `--pc-live` (Live) | `#ff5c5c` | Live indicator ve süre-bitiyor uyarısı. Sıkı kullanım, sadece anlık. |
| `--pc-text2` (Mid) | `#c0bdca` | Subtitle. |
| `--pc-text3` (Quiet) | `#8c8898` | Mini-label, mono caps. |

Light theme alternatifi mevcut (`[data-pc-theme="light"]`), brand mor + lime korunur, surface beyaz ekrana yumuşar (`#f6f7f9`).

## 4. Tipografi

| Font stack | Kullanım |
|---|---|
| **Silkscreen** (pixel) | Wordmark, headline, statü chip (CANLI, HAZIR, ÇİZİLİYOR), timer rakam. Sıkı harf aralığı `0.04em`. |
| **Inter Tight** (sans) | Body, subtitle, açıklama metni, oyuncu adı. |
| **JetBrains Mono** (mono) | Sayaç, oran (`1 / 2`), mini-label letterspaced caps. |
| **Poppins** (legacy) | Admin panel q-design-system fallback. Marka iletişiminde kullanılmaz. |

## 5. Logo direction, axolotl maskotu + wordmark

### 5.1 Maskot, axolotl

**Neden axolotl:** AI yarışmasının "yeniden üretme" temasıyla rezonans (axolotl üye yenileyen amfibik canlı, biyolojik "regeneration" sembolü). Minecraft axolotl referansı dostane ve genç kitleye hitap ediyor. Brand mor ile uyumlu olabilen pembe-mor varyantı doğal seçim.

**Stilistik karar:**
- **Pixel-leaning, ama soft.** Düşük çözünürlük voxel hissi (Minecraft, Disco Elysium pixel art ekolü), saf 8-bit değil. Stage `Silkscreen` font tutarlılığı.
- **Statik poz.** Yan profil veya hafif quartering, kuyruk hafif kıvrımlı. Gözler iri, dost canlı, yarışmacı değil.
- **3 dış solungaç (axolotl signature).** Lime accent (`#aed24a`) burada kullanılır, brand kontrastı maskot içine sıkıştırılmış olur.
- **Vücut mor.** Ana renk `#7c4dff` (Player A) baz, brand birinci öğesi. Aydınlık kısımları açık mor (`#a384ff`), gölge koyu mor (`#5a35cc`).
- **Karın açık.** Bone (`#f5f5f8`) yumuşak vurgu, derinlik için.
- **2x2 piksel grid disiplini.** SVG'de tüm path'ler 2px çarpan grid'e snap'lendirilir, pixel hissi korunsun.

**Boyut hedefi:**
- Master SVG: 512×512 viewBox, axolotl ~360px alanda yer alır
- Favicon 32×32'de hala tanınabilir kalmalı (yüz + 3 solungaç + gövde silueti)
- 16×16'da sadece silüet okunur (mor lekede 3 nokta), sorun değil

### 5.2 Wordmark

- **Silkscreen Bold** veya regular, harf aralığı `0.04em`
- Tüm büyük harf: `PROMPT CLASH`
- Tek satır veya iki satır (PROMPT / CLASH alt alta)
- Bone (`#ffffff`) baz, dark zemin üzerinde
- Light theme'de near-black (`#14121a`)

### 5.3 Lockup varyantları

1. **Full lockup**: axolotl solda + "PROMPT CLASH" iki satır sağda. README, marketing, site header için.
2. **Stacked lockup**: axolotl üst, "PROMPT CLASH" tek satır alt. Vertical alanlar (mobile splash, manifest icon) için.
3. **Mark only**: sadece axolotl, kare framing. Favicon, app icon, social profile için.
4. **Wordmark only**: sadece "PROMPT CLASH". Header'larda mor accent ile, alt yazılarda metin olarak.

## 6. Asset üretim hedefleri

| Asset | Boyut | Kaynak | Kullanım |
|---|---|---|---|
| `public/logo.svg` | 512×512 viewBox | El yapımı | Full lockup master |
| `public/logo-mark.svg` | 256×256 viewBox | El yapımı | Sadece axolotl, square |
| `public/logo-wordmark.svg` | 512×128 viewBox | El yapımı | Sadece wordmark |
| `public/favicon.ico` | 16,32,48 multi | mark.svg → sharp | Browser tab |
| `app/icon.png` | 512×512 | mark.svg → sharp | Next.js otomatik favicon link |
| `app/apple-icon.png` | 180×180 | mark.svg → sharp | iOS home screen |
| `public/icon-192.png` | 192×192 | mark.svg → sharp | PWA manifest |
| `public/icon-512.png` | 512×512 | mark.svg → sharp | PWA manifest |
| `public/icon-maskable-512.png` | 512×512 | mark.svg + safe area | PWA maskable |
| `app/opengraph-image.png` | 1200×630 | logo.svg + compose | Facebook, LinkedIn, Discord embed |
| `app/twitter-image.png` | 1200×600 | logo.svg + compose | X/Twitter card |

OG/Twitter image kompozisyonu: ortada axolotl + wordmark, alt etiket `1v1 AI görsel kapışması, etkinliğin için QR'la`, sağ alt mini `CANLI` dot. Surface dark, mor accent.

## 7. Ton ve kullanım dışı

- ❌ Glow, neon halo, abartılı parıltı, dökülen pixel particle yok. Premium = kontrollü kullanım.
- ❌ Em-dash karakteri kullanılmaz, virgül veya nokta.
- ❌ Çocuksu mascot tonu, kawaii overload. Axolotl dost canlı ama yarışmacı dengesi.
- ❌ Marka renklerinde RGB rainbow / gradient agresif geçiş. Mor ana, lime kontrast, fazlası yok.
- ❌ Stock illustration, AI üretilmiş generic mascot. El yapımı veya Stitch ile dahili üretim.

## 8. Çıktı kontrol listesi

Bir tasarım çıktısı şu üç testten geçmelidir:

1. **3 saniye testi**: Marka tab favicon olarak gösterildiğinde, izleyici 3 saniyede "axolotl maskotlu mor pixel oyun" anlayabilmeli.
2. **Distance testi**: Sahne projeksiyonunda 10 metre uzaklıktan wordmark net okunabilmeli (Silkscreen + bone yeterli).
3. **Dark/light testi**: Aynı SVG dark `#22202b` ve light `#f6f7f9` üzerinde aynı tanınırlığı verir, mor ve lime tonları her ikisinde dengeli.

## 9. Stitch design system input

Stitch ile design system kurulurken bu dosya doğrudan kaynak. Tokens:

```yaml
colors:
  primary: "#7c4dff"
  accent: "#aed24a"
  surface: "#22202b"
  surface-light: "#f6f7f9"
  bone: "#ffffff"
  live: "#ff5c5c"
fonts:
  pixel: "Silkscreen"
  body: "Inter Tight"
  mono: "JetBrains Mono"
tone:
  - "premium arcade"
  - "broadcast lower-third"
  - "tr language, em-dash yok"
mascot: "axolotl, pixel-leaning, mor body + lime gills, friendly"
```
