# Memento Web

The React and TypeScript web client for Memento. It consumes the shared API contract used by the mobile app and treats server-provided authentication, attachment, subscription, and storage metadata as authoritative.

## Development

```bash
npm install
npm run dev
```

Use the scripts in `package.json` for linting, tests, type checks, and production builds. Do not replace authenticated attachment metadata with durable public object URLs; request or refresh access through the API contract.

## Billing contract

Polar is the only active payment provider. The client starts checkout through the API and follows the returned URL; it does not integrate directly with Polar and contains no Paystack flow.

Default storage quotas are 200 MiB for Free and 10 GiB for Pro and Legacy, but API response metadata is authoritative because configuration or a per-user override may change the effective limit. See:

- [Pricing implementation status](docs/PRICING_IMPLEMENTATION_STATUS.md)
- [Backend handoff](docs/PRICING_BACKEND_HANDOFF.md)
- [Launch and operations notes](docs/PRICING_ATTENTION.md)

## Release boundaries

- Keep compatibility shims until production telemetry and the supported-client window authorize retirement.
- Preserve soft client gates while relying on API enforcement and standard 402 responses.
- Treat staging checkout, webhook, portal, invoice, and rollback exercises as release sign-offs; automated tests do not replace them.
