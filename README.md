# SAPUI5 Enterprise Portal Framework PoC

SAP Enterprise Portal End of Service 대응을 위한 고객 중립형 Portal Shell 기술 검증 프로젝트입니다. 인포데이에서 발표한 SAPUI5 기반 고전형 Portal(MDI 포함)을 1차 솔루션 범위로 하며, 특정 MDI 제품을 대체하지 않고 공통 Core와 고객별 Workspace Adapter를 분리합니다.

## 1단계 범위

- SAPUI5 Portal Shell, 계층 메뉴, 메뉴 검색
- Mock 사용자/역할 기반 메뉴 필터링
- 즐겨찾기, 최근 실행 이력
- `UI5_COMPONENT`, `IFRAME`, `EXTERNAL_WINDOW`, `CUSTOM_HANDLER` 실행 모델
- `Ui5TabWorkspaceAdapter` 탭 워크스페이스와 메시지 envelope
- 메뉴/애플리케이션 설정을 확인할 수 있는 관리자 화면

## 실행

```bash
npm install
npm start
```

브라우저에서 `http://localhost:8080/index.html`을 엽니다. 상단 역할 선택기는 Mock 로그인 전환을 위한 PoC 도구입니다.

상세 설계와 운영 가이드는 [개념설계](docs/concept-design.md), [아키텍처](docs/architecture.md), [Adapter 확장 가이드](docs/adapter-extension-guide.md), [BTP 배포](docs/deployment-btp.md)를 참고하세요.
