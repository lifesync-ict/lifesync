import type { LanguageCode } from '../../data/translations'

export const actionReviewGuidance: Record<LanguageCode, { message: string; editFacts: string }> = {
  ko: { message: '현재 시연은 사업장 변경을 원하는 E-9 제조업 근로자 시나리오를 지원합니다. 사실 확인 단계에서 사업장 변경 의사를 수정하거나 전문가 확인이 필요한 상태로 유지할 수 있습니다.', editFacts: '사실 수정하기' },
  en: { message: 'This demo supports an E-9 manufacturing worker who wants to change workplaces. You can update your workplace-change preference in fact confirmation or keep the case marked for expert review.', editFacts: 'Edit facts' },
  vi: { message: 'Bản demo hiện hỗ trợ người lao động E-9 trong ngành sản xuất muốn đổi nơi làm việc. Bạn có thể sửa nguyện vọng đổi nơi làm việc ở bước xác nhận thông tin hoặc giữ trạng thái cần chuyên gia kiểm tra.', editFacts: 'Sửa thông tin' },
  ne: { message: 'हालको डेमोले कार्यस्थल परिवर्तन गर्न चाहने E-9 उत्पादन क्षेत्रका श्रमिकको अवस्था समर्थन गर्छ। तथ्य पुष्टि चरणमा कार्यस्थल परिवर्तनको इच्छा सच्याउन वा विशेषज्ञ समीक्षा आवश्यक अवस्थामै राख्न सक्नुहुन्छ।', editFacts: 'तथ्य सच्याउनुहोस्' },
}
