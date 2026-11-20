// 원정 현지어 회화 — 독일어(베를린·빈), 체코어(프라하), 영어
// 각 문장: ko 한국어 뜻 · en 영어 · de 독일어 · deP 독일어 한글 발음 · cs 체코어 · csP 체코어 한글 발음 · enP 영어 한글 발음
window.TOUR_PHRASES = {
  langs: {
    de: { name: '독일어', nameEn: 'German', where: '베를린 · 빈', whereEn: 'Berlin · Vienna', speech: 'de-DE' },
    cs: { name: '체코어', nameEn: 'Czech', where: '프라하', whereEn: 'Prague', speech: 'cs-CZ' },
    en: { name: '영어', nameEn: 'English', where: '어디서나', whereEn: 'Everywhere', speech: 'en-US' }
  },
  cats: [
    { id: 'greet', ko: '인사', en: 'Greetings' },
    { id: 'show', ko: '공연·태권도', en: 'Show & Taekwondo' },
    { id: 'food', ko: '식당·카페', en: 'Restaurant & Café' },
    { id: 'way', ko: '길·교통', en: 'Directions & Transport' },
    { id: 'shop', ko: '쇼핑', en: 'Shopping' },
    { id: 'hotel', ko: '숙소', en: 'Hotel' },
    { id: 'help', ko: '긴급·도움', en: 'Emergency & Help' }
  ],
  list: [
    { id: 'g1', cat: 'greet', ko: '안녕하세요', en: 'Hello!', enP: '헬로', de: 'Hallo! / Guten Tag!', deP: '할로 / 구텐 타크', cs: 'Dobrý den!', csP: '도브리 덴' },
    { id: 'g2', cat: 'greet', ko: '안녕히 계세요 (헤어질 때)', en: 'Goodbye!', enP: '굿바이', de: 'Auf Wiedersehen!', deP: '아우프 비더제엔', cs: 'Na shledanou!', csP: '나 스흘레다노우' },
    { id: 'g3', cat: 'greet', ko: '감사합니다', en: 'Thank you!', enP: '땡큐', de: 'Danke schön!', deP: '당케 쇤', cs: 'Děkuji!', csP: '데쿠이' },
    { id: 'g4', cat: 'greet', ko: '실례합니다 / 죄송합니다', en: 'Excuse me!', enP: '익스큐즈 미', de: 'Entschuldigung!', deP: '엔트슐디궁', cs: 'Promiňte!', csP: '프로미뉴테' },
    { id: 'g5', cat: 'greet', ko: '네 / 아니요', en: 'Yes / No', enP: '예스 / 노', de: 'Ja / Nein', deP: '야 / 나인', cs: 'Ano / Ne', csP: '아노 / 네' },
    { id: 'g6', cat: 'greet', ko: '저는 한국에서 왔어요', en: "I'm from Korea.", enP: '아임 프롬 코리아', de: 'Ich komme aus Korea.', deP: '이히 콤메 아우스 코레아', cs: 'Jsem z Koreje.', csP: '이셈 스 코레예' },
    { id: 'g7', cat: 'greet', ko: '제 이름은 ○○입니다', en: 'My name is …', enP: '마이 네임 이즈', de: 'Ich heiße …', deP: '이히 하이세', cs: 'Jmenuji se …', csP: '이메누이 세' },
    { id: 'g8', cat: 'greet', ko: '만나서 반가워요', en: 'Nice to meet you!', enP: '나이스 투 밋 유', de: 'Freut mich!', deP: '프로이트 미히', cs: 'Těší mě!', csP: '테시 므녜' },
    { id: 'g9', cat: 'greet', ko: '안녕하세요 (빈에서 쓰는 인사)', en: 'Hello! (Austrian greeting)', enP: '헬로', de: 'Grüß Gott!', deP: '그뤼스 고트', cs: 'Dobrý den!', csP: '도브리 덴', only: 'de' },

    { id: 's1', cat: 'show', ko: '우리는 한국에서 온 태권도 팀이에요', en: "We're a taekwondo team from Korea.", enP: '위어 어 태권도 팀 프롬 코리아', de: 'Wir sind ein Taekwondo-Team aus Korea.', deP: '비어 진트 아인 태권도 팀 아우스 코레아', cs: 'Jsme tým taekwonda z Koreje.', csP: '이스메 팀 태권다 스 코레예' },
    { id: 's2', cat: 'show', ko: '공연은 7시에 시작해요', en: 'The show starts at seven.', enP: '더 쇼 스타츠 앳 세븐', de: 'Die Show beginnt um sieben Uhr.', deP: '디 쇼 베긴트 움 지벤 우어', cs: 'Představení začíná v sedm hodin.', csP: '프르셰드스타베니 자치나 프 세듬 호딘' },
    { id: 's3', cat: 'show', ko: '공연 보러 오세요!', en: 'Please come and watch!', enP: '플리즈 컴 앤 워치', de: 'Kommen Sie und schauen Sie zu!', deP: '콤멘 지 운트 샤우엔 지 추', cs: 'Přijďte se podívat!', csP: '프르시이테 세 포디바트' },
    { id: 's4', cat: 'show', ko: '같이 사진 찍을래요?', en: 'Would you like a photo with us?', enP: '우쥬 라이크 어 포토 위드 어스', de: 'Möchten Sie ein Foto mit uns machen?', deP: '뫼히텐 지 아인 포토 미트 운스 마헨', cs: 'Chcete si s námi udělat fotku?', csP: '흐체테 시 스 나미 우델라트 포트쿠' },
    { id: 's5', cat: 'show', ko: '태권도는 한국의 무술이에요', en: 'Taekwondo is a Korean martial art.', enP: '태권도 이즈 어 코리안 마셜 아트', de: 'Taekwondo ist eine koreanische Kampfkunst.', deP: '태권도 이스트 아이네 코레아니셰 캄프쿤스트', cs: 'Taekwondo je korejské bojové umění.', csP: '태권도 예 코레이스케 보요베 우므녜니' },
    { id: 's6', cat: 'show', ko: '무대는 어디예요?', en: 'Where is the stage?', enP: '웨어 이즈 더 스테이지', de: 'Wo ist die Bühne?', deP: '보 이스트 디 뷔네', cs: 'Kde je pódium?', csP: '그데 예 포디움' },
    { id: 's7', cat: 'show', ko: '탈의실은 어디예요?', en: 'Where is the changing room?', enP: '웨어 이즈 더 체인징 룸', de: 'Wo ist die Umkleide?', deP: '보 이스트 디 움클라이데', cs: 'Kde je šatna?', csP: '그데 예 샤트나' },
    { id: 's8', cat: 'show', ko: '큰 박수 부탁드려요!', en: 'A big round of applause, please!', enP: '어 빅 라운드 오브 어플로즈 플리즈', de: 'Bitte einen großen Applaus!', deP: '비테 아이넨 그로센 아플라우스', cs: 'Prosím o velký potlesk!', csP: '프로심 오 벨키 포틀레스크' },

    { id: 'f1', cat: 'food', ko: '메뉴판 주세요', en: 'The menu, please.', enP: '더 메뉴 플리즈', de: 'Die Speisekarte, bitte.', deP: '디 슈파이제카르테 비테', cs: 'Jídelní lístek, prosím.', csP: '이델니 리스테크 프로심' },
    { id: 'f2', cat: 'food', ko: '물 주세요', en: 'Water, please.', enP: '워터 플리즈', de: 'Wasser, bitte.', deP: '바서 비테', cs: 'Vodu, prosím.', csP: '보두 프로심' },
    { id: 'f3', cat: 'food', ko: '이거 주세요', en: 'This one, please.', enP: '디스 원 플리즈', de: 'Das hier, bitte.', deP: '다스 히어 비테', cs: 'Tohle, prosím.', csP: '토흘레 프로심' },
    { id: 'f4', cat: 'food', ko: '계산할게요', en: 'The bill, please.', enP: '더 빌 플리즈', de: 'Die Rechnung, bitte.', deP: '디 레히눙 비테', cs: 'Zaplatím, prosím.', csP: '자플라팀 프로심' },
    { id: 'f5', cat: 'food', ko: '정말 맛있어요!', en: "It's delicious!", enP: '잇츠 딜리셔스', de: 'Sehr lecker!', deP: '제어 레커', cs: 'Je to výborné!', csP: '예 토 비보르네' },
    { id: 'f6', cat: 'food', ko: '저는 땅콩 알레르기가 있어요', en: "I'm allergic to peanuts.", enP: '아임 알러직 투 피넛츠', de: 'Ich bin allergisch gegen Erdnüsse.', deP: '이히 빈 알레르기시 게겐 에어트뉘세', cs: 'Mám alergii na arašídy.', csP: '맘 알레르기이 나 아라시디' },
    { id: 'f7', cat: 'food', ko: '화장실이 어디예요?', en: 'Where is the restroom?', enP: '웨어 이즈 더 레스트룸', de: 'Wo ist die Toilette?', deP: '보 이스트 디 토알레테', cs: 'Kde je toaleta?', csP: '그데 예 토알레타' },
    { id: 'f8', cat: 'food', ko: '카드로 낼게요', en: 'By card, please.', enP: '바이 카드 플리즈', de: 'Mit Karte, bitte.', deP: '미트 카르테 비테', cs: 'Kartou, prosím.', csP: '카르토우 프로심' },

    { id: 'w1', cat: 'way', ko: '○○는 어디예요?', en: 'Where is …?', enP: '웨어 이즈', de: 'Wo ist …?', deP: '보 이스트', cs: 'Kde je …?', csP: '그데 예' },
    { id: 'w2', cat: 'way', ko: '기차역은 어디예요?', en: 'Where is the train station?', enP: '웨어 이즈 더 트레인 스테이션', de: 'Wo ist der Bahnhof?', deP: '보 이스트 데어 반호프', cs: 'Kde je nádraží?', csP: '그데 예 나드라지' },
    { id: 'w3', cat: 'way', ko: '걸어서 갈 수 있어요?', en: 'Can I walk there?', enP: '캔 아이 워크 데어', de: 'Kann man zu Fuß gehen?', deP: '칸 만 추 푸스 게엔', cs: 'Dá se tam dojít pěšky?', csP: '다 세 탐 도이트 페시키' },
    { id: 'w4', cat: 'way', ko: '표 한 장 주세요', en: 'One ticket, please.', enP: '원 티켓 플리즈', de: 'Eine Fahrkarte, bitte.', deP: '아이네 파카르테 비테', cs: 'Jednu jízdenku, prosím.', csP: '예드누 이즈덴쿠 프로심' },
    { id: 'w5', cat: 'way', ko: '이 버스 ○○에 가요?', en: 'Does this bus go to …?', enP: '더즈 디스 버스 고 투', de: 'Fährt dieser Bus nach …?', deP: '페어트 디저 부스 나흐', cs: 'Jede tento autobus do …?', csP: '예데 텐토 아우토부스 도' },
    { id: 'w6', cat: 'way', ko: '왼쪽 / 오른쪽 / 직진', en: 'Left / Right / Straight', enP: '레프트 / 라이트 / 스트레이트', de: 'links / rechts / geradeaus', deP: '링크스 / 레히츠 / 게라데아우스', cs: 'doleva / doprava / rovně', csP: '돌레바 / 도프라바 / 로브녜' },
    { id: 'w7', cat: 'way', ko: '길을 잃었어요', en: "I'm lost.", enP: '아임 로스트', de: 'Ich habe mich verlaufen.', deP: '이히 하베 미히 페어라우펜', cs: 'Ztratil(a) jsem se.', csP: '스트라틸(라) 이셈 세' },
    { id: 'w8', cat: 'way', ko: '지도에서 보여 주시겠어요?', en: 'Can you show me on the map?', enP: '캔 유 쇼 미 온 더 맵', de: 'Können Sie es mir auf der Karte zeigen?', deP: '쾬넨 지 에스 미어 아우프 데어 카르테 차이겐', cs: 'Můžete mi to ukázat na mapě?', csP: '무제테 미 토 우카자트 나 마폐' },

    { id: 'p1', cat: 'shop', ko: '얼마예요?', en: 'How much is it?', enP: '하우 머치 이즈 잇', de: 'Wie viel kostet das?', deP: '비 필 코스테트 다스', cs: 'Kolik to stojí?', csP: '콜리크 토 스토이' },
    { id: 'p2', cat: 'shop', ko: '너무 비싸요', en: "That's too expensive.", enP: '댓츠 투 익스펜시브', de: 'Das ist zu teuer.', deP: '다스 이스트 추 토이어', cs: 'To je moc drahé.', csP: '토 예 모츠 드라헤' },
    { id: 'p3', cat: 'shop', ko: '그냥 구경하는 거예요', en: "I'm just looking.", enP: '아임 저스트 루킹', de: 'Ich schaue nur.', deP: '이히 샤우에 누어', cs: 'Jen se dívám.', csP: '옌 세 디밤' },
    { id: 'p4', cat: 'shop', ko: '이걸로 할게요', en: "I'll take it.", enP: '아일 테이크 잇', de: 'Ich nehme das.', deP: '이히 네메 다스', cs: 'Vezmu si to.', csP: '베즈무 시 토' },
    { id: 'p5', cat: 'shop', ko: '봉투 하나 주세요', en: 'A bag, please.', enP: '어 백 플리즈', de: 'Eine Tüte, bitte.', deP: '아이네 튀테 비테', cs: 'Tašku, prosím.', csP: '타시쿠 프로심' },
    { id: 'p6', cat: 'shop', ko: '영수증 주세요', en: 'A receipt, please.', enP: '어 리시트 플리즈', de: 'Die Quittung, bitte.', deP: '디 크비퉁 비테', cs: 'Účtenku, prosím.', csP: '우치텐쿠 프로심' },

    { id: 'h1', cat: 'hotel', ko: '체크인하려고요', en: "I'd like to check in.", enP: '아이드 라이크 투 체크 인', de: 'Ich möchte einchecken.', deP: '이히 뫼히테 아인체켄', cs: 'Chtěl(a) bych se ubytovat.', csP: '흐톌(라) 비흐 세 우비토바트' },
    { id: 'h2', cat: 'hotel', ko: '방 열쇠가 안 돼요', en: "My room key doesn't work.", enP: '마이 룸 키 더즌트 워크', de: 'Mein Zimmerschlüssel funktioniert nicht.', deP: '마인 침머슐뤼셀 풍치오니어트 니히트', cs: 'Klíč od pokoje nefunguje.', csP: '클리치 오트 포코예 네풍구예' },
    { id: 'h3', cat: 'hotel', ko: '와이파이 비밀번호가 뭐예요?', en: "What's the Wi-Fi password?", enP: '왓츠 더 와이파이 패스워드', de: 'Wie ist das WLAN-Passwort?', deP: '비 이스트 다스 베란 파스보르트', cs: 'Jaké je heslo na wifi?', csP: '야케 예 헤슬로 나 와이파이' },
    { id: 'h4', cat: 'hotel', ko: '아침 식사는 몇 시예요?', en: 'What time is breakfast?', enP: '왓 타임 이즈 브렉퍼스트', de: 'Wann gibt es Frühstück?', deP: '반 깁트 에스 프뤼슈튀크', cs: 'V kolik je snídaně?', csP: '프 콜리크 예 스니다녜' },
    { id: 'h5', cat: 'hotel', ko: '수건 하나 더 주세요', en: 'One more towel, please.', enP: '원 모어 타월 플리즈', de: 'Noch ein Handtuch, bitte.', deP: '노흐 아인 한트투흐 비테', cs: 'Ještě jeden ručník, prosím.', csP: '예시테 예덴 루치니크 프로심' },

    { id: 'e1', cat: 'help', ko: '도와주세요!', en: 'Help!', enP: '헬프', de: 'Hilfe!', deP: '힐페', cs: 'Pomoc!', csP: '포모츠' },
    { id: 'e2', cat: 'help', ko: '경찰을 불러 주세요!', en: 'Call the police!', enP: '콜 더 폴리스', de: 'Rufen Sie die Polizei!', deP: '루펜 지 디 폴리차이', cs: 'Zavolejte policii!', csP: '자볼레이테 폴리치이' },
    { id: 'e3', cat: 'help', ko: '구급차를 불러 주세요!', en: 'Call an ambulance!', enP: '콜 언 앰뷸런스', de: 'Rufen Sie einen Krankenwagen!', deP: '루펜 지 아이넨 크랑켄바겐', cs: 'Zavolejte sanitku!', csP: '자볼레이테 사니트쿠' },
    { id: 'e4', cat: 'help', ko: '몸이 안 좋아요', en: "I don't feel well.", enP: '아이 돈트 필 웰', de: 'Mir geht es nicht gut.', deP: '미어 게트 에스 니히트 구트', cs: 'Je mi špatně.', csP: '예 미 슈파트녜' },
    { id: 'e5', cat: 'help', ko: '병원은 어디예요?', en: 'Where is the hospital?', enP: '웨어 이즈 더 하스피털', de: 'Wo ist das Krankenhaus?', deP: '보 이스트 다스 크랑켄하우스', cs: 'Kde je nemocnice?', csP: '그데 예 네모츠니체' },
    { id: 'e6', cat: 'help', ko: '여권을 잃어버렸어요', en: 'I lost my passport.', enP: '아이 로스트 마이 패스포트', de: 'Ich habe meinen Pass verloren.', deP: '이히 하베 마이넨 파스 페어로렌', cs: 'Ztratil(a) jsem pas.', csP: '스트라틸(라) 이셈 파스' },
    { id: 'e7', cat: 'help', ko: '천천히 말씀해 주세요', en: 'Please speak slowly.', enP: '플리즈 스픽 슬로울리', de: 'Bitte langsam sprechen.', deP: '비테 랑잠 슈프레헨', cs: 'Mluvte pomalu, prosím.', csP: '믈루브테 포말루 프로심' },
    { id: 'e8', cat: 'help', ko: '영어 할 줄 아세요?', en: 'Do you speak English?', enP: '두 유 스픽 잉글리시', de: 'Sprechen Sie Englisch?', deP: '슈프레헨 지 엥글리시', cs: 'Mluvíte anglicky?', csP: '믈루비테 앙글리츠키' }
  ]
};
