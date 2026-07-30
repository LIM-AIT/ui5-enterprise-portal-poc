# BTP Identity and Destination Integration

The PoC currently uses `MockIdentityProvider`, `HttpDestinationResolver`, `/api/session`, and `/api/destinations/:name`.

## Production replacement points

1. Bind XSUAA using `xs-security.json`; validate JWT in the Node service.
2. Replace `MockIdentityProvider` with a JWT implementation that maps claims to Portal roles.
3. Bind the Destination service; replace `/api/destinations/:name` with a server-side Destination lookup.
4. Do not expose destination credentials or resolved protected URLs to the browser. The server must proxy protected backends where required.

The Portal Core stays unchanged: it receives a user from `IdentityProvider` and an executable target from `DestinationResolver`.
