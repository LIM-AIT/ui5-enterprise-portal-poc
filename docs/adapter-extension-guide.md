# 고객별 Workspace Adapter 구현 가이드

고객사의 기존 MDI 또는 커스텀 UI5 Tab Control을 연결할 때는 Portal Core가 아니라 새 `WorkspaceAdapter` 구현체를 추가한다. Adapter는 애플리케이션 ID와 고객사 내부 탭/창 ID의 매핑 및 수명주기를 소유한다.

```ts
class CustomerWorkspaceAdapter implements WorkspaceAdapter {
  readonly key = "CUSTOMER" as const;

  open(app: ApplicationConfig) { /* 고객사 MDI의 create/open 호출 */ }
  close(instanceId: string) { /* 고객사 탭 close 호출 */ }
  closeAll() { /* 모든 고객사 탭 close 호출 */ }
  activate(instanceId: string) { /* 고객사 탭 focus/select 호출 */ }
  sendMessage(message: PortalMessage) { /* EventBus 또는 postMessage bridge */ }
  getOpenedApplications() { return []; }
  getWorkspaceControl() { return this.customerMdiControl; }
  getActiveControl() { return undefined; }
}
```

## 적용 원칙

- `application.id`와 고객사 Tab ID를 Adapter 내부에서 일대일로 관리한다.
- 메뉴를 다시 선택했을 때 기존 탭을 활성화하고 중복 생성하지 않는다.
- 고객사 Control의 탭 닫기 이벤트를 받아 열린 앱 목록과 활성 상태를 동기화한다.
- UI5 Component 제거, iframe 메시지 리스너, 타이머 등 앱 리소스를 닫을 때 정리한다.
- Portal Core, 메뉴 권한, `ApplicationConfig`에 고객사 SDK 클래스나 API를 직접 참조하지 않는다.

## 등록 위치

현재 PoC는 `PortalController`가 선택된 Adapter Key에 따라 구현체를 생성한다. 새 구현체를 추가할 때는 해당 Adapter factory에 Key와 생성 코드를 등록한다. 실제 운영에서는 고객 설정 또는 테넌트 설정으로 Key를 결정하는 방식을 권장한다.

## 검증 항목

1. 동일 앱 재선택 시 중복 탭이 없는가
2. 탭 닫기와 전체 닫기 후 메모리·이벤트 리스너가 정리되는가
3. 활성 탭과 `getOpenedApplications()` 상태가 일치하는가
4. 역할 또는 사용자 전환 시 권한 없는 탭이 닫히는가
5. UI5 EventBus 및 iframe `postMessage` 메시지가 올바른 대상에 전달되는가
6. 고객사 Control 렌더링·비동기 lifecycle 오류가 Portal Shell을 중단시키지 않는가

`CustomWorkspaceAdapter`는 이 확장 지점의 구조를 보여 주는 참조 구현이다. 한수원 e-CAP 등 실제 고객사 컨트롤과의 연계는 해당 컨트롤 API를 확인한 뒤 별도 Adapter로 구현해야 한다.
