import EventBus from "sap/ui/core/EventBus";
import { PortalMessage } from "./models";

export type PortalMessageListener = (message: PortalMessage) => void;

/** Routes the common message envelope between Portal, UI5 components and adapters. */
export default class PortalMessageBroker {
  private readonly listeners = new Map<string, Set<PortalMessageListener>>();
  private readonly seenMessageIds = new Set<string>();
  public constructor(private readonly eventBus: EventBus) {
    window.addEventListener("message", event => this.receiveIframeMessage(event));
    this.eventBus.subscribe("portal", "AI_CONTEXT_CHANGED", (_channel, _event, data) => {
      if (this.isPortalMessage(data) && !this.seenMessageIds.has(data.messageId)) this.publish(data);
    });
  }
  public subscribe(target: string, listener: PortalMessageListener): () => void { const listeners = this.listeners.get(target) ?? new Set<PortalMessageListener>(); listeners.add(listener); this.listeners.set(target, listeners); return () => listeners.delete(listener); }
  public publish(message: PortalMessage): void {
    this.assertEnvelope(message);
    if (this.seenMessageIds.has(message.messageId)) return;
    this.remember(message.messageId);
    this.eventBus.publish("portal", message.eventType, message);
    [...(this.listeners.get(message.target) ?? []), ...(this.listeners.get("*") ?? [])].forEach(listener => listener(message));
  }
  public create(source: string, target: string, eventType: string, payload: unknown): PortalMessage { const id = typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`; return { messageId: id, source, target, eventType, payload, timestamp: new Date().toISOString() }; }
  private receiveIframeMessage(event: MessageEvent<unknown>): void { if (event.origin === window.location.origin && this.isPortalMessage(event.data)) this.publish(event.data); }
  private remember(messageId: string): void {
    this.seenMessageIds.add(messageId);
    if (this.seenMessageIds.size > 300) this.seenMessageIds.delete(this.seenMessageIds.values().next().value as string);
  }
  private assertEnvelope(message: PortalMessage): void { if (!message.messageId || !message.source || !message.target || !message.eventType || !message.timestamp) throw new Error("Invalid PortalMessage envelope"); }
  private isPortalMessage(value: unknown): value is PortalMessage { return typeof value === "object" && value !== null && "messageId" in value && "source" in value && "target" in value && "eventType" in value && "timestamp" in value; }
}
