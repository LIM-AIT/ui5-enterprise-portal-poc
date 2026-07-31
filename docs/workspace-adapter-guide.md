# WorkspaceAdapter 확장 가이드

`WorkspaceAdapter`는 Portal Core와 고객별 Workspace/MDI 컨테이너 사이의 경계다. 메뉴, 역할, 즐겨찾기, 최근 실행, 앱 실행 규격은 Core가 유지하고, 탭 또는 창 UI의 구현만 Adapter가 맡는다.

## 공통 계약

| 메서드 | 역할 |
| --- | --- |
| `open(application)` | 새 앱을 열거나, 이미 열린 앱이면 재활성화 |
| `close(instanceId)` | 특정 앱의 탭/창과 실행 리소스 정리 |
| `closeAll()` | Adapter가 소유한 모든 탭/창 정리 |
| `activate(instanceId)` | 앱을 다시 만들지 않고 기존 항목을 전면 활성화 |
| `sendMessage(message)` | 공통 Envelope을 대상 앱으로 전달 |
| `getOpenedApplications()` | 현재 열린 앱 목록 반환 |
| `getWorkspaceControl()` | Shell에 배치할 Adapter 소유 Workspace Control 반환 |
| `getActiveControl()` | 현재 활성 앱의 UI5 Control 반환 |

## 현재 제공 구현체

| Key | 구현체 | 실제 컨테이너 | 지원 범위 |
| --- | --- | --- | --- |
| `UI5_TAB` | `Ui5TabWorkspaceAdapter` | `AdapterTabContainer` / SAPUI5 `TabContainer` | UI5 Component, iframe, Custom Handler 예시. 각 탭 닫기 지원 |
| `IFRAME` | `IframeWorkspaceAdapter` | `IframeWorkspaceContainer` / 컴팩트 탭 스트립 + 콘텐츠 Pane | URL 기반 iframe 앱만. 각 탭 닫기 지원 |
| `CUSTOM` | `CustomWorkspaceAdapter` | `CustomerMdiWorkspaceContainer` / `FlexBox` 창 스트립 + 콘텐츠 Pane | 고객사 MDI 연계 구조 예시. 각 탭 닫기 지원 |

따라서 Adapter를 바꾸면 테두리 색만 바뀌는 것이 아니라 Workspace의 탭/창 컨트롤과 콘텐츠 배치 방식 자체가 바뀐다. 다만 `CUSTOM`은 현재 고객사 SDK를 연결하지 않은 참조 구현이므로, 실제 고객 컨트롤의 기능과 동일하다고 해석하면 안 된다.

## 고객 Adapter 추가 절차

1. 고객사 Control의 생성, 탭 열기, 선택, 닫기, 전체 닫기, 콘텐츠 삽입 API를 확인한다.
2. `WorkspaceAdapter`를 구현하는 새 클래스를 만든다.
3. `application.id`와 고객사 내부 탭 ID를 Adapter 내부 `Map`으로 관리한다.
4. `open`, `close`, `closeAll`, `activate`를 고객사 Control API에 매핑한다.
5. `getWorkspaceControl()`에서 고객사 Tab/MDI Container를 반환한다.
6. iframe은 `postMessage`, UI5 Component는 EventBus 메시지 수신 경로를 `sendMessage`에 연결한다.
7. PortalController의 Adapter factory에 새 Key를 등록하고, 중복 열기·역할 전환·전체 닫기·메시지 수신을 검증한다.

Portal Core의 메뉴·권한 로직이나 `ApplicationConfig` 계약에 고객사 SDK를 직접 넣지 않는 것이 원칙이다.
