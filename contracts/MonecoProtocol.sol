// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ============================================================
//  MONECO PROTOCOL — Merkeziyetsizliğin Doğacı Manifestosu
//  Monad Network | DePIN Çevre Veri Protokolü
// ============================================================

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// ──────────────────────────────────────────────────────────────
//  $MONECO ERC-20 Token (100,000,000 toplam arz)
// ──────────────────────────────────────────────────────────────
contract MonecoToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 1e18;

    constructor(address initialOwner)
        ERC20("Moneco", "MONECO")
        Ownable(initialOwner)
    {
        _mint(initialOwner, TOTAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}

// ──────────────────────────────────────────────────────────────
//  Ana Protokol Sözleşmesi
// ──────────────────────────────────────────────────────────────
contract MonecoProtocol is ReentrancyGuard, Ownable {

    // ── Sabitler ────────────────────────────────────────────
    MonecoToken public immutable token;

    uint256 public constant COLLECTOR_STAKE    = 1_000 * 1e18;
    uint256 public constant LEVEL_BONUS_BPS    = 500;      // her seviye +5% (basis point)
    uint256 public constant COLLECTOR_SHARE    = 70;       // havuz ödülünün %70'i toplayıcılara
    uint256 public constant VALIDATOR_SHARE    = 30;       // %30'u doğrulayıcılara
    uint256 public constant MAX_WRONG_VOTES    = 20;       // doğrulayıcı ban eşiği

    // Geometrik seviye eşikleri: threshold[i] = 50 * 2^i  (i = 0..8 → seviye 1→10)
    uint256[9] public LEVEL_THRESHOLDS = [
        50, 100, 200, 400, 800, 1_600, 3_200, 6_400, 12_800
    ];

    // Zorluk → havuz ödülü (1=kolay … 5=çok izbe)
    uint256[5] public DIFFICULTY_REWARDS = [
        10  * 1e18,   // zorluk 1
        25  * 1e18,   // zorluk 2
        60  * 1e18,   // zorluk 3
        150 * 1e18,   // zorluk 4
        400 * 1e18    // zorluk 5
    ];

    // ── Tipler ─────────────────────────────────────────────
    enum Role        { None, Collector, Validator }
    enum ImageStatus { Pending, AICheck, ValidatorVote, Approved, Rejected }

    struct User {
        Role     role;
        uint8    level;           // 1-10
        uint256  correctAnswers;
        uint256  stakedAmount;
        bool     isSlashed;
        uint256  totalEarned;
    }

    struct ImagePool {
        bytes32     imageHash;
        address     collector;
        int256      latitude;     // 1e6 hassasiyet
        int256      longitude;
        uint256     poolReward;
        uint256     validatorCount;
        uint256     approveVotes;
        uint256     rejectVotes;
        ImageStatus status;
        uint256     submittedAt;
        bool        rewardDistributed;
        string      locationName;
        uint8       difficulty;
    }

    struct ValidationVote {
        bool    vote;      // true = onayla, false = reddet
        uint256 timestamp;
    }

    // ── State ───────────────────────────────────────────────
    mapping(address  => User)                                  public users;
    mapping(bytes32  => ImagePool)                             public imagePools;
    mapping(bytes32  => mapping(address => ValidationVote))    public validationVotes;
    mapping(bytes32  => address[])                             public poolValidators;
    mapping(bytes32  => address[])                             public poolCollectors;
    mapping(address  => uint256)                               public validatorWrongAnswers;

    bytes32[] public allPools;

    uint256 public validatorThreshold = 5;   // finalize için minimum oy sayısı
    uint256 public approvalQuorum     = 60;  // onay için gerekli minimum % oy

    // ── Olaylar ─────────────────────────────────────────────
    event UserRegistered      (address indexed user, Role role);
    event CollectorStaked     (address indexed collector, uint256 amount);
    event CollectorSlashed    (address indexed collector, uint256 amount, string reason);
    event ImageSubmitted      (bytes32 indexed poolId, address indexed collector, string locationName);
    event AICheckPassed       (bytes32 indexed poolId);
    event AICheckFailed       (bytes32 indexed poolId, string reason);
    event ValidationVoteCast  (bytes32 indexed poolId, address indexed validator, bool vote);
    event PoolFinalized       (bytes32 indexed poolId, bool approved);
    event RewardDistributed   (bytes32 indexed poolId, address indexed recipient, uint256 amount);
    event LevelUp             (address indexed user, uint8 newLevel);
    event ValidatorBanned     (address indexed validator);
    event MunicipalPoolCreated(bytes32 indexed poolId, string locationName, uint256 reward);

    // ── Modifier'lar ────────────────────────────────────────
    modifier onlyCollector() {
        User storage u = users[msg.sender];
        require(u.role == Role.Collector,          "Sadece toplayicilar");
        require(!u.isSlashed,                      "Hesap slash edildi");
        require(u.stakedAmount >= COLLECTOR_STAKE, "Yetersiz stake");
        _;
    }

    modifier onlyValidator() {
        User storage u = users[msg.sender];
        require(u.role == Role.Validator, "Sadece dogrulayicilar");
        require(!u.isSlashed,             "Hesap banlandi");
        _;
    }

    // ── Kurucu ──────────────────────────────────────────────
    constructor(address _token, address initialOwner)
        Ownable(initialOwner)
    {
        token = MonecoToken(_token);
    }

    // ════════════════════════════════════════════════════════
    //  KAYIT & STAKE
    // ════════════════════════════════════════════════════════

    /// @notice Kullanıcıyı Toplayıcı olarak kaydeder; 1000 $MONECO stake alır.
    function registerAsCollector() external nonReentrant {
        require(users[msg.sender].role == Role.None,              "Zaten kayitli");
        require(token.balanceOf(msg.sender) >= COLLECTOR_STAKE,   "Yetersiz bakiye");

        token.transferFrom(msg.sender, address(this), COLLECTOR_STAKE);

        users[msg.sender] = User({
            role:           Role.Collector,
            level:          1,
            correctAnswers: 0,
            stakedAmount:   COLLECTOR_STAKE,
            isSlashed:      false,
            totalEarned:    0
        });

        emit UserRegistered(msg.sender, Role.Collector);
        emit CollectorStaked(msg.sender, COLLECTOR_STAKE);
    }

    /// @notice Kullanıcıyı Doğrulayıcı olarak kaydeder (stake gereksiz).
    function registerAsValidator() external {
        require(users[msg.sender].role == Role.None, "Zaten kayitli");

        users[msg.sender] = User({
            role:           Role.Validator,
            level:          1,
            correctAnswers: 0,
            stakedAmount:   0,
            isSlashed:      false,
            totalEarned:    0
        });

        emit UserRegistered(msg.sender, Role.Validator);
    }

    // ════════════════════════════════════════════════════════
    //  FOTOĞRAF GÖNDERİMİ
    // ════════════════════════════════════════════════════════

    /**
     * @notice Toplayıcı fotoğraf hash'ini ve konum bilgisini sisteme gönderir.
     * @param imageHash   IPFS ya da on-chain fotoğraf hash'i
     * @param latitude    Enlem × 1e6 (örn: 40.123456 → 40123456)
     * @param longitude   Boylam × 1e6
     * @param locationName Konum adı (örn: "Çanakkale / Biga Belediyesi")
     * @param difficulty  1-5 arası alan zorluğu (5 = en izbe)
     */
    function submitImage(
        bytes32      imageHash,
        int256       latitude,
        int256       longitude,
        string calldata locationName,
        uint8        difficulty
    ) external onlyCollector nonReentrant returns (bytes32 poolId) {
        require(difficulty >= 1 && difficulty <= 5,  "Gecersiz zorluk");
        require(bytes(locationName).length > 0,       "Konum adi gerekli");

        poolId = keccak256(
            abi.encodePacked(imageHash, msg.sender, block.timestamp)
        );
        require(imagePools[poolId].submittedAt == 0, "Havuz mevcut");

        imagePools[poolId] = ImagePool({
            imageHash:         imageHash,
            collector:         msg.sender,
            latitude:          latitude,
            longitude:         longitude,
            poolReward:        DIFFICULTY_REWARDS[difficulty - 1],
            validatorCount:    0,
            approveVotes:      0,
            rejectVotes:       0,
            status:            ImageStatus.AICheck,
            submittedAt:       block.timestamp,
            rewardDistributed: false,
            locationName:      locationName,
            difficulty:        difficulty
        });

        poolCollectors[poolId].push(msg.sender);
        allPools.push(poolId);

        emit ImageSubmitted(poolId, msg.sender, locationName);
    }

    // ════════════════════════════════════════════════════════
    //  AI ORACLE GERİ ÇAĞRIMI
    // ════════════════════════════════════════════════════════

    /**
     * @notice Yetkilendirilmiş AI oracle'ı ön kontrol sonucunu bildirir.
     * @param passed  true → doğrulayıcı oylamasına geç, false → slash + reddet
     */
    function aiOracleCallback(
        bytes32 poolId,
        bool    passed,
        string calldata reason
    ) external onlyOwner {
        ImagePool storage pool = imagePools[poolId];
        require(pool.status == ImageStatus.AICheck, "AI kontrol asamasinda degil");

        if (passed) {
            pool.status = ImageStatus.ValidatorVote;
            emit AICheckPassed(poolId);
        } else {
            pool.status = ImageStatus.Rejected;
            _slashCollector(pool.collector, reason);
            emit AICheckFailed(poolId, reason);
        }
    }

    // ════════════════════════════════════════════════════════
    //  DOĞRULAYICI OYLAMASI
    // ════════════════════════════════════════════════════════

    /// @notice Doğrulayıcı bir fotoğraf havuzu için oy kullanır.
    function castValidationVote(bytes32 poolId, bool approve)
        external onlyValidator nonReentrant
    {
        ImagePool storage pool = imagePools[poolId];
        require(pool.status == ImageStatus.ValidatorVote,        "Oylama asamasinda degil");
        require(validationVotes[poolId][msg.sender].timestamp == 0, "Zaten oy kullanildi");
        require(pool.collector != msg.sender,                    "Kendi fotografini onaylayamazsin");

        validationVotes[poolId][msg.sender] = ValidationVote({
            vote:      approve,
            timestamp: block.timestamp
        });

        poolValidators[poolId].push(msg.sender);
        pool.validatorCount++;

        if (approve) pool.approveVotes++;
        else         pool.rejectVotes++;

        emit ValidationVoteCast(poolId, msg.sender, approve);

        if (pool.validatorCount >= validatorThreshold) {
            _finalizePool(poolId);
        }
    }

    // ── İç: Havuzu sonuçlandır ──────────────────────────────
    function _finalizePool(bytes32 poolId) internal {
        ImagePool storage pool = imagePools[poolId];

        uint256 approvalRate = (pool.approveVotes * 100) / pool.validatorCount;
        bool    approved     = approvalRate >= approvalQuorum;

        if (approved) {
            pool.status = ImageStatus.Approved;
            _distributeRewards(poolId);
            _updateUserLevel(pool.collector);
        } else {
            pool.status = ImageStatus.Rejected;
            _slashCollector(pool.collector, "Topluluk reddetti: sahte fotograf");
        }

        _processValidatorOutcomes(poolId, approved);
        emit PoolFinalized(poolId, approved);
    }

    // ════════════════════════════════════════════════════════
    //  ÖDÜL DAĞITIMI
    // ════════════════════════════════════════════════════════

    function _distributeRewards(bytes32 poolId) internal {
        ImagePool storage pool = imagePools[poolId];
        require(!pool.rewardDistributed, "Zaten dagitildi");
        pool.rewardDistributed = true;

        address[] memory collectors = poolCollectors[poolId];
        uint256 n = collectors.length;
        if (n == 0) return;

        // %70 toplayıcılara, %30 doğrulayıcılara
        uint256 collectorTotal  = (pool.poolReward * COLLECTOR_SHARE) / 100;
        uint256 perCollector    = collectorTotal / n;

        for (uint256 i = 0; i < n; i++) {
            address  c = collectors[i];
            uint256  reward = _applyLevelBonus(perCollector, users[c].level);
            users[c].correctAnswers++;
            users[c].totalEarned += reward;
            _safeTransfer(c, reward);
            emit RewardDistributed(poolId, c, reward);
        }

        uint256 validatorTotal = pool.poolReward - collectorTotal;
        _distributeValidatorRewards(poolId, validatorTotal, true);
    }

    function _distributeValidatorRewards(
        bytes32 poolId,
        uint256 totalAmount,
        bool    poolApproved
    ) internal {
        address[] memory validators = poolValidators[poolId];
        uint256 correctCount;

        for (uint256 i = 0; i < validators.length; i++) {
            if (validationVotes[poolId][validators[i]].vote == poolApproved) {
                correctCount++;
            }
        }
        if (correctCount == 0) return;

        uint256 perValidator = totalAmount / correctCount;

        for (uint256 i = 0; i < validators.length; i++) {
            address v = validators[i];
            if (validationVotes[poolId][v].vote == poolApproved) {
                uint256 reward = _applyLevelBonus(perValidator, users[v].level);
                users[v].totalEarned += reward;
                _safeTransfer(v, reward);
                emit RewardDistributed(poolId, v, reward);
            }
        }
    }

    function _processValidatorOutcomes(bytes32 poolId, bool poolApproved) internal {
        address[] memory validators = poolValidators[poolId];

        for (uint256 i = 0; i < validators.length; i++) {
            address v = validators[i];
            if (validationVotes[poolId][v].vote == poolApproved) {
                users[v].correctAnswers++;
                _updateUserLevel(v);
            } else {
                validatorWrongAnswers[v]++;
                if (validatorWrongAnswers[v] >= MAX_WRONG_VOTES) {
                    users[v].isSlashed = true;
                    emit ValidatorBanned(v);
                }
            }
        }
    }

    // ════════════════════════════════════════════════════════
    //  SLASH MEKANİZMASI
    // ════════════════════════════════════════════════════════

    function _slashCollector(address collector, string memory reason) internal {
        User storage u = users[collector];
        if (u.isSlashed) return;

        uint256 slashAmount = u.stakedAmount;
        u.stakedAmount = 0;
        u.isSlashed    = true;

        // Tokenları yak (deflationary baskı)
        if (slashAmount > 0) token.burn(slashAmount);

        emit CollectorSlashed(collector, slashAmount, reason);
    }

    // ════════════════════════════════════════════════════════
    //  SEVİYE SİSTEMİ  (Geometrik: 50 × 2^(level-1))
    // ════════════════════════════════════════════════════════

    function _updateUserLevel(address userAddr) internal {
        User storage u = users[userAddr];
        if (u.level >= 10) return;

        uint256 threshold = LEVEL_THRESHOLDS[u.level - 1];
        if (u.correctAnswers >= threshold) {
            u.level++;
            emit LevelUp(userAddr, u.level);
        }
    }

    // Ödül çarpanı: her seviye %5 artış (BPS cinsinden)
    // Seviye 1 → 10000 BPS (1×), Seviye 2 → 10500 BPS (1.05×), …
    function _applyLevelBonus(uint256 baseAmount, uint8 level) internal pure returns (uint256) {
        uint256 multiplier = 10_000 + uint256(level > 0 ? level - 1 : 0) * LEVEL_BONUS_BPS;
        return (baseAmount * multiplier) / 10_000;
    }

    // ════════════════════════════════════════════════════════
    //  BELEDİYE / KURUMSAL HAVUZ OLUŞTURMA (Admin)
    // ════════════════════════════════════════════════════════

    /**
     * @notice Belediye ya da sponsor tarafından özel ödüllü görev havuzu açar.
     * @dev Örnek: Çanakkale Biga Belediyesi → 100 $MONECO, zorluk 4
     */
    function createMunicipalPool(
        string  calldata locationName,
        int256           latitude,
        int256           longitude,
        uint256          rewardAmount,
        uint8            difficulty
    ) external onlyOwner returns (bytes32 poolId) {
        require(rewardAmount > 0,                  "Odulsuz havuz olusturulamaz");
        require(difficulty >= 1 && difficulty <= 5,"Gecersiz zorluk");

        poolId = keccak256(
            abi.encodePacked(locationName, latitude, longitude, block.timestamp)
        );

        imagePools[poolId] = ImagePool({
            imageHash:         bytes32(0),
            collector:         address(0),
            latitude:          latitude,
            longitude:         longitude,
            poolReward:        rewardAmount,
            validatorCount:    0,
            approveVotes:      0,
            rejectVotes:       0,
            status:            ImageStatus.Pending,
            submittedAt:       block.timestamp,
            rewardDistributed: false,
            locationName:      locationName,
            difficulty:        difficulty
        });

        allPools.push(poolId);
        emit MunicipalPoolCreated(poolId, locationName, rewardAmount);
    }

    /// @notice Protokolü $MONECO ile fonlar (belediye sponsorluğu, grant vb.)
    function fundProtocol(uint256 amount) external nonReentrant {
        token.transferFrom(msg.sender, address(this), amount);
    }

    // ════════════════════════════════════════════════════════
    //  ADMİN AYARLARI
    // ════════════════════════════════════════════════════════

    function setValidatorThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold >= 3, "Minimum 3 dogrulayici gerekli");
        validatorThreshold = _threshold;
    }

    function setApprovalQuorum(uint256 _quorum) external onlyOwner {
        require(_quorum >= 51 && _quorum <= 100, "Gecersiz quorum");
        approvalQuorum = _quorum;
    }

    // ════════════════════════════════════════════════════════
    //  VIEW FONKSİYONLARI
    // ════════════════════════════════════════════════════════

    function getUserInfo(address userAddr) external view returns (User memory) {
        return users[userAddr];
    }

    function getPoolInfo(bytes32 poolId) external view returns (ImagePool memory) {
        return imagePools[poolId];
    }

    function getAllPools() external view returns (bytes32[] memory) {
        return allPools;
    }

    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @notice Bir kullanıcının bir sonraki seviyeye kaç doğru cevap uzakta olduğunu döner.
     * @return threshold  Bir sonraki seviye için gereken toplam doğru sayısı
     * @return progress   Tamamlanma yüzdesi (0-100)
     * @return remaining  Kalan doğru sayısı
     */
    function getNextLevelInfo(address userAddr)
        external view
        returns (uint256 threshold, uint256 progress, uint256 remaining)
    {
        User storage u = users[userAddr];
        if (u.level >= 10) return (0, 100, 0);

        threshold = LEVEL_THRESHOLDS[u.level - 1];
        progress  = u.correctAnswers >= threshold
            ? 100
            : (u.correctAnswers * 100) / threshold;
        remaining = u.correctAnswers >= threshold
            ? 0
            : threshold - u.correctAnswers;
    }

    /// @notice Belirli temel ödüle kullanıcının seviye bonusunu uygular.
    function calculateUserReward(address userAddr, uint256 baseAmount)
        external view returns (uint256)
    {
        return _applyLevelBonus(baseAmount, users[userAddr].level);
    }

    // ── İç yardımcı ────────────────────────────────────────
    function _safeTransfer(address to, uint256 amount) internal {
        if (amount > 0 && token.balanceOf(address(this)) >= amount) {
            token.transfer(to, amount);
        }
    }
}
