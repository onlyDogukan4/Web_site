# HTML şablonları

Canlı `index.html` ve `admin.html` dosyaları buradan üretilir.

## Düzenleme akışı

1. `partials/` altındaki ilgili parçayı düzenleyin (ör. `partials/site/navbar.html`)
2. Veya `templates/index.html` / `templates/admin.html` iskeletini güncelleyin
3. Derleyin: `npm run build:html`

## Klasör yapısı

- `partials/site/` — navbar, footer, arama (ortak)
- `partials/index/` — ana sayfa bölümleri
- `partials/admin/modals/` — yönetici modalları
- `partials/admin/sections/` — yönetici panel sekmeleri

Ana sayfa JS: `js/pages/index.js`  
Ana sayfa ek CSS: `css/index-page.css`
