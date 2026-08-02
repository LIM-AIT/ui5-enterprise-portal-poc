import AssistantProvider, { AssistantCard, AssistantContext, AssistantMenu, AssistantReply } from "./AssistantProvider";

/**
 * Local BTP Trial provider. A productive Joule/LLM gateway can implement the
 * same AssistantProvider contract without changing the shell or panel.
 */
export default class LocalTrialAssistantProvider implements AssistantProvider {
  public async respond(question: string, context: AssistantContext): Promise<AssistantReply> {
    await new Promise(resolve => window.setTimeout(resolve, 420));
    const prompt = question.trim().toLowerCase();

    if (this.includesAny(prompt, ["견적", "협력사", "최저가", "최저 견적"])) {
      const menu = this.findMenu(context, ["협력사 견적 조회", "react 견적", "vue 견적"]);
      return {
        text: context.businessContext?.kind === "VENDOR_QUOTATION"
          ? `현재 ‘${context.businessContext.title}’ 화면의 선택 데이터를 기준으로 요약했습니다. 가격뿐 아니라 납기와 평가를 함께 검토해 주세요.`
          : "현재 Trial 견적 기준으로 에스텍솔루션이 2,180,000원으로 최저가입니다. 요청 예산 대비 9.2% 절감되며 거래 평가는 4.8점입니다.",
        card: this.quotationCard(context),
        actionMenuId: menu?.id,
        actionLabel: menu ? `${menu.title} 열기` : undefined
      };
    }

    if (this.includesAny(prompt, ["구매요청", "구매 요청", "요청 등록", "등록 방법"])) {
      const menu = this.findMenu(context, ["구매요청 등록"]);
      return menu
        ? {
            text: "구매요청 등록에서는 요청 목적과 납기일을 입력하고 품목을 추가한 뒤, 예산 확인 후 승인 흐름을 시작할 수 있습니다. 필수 항목을 먼저 채우면 검토가 빠릅니다.",
            card: this.contextCard(context, ["PURCHASE_REQUEST"], "구매요청 등록", "요청 작성 체크리스트", "작성 안내"),
            actionMenuId: menu.id,
            actionLabel: "구매요청 등록 열기"
          }
        : { text: `현재 ${context.roleLabel} 역할에는 구매요청 등록 실행 권한이 없습니다. 상단 역할 선택에서 포털 사용자 권한을 확인해 주세요.` };
    }

    if (this.includesAny(prompt, ["승인", "결재", "대기 업무"])) {
      const menu = this.findMenu(context, ["구매승인함"]);
      return menu
        ? {
            text: "구매승인함에서 예산검토가 완료된 요청을 확인할 수 있습니다. 금액, 요청 사유, 예산 상태를 비교한 뒤 승인 또는 반려 의견을 남기세요.",
            card: this.contextCard(context, ["APPROVAL_WORKLIST"], "구매 승인함", "승인 판단에 필요한 핵심 정보", "검토 필요"),
            actionMenuId: menu.id,
            actionLabel: "구매승인함 열기"
          }
        : { text: `현재 ${context.roleLabel} 역할에는 구매승인함이 표시되지 않습니다. 승인 담당자 역할로 전환하면 승인 대기 업무를 확인할 수 있습니다.` };
    }

    if (this.includesAny(prompt, ["예산", "fi", "전표"])) {
      const menu = this.findMenu(context, ["fi 예산검토", "fi 전표", "예산 현황"]);
      return menu
        ? {
            text: "예산 화면에서는 가용 예산, 집행률과 전표 현황을 함께 확인할 수 있습니다. 초과 가능성이 있는 항목은 상태 배지와 검토 의견을 우선 확인하세요.",
            card: this.contextCard(context, ["BUDGET_REVIEW", "FI_LEDGER"], "FI 예산 검토", "현재 화면의 예산 문맥", "예산 확인"),
            actionMenuId: menu.id,
            actionLabel: `${menu.title} 열기`
          }
        : { text: `현재 ${context.roleLabel} 역할에는 FI 예산 업무 권한이 없습니다. 재무 담당자 역할에서 관련 화면을 이용할 수 있습니다.` };
    }

    if (this.includesAny(prompt, ["최근", "이어서", "하던 업무"])) {
      const menu = context.recent[0];
      return menu
        ? { text: `가장 최근에 실행한 업무는 ‘${menu.title}’입니다. 중단한 지점부터 다시 확인할 수 있도록 Workspace에 열어드릴게요.`, actionMenuId: menu.id, actionLabel: `${menu.title} 이어서 열기` }
        : { text: "아직 최근 실행 이력이 없습니다. 왼쪽 업무 메뉴에서 화면을 한 번 실행하면 홈의 최근 업무와 AI 도우미에서 바로 이어갈 수 있습니다." };
    }

    if (this.includesAny(prompt, ["메뉴", "찾아", "어떤 업무", "할 수 있"])) {
      const titles = context.menus.slice(0, 6).map(menu => menu.title);
      return { text: `현재 ${context.roleLabel} 역할에서 실행 가능한 업무는 ${titles.join(", ")}입니다. 원하는 업무명을 입력하면 화면 위치와 사용 방법을 안내해 드릴게요.` };
    }

    if (this.includesAny(prompt, ["안녕", "hello", "도와줘", "help"])) {
      return { text: `안녕하세요. 현재 ‘${context.activeTitle}’ 문맥을 기준으로 업무를 도와드릴 수 있습니다. 메뉴 찾기, 견적 요약, 구매요청 안내처럼 자연스럽게 질문해 주세요.` };
    }

    return {
      text: `‘${question.trim()}’ 요청을 확인했습니다. 이 PoC에서는 메뉴 탐색, 견적 비교, 구매요청, 예산과 승인 업무를 안내할 수 있습니다. 관련 업무명을 조금 더 구체적으로 입력해 주세요.`
    };
  }

  private findMenu(context: AssistantContext, candidates: string[]): AssistantMenu | undefined {
    return candidates.map(candidate => context.menus.find(menu => menu.title.toLowerCase().includes(candidate))).find(Boolean);
  }

  private quotationCard(context: AssistantContext): AssistantCard {
    const business = context.businessContext?.kind === "VENDOR_QUOTATION" ? context.businessContext : undefined;
    return {
      eyebrow: business ? "LIVE WORKSPACE CONTEXT" : "BTP TRIAL SNAPSHOT",
      title: business?.entityId ? `${business.entityId} · ${business.title}` : business?.title ?? "에스텍솔루션",
      subtitle: business?.summary ?? "노트북 20대 공급 견적",
      status: business ? "화면 연동" : "최저가",
      statusState: "Success",
      facts: business?.fields.slice(0, 4) ?? [
        { label: "견적 금액", value: "2,180,000원" },
        { label: "요청 예산 대비", value: "9.2% 절감", state: "Success" },
        { label: "납기", value: "2026.08.14" },
        { label: "협력사 평가", value: "4.8 / 5.0" }
      ]
    };
  }

  private contextCard(context: AssistantContext, expectedKinds: string[], fallbackTitle: string, fallbackSubtitle: string, fallbackStatus: string): AssistantCard {
    const business = context.businessContext && expectedKinds.includes(context.businessContext.kind) ? context.businessContext : undefined;
    return {
      eyebrow: business ? "LIVE WORKSPACE CONTEXT" : "업무 가이드",
      title: business?.title ?? fallbackTitle,
      subtitle: business?.summary ?? fallbackSubtitle,
      status: business ? "화면 연동" : fallbackStatus,
      statusState: business ? "Success" : "Information",
      facts: business?.fields.slice(0, 4) ?? [
        { label: "1단계", value: "필수 정보 입력" },
        { label: "2단계", value: "예산·증빙 확인" },
        { label: "3단계", value: "검토 후 제출" }
      ]
    };
  }

  private includesAny(prompt: string, keywords: string[]): boolean { return keywords.some(keyword => prompt.includes(keyword)); }
}
