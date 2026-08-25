export type LanguageCode = 'ko' | 'en' | 'vi' | 'ne'

type Translation = {
  languageName: string
  landing: { tagline: string; button: string; trust: string }
  progress: [string, string, string, string]
  progressLabel: string
  situation: {
    title: string; description: string; inputLabel: string; placeholder: string; privacy: string
    characterCount: (current: number, max: number) => string; error: string; examplesLabel: string
    examples: [string, string, string]; back: string; next: string
  }
  profile: {
    demoLabel: string; visa: string; nationality: string; region: string; industry: string; workplace: string
    nationalityValue: string; regionValue: string; industryValue: string; workplaceValue: string
  }
  confirm: { title: string; description: string; temporary: string; back: string }
}

export const translations: Record<LanguageCode, Translation> = {
  ko: {
    languageName: '한국어',
    landing: { tagline: '낯선 행정 앞에서도 길을 잃지 않도록 안내해 드립니다.', button: '안내 시작하기', trust: '이름이나 외국인등록번호 없이 시작할 수 있어요.' },
    progress: ['상황 입력', '사실 확인', '해야 할 일', '기관 연결'], progressLabel: '진행 순서',
    situation: {
      title: '무슨 일이 있었나요?', description: '편하게 말하듯 입력해 주세요. 이름이나 외국인등록번호는 적지 않아도 됩니다.', inputLabel: '현재 상황', placeholder: '회사나 계약과 관련해 있었던 일을 편하게 적어 주세요.', privacy: '이름, 외국인등록번호, 전화번호 등 개인정보는 입력하지 마세요.', characterCount: (current, max) => `${current} / ${max}자`, error: '상황을 한 글자 이상 입력해 주세요.', examplesLabel: '이렇게 시작해도 좋아요', examples: ['회사에서 갑자기 그만 나오라고 했어요', '계약이 끝났는데 다른 회사로 옮기고 싶어요', '사장님이 필요한 서류를 주지 않아요'], back: '이전으로', next: '다음 단계로',
    },
    profile: { demoLabel: '데모용 합성 정보', visa: '체류자격', nationality: '국적', region: '지역', industry: '업종', workplace: '현재 사업장', nationalityValue: '베트남', regionValue: '충북 음성군', industryValue: '제조업', workplaceValue: '사업장 A' },
    confirm: { title: '입력 내용이 저장되었습니다', description: '다음 단계에서 사실 확인에 필요한 내용을 정리할 예정입니다.', temporary: '현재는 다음 개발 단계를 위한 임시 확인 화면입니다.', back: '상황 입력으로 돌아가기' },
  },
  en: {
    languageName: 'English',
    landing: { tagline: 'Guidance so you do not lose your way in unfamiliar procedures.', button: 'Start guidance', trust: 'You can start without your name or foreign registration number.' },
    progress: ['Share situation', 'Verify facts', 'Next actions', 'Connect to agency'], progressLabel: 'Your path',
    situation: {
      title: 'What happened?', description: 'Describe it in your own words. You do not need to include your name or foreign registration number.', inputLabel: 'Your situation', placeholder: 'Tell us what happened with your workplace or contract.', privacy: 'Do not enter personal details such as your name, registration number, or phone number.', characterCount: (current, max) => `${current} / ${max} characters`, error: 'Please describe your situation before continuing.', examplesLabel: 'You can start with an example', examples: ['My company suddenly told me not to come back', 'My contract ended and I want to move to another company', 'My employer will not give me the documents I need'], back: 'Back', next: 'Continue to fact check',
    },
    profile: { demoLabel: 'Demo profile · synthetic data', visa: 'Visa', nationality: 'Nationality', region: 'Region', industry: 'Industry', workplace: 'Current workplace', nationalityValue: 'Vietnam', regionValue: 'Eumseong, Chungbuk', industryValue: 'Manufacturing', workplaceValue: 'Workplace A' },
    confirm: { title: 'Your situation has been saved', description: 'The next step will organize the facts that need to be checked.', temporary: 'This is a temporary handoff screen for the next development phase.', back: 'Return to situation' },
  },
  vi: {
    languageName: 'Tiếng Việt',
    landing: { tagline: 'Giúp bạn không lạc hướng trước những thủ tục hành chính xa lạ.', button: 'Bắt đầu hướng dẫn', trust: 'Bạn có thể bắt đầu mà không cần nhập tên hoặc số đăng ký người nước ngoài.' },
    progress: ['Chia sẻ tình huống', 'Xác minh thông tin', 'Việc cần làm', 'Kết nối cơ quan'], progressLabel: 'Lộ trình của bạn',
    situation: {
      title: 'Bạn đã gặp chuyện gì?', description: 'Hãy kể lại một cách tự nhiên. Bạn không cần ghi tên hoặc số đăng ký người nước ngoài.', inputLabel: 'Tình huống của bạn', placeholder: 'Hãy kể những gì đã xảy ra với công ty hoặc hợp đồng của bạn.', privacy: 'Không nhập thông tin cá nhân như họ tên, số đăng ký người nước ngoài hoặc số điện thoại.', characterCount: (current, max) => `${current} / ${max} ký tự`, error: 'Vui lòng nhập tình huống của bạn trước khi tiếp tục.', examplesLabel: 'Bạn có thể bắt đầu bằng một ví dụ', examples: ['Công ty đột ngột bảo tôi không cần đi làm nữa', 'Hợp đồng đã hết và tôi muốn chuyển sang công ty khác', 'Chủ công ty không đưa cho tôi giấy tờ cần thiết'], back: 'Quay lại', next: 'Tiếp tục xác minh',
    },
    profile: { demoLabel: 'Thông tin giả lập dùng cho demo', visa: 'Tư cách lưu trú', nationality: 'Quốc tịch', region: 'Khu vực', industry: 'Ngành nghề', workplace: 'Nơi làm việc hiện tại', nationalityValue: 'Việt Nam', regionValue: 'Eumseong, Chungbuk', industryValue: 'Sản xuất', workplaceValue: 'Cơ sở A' },
    confirm: { title: 'Nội dung của bạn đã được lưu', description: 'Ở bước tiếp theo, chúng tôi sẽ sắp xếp những thông tin cần xác minh.', temporary: 'Đây là màn hình chuyển tiếp tạm thời cho giai đoạn phát triển tiếp theo.', back: 'Quay lại nhập tình huống' },
  },
  ne: {
    languageName: 'नेपाली',
    landing: { tagline: 'अपरिचित प्रशासनिक प्रक्रियामा पनि बाटो नहराउन मार्गदर्शन गर्छौं।', button: 'मार्गदर्शन सुरु गर्नुहोस्', trust: 'नाम वा विदेशी दर्ता नम्बर नदिई सुरु गर्न सक्नुहुन्छ।' },
    progress: ['अवस्था बताउनुहोस्', 'तथ्य पुष्टि', 'गर्नुपर्ने काम', 'निकायसँग सम्पर्क'], progressLabel: 'तपाईंको मार्ग',
    situation: {
      title: 'के भएको थियो?', description: 'सजिलै बोलजस्तै लेख्नुहोस्। आफ्नो नाम वा विदेशी दर्ता नम्बर लेख्नुपर्दैन।', inputLabel: 'तपाईंको अवस्था', placeholder: 'कम्पनी वा सम्झौतासँग सम्बन्धित के भयो बताउनुहोस्।', privacy: 'नाम, विदेशी दर्ता नम्बर वा फोन नम्बर जस्ता व्यक्तिगत विवरण नलेख्नुहोस्।', characterCount: (current, max) => `${current} / ${max} अक्षर`, error: 'अघि बढ्न आफ्नो अवस्था लेख्नुहोस्।', examplesLabel: 'यसरी सुरु गर्न सक्नुहुन्छ', examples: ['कम्पनीले अचानक अब काममा नआउन भन्यो', 'मेरो सम्झौता सकियो र म अर्को कम्पनीमा जान चाहन्छु', 'मालिकले आवश्यक कागजात दिइरहेका छैनन्'], back: 'पछाडि', next: 'तथ्य पुष्टिमा जानुहोस्',
    },
    profile: { demoLabel: 'डेमोका लागि कृत्रिम जानकारी', visa: 'बसोबास स्थिति', nationality: 'राष्ट्रियता', region: 'क्षेत्र', industry: 'उद्योग', workplace: 'हालको कार्यस्थल', nationalityValue: 'भियतनाम', regionValue: 'उम्सङ, छुङबुक', industryValue: 'उत्पादन', workplaceValue: 'कार्यस्थल A' },
    confirm: { title: 'तपाईंको विवरण सुरक्षित भयो', description: 'अर्को चरणमा पुष्टि गर्नुपर्ने तथ्यहरू व्यवस्थित गरिनेछ।', temporary: 'यो अर्को विकास चरणका लागि अस्थायी पृष्ठ हो।', back: 'अवस्था लेख्ने पृष्ठमा फर्कनुहोस्' },
  },
}

export const languageCodes = Object.keys(translations) as LanguageCode[]
