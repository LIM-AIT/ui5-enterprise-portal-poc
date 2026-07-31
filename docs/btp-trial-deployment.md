# SAP BTP Trial Cloud Foundry 배포

## 범위

이 배포는 Portal Shell, SAPUI5 Component 앱, React/Vue 정적 빌드를 하나의 Node.js Express 애플리케이션으로 패키징한다. 데이터는 서버 메모리 Mock이며 HANA Cloud, XSUAA, Destination은 아직 사용하지 않는다.

## 사전 준비

1. SAP BTP Trial 계정에서 Cloud Foundry Org와 Space를 준비한다.
2. Cloud Foundry CLI를 설치한다.
3. 프로젝트 루트에서 의존성과 빌드를 검증한다.

```powershell
npm ci
npm test
npm run build
```

## 배포

```powershell
cf login
cf target -o <org> -s <space>
cf push
```

`manifest.yml`은 `server.js`를 시작한다. 서버는 `dist`의 UI5 산출물과 `non-sap/react-procurement/dist`, `non-sap/vue-procurement/dist`의 정적 산출물을 제공한다.

## 확인

```powershell
cf apps
cf logs ui5-enterprise-portal-poc --recent
```

`cf apps`에 표시된 route로 접속해 역할 전환, UI5 Component, HTML/React/Vue iframe, 현재 탭 닫기·전체 닫기, 구매 승인 시나리오를 확인한다. 새 배포 내용이 보이지 않으면 브라우저에서 `Ctrl + F5`를 실행한다.

## Trial 유의사항

Trial Cloud Foundry는 앱을 자동 중지할 수 있으므로, 시연 전에 상태를 확인한다. 중지된 경우 다음 명령으로 다시 시작한다.

```powershell
cf start ui5-enterprise-portal-poc
```

현재 PoC route는 인증이 없는 공개 주소로 취급해야 한다. 민감정보나 실제 업무 데이터를 올리지 않는다.

## 운영 전환

운영에서는 XSUAA/IAS, Destination, Connectivity, DB, approuter 또는 HTML5 Application Repository, CI/CD 및 모니터링을 적용한다.
