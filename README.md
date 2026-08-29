# 💸 EasyJot

**EasyJot**, kişisel finans yönetimini ve bütçe takibini kolaylaştırmak için geliştirilmiş, tam kapsamlı (full-stack) bir web uygulamasıdır. Gelir-gider takibi, aylık bütçe planlaması ve detaylı analitik özetleri ile finansal hedeflerinizi yönetmenize yardımcı olur.

---

## 🚀 Özellikler

- **Gelir & Gider Yönetimi:** Günlük harcamaları ve gelir kaynaklarını kolayca kategorize edip kaydedin.
- **Aylık Bütçe Planlama:** Farklı harcama kalemleri için limitler ve hedefler belirleyin.
- **Analitik & Özet Motoru:** Gelir-gider dengesini, harcama dağılımlarını ve trendleri görsel grafiklerle takip edin.
- **Güvenli Kimlik Doğrulama:** Güvenli oturum yönetimi ve kullanıcı verisi izolasyonu.
- **Konteyner Mimarisi:** Docker ve Nginx ile production ortamına hazır, hızlı ve yalıtılmış dağıtım.

---

## 🛠️ Teknoloji Yığını

- **Frontend:** Next.js / React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js / TypeScript
- **Veritabanı & ORM:** PostgreSQL, Drizzle ORM
- **Önbellekleme:** Redis
- **DevOps & Dağıtım:** Docker, Docker Compose, Nginx (Reverse Proxy)

---

## 📂 Proje Yapısı

```bash
easyjot/
├── backend/            # Express & Drizzle ORM REST API servisi
├── frontend/           # Next.js / React web arayüzü
├── nginx/              # Reverse proxy & yönlendirme konfigürasyonları
├── docker-compose.yml  # Tüm servisleri ayağa kaldıran Docker konfigürasyonu
├── .env.example        # Örnek ortam değişkenleri
└── PROJECT_SPECIFICATION.md
