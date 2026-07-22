import { Response } from "express";

let sseClients: { id: string; res: Response }[] = [];

export function addSseClient(id: string, res: Response) {
  sseClients.push({ id, res });
}

export function removeSseClient(id: string) {
  sseClients = sseClients.filter(c => c.id !== id);
}

export function sseBroadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
      // Ensure data is pushed through, some proxy buffering may exist but express write/flush handles it
      if ((client.res as any).flush) {
        (client.res as any).flush();
      }
    } catch (err) {
      console.error("Error writing to SSE client:", err);
    }
  });
}
