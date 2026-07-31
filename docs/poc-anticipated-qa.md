# SAPUI5 Enterprise Portal MDI PoC 예상 질의응답

## 1. 이 PoC는 무엇을 검증했나?

SAP Enterprise Portal End of Service 대응 관점에서, SAPUI5 기반의 고전적 Portal과 MDI(다중 탭 Workspace) 구조를 구현할 수 있는지 검증했다. SAPUI5 업무 앱뿐 아니라 React, Vue, 일반 HTML 등 Non-SAP 앱을 하나의 Portal 안에서 실행할 수 있음을 실제 화면과 BTP 배포로 확인했다.

## 2. 특정 고객사의 기존 Portal을 바로 대체할 수 있나?

아니다. 특정 고객사 화면을 대체한 완성 제품이 아니라, 여러 고객사에 적용 가능한 공통 기술 골격과 시연 자산이다. 실제 구축 시에는 고객사의 메뉴, 권한, SSO, SAP 연계, 업무 화면 및 운영 요건을 반영해야 한다.

## 3. MDI는 SAP 표준 기능인가?

SAPUI5에는 SAP Enterprise Portal과 동일한 완성형 MDI 컨테이너가 표준으로 제공되지는 않는다. 이 PoC는 SAPUI5의 표준 탭 컨트롤을 기반으로 `WorkspaceAdapter`를 구현해 MDI 동작을 구성했다. 따라서 고객사가 사용하는 커스텀 Tab Container가 있더라도 Portal Core를 수정하지 않고 Adapter 구현체로 연결하는 방향을 검증했다.

## 4. SAP 앱과 Non-SAP 앱은 어떻게 구동되나?

| 유형 | 실행 방식 | PoC 적용 예 |
| --- | --- | --- |
| SAPUI5 Component | Portal Workspace에 UI5 Component를 직접 생성 | 구매요청, 예산검토, 승인, FI 화면 |
| iframe | Workspace 탭 내부 iframe 실행 | HTML 견적 비교, React 견적 대시보드, Vue 견적 대시보드 |
| External Window | 새 브라우저 창 실행 | 외부 애플리케이션 예시 |
| Custom Handler | 고객사 전용 실행 로직 확장 | 확장 지점 예시 |

## 5. React/Vue/Nexacro도 통합할 수 있나?

React와 Vue는 iframe 방식으로 실제 통합 검증했다. Nexacro도 웹 URL로 제공되는 화면이라면 같은 iframe 또는 고객사 전용 Adapter/Handler 방식으로 연계할 수 있다. 다만 Nexacro는 고객사의 라이선스, 배포 방식, 보안 정책을 별도로 확인해야 한다.

## 6. Portal과 외부 앱 사이의 데이터 전달은 가능한가?

가능하다. iframe 앱은 브라우저 `postMessage`, UI5 Component 앱은 UI5 EventBus를 사용한다. 두 방식 모두 `messageId`, `source`, `target`, `eventType`, `payload`, `timestamp`로 구성된 공통 Message Envelope으로 처리하도록 설계했다.

## 7. 현재 역할별 메뉴 제어는 실제 권한 관리인가?

현재는 Mock 역할 선택으로 동작을 시연한다. 메뉴와 애플리케이션에 역할을 연결하고 역할별 노출을 검증했다. 운영에서는 XSUAA/IAS 또는 고객사 SSO·AD의 로그인 토큰과 역할 정보를 서버에서 검증하도록 전환해야 한다.

## 8. 현재 등록·승인 데이터는 저장되는가?

아니다. 현재는 서버 메모리 기반 Mock 데이터이므로 서버를 재시작하면 초기화된다. 실제 구축에서는 CAP 또는 Express API와 DB를 추가하여 메뉴 설정, 즐겨찾기, 최근 실행 이력, 구매요청 및 승인 이력을 영속화한다.

## 9. SAP S/4HANA 또는 ECC와 연계할 수 있나?

가능하다. 현재는 Mock 업무 데이터로 화면 흐름을 검증했다. 후속 단계에서 OData, REST, RFC 연계 API를 적용하고, BTP 환경에서는 Destination/Connectivity 서비스, On-Premise 환경에서는 고객사 네트워크와 보안 정책에 맞는 연결 방식을 구성한다.

## 10. BTP에서 동작하는가?

동작한다. SAP BTP Cloud Foundry Trial에 실제 배포해 UI5 Portal과 React/Vue iframe 앱의 실행을 확인했다. 다만 Trial 환경은 매일 앱을 자동 중지하므로 시연·검증용으로만 사용한다.

## 11. On-Premise에도 배포할 수 있나?

가능하다. Portal은 SAPUI5 정적 리소스와 Node.js/Express 서버로 구성되어 있어 Windows 또는 Linux 서버, VM, 컨테이너 환경에 배포할 수 있다. 운영 구축 시에는 Nginx/IIS Reverse Proxy, 고객사 SSO·AD, DB, 내부 SAP 시스템 연결을 고객 환경에 맞게 구성한다.

## 12. 현재 BTP URL은 안전한가?

현재 URL은 인증이 없는 공개 PoC URL이다. 따라서 민감정보나 실제 업무 데이터를 올리면 안 된다. 운영 전에는 XSUAA 또는 IAS 인증, 역할 컬렉션, 서버 측 JWT 권한 검증, HTTPS 및 감사 로그를 적용해야 한다.

## 13. 지금 바로 다른 기업에 구축 가능한가?

PoC 결과물은 제안·시연·기술 검증 및 구축 착수용 공통 골격으로 사용할 수 있다. 운영 시스템으로 즉시 제공하려면 인증/권한, DB, SAP 연계, 오류 처리, 감사 로그, 모니터링, 고객사 UX와 업무 요건을 추가하는 구축 단계가 필요하다.

## 14. 다음 단계의 우선순위는 무엇인가?

1. 고객사 요구사항과 대상 업무를 기준으로 공통/개별 범위를 정의한다.
2. XSUAA/IAS 또는 고객사 SSO 연동과 실제 역할 모델을 적용한다.
3. 메뉴·업무 데이터·관리자 설정을 DB와 API로 전환한다.
4. SAP OData/API와 Non-SAP 시스템을 실제 연계한다.
5. 고객사별 WorkspaceAdapter와 운영 배포 구조를 적용한다.

## 15. 소스는 어떻게 관리되는가?

소스와 BTP 배포 설정은 비공개 GitHub 저장소에서 관리한다. 다른 개발 PC에서도 저장소를 clone하여 동일 소스를 수정하고 재배포할 수 있다. Service Key, 비밀번호, API Key 등 민감정보는 저장소에 포함하지 않는다.
