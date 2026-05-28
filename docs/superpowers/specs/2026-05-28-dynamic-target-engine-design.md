# Dinamik Hedef-Üretim Motoru — Tasarım

Tarih: 2026-05-28
Proje: Prompt Clash
Durum: Onaylandı (brainstorming), plan aşamasına hazır

## Amaç

Oyunun çekirdeği "prompt savaşı": ortada bir hedef görsel var, oyuncular o
görseli üreten prompt'u tahmin etmeye çalışıyor. Şu an hedef görsel sabit tek
temadan (cyberpunk cat) üretiliyor; her maç aynı his veriyor. Hedef, her turun
hedef görselini farklı, sürprizli ve zorluk/kategoriye göre çeşitli yapmak;
böylece tahmin etmek hype ve eğlence üretsin.

Sabit kedi teması tamamen kalkar. Yerine her tur taze bir hedef üreten dinamik
motor gelir.

## Çekirdek mekanik (değişmiyor)

Oyuncu prompt yazar → prompt'tan görsel üretilir (Cloudflare flux) → hedef
görselle görsel benzerliği üzerinden puanlanır (Gemini Vision). Kazananı AI
seçer, beraberlik yok. Bu akış aynen korunur.

## Üretim yaklaşımı: B + C (LLM + küratörlü tohum)

Her tur LLM taze bir hedef prompt üretir (sonsuz çeşitlilik), ama küratörlü
kategori/zorluk tohumlarıyla yönlendirilir (kalite ve kontrol). Bu, daha önce
geri alınan kontrolsüz tema rotasyonunun başarısızlık sebebini (kimlik/kalite
kaybı) doğrudan çözer.

## 1. Hedef-üretim motoru (`lib/game/targetPrompt.js`)

Her tur için akış:

1. Bir kategori + zorluk seçilir.
   - Varsayılan: otomatik rastgele (her tur farklı his).
   - Admin'den kilitlenebilir (temalı etkinlik: ör. sadece "sinema / zor").
2. O kategori+zorluğa ait küratörlü tohum havuzundan kısa bir konsept çekilir
   (ör. "insan işi yapan bir hayvan").
3. Gemini metin modeli (`gemini-2.5-flash`) tohumu canlı, somut bir görsel
   prompt'a açar. Bu, saklanan "gerçek prompt"tur.
4. Cloudflare flux ile görsel üretilir; gerçek prompt + kategori + zorluk
   state'e ve `nextReference*` pre-cache alanlarına yazılır.

Modül API'si (öneri):

- `pickRound({ category, difficulty })` → seçili veya rastgele `{ category, difficulty, seed }`.
- `expandSeed({ category, difficulty, seed })` → `{ prompt }` (Gemini metin çağrısı).
- Üst akış `matchLifecycle.js` içindeki mevcut `ensureReferenceImage` yerine
  `ensureTargetImage()` olarak yeniden adlandırılır/genişletilir.

### Fallback zinciri (canlı etkinlik güvenliği)

- LLM metin üretimi başarısız → tohum konsepti doğrudan görsel prompt olarak
  kullanılır (motor asla durmaz).
- Görsel üretimi başarısız → mevcut 3x retry + exponential backoff → placeholder.
- Pre-cache her zaman bir tur önce çalışır; tur başında kullanıcı gecikme
  görmez.

## 2. Zorluk ve kategori

### Zorluk seviyeleri

- Kolay: tek ikonik özne, sade kompozisyon. Prompt kısa, tahmini kolay.
- Orta: özne + mekan + stil.
- Zor: bileşik konsept, spesifik stil, birden çok öğe.
- Efsane: zor + nadir/şaşırtıcı; sahnede "EFSANE" rozeti ile vurgulanır.

### Kategoriler (genişletilmiş)

sinema, hayvanlar, fantezi, bilim-kurgu, yemek, tarih, doğa, spor, müzik,
mimari, uzay, sualtı, mitoloji, retro/80ler, oyun/video-oyunu, süper-kahraman,
absürt/meme, günlük-hayat, moda, araçlar.

Liste `targetPrompt.js` içinde veri olarak tutulur; her kategori için zorluk
bazlı tohum konseptleri bulunur. Yeni kategori/tohum eklemek sadece veri
düzenlemesidir.

## 3. State ve veri değişiklikleri

- `state.theme` (sabit kedi) kaldırılır.
- Eklenir: `state.targetPrompt`, `state.roundCategory`, `state.roundDifficulty`.
- Pre-cache alanları (`nextReferenceImageUrl`, `referenceForTheme` vb.) yeni
  modele uyarlanır: bir sonraki turun prompt + görsel + kategori + zorluk'u
  RESULT fazında önceden üretilir, maç başında promote edilir.
- `models/Match.js` kaydına `targetPrompt`, `category`, `difficulty` eklenir.
- `models/Settings.js`: `theme` alanı yerine `lockedCategory` + `lockedDifficulty`
  (boş = otomatik rastgele).
- Socket broadcast (`lib/socket/broadcasts.js`) + `types/game.ts`: yeni alanlar
  yayılır. `targetPrompt` yalnızca RESULT fazında istemciye gönderilir (önceden
  sızmasın).

## 4. Hype / ifşa UX

- Tur başı (VS / PROMPTING): gizli tema metni yerine kategori + zorluk rozeti
  ("KATEGORİ: SİNEMA · ZORLUK: EFSANE"). Hedef görsel görünür, gerçek prompt
  gizli kalır.
- Tur sonu (RESULT): dramatik "GERÇEK PROMPT" kartı açılır; yanında her
  oyuncunun yazdığı prompt + yakınlık skoru. Payoff anı.
- Skor draması mevcut; reveal onun üstüne eklenir.
- Etkilenen bileşenler: `StageVS.tsx`, `StagePrompting.tsx`, `StageResult.tsx`,
  `atmosphere.tsx` (TopBar rozeti), `PromptingView.tsx`, `ResultView.tsx`.

## 5. Admin

- Settings formundan `theme` metin alanı kaldırılır.
- Eklenir: kategori kilidi (dropdown, "otomatik" dahil) + zorluk kilidi
  (dropdown, "otomatik" dahil).
- `SettingsForm.tsx` + `app/api/admin/settings/route.ts` güncellenir.

## 6. Kapsam dışı (YAGNI)

- Prompt-metni benzerliği skorlaması yok; görsel benzerliği korunur.
- Kalıcı koleksiyon/rozet/seviye sistemi yok; rozet sadece tur içi gösterim.
- Kullanıcı oylaması yok (zaten kaldırılmış).
- Kategori/zorluk için ayrı zamanlama/ramp yok.

## Copy tonu

Tüm yüzey metinlerinde em-dash yasak (quedl design DNA). Türkçe, kısa, net.
