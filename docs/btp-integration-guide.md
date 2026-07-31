# BTP 인증 및 Destination 전환 가이드

현재 PoC는 `MockIdentityProvider`, `HttpDestinationResolver`, `/api/session`, `/api/destinations/:name`과 서버 메모리 Mock 데이터를 사용한다. 이는 화면과 실행 모델 검증용이며 실제 인증·권한 또는 목적지 보안 설정이 아니다.

## 운영 전환 지점

1. `xs-security.json`을 정의하고 XSUAA 또는 IAS 기반 인증을 구성한다.
2. `MockIdentityProvider`를 JWT 검증 구현으로 교체하고, claim을 Portal 역할에 매핑한다.
3. Destination 서비스를 바인딩하고 `HttpDestinationResolver`를 서버 측 Destination 조회 구현으로 교체한다.
4. SAP On-Premise 연계가 필요한 경우 Connectivity와 Cloud Connector, 고객 네트워크 정책을 함께 구성한다.
5. 메뉴·즐겨찾기·최근 실행·업무 데이터를 DB와 보호된 API로 전환한다.

Portal Core는 `IdentityProvider`로부터 사용자 컨텍스트를 받고 `DestinationResolver`로부터 실행 가능한 대상 정보를 받는다. 이 경계를 유지하면 인증 방식과 대상 시스템이 바뀌어도 메뉴·Workspace·앱 실행 로직의 변경을 최소화할 수 있다.

## 보안 원칙

- Destination 자격증명, Service Key, 보호된 백엔드 URL을 브라우저에 노출하지 않는다.
- 보호된 요청은 서버 또는 approuter가 권한을 검증한 뒤 프록시한다.
- iframe 대상은 allow-list, CSP, `frame-ancestors`, SSO, `postMessage` origin 검증을 설계한다.
- 역할은 UI 표시용 필터만으로 판단하지 않고 서버에서 JWT와 권한을 검증한다.
