# 애플리케이션 실행 유형 및 제약

| 유형 | 실행 | 주요 제약 |
|---|---|---|
| `UI5_COMPONENT` | ComponentContainer로 component 로드 | namespace/manifest 충돌 방지, EventBus channel을 앱별로 격리 |
| `IFRAME` | Adapter가 iframe 탭 생성 | CSP `frame-src`, X-Frame-Options, same-origin 제약, origin 검증 필요 |
| `EXTERNAL_WINDOW` | `window.open` | 브라우저 popup 정책, 창 수명주기/메시지 제어 제한 |
| `CUSTOM_HANDLER` | 고객 등록 handler 호출 | handler registry 및 실패 fallback, 계약 버전 관리 필요 |

외부 URL은 Admin API에서 allow-list 검증한다. iframe에는 `sandbox`를 기본 적용하고 필요한 권한만 열며, 임의 `postMessage` 수신은 허용하지 않는다.
