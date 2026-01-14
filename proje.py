import cv2
import numpy as np
import matplotlib.pyplot as plt

def load_and_preprocess(image_path):
    """
    Adım 1: Veri Hazırlığı (Data Consistency)
    Görüntüyü yükler, griye çevirir ve sabit boyuta (512x512) getirir.
    """
    img = cv2.imread(image_path, 0) # Gri formatta oku
    if img is None:
        raise ValueError(f"Görüntü bulunamadı! '{image_path}' dosyasının bu dizinde olduğundan emin ol.")
    img_resized = cv2.resize(img, (512, 512)) # Standartlaştırma
    return img_resized

def spatial_enhancement(img):
    """
    Adım 2A: Uzamsal Düzende İyileştirme (Spatial Domain)
    CLAHE ve Keskinleştirme kullanır.
    """
    # CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced_img = clahe.apply(img)
    
    # Laplacian Sharpening (Agresif Kenar Vurgusu)
    kernel = np.array([[0, -1, 0], 
                       [-1, 5,-1], 
                       [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced_img, -1, kernel)
    return sharpened

def frequency_enhancement(img):
    """
    Adım 2B: Frekans Uzayında İyileştirme (Frequency Domain)
    Fourier Dönüşümü (DFT) ile Yüksek Geçiren Filtre (High Pass Filter) uygular.
    """
    dft = cv2.dft(np.float32(img), flags=cv2.DFT_COMPLEX_OUTPUT)
    dft_shift = np.fft.fftshift(dft)

    rows, cols = img.shape
    crow, ccol = rows//2, cols//2
    
    # High Pass Filter (Merkezi maskeleme - Alçak frekansları engelleme)
    mask = np.ones((rows, cols, 2), np.uint8)
    r = 30 # Yarıçap
    mask[crow-r:crow+r, ccol-r:ccol+r] = 0

    fshift = dft_shift * mask
    f_ishift = np.fft.ifftshift(fshift)
    img_back = cv2.idft(f_ishift)
    img_back = cv2.magnitude(img_back[:,:,0], img_back[:,:,1])

    # Görüntüyü 0-255 arasına normalize et
    cv2.normalize(img_back, img_back, 0, 255, cv2.NORM_MINMAX)
    return np.uint8(img_back)

def segmentation_method_1_otsu(img):
    """
    Adım 3A: Segmentasyon Yöntemi 1 (Otsu Eşikleme)
    """
    blur = cv2.GaussianBlur(img, (5,5), 0)
    ret, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    return th

def segmentation_method_2_adaptive(img):
    """
    Adım 3B: Segmentasyon Yöntemi 2 (Adaptive Thresholding)
    """
    th = cv2.adaptiveThreshold(img, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                               cv2.THRESH_BINARY, 11, 2)
    return th

def calculate_metrics(original, processed):
    """
    Adım 4: Nicel Karşılaştırma (PSNR hesaplar)
    """
    mse = np.mean((original - processed) ** 2)
    if mse == 0:
        return 100
    max_pixel = 255.0
    psnr = 20 * np.log10(max_pixel / np.sqrt(mse))
    return psnr

# --- ANA AKIŞ (PIPELINE) ---
image_path = 'foto.jpeg' 

try:
    # 1. Ön İşleme
    original = load_and_preprocess(image_path)

    # 2. İyileştirme
    spatial_result = spatial_enhancement(original)
    freq_result = frequency_enhancement(original)

    # 3. Segmentasyon
    seg_otsu = segmentation_method_1_otsu(spatial_result)
    seg_adapt = segmentation_method_2_adaptive(spatial_result)

    # 4. Performans Ölçümü
    area_otsu = np.count_nonzero(seg_otsu)
    area_adapt = np.count_nonzero(seg_adapt)

    print("-" * 30)
    print(f"Dosya İşlendi: {image_path}")
    print(f"Otsu Metodu Seçilen Piksel Sayısı: {area_otsu}")
    print(f"Adaptive Metodu Seçilen Piksel Sayısı: {area_adapt}")
    print(f"Farklılık Oranı: %{abs(area_otsu - area_adapt)/area_otsu*100:.2f}")
    print("-" * 30)

    # 5. Görselleştirme
    plt.figure(figsize=(15, 10))

    plt.subplot(2, 3, 1), plt.imshow(original, cmap='gray'), plt.title('1. Orijinal Girdi')
    plt.subplot(2, 3, 2), plt.imshow(spatial_result, cmap='gray'), plt.title('2. Uzamsal İyileştirme (CLAHE)')
    plt.subplot(2, 3, 3), plt.imshow(freq_result, cmap='gray'), plt.title('3. Frekans İyileştirme (HPF)')
    plt.subplot(2, 3, 5), plt.imshow(seg_otsu, cmap='gray'), plt.title('4. Seg: Otsu (Global)')
    plt.subplot(2, 3, 6), plt.imshow(seg_adapt, cmap='gray'), plt.title('5. Seg: Adaptive (Lokal)')

    plt.tight_layout()
    plt.show()

except Exception as e:
    print(f"Hata oluştu: {e}")