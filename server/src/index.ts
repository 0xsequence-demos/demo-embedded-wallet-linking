import { ethers } from 'ethers'
import { sequence } from "0xsequence"
import { URL } from "url";

export interface Env {
    PROJECT_ACCESS_KEY: string;
    VERIFICATION_URL: string;
    demo_waas_wallet_link_server_db: KVNamespace;
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    // Allow requests from any origin - adjust this as necessary
                    "Access-Control-Allow-Origin": "*",
                    
                    // Allows the headers Content-Type, your-custom-header
                    "Access-Control-Allow-Headers": "Content-Type, your-custom-header",
                    
                    // Allow POST method - add any other methods you need to support
                    "Access-Control-Allow-Methods": "POST",
                    
                    // Optional: allow credentials
                    "Access-Control-Allow-Credentials": "true",
                    
                    // Preflight cache period
                    "Access-Control-Max-Age": "86400", // 24 hours
                }
            });
    }

    if (request.method !== "POST") {
        return new Response(null, {
            status: 405,
            statusText: "Method Not Allowed",
        });
    }

    let url = new URL(request.url)

    if (url.pathname === "/generateNonce") {
        const payload = await request.json()
        const { walletAddress }: any = payload

        if (!walletAddress) {
            return new Response(null, {
                status: 400,
                statusText: "Bad Request",
            });
        }

        const nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32))

        await env.demo_waas_wallet_link_server_db.put(nonce, walletAddress)

        return new Response(JSON.stringify({
            nonce: nonce,
            verificationUrl: env.VERIFICATION_URL
        }), {
            headers: {
                "Content-Type": "application/json",
            },
        });
    }

    if (url.pathname === "/verifyNonce") {
        const payload = await request.json()
        const { nonce, signature, sessionId, chainId }: any = payload

        if (!nonce || !signature || !sessionId || !chainId) {
            return new Response(null, {
                status: 400,
                statusText: "Bad Request",
            });
        }

        let walletAddress = await env.demo_waas_wallet_link_server_db.get(nonce)

        if (!walletAddress) {
            return new Response(null, {
                status: 404,
                statusText: "Not Found",
            });
        }

        let authProof = `SessionAuthProof ${sessionId} ${walletAddress} ${nonce}`
        let api = new sequence.api.SequenceAPIClient(
            "https://api.sequence.app",
            env.PROJECT_ACCESS_KEY
        )

        let isValid = await api.isValidMessageSignature({
            walletAddress: walletAddress,
            message: authProof,
            signature: signature,
            chainId: chainId
        })

        if (!isValid) {
            return new Response(null, {
                status: 401,
                statusText: "Unauthorized",
            });
        } else {
            return new Response(JSON.stringify({
                walletAddress
            }), {
                status: 200,
                statusText: "OK",
            });
        }
    }

    return new Response(null, {
        status: 404,
        statusText: "Not Found",
    });
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext) {
        // Process the request and create a response
        const response = await handleRequest(request, env, ctx);

        // Set CORS headers
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set("Access-Control-Allow-Headers", "Content-Type");

        // return response
        return response;
    }
}
