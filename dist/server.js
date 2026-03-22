import express from "express";
import { HTTPFacilitatorClient } from "@x402/core/http";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { spawn } from "node:child_process";
const app = express();
const evmAddress = "0x6C8Bb085e8E978efF8E4F1beBfC45090542c660e";
const facilitatorClient = new HTTPFacilitatorClient({
    url: "https://x402.org/facilitator"
});
app.use(express.json());
app.use(paymentMiddleware({
    "POST /skill": {
        accepts: [
            {
                scheme: "exact",
                price: "$0.001",
                network: "eip155:84532", // Base Sepolia
                payTo: evmAddress,
            }
        ],
        description: "Skills Response",
        mimeType: "application/json"
    },
}, new x402ResourceServer(facilitatorClient).register("eip155:84532", new ExactEvmScheme())));
app.post("/skill", (req, res) => {
    console.log(req.body);
    const { CLAUDECODE, ...cleanEnv } = process.env;
    const child = spawn("/Users/sakruhnab1/.npm-global/bin/claude", ["-p", req.body.str], { env: cleanEnv });
    child.stdin.end();
    let out = "";
    let err = "";
    child.stdout.on("data", (data) => { out += data; });
    child.stderr.on("data", (data) => { err += data; });
    child.on("close", (code) => {
        console.log("exit code:", code);
        res.json({ stdout: out || err });
    });
});
app.listen(4021, () => {
    console.log(`Server listening at http://localhost:4021`);
});
//# sourceMappingURL=server.js.map