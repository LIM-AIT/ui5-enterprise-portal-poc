# SAPUI5 Enterprise Portal MDI PoC

SAP Enterprise Portal End of Service 대응을 위한 고객 중립형 기술 검증 프로젝트입니다. 인포데이에서 제시한 **SAPUI5 기반 고전형 Portal(MDI 포함)**을 대상으로, 공통 Portal Core와 고객별 Workspace/MDI 구현을 분리할 수 있는지 확인합니다. 특정 고객사의 기존 MDI를 대체하거나 연계한 완성 제품은 아닙니다.

## 현재 PoC 범위

- SAPUI5 Portal Shell, 계층 메뉴, 검색, 즐겨찾기, 최근 실행
- Mock 역할 기반 메뉴·애플리케이션 필터링
- SAPUI5 Component, HTML/React/Vue iframe, 새 창, Custom Handler 실행 모델
- 공통 Message Envelope와 UI5 EventBus / iframe `postMessage` 통신
- 구매요청 → 예산검토 → 승인 시연 흐름 및 Mock 관리자 설정
- 세 가지 실제 Workspace 구현체
  - `UI5_TAB`: SAPUI5 `IconTabBar` 기반 표준 통합 탭
  - `IFRAME`: `SegmentedButton`과 단일 콘텐츠 Pane 기반 Non-SAP iframe 탭
  - `CUSTOM`: 고객사 MDI 창 스트립을 모사한 `FlexBox` 기반 확장 예시

`CUSTOM`은 실제 고객사 SDK와 연결된 구현이 아니라, Portal Core 변경 없이 고객사 컨트롤로 교체할 수 있음을 보여 주는 참조 구현입니다.

## 로컬 실행

```powershell
npm ci
npm start
```

브라우저에서 `http://localhost:8080/index.html`을 엽니다. 화면이 이전 버전으로 보이면 `Ctrl + F5`로 새로 고칩니다.

## 검증 및 배포

```powershell
npm test
npm run build
cf push
```

Cloud Foundry 배포 전에는 대상 Org와 Space를 선택해야 합니다. Trial 환경은 앱이 자동 중지될 수 있으므로 시연 전에 상태를 확인합니다.

## 문서

- [개념설계](docs/concept-design.md)
- [전체 아키텍처](docs/architecture.md)
- [WorkspaceAdapter 확장 가이드](docs/workspace-adapter-guide.md)
- [고객별 Adapter 구현 가이드](docs/adapter-extension-guide.md)
- [실행 유형 및 제약](docs/application-types.md)
- [BTP Trial 배포](docs/btp-trial-deployment.md)
- [BTP 인증·Destination 전환](docs/btp-integration-guide.md)
- [PoC Q&A](docs/poc-anticipated-qa.md)
