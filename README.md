# QR Work

A modern, mobile-friendly QR testing workspace built as a static frontend.

## Included

- Tester sign-in prototype
- Tester dashboard
- Animated/floating glass UI
- Task start + countdown flow
- Task submission and reward simulation
- Activity and transaction history
- Local QR generator for authorized text/URL sharing
- Administrator dashboard
- Task creation and approval simulation
- Responsive mobile navigation
- Reduced dependency on the UI layer; QR generation uses the QRCode.js CDN

## Run

This repository is a static site. Open `index.html` directly or deploy the repository with GitHub Pages.

## Production requirements

The current app intentionally uses local browser state for the demo. For a real multi-user deployment, add server-side authentication, PostgreSQL (or another durable database), server-side authorization, rate limiting, audit logs, background jobs, monitoring, backups, and load testing. Do not put secrets in frontend code.

## Safety

Use QR tasks only for authorized testing. Never ask testers for passwords, OTPs, UPI PINs, card PINs, recovery codes, or other authentication secrets. Payment/mandate flows should use an authorized payment provider with clear user disclosure.
