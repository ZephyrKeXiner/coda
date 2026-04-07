interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: { code: number; message: string };
}

function send(res: JsonRpcResponse) {
  process.stdout.write(JSON.stringify(res) + "\n");
}

const handlers: Record<string, (msg: JsonRpcResponse) => Promise<void>> = {
  initialize: async (msg) => {
    send({
      jsonrpc: "2.0",
      id: msg.id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "coda-mcp",
          version: "1.0.0",
        },
      },
    });
  },
  "notifications/initialized": async (msg) => {
    //TODO
  },
  "tool/list": async (msg) => {
    //TODO
  },
  "tool/call": async (msg) => {
    //TODO
  },
};

async function handlerMessage(msg: JsonRpcRequest) {
  const handler = handlers[msg.method];
  if (handler) {
    await handler(msg);
  } else if (msg.id !== undefined) {
    send({
      jsonrpc: "2.0",
      id: msg.id,
      error: { code: -1, message: `Method not found: ${msg.method}` },
    });
  }
}
