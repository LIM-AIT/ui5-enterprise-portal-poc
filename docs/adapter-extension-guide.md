# 고객별 Workspace Adapter 확장 가이드

Portal Core를 수정하지 않고 `WorkspaceAdapter`를 구현해 조립합니다. Adapter는 application ID와 customer container instance ID의 매핑을 소유해야 합니다.

```ts
class CustomWorkspaceAdapter implements WorkspaceAdapter {
  open(app: ApplicationConfig) { /* customer MDI create/open */ }
  close(instanceId: string) { /* customer MDI close */ }
  closeAll() { /* close every owned tab */ }
  activate(instanceId: string) { /* focus tab */ }
  sendMessage(message: PortalMessage) { /* bridge to application */ }
  getOpenedApplications() { return []; }
  getActiveControl() { return undefined; }
}
```

등록은 composition root에서 `new PortalController(new CustomWorkspaceAdapter(...))`처럼 주입한다. Core에 고객 API를 직접 참조하지 않는다.

- `Ui5TabWorkspaceAdapter`: SAPUI5 Control 기반 탭. PoC 기본값.
- `CustomWorkspaceAdapter`: 기존 고객 Tab Container SDK를 감싼 구현. lifecycle callback을 Adapter 메서드로 변환한다.
- `IframeWorkspaceAdapter`: 각 앱을 iframe으로 격리하는 구현. origin allow-list, sandbox, postMessage handshake가 필수다.

Adapter 구현은 동일 앱을 중복으로 열지 않는 정책, close 실패 처리, active-app 변경 이벤트, `PortalMessage` 전달을 테스트해야 한다.
