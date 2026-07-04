/**
 * Mengompres & mengecilkan resolusi file gambar di sisi browser (client-side) sebelum diunggah,
 * supaya ukuran data yang dikirim ke server tetap kecil (hemat kuota, cepat, dan tidak melebihi
 * batas ukuran body request di backend). Dipakai untuk foto profil yang diunggah lewat galeri/kamera HP,
 * yang aslinya bisa berukuran beberapa MB.
 *
 * @param file       File gambar asli (dari <input type="file">)
 * @param maxWidth   Lebar maksimum hasil kompresi (px), tinggi menyesuaikan proporsional
 * @param quality    Kualitas kompresi JPEG (0-1), semakin kecil semakin ringan ukurannya
 * @returns          Data URL base64 (string) hasil gambar yang sudah dikompres
 */
export function compressImageFile(file: File, maxWidth = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memuat gambar untuk dikompres.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung kompresi gambar.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
