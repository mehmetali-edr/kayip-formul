// Oyun verisi: çağlar, terazi bölümleri, sınav soruları.
export const ERAS = [
  { id: 'bagdat', name: 'Bağdat · 820', sub: 'Beytülhikme · Cebir', color: 0x35d0c0, unlocked: true, part: 'Cebir' },
  { id: 'misir', name: 'Mısır · MÖ 2500', sub: 'Piramitler · Oran-Orantı', color: 0xffb347, unlocked: true, part: 'Oran' },
  { id: 'iskenderiye', name: 'İskenderiye · MÖ 240', sub: 'Kütüphane · Geometri', color: 0xb39ddb, unlocked: true, part: 'Geometri' },
];

export const STORY = [
  'Yıl 2157. İnsanlık matematiği unuttu... Bir "Silinme" tüm tarihi bozdu; sayılar, denklemler, oranlar hafızalardan kayboldu.',
  'Elinde son umut var: zaman makinesi. Ama makinenin çalışması için "Kayıp Formül"ün üç parçası gerekiyor — her biri farklı bir çağda saklı.',
  'Parçaları bulmak için o çağların bilginlerinden öğrenmen, bulmacaları çözmen ve sınavlarını geçmen gerek. İlk durak: Bağdat.',
];

// a·x + b = c·x + d  — her bölümün x değeri tam sayı ve pozitif.
export const BALANCE_LEVELS = [
  { a: 1, b: 3, c: 0, d: 7, tip: 'Önce tartının iki yanından da aynı ağırlığı çıkar. Denge bozulmaz!' },
  { a: 2, b: 0, c: 0, d: 10, tip: 'İki x var. İki tarafı da 2\'ye bölersen tek x kalır.' },
  { a: 2, b: 3, c: 0, d: 11, tip: 'Önce sabiti götür, sonra x\'in katsayısına böl.' },
  { a: 3, b: 2, c: 1, d: 8, tip: 'x iki yanda da var — iki taraftan da x çıkarabilirsin.' },
  { a: 4, b: 5, c: 2, d: 15, tip: 'Önce x\'leri azalt, sonra ağırlıkları, en son böl.' },
  { a: 5, b: 4, c: 2, d: 19, tip: 'Son bölüm! Aynı işlemi iki yana da uyguladığın sürece denge korunur.' },
];

// options[0] doğru cevap; çalışırken karıştırılır.
export const QUIZ_BAGDAT = [
  { topic: 'Birinci Derece Denklem', q: '2x + 5 = 17 denkleminde x kaçtır?', options: ['6', '5', '11', '7'], note: '2x = 12 → x = 6.' },
  { topic: 'Birinci Derece Denklem', q: '3x − 4 = 11 ise x kaçtır?', options: ['5', '3', '7', '15'], note: '3x = 15 → x = 5.' },
  { topic: 'Kesirli Denklem', q: 'x/4 + 2 = 5 ise x kaçtır?', options: ['12', '3', '7', '16'], note: 'x/4 = 3 → x = 12.' },
  { topic: 'İki Yanda x', q: '5x + 3 = 2x + 18 ise x kaçtır?', options: ['5', '3', '7', '6'], note: '3x = 15 → x = 5.' },
  { topic: 'Parantezli Denklem', q: '2(x − 3) = 10 ise x kaçtır?', options: ['8', '2', '5', '13'], note: 'x − 3 = 5 → x = 8.' },
  { topic: 'Mutlak Değer', q: '|x − 2| = 5 denkleminin çözüm kümesi nedir?', options: ['{7, −3}', '{7}', '{−3}', '{3, −7}'], note: 'x−2 = 5 veya x−2 = −5 → x = 7 veya x = −3.' },
  { topic: 'İkinci Derece Denklem', q: 'x² − 5x + 6 = 0 denkleminin kökleri nedir?', options: ['2 ve 3', '−2 ve −3', '1 ve 6', '−2 ve 3'], note: '(x−2)(x−3) = 0 → x = 2 veya x = 3.' },
  { topic: 'Matematik Tarihi', q: '"Algoritma" sözcüğü hangi bilginin adından gelir?', options: ['El-Harezmî', 'Pisagor', 'Öklid', 'Eratosthenes'], note: 'Algoritma, El-Harezmî\'nin Latinceleşmiş adı "Algoritmi"den türemiştir.' },
  { topic: 'Matematik Tarihi', q: '"Cebir" adı, Harezmî\'nin kitabındaki hangi işlemden gelir?', options: ['El-cebr: eksik olanı tamamlama', 'Çarpma tablosu', 'Daire alanı', 'Sayı yazma'], note: 'El-cebr "tamamlama" demektir: eşitliğin bir yanındaki eksiği tamamlayıp dengeyi korumak.' },
];

export const PASS_SCORE = 6;

export const HAREZMI = {
  hub: [
    'Selam, zaman yolcusu! Ben Harezmî\'nin hologramıyım. Gerçeği Bağdat\'ta seni bekliyor.',
    'Makinenin çalışması için Kayıp Formül\'ün üç parçası lazım: Cebir, Oran ve Geometri.',
    'Sağdaki parlayan kapı Bağdat\'a açılıyor. Haydi!',
  ],
  hubDone1: ['Cebir parçası makinede! İki parça daha var; diğer çağların kapıları şimdilik kapalı — bir sonraki güncellemede açılacak.'],
  bagdat1: [
    'Hoş geldin! Ben Muhammed bin Musa el-Harezmî. Beytülhikme\'de çalışıyorum.',
    'Benim büyük buluşum şu: bir denklem bir terazidir. İki yanı eşit olduğu sürece, iki yana da aynı şeyi yaparsan denge bozulmaz.',
    'İşte buna "el-cebr" ve "el-mukâbele" dedim. Soldaki teraziyi dene: x kutusunu yalnız bırakarak kaç olduğunu bul!',
  ],
  bagdat2: ['Teraziyi hiç sarsmadan çözdün! Şimdi son sınav: Bilgelik Sınavı. Hazırsan başlayalım.'],
  bagdat3: ['Cebir parçası artık senin! Zaman makinene dön ve onu yerine tak. Bilgi paylaşıldıkça çoğalır, unutma.'],
};

// ---------- MISIR: Thales'in gölge ölçümü ----------
// h arşınlık çubuğun gölgesi s ise, gölgesi S olan yapının boyu H = h·S/s
export const SHADOW_LEVELS = [
  { h: 2, s: 2, S: 6, tip: 'Çubuğun boyu gölgesine eşit. Aynı güneşte yapının boyu da gölgesine eşit olur.' },
  { h: 2, s: 4, S: 10, tip: 'Çubuğun gölgesi boyunun 2 katı. Yapının gölgesi 10 ise boyu bunun yarısıdır.' },
  { h: 3, s: 2, S: 6, tip: 'Boy / gölge oranı 3/2. Aynı oranı yapı için kur: H / 6 = 3 / 2.' },
  { h: 4, s: 6, S: 9, tip: 'Oranı sadeleştir: 4/6 = 2/3. Sonra H / 9 = 2 / 3.' },
  { h: 3, s: 5, S: 15, tip: 'İçler dışlar çarpımı: H · 5 = 3 · 15.' },
  { h: 5, s: 4, S: 8, tip: 'Son bölüm! Boy/gölge oranı hep aynı: 5/4 = H/8.' },
];

export const QUIZ_MISIR = [
  { topic: 'Doğru Orantı', q: '3 kalem 12 TL ise 5 kalem kaç TL eder?', options: ['20', '15', '18', '24'], note: 'Bir kalem 4 TL → 5 kalem 20 TL.' },
  { topic: 'Oran', q: 'a / b = 3 / 4 ve b = 20 ise a kaçtır?', options: ['15', '12', '16', '24'], note: 'a / 20 = 3 / 4 → a = 15.' },
  { topic: 'Ters Orantı', q: '6 işçi bir işi 10 günde bitiriyor. Aynı işi 12 işçi kaç günde bitirir?', options: ['5', '20', '8', '12'], note: 'İşçi sayısı 2 katına çıkınca süre yarıya iner (ters orantı): 5 gün.' },
  { topic: 'Ters Orantı', q: '4 musluk bir havuzu 6 saatte dolduruyor. 3 musluk kaç saatte doldurur?', options: ['8', '4,5', '6', '12'], note: 'Musluk sayısı azalınca süre uzar (ters orantı): 4·6 = 3·x → x = 8.' },
  { topic: 'Orantı Çözme', q: 'x / 5 = 12 / 15 ise x kaçtır?', options: ['4', '3', '5', '6'], note: 'İçler dışlar: 15x = 60 → x = 4.' },
  { topic: 'Orantı Çözme', q: '2 / x = 6 / 9 ise x kaçtır?', options: ['3', '4', '6', '1'], note: '6x = 18 → x = 3.' },
  { topic: 'Harita Ölçeği', q: 'Ölçeği 1/50000 olan haritada 4 cm, gerçekte kaç km eder?', options: ['2', '20', '0,2', '200'], note: '4 · 50000 = 200000 cm = 2 km.' },
  { topic: 'Gölge Problemi', q: 'Boyu 1,5 m olan çubuğun gölgesi 2 m iken, gölgesi 20 m olan ağacın boyu kaç metredir?', options: ['15', '12', '18', '30'], note: '1,5 / 2 = H / 20 → H = 15 m.' },
  { topic: 'Matematik Tarihi', q: 'Piramidin yüksekliğini gölgesinden ölçtüğü anlatılan Antik Yunan bilgini kimdir?', options: ['Thales', 'Pisagor', 'Öklid', 'Arşimet'], note: 'Thales, kendi boyunun gölgesine eşit olduğu anı bekleyip piramidin gölgesini ölçmüş.' },
];

export const AHMES = {
  misir1: [
    'Selam yolcu! Ben Katip Ahmes; sayıları papirüse yazarım.',
    'Nil her yıl taşar ve tarlaların sınırlarını siler. Biz de her yıl yeniden ölçeriz. Sırrımız ORAN: büyük ve küçük şeyler aynı oranı taşır.',
    'Güneş hepimize aynı açıyla vurur. 2 arşınlık çubuğun gölgesi 4 ise, bir yapının boyu da gölgesinin yarısıdır. Thales de piramidi böyle ölçmüştü.',
    'Şu çubuğun yanındaki yapı alanına git (E), bayrağın gösterdiği gölgeyi tutturacak boyu hesapla!',
  ],
  misir2: ['Gölgelerle yükseklik buldun, Nil çocukları gibi ölçüyorsun! Şimdi Katiplik Sınavı: Oran-Orantı. Hazırsan başlayalım.'],
  misir3: ['Oran parçası artık senin! Zaman makinene dön ve onu yerine tak. Oranı bilen, dünyayı ölçer.'],
};

// ---------- İSKENDERİYE: Eratosthenes, Dünya'nın çevresi ----------
// θ derece merkez açıya karşılık gelen yay L ise çember çevresi C = 360·L/θ
export const ANGLE_LEVELS = [
  { theta: 90, L: 10, unit: 'birim', tip: 'Çeyrek çember: 90° tam çemberin 1/4\'ü. Yay 10 ise çevre bunun 4 katı.' },
  { theta: 60, L: 20, unit: 'birim', tip: '60°, 360°\'nin altıda biri. Çevre = 6 · yay.' },
  { theta: 45, L: 12, unit: 'birim', tip: '45°, 360°\'nin sekizde biri. Çevre = 8 · yay.' },
  { theta: 30, L: 25, unit: 'birim', tip: 'Oran kur: 30 / 360 = 25 / C.' },
  { theta: 10, L: 40, unit: 'birim', tip: '10°, 360°\'nin 36\'da biri. C = 36 · 40.' },
  { theta: 7.2, L: 5000, unit: 'stadion', tip: 'Gerçek ölçüm! Eratosthenes\'in verileri: 7,2° ve 5000 stadion. 7,2 / 360 = 5000 / C.' },
];

export const QUIZ_ISKENDERIYE = [
  { topic: 'Üçgen', q: 'Bir üçgenin iç açılarının toplamı kaç derecedir?', options: ['180°', '360°', '90°', '270°'], note: 'Her üçgenin iç açıları toplamı 180°dir.' },
  { topic: 'Üçgen', q: 'İki açısı 50° ve 60° olan üçgenin üçüncü açısı kaç derecedir?', options: ['70°', '80°', '60°', '110°'], note: '180 − (50 + 60) = 70°.' },
  { topic: 'Çember', q: 'Yarıçapı 7 cm olan çemberin çevresi kaç cm\'dir? (π = 22/7)', options: ['44', '22', '154', '88'], note: 'Ç = 2πr = 2 · 22/7 · 7 = 44.' },
  { topic: 'Çember', q: 'Çevresi 62,8 cm olan çemberin yarıçapı kaç cm\'dir? (π = 3,14)', options: ['10', '20', '5', '6,28'], note: '2 · 3,14 · r = 62,8 → r = 10.' },
  { topic: 'Daire Dilimi', q: 'Çevresi 80 cm olan çemberde 90° lik merkez açının gördüğü yay kaç cm\'dir?', options: ['20', '40', '10', '30'], note: '90/360 = 1/4 → 80/4 = 20.' },
  { topic: 'Çevre Açı', q: 'Çapı gören çevre açı kaç derecedir?', options: ['90°', '180°', '45°', '60°'], note: 'Çapı gören çevre açı daima 90°dir.' },
  { topic: 'Çevre Açı', q: 'Merkez açısı 80° olan yayı gören çevre açı kaç derecedir?', options: ['40°', '80°', '160°', '20°'], note: 'Çevre açı, aynı yayı gören merkez açının yarısıdır.' },
  { topic: 'Pisagor', q: 'Dik kenarları 6 ve 8 olan dik üçgenin hipotenüsü kaçtır?', options: ['10', '14', '12', '9'], note: '6² + 8² = 100 → hipotenüs 10.' },
  { topic: 'Matematik Tarihi', q: 'Eratosthenes gölge ve açı kullanarak neyi ölçmüştür?', options: ['Dünya\'nın çevresini', 'Ay\'ın boyunu', 'Nil\'in uzunluğunu', 'Piramidin hacmini'], note: 'Syene ve İskenderiye arasındaki açıdan Dünya çevresini yaklaşık olarak hesapladı.' },
];

export const ERATO = {
  isk1: [
    "Selam yolcu! Ben Eratosthenes, İskenderiye Kütüphanesi'nin başkâtibiyim.",
    "Syene'de yaz gündönümü öğle vakti güneş ışınları kuyunun dibine kadar iner: ışınlar tam diktir. Aynı anda burada, İskenderiye'de çubuğun gölgesi düşer.",
    "İkisi arasındaki açı, Dünya'nın tam çemberi olan 360°'ye oranlanır. Yayın uzunluğunu bu orana bölersen çevreyi bulursun!",
    "Yandaki Dünya modelinde dene (E): yay ve açı verilecek, çemberin çevresini sen hesapla.",
  ],
  isk2: ["Dünya'yı bir çubuk, bir gölge ve biraz matematikle ölçtün! Şimdi son sınav: Açı ve Çevre. Hazırsan başlayalım."],
  isk3: ["Son parça da senin! Zaman makinene dön. Kayıp Formül tamamlanmak üzere."],
};

export const FINALE = [
  'Üç parça da yerinde: Cebir, Oran ve Geometri!',
  "Harezmî'nin dengesi, Ahmes'in oranı ve Eratosthenes'in ölçüsü bir araya geldi.",
  'Zaman makinesini çalıştırıyorum... Matematik geri dönüyor!',
];
