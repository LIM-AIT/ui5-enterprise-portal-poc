# Workspace Adapter 확장 가이드

`WorkspaceAdapter`는 Portal Core와 고객별 Workspace/MDI 컨테이너 사이의 경계입니다. Portal Core는 `open`, `close`, `closeAll`, `activate`, `sendMessage`, `getOpenedApplications`, `getActiveControl`만 사용합니다.

## 제공 구현체

- `Ui5TabWorkspaceAdapter` (`UI5_TAB`): UI5 Component와 iframe을 기본 탭 Workspace로 실행합니다.
- `IframeWorkspaceAdapter` (`IFRAME`): React, Vue, Nexacro 등 URL 기반 Non-SAP 앱을 iframe 중심으로 실행합니다. UI5 Component는 URL 기반 배포 대상이 필요합니다.
- `CustomWorkspaceAdapter` (`CUSTOM`): 고객사의 기존 Tab/MDI 위젯으로 교체할 위치를 보여주는 참조 구현입니다.

## 고객 Adapter 추가 절차

1. `WorkspaceAdapter` 인터페이스를 구현합니다.
2. 고객 위젯의 열기/닫기/활성화 API를 해당 메서드에 매핑합니다.
3. iframe 앱이 있다면 `sendMessage`에서 공통 `PortalMessage` Envelope를 `postMessage`로 전달합니다.
4. `PortalController.setWorkspaceAdapter`의 factory에 고객 key를 등록하거나, BTP 런타임 설정에서 주입합니다.

Portal Core, 메뉴 권한, 애플리케이션 실행 규격을 변경할 필요는 없습니다.
