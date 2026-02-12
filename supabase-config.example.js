/**
 * Supabase ile yüklenen foto/videolar tüm cihazlarda görünür.
 *
 * KURULUM:
 * 1. https://supabase.com dashboard → Proje oluştur
 * 2. Storage → "New bucket" → adı: gallery → "Public bucket" işaretle (yüklenen dosyalar herkese açık URL ile açılır)
 * 3. Table Editor → "New table" → SQL ile oluştur (aşağıdaki SQL)
 * 4. Settings → API → Project URL ve anon public key'i kopyala
 * 5. Bu dosyayı "supabase-config.js" olarak kopyala ve aşağıdaki değerleri doldur
 *
 * SQL (Table Editor → SQL Editor'da çalıştır):
 *
 *   create table public.gallery_items (
 *     id uuid default gen_random_uuid() primary key,
 *     url text not null,
 *     type text not null,
 *     created_at timestamptz default now()
 *   );
 *
 *   alter table public.gallery_items enable row level security;
 *
 *   create policy "Herkes okuyabilir" on public.gallery_items for select using (true);
 *   create policy "Herkes ekleyebilir" on public.gallery_items for insert with check (true);
 *
 * Storage: gallery bucket'ı zaten public seçtiysen okuma açık. Yükleme için Policy ekle:
 *   Storage → gallery → Policies → "New policy" → "For full customization" →
 *   Policy name: Yükleme izni, Allowed operation: INSERT, Target roles: (boş bırak = herkes)
 */

window.supabaseUrl = "BURAYA_PROJECT_URL";
window.supabaseAnonKey = "BURAYA_ANON_KEY";
