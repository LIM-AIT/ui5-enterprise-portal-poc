# 애플리케이션 실행 유형 및 제약

| 유형 | 실행 방식 | 기본 Workspace 호환 | 주요 제약 |
| --- | --- | --- | --- |
| `UI5_COMPONENT` | `ComponentContainer`로 독립 UI5 Component 로드 | `UI5_TAB`, `CUSTOM` | namespace/manifest 충돌 방지, EventBus 구독 해제 필요 |
| `IFRAME` | Adapter가 iframe 콘텐츠를 생성 | `UI5_TAB`, `IFRAME`, `CUSTOM` | CSP `frame-src`, X-Frame-Options, SSO, origin 검증 필요 |
| `EXTERNAL_WINDOW` | `window.open`으로 별도 창 실행 | Workspace 밖에서 실행 | 브라우저 popup 정책, 창 수명주기·메시지 제어 제한 |
| `CUSTOM_HANDLER` | 고객 등록 Handler 호출 | `UI5_TAB`에서 확장 지점 시연 | Handler registry, 오류 fallback, 계약 버전 관리 필요 |

## Adapter별 의미

- `UI5_TAB`은 SAPUI5 Component와 iframe을 하나의 `IconTabBar` Workspace에서 함께 실행하는 기본 모드다.
- `IFRAME`은 React, Vue, HTML, 웹 URL 형태의 Nexacro 등 URL 기반 Non-SAP 앱만 실행한다. 다른 유형을 열면 경고 콘텐츠가 표시된다.
- `CUSTOM`은 고객사 MDI 컨트롤을 연결할 구조를 제공한다. PoC에서는 UI5 Component와 iframe을 실행하는 참조 컨테이너를 사용한다.

## 보안 전환 시 확인 사항

PoC의 iframe 앱은 같은 Origin에서 동작하는 샘플이다. 운영 환경에서는 외부 URL allow-list, `frame-src` CSP, X-Frame-Options/`frame-ancestors`, iframe `sandbox` 최소 권한, SSO 방식, `postMessage`의 수신 origin과 payload schema를 반드시 검증해야 한다. 보호된 Destination의 자격증명과 URL을 브라우저에 노출하지 않고 서버 또는 approuter가 중계해야 한다.
