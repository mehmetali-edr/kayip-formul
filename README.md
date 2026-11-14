# Kayıp Formül

Zaman yolculuğu temalı, 3D bir matematik eğitim oyunu (lise 9–10). Matematik silinmiş; 2157'den üç çağa ışınlanıp formülün parçalarını geri getiriyorsun.

## Çağlar
| Çağ | Konu | Rehber |
|---|---|---|
| Bağdat, 820 | Cebir — denklem çözme (terazi bulmacası) | Harezmî |
| Mısır, MÖ 2500 | Oran-orantı (gölge/boy bulmacası) | Ahmes |
| İskenderiye, MÖ 240 | Geometri — daire ve yay (Dünya'nın çevresi) | Eratosthenes |

Her çağda bulmacalar + 9 soruluk sınav var; sınavı geçince (en az 6 doğru) parça kazanılır. Oyun sonunda **Karne** yanlış soruları, çözümlerini ve çalışılacak konuları gösterir.

## Kontroller
WASD / ok tuşları: yürü · Fare sürükle: kamera · Tekerlek: yakınlaş · E: konuş/kullan · Boşluk: devam · K: karne · M: ses · F: FPS

## Çalıştırma
ES modülleri kullandığı için bir yerel sunucu gerekir (VS Code Live Server, `npx serve`, GitHub Pages). `index.html` dosyasını açmak yeterli.

## Teknoloji
Three.js r160 (unpkg), ES modülleri, UnrealBloom + özel renk geçişi, WebAudio ile üretilen ortam sesi. Derleme adımı yok.

## Kaynaklar
- Three.js — MIT
- Dokular: Poly Haven ve ambientCG (CC0)
- Gün batımı HDRI: Poly Haven "Magalies Field Sunset" (CC0)
- Karakter modelleri ve portreler: yapay zekâ destekli araçlarla üretilmiştir
- Oyun tasarımı ve kodu: Mehmet Ali Şinik (Çanakkale Onsekiz Mart Üniversitesi)
