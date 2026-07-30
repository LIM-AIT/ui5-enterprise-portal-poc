export interface PortalUser { id: string; name: string; roles: string[]; }
export interface IdentityProvider { getCurrentUser(): Promise<PortalUser>; }

/** Local adapter. Replace with an XSUAA JWT-backed implementation in BTP. */
export default class MockIdentityProvider implements IdentityProvider {
  public async getCurrentUser(): Promise<PortalUser> {
    const response = await fetch("/api/session");
    if (!response.ok) throw new Error("Identity service is unavailable.");
    return response.json() as Promise<PortalUser>;
  }
}
