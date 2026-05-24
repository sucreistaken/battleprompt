# Prompt Clash

Etkinliklerde QR ile katılımlı 1v1 AI görsel üretme yarışması.

## Hızlı başlangıç

```bash
# 1. .env oluştur
cp .env.example .env
# Düzenle: MONGODB_URI, GEMINI_API_KEY, GCS_BUCKET, ADMIN_PASSWORD, ADMIN_COOKIE_SECRET

# 2. Bağımlılıklar
npm install

# 3. Geliştirme
npm run dev
# → http://localhost:3000 (mobil + izleyici)
# → http://localhost:3000/stage (TV ekranı)
# → http://localhost:3000/admin (admin paneli)
```

## Ön koşullar

- **Node.js 20+**
- **MongoDB Atlas** cluster (M0 free yeterli). `MONGODB_URI` olarak bağla.
- **Google Cloud Storage** bucket. Şu seçeneklerden biri:
  - Lokal: `GOOGLE_APPLICATION_CREDENTIALS=./gcs-key.json` (SA JSON dosya yolu)
  - Cloud Run: bucket'a yazma yetkisi olan bir Service Account ile çalıştır (ADC)
  - Inline: `GCS_SA_KEY_JSON='{...}'` (Secret Manager'dan)
- **Gemini API key** ([aistudio.google.com](https://aistudio.google.com)). `GEMINI_API_KEY`.

Bucket public read olmalı veya uygun signed URL stratejisi seçilmeli (kod şu an public URL döndürüyor).

## Mimari

- Tek Node.js süreci: Next.js (App Router) + Socket.io aynı portta (`server.js`)
- Tek global maç, oda yok — RAM'de singleton state
- MongoDB sadece ayarlar + maç geçmişi + oy audit'i için
- Görseller GCS'te, public URL ile servis
- Gemini API: hem görsel üretimi (`gemini-2.5-flash-image`) hem skorlama (`gemini-2.5-flash` vision)

Detaylı tasarım: `C:\Users\kadir\.claude\plans\we-are-building-an-prancy-harbor.md`

## Cloud Run deploy

```bash
# Bir kerelik:
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create prompt-clash \
  --repository-format=docker --location=europe-west1

# Build + push
gcloud builds submit \
  --tag europe-west1-docker.pkg.dev/$PROJECT/prompt-clash/app:latest

# Deploy (tek instance, session affinity, no cpu throttling)
gcloud run deploy prompt-clash \
  --image europe-west1-docker.pkg.dev/$PROJECT/prompt-clash/app:latest \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances=1 \
  --max-instances=1 \
  --session-affinity \
  --cpu-throttling=disabled \
  --port=3000 \
  --memory=1Gi \
  --set-env-vars NEXT_PUBLIC_APP_URL=https://your-domain.example,GEMINI_IMAGE_MODEL=gemini-2.5-flash-image,GEMINI_TEXT_MODEL=gemini-2.5-flash,GCS_BUCKET=prompt-clash-images \
  --set-secrets MONGODB_URI=mongodb-uri:latest,GEMINI_API_KEY=gemini-key:latest,ADMIN_PASSWORD=admin-password:latest,ADMIN_COOKIE_SECRET=admin-cookie-secret:latest,GCS_SA_KEY_JSON=gcs-sa-key:latest
```

## Test akışı

1. `npm run dev`
2. 4 tarayıcı sekmesi:
   - `/stage` — TV görünümü
   - `/` (1. oyuncu) — nickname gir → Join → Player A
   - `/` (2. oyuncu, farklı sekme/incognito) — Join → Player B
   - `/` (3. izleyici) — otomatik izleyici
   - `/admin` — şifre gir, ayarları gör
3. Maç akar: VS → 60s prompt → görsel üretimi → AI skoru (veya oylama) → result → idle

## Edge case testleri

- **Disconnect:** Player A sekmesini kapat → 10s sonra mevcut prompt otomatik gönderilir
- **Gen failure:** `GEMINI_API_KEY`'i bozuk değer ayarla → 3x retry sonrası forfeit + diğer oyuncu kazanır
- **Berabere:** AI skorlama beraber çıkarsa sudden-death izleyici oylaması açılır
- **Profanite:** Küfürlü nickname → reject; küfürlü prompt → sahnede maskelenir
- **Çift oy:** Aynı cihazdan ikinci oy → reject (cookie dedup + Mongo unique index)

## Komutlar

- `npm run dev` — lokal geliştirme
- `npm run build` — Next.js build
- `npm start` — production
- `npm run typecheck` — TS kontrolü

## Yapılacaklar (v2 fikirleri)

- Çoklu eşzamanlı maç / oda sistemi
- Nickname istatistikleri ve leaderboard
- Replay paylaşımı
- Tema rotasyonu (admin'in seçtiği havuzdan rastgele)
- Stage'de ses efektleri
