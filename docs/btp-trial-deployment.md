# SAP BTP Trial Cloud Foundry Deployment

## Scope

This deployment packages the Portal Shell, SAPUI5 apps, and React/Vue static builds in one Node.js Express application. It deliberately keeps Mock data and does not require HANA Cloud.

## Prerequisites

1. Create an SAP BTP Trial account and open its Cloud Foundry space.
2. Install the Cloud Foundry CLI.
3. In this project root, run `npm ci` and `npm run build`.

## Deploy

```powershell
cf login
cf target -o <org> -s <space>
cf push
```

`manifest.yml` starts the already-built `server.js`. The server serves UI5 from `dist`, React from `non-sap/react-procurement/dist`, and Vue from `non-sap/vue-procurement/dist`.

## Verify

```powershell
cf apps
cf logs ui5-enterprise-portal-poc --recent
```

Open the route shown by `cf apps`. Validate UI5, HTML iframe, React iframe, Vue iframe, role switching, and the purchase approval scenario.

## Productive follow-up

Replace MockIdentityProvider with XSUAA/IAS claims, replace mock destinations with Destination service lookup, and replace in-memory configuration/workflow data with protected APIs and persistence.
