# SAP BTP Cloud Foundry 배포 요약

이 PoC는 `manifest.yml`과 Node.js buildpack으로 Cloud Foundry에 배포한다.

```powershell
npm ci
npm test
npm run build
cf login
cf target -o <org> -s <space>
cf push -f manifest.yml
cf apps
```

문제가 발생하면 아래로 최근 로그를 확인한다.

```powershell
cf logs ui5-enterprise-portal-poc --recent
```

배포 전에 `npm run build`를 반드시 수행해야 React/Vue와 UI5 정적 파일이 최신 상태로 포함된다. Trial 환경에서는 앱이 자동 중지될 수 있으므로 시연 전 `cf apps`를 확인하고 필요 시 `cf start ui5-enterprise-portal-poc`을 실행한다.

현재는 단일 Express 앱에 UI와 Mock API를 함께 배포한다. 운영 환경에서는 XSUAA, Destination, DB, approuter 또는 HTML5 Application Repository, CI/CD를 적용하는 구조로 전환한다.
