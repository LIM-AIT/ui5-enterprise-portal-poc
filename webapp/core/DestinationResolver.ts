import { ApplicationConfig } from "./models";

export interface DestinationResolver { resolve(application: ApplicationConfig): Promise<ApplicationConfig>; }

/** Resolves a configured destination locally; replace with BTP Destination service access in production. */
export default class HttpDestinationResolver implements DestinationResolver {
  public async resolve(application: ApplicationConfig): Promise<ApplicationConfig> {
    const destinationName = application.parameters?.destinationName;
    if (!destinationName) return application;
    const response = await fetch(`/api/destinations/${encodeURIComponent(destinationName)}`);
    if (!response.ok) throw new Error(`Destination is unavailable: ${destinationName}`);
    const destination = await response.json() as { target: string };
    return { ...application, target: destination.target };
  }
}
