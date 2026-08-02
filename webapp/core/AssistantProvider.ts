export interface AssistantMenu {
  id: string;
  title: string;
  description: string;
}

export interface AssistantContextField {
  label: string;
  value: string;
  state?: "None" | "Information" | "Success" | "Warning" | "Error";
}

/** Business data exposed by the currently active Workspace application. */
export interface AssistantBusinessContext {
  applicationId: string;
  kind: string;
  title: string;
  entityId?: string;
  summary?: string;
  fields: AssistantContextField[];
  data?: Record<string, unknown>;
  updatedAt?: string;
}

export interface AssistantCard {
  eyebrow: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusState?: "None" | "Information" | "Success" | "Warning" | "Error";
  facts: AssistantContextField[];
}

export interface AssistantContext {
  role: string;
  roleLabel: string;
  activeTitle: string;
  menus: AssistantMenu[];
  recent: AssistantMenu[];
  businessContext?: AssistantBusinessContext;
}

export interface AssistantReply {
  text: string;
  card?: AssistantCard;
  actionMenuId?: string;
  actionLabel?: string;
}

/** Stable boundary for swapping Trial logic with a productive Joule/LLM gateway. */
export default interface AssistantProvider {
  respond(question: string, context: AssistantContext): Promise<AssistantReply>;
}
