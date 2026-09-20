# Thomas OpenAI Webhook Receiver

This branch stages the public HTTPS receiver for Thomas production-compute evidence.

Trust boundary:
- OpenAI signing secret is NOT stored on Vercel or in GitHub.
- The POST function stores the exact raw request body plus `webhook-id`, `webhook-timestamp`, and `webhook-signature` headers in Vercel Private Blob.
- Thomas retrieves the private evidence through the protected evidence endpoint and verifies OpenAI HMAC locally using the DPAPI-vaulted signing secret.
- `THOMAS_CAPTURE_TOKEN` protects the evidence retrieval route and must be a Vercel environment secret, never committed.
- Private Blob must be connected to the Vercel project using OIDC-backed private storage.

Routes after deployment:
- `POST /api/openai-webhook` — OpenAI webhook destination.
- `GET /api/openai-webhook-evidence` — returns the most recent private capture when authorized with `Authorization: Bearer <THOMAS_CAPTURE_TOKEN>`.

The receiver performs no model calls, money movement, or human activation.
