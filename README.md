# Özel Oda Botu

Discord sunucuları için geçici özel ses odaları oluşturan TypeScript botu. Bot, kullanıcı oluşturma kanalına girdiğinde kişiye özel bir ses kanalı açar; kanal boş kaldığında otomatik olarak siler.

Panel görseli çalışma anında `@resvg/resvg-js` ile oluşturulur. Yönetim paneli koyu temalıdır ve sunucu avatarını kullanır. Panel butonları için sade özel Discord emojileri oluşturulur; emoji oluşturma yetkisi yoksa Unicode ikonları kullanılır.

## Gereksinimler

- Node.js 20 veya üzeri
- Çalışan MongoDB bağlantısı
- Discord bot uygulaması
- Bot için `Manage Channels`, `Move Members` ve `Manage Permissions` yetkileri
- Özel panel emojileri için `Manage Emojis and Stickers` yetkisi önerilir

## Kurulum

1. Depoyu klonlayın ve proje klasörüne girin.

```bash
git clone https://github.com/Saldiraay/Discord-TempVoice-Manager.git
cd voice-manager
npm install
```

2. `config.json` dosyasını açıp değerleri doldurun:

```json
{
	"token": "DISCORD_BOT_TOKEN",
	"clientId": "DISCORD_APPLICATION_CLIENT_ID",
	"guildId": "",
	"mongoUri": "mongodb://127.0.0.1:27017/ozel-oda-botu"
}
```

`guildId` boş bırakılırsa slash komutları global olarak kaydedilir. Geliştirme sırasında belirli bir sunucu ID’si yazarsanız komutlar o sunucuya kaydedilir ve daha hızlı görünür.

3. Slash komutlarını Discord’a kaydedin:

```bash
npm run register
```

4. Botu başlatın:

```bash
npm start
```

Geliştirme sırasında otomatik yeniden başlatma için:

```bash
npm run dev
```

## Kullanım

Sunucuda yönetici yetkisiyle `/setup` komutunu çalıştırın. Bot şunları oluşturur:

- Özel oda kategorisi
- Özel oda yönetim metin kanalı
- Oda oluşturma ses kanalı
- Görsel ve ikon butonlarından oluşan yönetim paneli

Kullanıcı oluşturma ses kanalına girdiğinde özel odası açılır ve kullanıcı otomatik olarak odaya taşınır.

## Komutlar

- `/setup`: Sunucuya özel oda sistemini kurar.
- `/voice name`: Oda adını değiştirir.
- `/voice limit`: Oda kullanıcı limitini değiştirir.
- `/voice privacy`: Oda bağlantı izinlerini açar veya kapatır.
- `/voice waiting`: Bekleme ayarını açar veya kapatır.
- `/voice chat`: Oda sohbet iznini açar veya kapatır.
- `/voice invite`: Kullanıcıyı odaya güvenilir olarak ekler.
- `/voice kick`: Kullanıcıyı odadan çıkarır.
- `/voice trust add/remove`: Güvenilir kullanıcı listesini yönetir.
- `/voice block add/remove`: Engelli kullanıcı listesini yönetir.
- `/voice claim`: Odayı sahiplenir.
- `/voice transfer`: Oda sahipliğini başka kullanıcıya devreder.
- `/voice delete`: Özel odayı siler.

Panelde kullanıcı işlemleri Discord kullanıcı seçim menüsüyle yapılır; ID yazılması gerekmez. İşlem sonrasında kullanıcı adı, güvenilir kullanıcılar ve engelli kullanıcılar kısa süreli bilgilendirme mesajında gösterilir.

## Proje Yapısı

- `src/handlers/command-handler.ts`: Komutları merkezi olarak kaydeder ve çalıştırır.
- `src/handlers/event-handler.ts`: Discord event kayıtlarını yönetir.
- `src/handlers/interaction-handler.ts`: Buton, kullanıcı seçim menüsü ve modal etkileşimlerini işler.
- `src/services/room-service.ts`: Oda kurulumu, oluşturulması ve temizlenmesini yönetir.
- `src/events/voice-state.ts`: Ses kanalı giriş-çıkışlarını takip eder.
- `src/models.ts`: MongoDB modellerini içerir.
- `src/panel.ts`: Resvg panel görselini ve panel emojilerini üretir.
- `src/config.ts`: Yalnızca `config.json` yapılandırmasını okur.

## Güvenlik

`config.json` içindeki bot token’ını ve MongoDB bağlantı adresini herkese açık bir depoya göndermeyin. Bu dosyadaki örnek değerleri kendi bilgilerinizle yerel olarak değiştirin. Gerçek bilgiler daha önce paylaşıldıysa Discord Developer Portal’dan bot token’ını, MongoDB sağlayıcınızdan da veritabanı parolasını yenileyin.

## Derleme

```bash
npm run build
```

Derleme çıktısı `dist/` klasörüne yazılır.
# Özel Oda Botu

TypeScript, discord.js, MongoDB ve `@resvg/resvg-js` ile çalışan geçici ses odası botu.

## Kurulum

1. Node.js 20+ ve çalışan bir MongoDB sunucusu kurun.
2. `config.json` içindeki `token` ve `clientId` değerlerini doldurun. İsterseniz `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID` ve `MONGODB_URI` ile bunları `.env` üzerinden geçersiz kılabilirsiniz.
3. Proje klasöründe `npm install` çalıştırın.
4. Slash komutunu Discord'a kaydetmek için `npm run register` çalıştırın.
5. Botu `npm start` ile başlatın.

Botun sunucuda kanal oluşturma, kanal yönetme, üyeleri taşıma ve izinleri yönetme yetkileri olmalıdır. `/setup` yalnızca yöneticiler tarafından kullanılabilir.

## Altyapı

- `src/handlers/command-handler.ts` komut tanımlarını ve çalıştırıcılarını merkezi olarak yönetir.
- `src/handlers/event-handler.ts` Discord event kayıtlarını ve hata akışını yönetir.
- `src/handlers/interaction-handler.ts` buton ve modal etkileşimlerini işler.
- `config.json` yalnızca ortak uygulama yapılandırmasını içerir; model ve komut implementasyonları bu projeye özeldir.

## Özellikler

- `/setup` ile kategori, `özel-odanı-yönet` metin kanalı ve `Ozel Oda Oluştur` ses kanalı kurulur.
- Oluşturma kanalına giren her kullanıcı için otomatik özel oda açılır.
- Türkçe panel görseli çalışma anında resvg-js ile PNG olarak üretilir.
- Ad, limit, gizlilik, bekleme, sohbet, güven, davet, atma, bölge, engelleme, sahiplenme, devretme ve silme işlemleri butonlarla çalışır.
- Oda sahibinin ayarları MongoDB'de saklanır ve sonraki odasına uygulanır.
- Boş kalan geçici odalar otomatik temizlenir.

## Komutlar

- `/setup`: Sistemi sunucuya kurar.
- `/voice name ad:<isim>` ve `/voice limit sayi:<0-99>`: Oda adı ve limitini değiştirir.
- `/voice privacy`, `/voice waiting`, `/voice chat`: İlgili ayarı açıp kapatır.
- `/voice region bölge:<auto|bölge>`: Ses bölgesini değiştirir.
- `/voice invite kullanici:<üye>` ve `/voice kick kullanici:<üye>`: Davet veya atma işlemi yapar.
- `/voice trust add kullanici:<üye>` ve `/voice trust remove kullanici:<üye>`: Güven listesini yönetir.
- `/voice block add kullanici:<üye>` ve `/voice block remove kullanici:<üye>`: Engelli listesini yönetir.
- `/voice claim`, `/voice transfer kullanici:<üye>` ve `/voice delete`: Sahiplik ve oda işlemlerini yönetir.
