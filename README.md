# MONECO Protocol

**Proof of Image — DePIN Çevre Veri Protokolü on Monad**

Kullanıcılar çevrelerinin fotoğrafını çeker, AI + topluluk doğrular, $MONECO token kazanırlar. Belediyeler ve sponsorlar özel ödüllü görev havuzları açabilir.

---

## Nasıl Çalışır?

```
Toplayıcı fotoğraf yükler
        ↓
   AI Oracle kontrolü
        ↓ (geçerse)
 Validator oylaması (≥5 oy)
        ↓ (≥%60 onay)
  Ödüller dağıtılır
```

1. **Toplayıcı** — 1.000 $MONECO stake eder, haritadan konum seçer, fotoğraf hash'ini on-chain gönderir.
2. **AI Oracle** — Owner tarafından tetiklenir; sahte fotoğrafı tespit ederse toplayıcı slash edilir (token yakılır).
3. **Validator** — AI'dan geçen fotoğrafı oylar. 5 oy dolunca havuz finalize edilir. Yanlış oy veren validator ban sayacı artırır; 20 yanlış oy → ban.
4. **Ödül dağılımı** — Havuz ödülünün %70'i toplayıcıya, %30'u doğru oy kullanan validatörlere gider. Her seviye +%5 çarpan ekler.

---

## $MONECO Tokenomics

| Parametre | Değer |
|-----------|-------|
| Toplam Arz | 100.000.000 |
| Ağ | Monad |
| Toplayıcı Stake | 1.000 $MONECO |
| Slash | Stake yakılır (deflationary) |
| Validator ban eşiği | 20 yanlış oy |

### Zorluk → Havuz Ödülü

| Zorluk | Ödül |
|--------|------|
| 1 | 10 $MONECO |
| 2 | 25 $MONECO |
| 3 | 60 $MONECO |
| 4 | 150 $MONECO |
| 5 | 400 $MONECO |

### Seviye Sistemi (geometrik eşik: 50 × 2^(n-1))

| Seviye | Gerekli doğru | Ödül çarpanı |
|--------|---------------|--------------|
| 1 | — | ×1.00 |
| 2 | 50 | ×1.05 |
| 3 | 100 | ×1.10 |
| … | … | … |
| 10 | 12.800 | ×1.45 |

---

## Akıllı Sözleşmeler

| Sözleşme | Açıklama |
|----------|----------|
| `MonecoToken` | ERC-20, 100 M arz, owner mint/burn |
| `MonecoProtocol` | Kayıt, stake, fotoğraf gönderimi, AI callback, validator oylama, ödül dağıtımı |

### Temel Fonksiyonlar

```solidity
registerAsCollector()                          // 1000 MONECO stake et
registerAsValidator()                          // ücretsiz kayıt
submitImage(hash, lat, lon, name, difficulty)  // fotoğraf gönder
aiOracleCallback(poolId, passed, reason)       // AI sonucu bildir (owner)
castValidationVote(poolId, approve)            // oy kullan
createMunicipalPool(name, lat, lon, reward, difficulty) // belediye havuzu (owner)
fundProtocol(amount)                           // protokolü fonla
```

---

## Kurulum

### Gereksinimler

- Node.js ≥ 18
- npm

### Adımlar

```bash
# 1. Bağımlılıkları kur
npm install
cd frontend && npm install && cd ..

# 2. Ortam değişkenlerini ayarla
cp .env.example .env
# .env içine Monad testnet private key ekle:
# PRIVATE_KEY=0x...

# 3. Sözleşmeleri derle
npm run compile

# 4. Deploy et (Monad testnet)
npm run deploy:testnet

# 5. Frontend'i başlat
cd frontend && npm run dev
```

### Deploy Çıktısı

Deploy tamamlandıktan sonra konsol şu değerleri verir:

```
VITE_TOKEN_ADDRESS=0x...
VITE_PROTOCOL_ADDRESS=0x...
```

Bunları `frontend/.env` dosyasına ekleyin:

```env
VITE_TOKEN_ADDRESS=0x...
VITE_PROTOCOL_ADDRESS=0x...
```

---

## Frontend

React + Vite uygulaması. Cüzdan bağlandıktan sonra:

- **MapView** — Türkiye genelinde simüle edilmiş 150 konum; kirlilik rengi (yeşil/turuncu/kırmızı) fotograf yüklenince güncellenir.
- **CollectorPanel** — Seçili konuma fotoğraf yükle, AI analizi simülasyonu.
- **ValidatorPanel** — Bekleyen havuzları oyla.
- **UserProfile** — Seviye, doğru sayısı, kazanç, kayıt / stake işlemleri.

---

## Proje Yapısı

```
MonGo/
├── contracts/
│   └── MonecoProtocol.sol   # MonecoToken + MonecoProtocol
├── scripts/
│   └── deploy.ts            # Hardhat deploy scripti
├── frontend/
│   └── src/
│       ├── components/      # WalletConnect, MapView, CollectorPanel, …
│       ├── hooks/           # useContract, useUser, …
│       ├── types/           # TypeScript arayüzleri
│       └── utils/           # locationSimulator, …
├── hardhat.config.ts
└── package.json
```

---

## Ağ Bilgisi

| Alan | Değer |
|------|-------|
| Ağ | Monad Testnet |
| Chain ID | 10143 |
| RPC | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |

---

## Lisans

MIT
