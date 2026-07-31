# SAPUI5 Enterprise Portal MDI PoC Q&A

## 1. 이 PoC는 무엇을 검증했나?

SAP Enterprise Portal End of Service 대응 관점에서 SAPUI5 기반 고전형 Portal과 MDI(다중 Workspace) 구조를 구현할 수 있는지 검증했다. SAPUI5 업무 앱뿐 아니라 HTML, React, Vue 등 Non-SAP 웹 앱을 하나의 Portal에서 실행하고 메시지를 주고받는 시나리오를 구현·배포했다.

## 2. MDI는 SAP 표준 기능인가?

SAPUI5에는 SAP Enterprise Portal과 동일한 완성형 MDI 제품이 표준으로 제공되지는 않는다. 이 PoC는 SAPUI5 표준 Control과 자체 `WorkspaceAdapter` 계약을 조합해 MDI 동작을 구성했다. 즉, SAPUI5는 Portal Shell과 기본 탭 구현에 사용했고, 다중 앱 실행·탭 수명주기는 PoC가 구현한 영역이다.

## 3. Adapter를 바꾸면 무엇이 달라지나?

색상만 달라지는 것이 아니다. `UI5_TAB`은 `IconTabBar`, `IFRAME`은 `SegmentedButton`과 콘텐츠 Pane, `CUSTOM`은 `FlexBox` 기반 고객사 MDI 창 스트립을 사용한다. Portal Core는 같은 계약으로 열기·닫기·활성화·메시지를 호출하고, Adapter가 서로 다른 Workspace 컨테이너를 소유한다.

다만 `CUSTOM`은 고객사 실제 SDK와 연계된 상태가 아니라, 연계 Adapter를 넣을 위치와 lifecycle 구조를 보여 주는 참조 구현이다.

## 4. 특정 고객사의 기존 Portal을 바로 대체할 수 있나?

아니다. 여러 고객사에 적용 가능한 공통 기술 골격과 시연 자산이다. 실제 구축에는 고객사의 메뉴, 권한, SSO, SAP 연계, 업무 화면, 운영 요건 및 기존 MDI Control API를 반영해야 한다.

## 5. SAP 앱과 Non-SAP 앱은 어떻게 구동되나?

| 유형 | 실행 방식 | PoC 적용 예 |
| --- | --- | --- |
| SAPUI5 Component | Workspace에 UI5 Component 직접 생성 | 구매요청, 예산검토, 승인, FI 화면 |
| iframe | Workspace 내부 iframe 실행 | HTML 견적 비교, React/Vue 견적 대시보드 |
| External Window | 새 브라우저 창 실행 | 외부 애플리케이션 예시 |
| Custom Handler | 고객사 전용 실행 로직 확장 | 확장 지점 예시 |

## 6. React/Vue/Nexacro도 통합할 수 있나?

React와 Vue는 iframe 방식으로 실제 통합했다. Nexacro도 웹 URL로 제공되는 화면이면 iframe 또는 전용 Adapter/Handler 방식으로 검토할 수 있다. Nexacro는 고객 라이선스, 배포 방식, 보안 정책을 별도로 확인해야 한다.

## 7. Portal과 앱 사이의 데이터 전달은 가능한가?

가능하다. UI5 Component는 UI5 EventBus, iframe은 브라우저 `postMessage`를 사용한다. 메시지는 `messageId`, `source`, `target`, `eventType`, `payload`, `timestamp`로 구성된 공통 Envelope을 사용한다. 운영에서는 origin allow-list, payload schema, 대상 앱 권한 검증을 추가해야 한다.

## 8. 현재 역할별 메뉴 제어는 실제 권한 관리인가?

현재는 역할 선택기를 이용한 Mock 시연이다. 메뉴와 애플리케이션에 역할을 연결하고 노출을 검증했다. 운영에서는 XSUAA/IAS 또는 고객사 SSO·AD의 토큰을 서버에서 검증해야 한다.

## 9. 현재 등록·승인 데이터는 저장되는가?

아니다. 서버 메모리 Mock 데이터라 서버 재시작 또는 재배포 시 초기화된다. 실제 구축에서는 CAP 또는 Express API와 DB로 메뉴 설정, 즐겨찾기, 최근 실행, 업무·승인 이력을 영속화한다.

## 10. SAP S/4HANA 또는 ECC와 연계할 수 있나?

가능하다. 현재는 Mock 업무 데이터로 흐름만 검증했다. 후속 단계에서 OData, REST, RFC 연계 API를 적용하고, BTP에서는 Destination/Connectivity, On-Premise에서는 고객 네트워크와 보안 정책에 맞는 연결 방식을 구성한다.

## 11. BTP와 On-Premise 모두 가능한가?

가능하다. PoC는 SAP BTP Cloud Foundry Trial에 배포해 동작을 확인했다. 같은 Node.js/Express와 SAPUI5 정적 구조는 Windows·Linux 서버, VM, 컨테이너에도 배포할 수 있다. On-Premise 운영에는 Reverse Proxy, 고객사 SSO·AD, DB, 내부 SAP 연결을 추가 구성한다.

## 12. 현재 BTP URL은 안전한가?

현재 PoC URL은 인증이 없는 공개 주소다. 민감정보나 실제 업무 데이터를 사용하면 안 된다. 운영 전에는 XSUAA 또는 IAS, 서버 측 JWT 권한 검증, HTTPS, 감사 로그를 적용한다.

## 13. 지금 바로 다른 기업에 구축 가능한가?

PoC는 제안·시연·기술 검증과 구축 착수용 공통 골격으로 사용할 수 있다. 운영 시스템으로 제공하려면 인증/권한, DB, SAP 연계, 오류 처리, 감사 로그, 모니터링, 고객 UX와 업무 요건을 추가해야 한다.

## 14. 다음 단계의 우선순위는 무엇인가?

1. 고객사 대상 업무와 MDI Control API를 확정한다.
2. 실제 SSO와 역할 모델을 적용한다.
3. 메뉴·업무 데이터를 DB와 API로 전환한다.
4. SAP OData/API와 Non-SAP 시스템을 실제 연계한다.
5. 고객사별 WorkspaceAdapter와 운영 배포 구조를 적용한다.

## 15. 소스와 배포 문서는 어디에 있는가?

공개 소스 저장소는 `https://github.com/LIM-AIT/ui5-enterprise-portal-poc`이다. 배포 방법과 구조 설명은 `docs` 폴더를 참고한다. 비밀번호, Service Key, API Key 등 민감정보는 저장소에 포함하지 않는다.
