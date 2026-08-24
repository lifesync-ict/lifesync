export type LanguageCode = 'ko' | 'en' | 'vi' | 'ne'

type Translation = {
  languageName: string
  title: string
  description: string
  button: string
  progress: [string, string, string, string]
  progressLabel: string
}

export const translations: Record<LanguageCode, Translation> = {
  ko: {
    languageName: '한국어',
    title: '낯선 행정 앞에서도 길을 잃지 않도록',
    description: '지금 상황을 알려주면 해야 할 일과 기한을 순서대로 안내해 드립니다',
    button: '안내 시작하기',
    progress: ['상황 입력', '사실 확인', '해야 할 일', '기관 연결'],
    progressLabel: '진행 순서',
  },
  en: {
    languageName: 'English',
    title: 'Stay on track through unfamiliar procedures',
    description: 'Tell us what is happening, and we’ll guide you through each action and deadline in order',
    button: 'Start guidance',
    progress: ['Share situation', 'Verify facts', 'Next actions', 'Connect to agency'],
    progressLabel: 'Your path',
  },
  vi: {
    languageName: 'Tiếng Việt',
    title: 'Vững bước trước những thủ tục hành chính xa lạ',
    description: 'Hãy cho chúng tôi biết tình huống của bạn để được hướng dẫn từng việc cần làm và thời hạn',
    button: 'Bắt đầu hướng dẫn',
    progress: ['Chia sẻ tình huống', 'Xác minh thông tin', 'Việc cần làm', 'Kết nối cơ quan'],
    progressLabel: 'Lộ trình của bạn',
  },
  ne: {
    languageName: 'नेपाली',
    title: 'अपरिचित प्रशासनिक प्रक्रियामा पनि सही बाटोमा रहनुहोस्',
    description: 'आफ्नो अवस्था बताउनुहोस्, हामी गर्नुपर्ने काम र समयसीमा क्रमसँग मार्गदर्शन गर्छौं',
    button: 'मार्गदर्शन सुरु गर्नुहोस्',
    progress: ['अवस्था बताउनुहोस्', 'तथ्य पुष्टि', 'गर्नुपर्ने काम', 'निकायसँग सम्पर्क'],
    progressLabel: 'तपाईंको मार्ग',
  },
}

export const languageCodes = Object.keys(translations) as LanguageCode[]
