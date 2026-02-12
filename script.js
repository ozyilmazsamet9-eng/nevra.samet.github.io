// Supabase (isteğe bağlı - supabase-config.js doluysa tüm cihazlarda görünür)
var supabaseReady = Promise.resolve();
if (window.supabaseUrl && window.supabaseAnonKey) {
    supabaseReady = import('https://esm.sh/@supabase/supabase-js@2').then(function(m) {
        window.supabase = m.createClient(window.supabaseUrl, window.supabaseAnonKey);
        return window.supabase;
    }).catch(function(e) { console.warn('Supabase yüklenemedi:', e); return null; });
}

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // Müzik çaları başlat ve otomatik çal
    initMusicPlayer();
    
    // Geri sayımı başlat (ilişkinizin başlangıç tarihi)
    startCountdown('2025-01-01T00:00:00');  
    // Sayfa yüklendiğinde müziği otomatik başlat
    const audio = document.getElementById('background-music');
    if (audio) {
        // Kullanıcı etkileşimi sonrası çalışması için bir kere tıklama dinleyicisi ekle
        const playAudioOnInteraction = () => {
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Otomatik çalma engellendi, kullanıcı etkileşimi bekleniyor...");
                });
            }
            
            // Sadece bir kere çalışsın diye event listener'ı kaldır
            document.removeEventListener('click', playAudioOnInteraction);
            document.removeEventListener('touchstart', playAudioOnInteraction);
            document.removeEventListener('keydown', playAudioOnInteraction);
        };
        
        // Kullanıcı etkileşimi için dinleyicileri ekle
        document.addEventListener('click', playAudioOnInteraction, { once: true });
        document.addEventListener('touchstart', playAudioOnInteraction, { once: true });
        document.addEventListener('keydown', playAudioOnInteraction, { once: true });
        
        // Müziğin ses seviyesini ayarla
        audio.volume = 0.5; // %50 ses seviyesi
    }
    
    // Yüklenen medyayı galeriye ekle (Supabase + IndexedDB), sonra LightGallery'yi başlat
    const galleryEl = document.getElementById('lightgallery');
    if (galleryEl) {
        supabaseReady.then(function() { return loadAllUploads(); }).then(function() {
            if (window.lightGallery) {
                var options = { speed: 500, download: false, mode: 'lg-fade' };
                if (typeof lgZoom !== 'undefined') options.plugins = [lgZoom];
                window.galleryInstance = lightGallery(galleryEl, options);
            }
            initGalleryUpload();
        });
    }
    
    supabaseReady.then(function() { loadMessages(); });
    
    // Navbar scroll efekti
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
    
    // Yumuşak kaydırma
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Giriş formu animasyonu
    const loginBox = document.querySelector('.login-box');
    if (loginBox) {
        setTimeout(() => {
            loginBox.style.opacity = '1';
            loginBox.style.transform = 'translateY(0)';
        }, 300);
    }
});

// --- Galeri yükleme (IndexedDB ile tarayıcıda saklanır) ---
var GALLERY_DB_NAME = 'NevraSametGallery';
var GALLERY_STORE = 'uploads';

function openGalleryDB() {
    return new Promise(function(resolve, reject) {
        var req = indexedDB.open(GALLERY_DB_NAME, 1);
        req.onerror = function() { reject(req.error); };
        req.onsuccess = function() { resolve(req.result); };
        req.onupgradeneeded = function(e) {
            e.target.result.createObjectStore(GALLERY_STORE, { keyPath: 'id' });
        };
    });
}

function loadUploadsFromSupabase() {
    var galleryEl = document.getElementById('lightgallery');
    if (!galleryEl || !window.supabase) return Promise.resolve();
    return window.supabase.from('gallery_items').select('id, url, type').order('created_at', { ascending: true })
        .then(function(r) {
            if (r.data && r.data.length) {
                r.data.forEach(function(item) {
                    addGalleryItemToDOM(galleryEl, item.type, item.url, { source: 'supabase', id: item.id, url: item.url });
                });
            }
            return Promise.resolve();
        })
        .catch(function() { return Promise.resolve(); });
}

function loadUploadsFromDB() {
    var galleryEl = document.getElementById('lightgallery');
    if (!galleryEl) return Promise.resolve();
    return openGalleryDB().then(function(db) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(GALLERY_STORE, 'readonly');
            var store = tx.objectStore(GALLERY_STORE);
            var req = store.getAll();
            req.onsuccess = function() {
                var items = req.result || [];
                items.forEach(function(item) {
                    var blob = item.data instanceof Blob ? item.data : new Blob([item.data]);
                    var url = URL.createObjectURL(blob);
                    addGalleryItemToDOM(galleryEl, item.type, url, { source: 'indexeddb', id: item.id });
                });
                resolve();
            };
            req.onerror = function() { reject(req.error); };
        });
    }).catch(function() { return Promise.resolve(); });
}

function loadAllUploads() {
    var galleryEl = document.getElementById('lightgallery');
    if (!galleryEl) return Promise.resolve();
    return loadUploadsFromSupabase().then(function() {
        return loadUploadsFromDB();
    });
}

function addGalleryItemToDOM(container, type, url, opts) {
    var el;
    if (type === 'image' || (typeof type === 'string' && type.indexOf('image') !== -1)) {
        var a = document.createElement('a');
        a.href = url;
        a.className = 'gallery-item';
        a.setAttribute('data-sub-html', '<h4>Yüklenen anı</h4>');
        var img = document.createElement('img');
        img.src = url;
        img.alt = 'Nevra ve Samet';
        a.appendChild(img);
        var overlay = document.createElement('div');
        overlay.className = 'gallery-overlay';
        overlay.innerHTML = '<i class="fas fa-search-plus"></i>';
        a.appendChild(overlay);
        el = a;
    } else {
        var video = document.createElement('video');
        video.src = url;
        video.controls = true;
        el = video;
    }
    if (opts && opts.source && opts.id) {
        var wrapper = document.createElement('div');
        wrapper.className = 'gallery-item-wrapper';
        wrapper.setAttribute('data-upload-source', opts.source);
        wrapper.setAttribute('data-upload-id', opts.id);
        if (opts.url) wrapper.setAttribute('data-upload-url', opts.url);
        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'upload-delete-btn';
        delBtn.setAttribute('title', 'Sil');
        delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        delBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm('Bu fotoğrafı/videoyu silmek istediğinize emin misiniz?')) {
                deleteUploadItem(wrapper);
            }
        });
        wrapper.appendChild(delBtn);
        wrapper.appendChild(el);
        container.appendChild(wrapper);
    } else {
        container.appendChild(el);
    }
}

function deleteUploadItem(wrapper) {
    var source = wrapper.getAttribute('data-upload-source');
    var id = wrapper.getAttribute('data-upload-id');
    var url = wrapper.getAttribute('data-upload-url');
    var galleryEl = document.getElementById('lightgallery');
    function removeFromDOM() {
        wrapper.remove();
        refreshLightGallery();
    }
    if (source === 'supabase' && window.supabase) {
        var path = url && url.indexOf('gallery/') !== -1 ? url.split('gallery/')[1].split('?')[0] : null;
        var p = Promise.resolve();
        if (path) {
            p = window.supabase.storage.from('gallery').remove([path]).then(function() {});
        }
        p.then(function() {
            return window.supabase.from('gallery_items').delete().eq('id', id);
        }).then(function() {
            removeFromDOM();
        }).catch(function(err) {
            console.warn('Silme hatası:', err);
            removeFromDOM();
        });
    } else if (source === 'indexeddb') {
        openGalleryDB().then(function(db) {
            return new Promise(function(resolve, reject) {
                var tx = db.transaction(GALLERY_STORE, 'readwrite');
                var store = tx.objectStore(GALLERY_STORE);
                store.delete(id);
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        }).then(removeFromDOM).catch(removeFromDOM);
    } else {
        removeFromDOM();
    }
}

function refreshLightGallery() {
    var galleryEl = document.getElementById('lightgallery');
    if (!galleryEl || !window.lightGallery) return;
    if (window.galleryInstance && typeof window.galleryInstance.destroy === 'function') {
        try { window.galleryInstance.destroy(); } catch (e) {}
    }
    var options = { speed: 500, download: false, mode: 'lg-fade' };
    if (typeof lgZoom !== 'undefined') options.plugins = [lgZoom];
    window.galleryInstance = lightGallery(galleryEl, options);
}

function uploadFileToSupabase(file, index) {
    var type = file.type.indexOf('image') !== -1 ? 'image' : 'video';
    var ext = (file.name && file.name.indexOf('.') !== -1) ? file.name.substring(file.name.lastIndexOf('.')) : (type === 'image' ? '.jpg' : '.mp4');
    var path = Date.now() + '_' + index + ext;
    return window.supabase.storage.from('gallery').upload(path, file, { upsert: false })
        .then(function(r) {
            if (r.error) throw r.error;
            var pub = window.supabase.storage.from('gallery').getPublicUrl(path);
            return { url: pub.data.publicUrl, type: type };
        });
}

function addItemToSupabase(item) {
    return window.supabase.from('gallery_items').insert({ url: item.url, type: item.type }).select('id').single();
}

function initGalleryUpload() {
    var input = document.getElementById('gallery-upload');
    var galleryEl = document.getElementById('lightgallery');
    if (!input || !galleryEl) return;
    input.addEventListener('change', function() {
        var files = this.files;
        if (!files || files.length === 0) return;
        var useSupabase = window.supabase;
        var processFile = function(index) {
            if (index >= files.length) {
                refreshLightGallery();
                input.value = '';
                return;
            }
            var file = files[index];
            var type = file.type.indexOf('image') !== -1 ? 'image' : 'video';
            var id = Date.now() + '_' + index;
            if (useSupabase) {
                uploadFileToSupabase(file, index).then(function(item) {
                    return addItemToSupabase(item).then(function(r) {
                        if (r.error) throw r.error;
                        var id = r.data && r.data.id ? r.data.id : null;
                        addGalleryItemToDOM(galleryEl, item.type, item.url, id ? { source: 'supabase', id: id, url: item.url } : null);
                        processFile(index + 1);
                    });
                }).catch(function(err) {
                    console.warn('Supabase yükleme hatası, yerel kayda geçiliyor:', err);
                    useSupabase = false;
                    saveToIndexedDBAndContinue(file, type, id, galleryEl, index, processFile);
                });
            } else {
                saveToIndexedDBAndContinue(file, type, id, galleryEl, index, processFile);
            }
        };
        function saveToIndexedDBAndContinue(file, type, id, galleryEl, index, processFile) {
            var reader = new FileReader();
            reader.onload = function() {
                var blob = new Blob([reader.result], { type: file.type });
                openGalleryDB().then(function(db) {
                    return new Promise(function(resolve, reject) {
                        var tx = db.transaction(GALLERY_STORE, 'readwrite');
                        var store = tx.objectStore(GALLERY_STORE);
                        store.put({ id: id, type: type, data: blob });
                        tx.oncomplete = function() {
                            var url = URL.createObjectURL(blob);
                            addGalleryItemToDOM(galleryEl, type, url, { source: 'indexeddb', id: id });
                            resolve();
                        };
                        tx.onerror = function() { reject(tx.error); };
                    });
                }).then(function() { processFile(index + 1); }).catch(function() { processFile(index + 1); });
            };
            reader.readAsArrayBuffer(file);
        }
        processFile(0);
    });
}

// Müzik çalar fonksiyonları
function initMusicPlayer() {
    const playBtn = document.getElementById('play-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const audio = document.getElementById('background-music');
    
    if (!audio) return;
    
    // Müzik çalma durumuna göre buton ikonunu güncelle
    const updatePlayButton = () => {
        if (audio.paused) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    };
    
    // Müzik çalma/duraklatma
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
            } else {
                audio.pause();
            }
            updatePlayButton();
        });
    }
    
    // Önceki şarkı
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            // Önceki şarkıya geçme kodu buraya eklenecek
            console.log('Önceki şarkı');
        });
    }
    
    // Sonraki şarkı
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            // Sonraki şarkıya geçme kodu buraya eklenecek
            console.log('Sonraki şarkı');
        });
    }
    
    // Müzik bittiğinde veya duraklatıldığında butonu güncelle
    audio.addEventListener('play', updatePlayButton);
    audio.addEventListener('pause', updatePlayButton);
    
    // Sayfa yüklendiğinde otomatik çalmayı dene
    const playPromise = audio.play();
    
    // Otomatik çalma engellendiyse
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Otomatik çalma engellendi:", error);
        });
    }
}

// Geri sayım fonksiyonu
function startCountdown(startDate) {
    console.log('Geri sayım başlatılıyor...');
    const targetDate = new Date(startDate);
    console.log('Hedef tarih:', targetDate);
    
    const daysElement = document.getElementById('days');
    const hoursElement = document.getElementById('hours');
    const minutesElement = document.getElementById('minutes');
    const secondsElement = document.getElementById('seconds');
    
    console.log('Elementler:', { daysElement, hoursElement, minutesElement, secondsElement });
    
    if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
        console.error('Geri sayım için gerekli elementler bulunamadı!');
        return;
    }
    
    // İlk değerleri ata
    daysElement.textContent = '00';
    hoursElement.textContent = '00';
    minutesElement.textContent = '00';
    secondsElement.textContent = '00';
    
    const updateCountdown = () => {
        const now = new Date();
        const diff = now - targetDate;
        
        console.log('Şu anki zaman:', now);
        console.log('Fark (ms):', diff);
        
        // Negatif süre kontrolü (geçmiş tarih için)
        if (diff < 0) {
            console.log('Hedef tarih henüz gelmedi');
            daysElement.textContent = '00';
            hoursElement.textContent = '00';
            minutesElement.textContent = '00';
            secondsElement.textContent = '00';
            return;
        }
        
        // Gün, saat, dakika ve saniyeleri hesapla
        const totalSeconds = Math.floor(diff / 1000);
        const days = Math.floor(totalSeconds / (3600 * 24));
        const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        console.log('Hesaplanan değerler:', { days, hours, minutes, seconds });
        
        // Değerleri güncelle
        daysElement.textContent = days.toString().padStart(2, '0');
        hoursElement.textContent = hours.toString().padStart(2, '0');
        minutesElement.textContent = minutes.toString().padStart(2, '0');
        secondsElement.textContent = seconds.toString().padStart(2, '0');
        
        // Her saniyede bir animasyon efekti ekle
        [daysElement, hoursElement, minutesElement, secondsElement].forEach(el => {
            if (el) { // Element kontrolü ekledim
                el.classList.add('pulse');
                setTimeout(() => el.classList.remove('pulse'), 900);
            }
        });
    };
    
    // Hemen bir kere çalıştır
    updateCountdown();
    
    // Her saniye bir güncelle
    setInterval(updateCountdown, 1000);
    
    // Sayacı hemen güncelle ve her saniye bir daha güncelle
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Giriş kontrolü
function checkLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim().toLowerCase();
    const loginContainer = document.querySelector('.login-container');
    
    if (username === 'nevra' && password === 'samet') {
        // Giriş başarılı animasyonu
        loginContainer.style.opacity = '0';
        
        // Animasyon bittikten sonra gizle
        setTimeout(() => {
            loginContainer.style.display = 'none';
            document.body.style.overflow = 'auto';
            
            // Sayfayı en üste kaydır
            window.scrollTo(0, 0);
            
            // Müziği başlat (kullanıcı etkileşimi sonrası çalışacak)
            const audio = document.getElementById('background-music');
            if (audio) {
                audio.volume = 0.5;
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Müzik çalınamadı:", error);
                    });
                }
            }
        }, 500);
    } else {
        // Hata animasyonu
        const loginBox = document.querySelector('.login-box');
        loginBox.style.animation = 'shake 0.5s';
        
        // Animasyon bittikten sonra sıfırla
        setTimeout(() => {
            loginBox.style.animation = '';
        }, 500);
        
        alert('Kullanıcı adı veya şifre yanlış!');
    }
}

var MESSAGES_STORAGE_KEY = 'nevra_samet_messages';

function getMessagesFromStorage() {
    try {
        var raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
}

function saveMessageToStorage(author, content) {
    var list = getMessagesFromStorage();
    list.unshift({
        author_name: author || null,
        content: content,
        created_at: new Date().toISOString()
    });
    if (list.length > 100) list = list.slice(0, 100);
    try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
}

function renderMessageList(items) {
    var listEl = document.getElementById('message-list');
    if (!listEl) return;
    if (!items || items.length === 0) {
        listEl.innerHTML = '<p class="message-list-empty">Henüz mesaj yok. İlk mesajı siz bırakın! 💕</p>';
        return;
    }
    listEl.innerHTML = items.map(function(m) {
        var name = m.author_name && String(m.author_name).trim() ? String(m.author_name).trim() : 'Anonim';
        var date = m.created_at ? new Date(m.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
        return '<div class="message-card"><div class="message-author-name">' + escapeHtml(name) + '</div><div class="message-content">' + escapeHtml(m.content) + '</div><div class="message-date">' + date + '</div></div>';
    }).join('');
}

// Mesaj listesini yükle (önce Supabase, yoksa localStorage)
function loadMessages() {
    var listEl = document.getElementById('message-list');
    if (!listEl) return;
    if (window.supabase) {
        window.supabase.from('messages').select('author_name, content, created_at').order('created_at', { ascending: false }).limit(50)
            .then(function(r) {
                if (!r.error && r.data && r.data.length > 0) {
                    renderMessageList(r.data);
                    return;
                }
                var local = getMessagesFromStorage();
                if (local.length > 0) {
                    renderMessageList(local);
                } else {
                    renderMessageList([]);
                }
            })
            .catch(function() {
                renderMessageList(getMessagesFromStorage());
            });
    } else {
        renderMessageList(getMessagesFromStorage());
    }
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mesaj gönderme fonksiyonu - mesaj hem sayfada listelenir hem Supabase/localStorage'a kaydedilir
function sendMessage(event) {
    event.preventDefault();
    var form = document.querySelector('.message-form');
    var authorInput = form && form.querySelector('.message-author');
    var messageInput = form && form.querySelector('.message-text');
    var author = authorInput ? authorInput.value.trim() : '';
    var message = messageInput ? messageInput.value.trim() : '';
    if (!message) {
        alert('Lütfen bir mesaj yazın!');
        return;
    }
    function showOnPage() {
        messageInput.value = '';
        if (authorInput) authorInput.value = '';
        loadMessages();
        alert('Mesajınız gönderildi! ❤️');
    }
    if (window.supabase) {
        window.supabase.from('messages').insert({ author_name: author || null, content: message })
            .then(function(r) {
                if (r.error) {
                    saveMessageToStorage(author, message);
                    showOnPage();
                    return;
                }
                showOnPage();
            })
            .catch(function() {
                saveMessageToStorage(author, message);
                showOnPage();
            });
    } else {
        saveMessageToStorage(author, message);
        showOnPage();
    }
}

// Sayfa yüklendiğinde çalışacak ek fonksiyonlar
window.onload = function() {
    // Sayfa yüklendiğinde navbar'ı kontrol et
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    }
    
    // Giriş formuna odaklan
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.focus();
    }
};
