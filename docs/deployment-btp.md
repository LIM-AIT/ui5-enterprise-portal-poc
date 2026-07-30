# SAP BTP Cloud Foundry Trial 배포

이 PoC는 Express/CAP 추가 전에는 `manifest.yml`의 Node.js UI5 development server 방식으로 바로 배포할 수 있다.

1. BTP Trial subaccount에서 Cloud Foundry environment와 Space를 준비하고 Space Developer 권한을 확인한다.
2. [CF CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)를 설치한 뒤 `cf api <region-api>`, `cf login`, `cf target -o <org> -s <space>`를 실행한다.
3. 프로젝트 루트에서 `npm ci`와 `npm run build`로 빌드 확인 후 `cf push -f manifest.yml`을 실행한다.
4. `cf apps`, `cf logs ui5-enterprise-portal-poc --recent`로 상태를 확인하고 생성된 route를 연다.

SAP BTP는 Node.js 배포에 표준 `nodejs_buildpack`을 사용하며, manifest의 buildpack 지정 또는 `cf push -b nodejs_buildpack`을 지원한다. [SAP Node.js CF 문서](https://help.sap.com/docs/btp/sap-business-technology-platform/developing-node-js-in-cloud-foundry-environment?locale=en-US&scp-env=Cloud+Foundry)를 참고한다.

운영 아키텍처 전환 시에는 UI를 HTML5 Application Repository에 배포하고 XSUAA와 Destination을 붙인 approuter를 사용한다. SAP는 CF에서 Generic Application Content Deployer(GACD)를 권장한다. [SAP HTML5 content deployment 문서](https://help.sap.com/docs/btp/sap-business-technology-platform/deploying-content)를 참고한다. HTML5 apps repo에 같은 app-host로 새 content를 배포하면 기존 content가 교체될 수 있으므로, MTA에 모든 앱을 포함하거나 app-host를 분리한다.
