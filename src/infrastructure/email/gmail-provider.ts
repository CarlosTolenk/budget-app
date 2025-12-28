import { google, gmail_v1 } from "googleapis";
import { EmailProvider, EmailProviderConfig } from "@/modules/email-ingestion/providers/email-provider";
import { EmailMessage, EmailAddress } from "@/modules/email-ingestion/types/email-message";

interface GmailProviderOptions {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export class GmailProvider implements EmailProvider {
  readonly name = "gmail";

  private readonly gmail: gmail_v1.Gmail;
  private labelsCache?: Map<string, string>;

  constructor(private readonly options: GmailProviderOptions) {
    const auth = new google.auth.OAuth2(this.options.clientId, this.options.clientSecret);
    auth.setCredentials({ refresh_token: this.options.refreshToken });
    this.gmail = google.gmail({ version: "v1", auth });
  }

  async listMessages(config?: EmailProviderConfig): Promise<EmailMessage[]> {
    if (!this.options.refreshToken) {
      return [];
    }

    const maxResults = config?.maxResults ?? 30;
    const labelMap = await this.getLabelMap();

    const response = await this.gmail.users.messages.list({
      userId: "me",
      maxResults,
      includeSpamTrash: false,
    });

    const messages = response.data.messages ?? [];
    if (messages.length === 0) {
      return [];
    }

    const results = await Promise.allSettled(
      messages.map(async (message) => {
        if (!message.id) {
          return null;
        }

        const { data } = await this.gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        return this.transformMessage(data, labelMap);
      }),
    );

    results
      .filter((result): result is PromiseRejectedResult => result.status === "rejected")
      .forEach((result) => {
        console.error("Failed to load Gmail message", result.reason);
      });

    return results
      .filter((result): result is PromiseFulfilledResult<EmailMessage | null> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((message): message is EmailMessage => Boolean(message));
  }

  async markAsProcessed(): Promise<void> {
    // Hook to archive/remove labels in Gmail if needed.
    return Promise.resolve();
  }

  private async getLabelMap() {
    if (this.labelsCache) {
      return this.labelsCache;
    }

    try {
      const { data } = await this.gmail.users.labels.list({ userId: "me" });
      this.labelsCache = new Map();
      for (const label of data.labels ?? []) {
        if (label.id && label.name) {
          this.labelsCache.set(label.id, label.name);
        }
      }
    } catch (error) {
      console.error("Failed to load Gmail labels", error);
      this.labelsCache = new Map();
    }

    return this.labelsCache;
  }

  private transformMessage(message: gmail_v1.Schema$Message, labelMap: Map<string, string>): EmailMessage | null {
    if (!message.id) {
      return null;
    }

    const headers = this.toHeaderMap(message.payload?.headers);
    const subject = headers.get("subject") ?? "(sin asunto)";
    const snippet = message.snippet ?? undefined;
    const from = this.parseAddress(headers.get("from"));
    const to = this.parseAddressList(headers.get("to"));
    const dateHeader = headers.get("date");
    const internalDate = message.internalDate ? Number(message.internalDate) : undefined;
    const receivedAt = dateHeader ? new Date(dateHeader) : internalDate ? new Date(internalDate) : new Date();
    const body = this.extractBody(message.payload) || snippet || "";
    const labels = (message.labelIds ?? []).map((id) => (id ? labelMap.get(id) ?? id : "")).filter(Boolean);

    return {
      id: message.id,
      subject,
      snippet,
      body,
      from,
      to,
      receivedAt,
      labels,
      metadata: {
        threadId: message.threadId ?? "",
        historyId: message.historyId ?? "",
      },
    };
  }

  private toHeaderMap(
    headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  ): Map<string, string> {
    const map = new Map<string, string>();
    for (const header of headers ?? []) {
      if (header.name && header.value) {
        map.set(header.name.toLowerCase(), header.value);
      }
    }
    return map;
  }

  private parseAddress(value?: string): EmailAddress {
    if (!value) {
      return { email: "unknown@example.com" };
    }

    const match = value.match(/^(?:"?([^"]*)"?\s*)?<([^>]+)>$/);
    if (match) {
      const name = match[1]?.trim();
      return {
        email: match[2].trim(),
        ...(name ? { name } : {}),
      };
    }

    return { email: value.trim() };
  }

  private parseAddressList(value?: string): EmailAddress[] {
    if (!value) {
      return [];
    }

    return value
      .split(/,(?![^<]*>)/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => this.parseAddress(entry));
  }

  private extractBody(payload?: gmail_v1.Schema$MessagePart): string {
    if (!payload) {
      return "";
    }

    if (payload.mimeType === "text/plain" && payload.body?.data) {
      return this.decodeBody(payload.body.data);
    }

    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        const partBody = this.extractBody(part);
        if (partBody) {
          return partBody;
        }
      }
    }

    if (payload.mimeType === "text/html" && payload.body?.data) {
      return this.decodeBody(payload.body.data);
    }

    return payload.body?.data ? this.decodeBody(payload.body.data) : "";
  }

  private decodeBody(data: string): string {
    const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(normalized, "base64").toString("utf8");
  }
}
