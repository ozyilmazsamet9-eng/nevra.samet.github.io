# Supabase’de Yapılacaklar

Sitede “Fotoğraf veya Video Yükle” ile eklediğin medyaların tüm cihazlarda görünmesi için Supabase’de şunları yap.

---

## 1. Projeye gir

- https://supabase.com → Giriş yap → Projeni seç (veya yeni proje oluştur).

---

## 2. Storage: “gallery” bucket’ı oluştur

1. Sol menüden **Storage**’a tıkla.
2. **New bucket** butonuna bas.
3. **Name:** `gallery` yaz (küçük harf, tam bu isim).
4. **Public bucket** kutusunu işaretle (yüklenen dosyalar link ile açılabilsin).
5. **Create bucket** de.

---

## 3. Storage: Yükleme izni (policy)

1. **Storage** → **Policies** sekmesine geç.
2. **New policy** → **For full customization** seç.
3. Şöyle ayarla:
   - **Policy name:** `Yükleme izni`
   - **Allowed operation:** **INSERT** (Upload)
   - **Target roles:** boş bırak (anon da yükleyebilir)
   - **WITH CHECK expression:** `true` yaz veya boş bırak
4. **Review** → **Save policy**.
5. Siteden yüklenen fotoğraf/videoyu **silmek** için bir policy daha ekle: **New policy** → **For full customization** → Policy name: `Silme izni`, **Allowed operation: DELETE** → Save.

---

## 4. Tablo oluştur (SQL)

1. Sol menüden **SQL Editor**’a gir.
2. **New query** de.
3. Projedeki **gallery_items.sql** dosyasını aç, içindeki **tüm satırları** kopyala (başında/sonunda ``` veya sql yazısı olmasın).
4. SQL Editor’e yapıştır → **Run** (veya Ctrl+Enter).

Hata almazsan tablo hazır.

Tablo zaten varsa ve sadece **silme** izni eklemek istiyorsan, SQL Editor’da şunu çalıştır:
`create policy "Herkes silebilir" on public.gallery_items for delete using (true);`

**Mesaj Bırak** özelliği için: Projedeki **messages.sql** dosyasının içeriğini SQL Editor’da yeni bir sorguda çalıştır.

---

## 5. API bilgilerini kopyala

1. Sol menüden **Settings** (dişli) → **API**.
2. Şunları kopyala:
   - **Project URL** (örn. `https://xxxxx.supabase.co`)
   - **anon public** key (uzun bir metin, “anon” / “public” yazan).

---

## 6. Projendeki config dosyasını doldur

1. Projende **supabase-config.js** dosyasını aç.
2. `null` olan yerleri kendi değerlerinle değiştir:

```javascript
window.supabaseUrl = "https://BURAYA_PROJE_ID.supabase.co";
window.supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6...";  // anon public key
```

3. Dosyayı kaydet.

---

## 7. Test et

1. Siteyi aç, giriş yap (nevra / samet).
2. Galeri bölümünde **“Fotoğraf veya Video Yükle”** ile bir fotoğraf yükle.
3. Aynı siteyi başka cihazda (veya farklı tarayıcıda) aç → yüklediğin fotoğraf orada da görünmeli.

---

## Sorun çıkarsa

- **Yükleme hatası:** Storage’ta `gallery` bucket’ı var mı, public mi? Policies’te INSERT policy ekledin mi?
- **Galeri boş / liste gelmiyor:** SQL’i çalıştırdın mı? Table Editor’da `gallery_items` tablosu görünüyor mu?
- **Config:** `supabase-config.js` içinde URL ve anon key’i tırnak içinde, virgüllü yazdığından emin ol.
