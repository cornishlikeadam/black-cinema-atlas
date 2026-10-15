# Connect the texting number

The website and movie guide are live at https://black-cinema-atlas.fresh-cream-7054.chatgpt.site . The SMS code is deployed but intentionally disabled. The owner deferred the Twilio payment/number connection until tomorrow. Do not complete payment, buy a number, or submit binding registration terms without the owner's required participation/authorization.

## Prepared webhook

- Inbound URL: `https://black-cinema-atlas.fresh-cream-7054.chatgpt.site/api/sms`
- Method: **POST**
- Hosted origin: `https://black-cinema-atlas.fresh-cream-7054.chatgpt.site`
- No local server or device tunnel is needed.

## Activation

1. Owner finishes Twilio's upgrade/payment if they choose to proceed. The last observed screen showed a $20 starting balance; confirm current costs in Twilio before any purchase. Obtain a number with SMS capability and complete any required carrier/business registration. Trial accounts can restrict recipients, and an upgraded account alone does not guarantee unrestricted messaging.
2. Retrieve the existing account SID and auth token from Twilio's account settings. Do not paste secrets into chat or GitHub. Use the ignored `.env.local` file for local setup if needed, then save secrets directly in the hosted environment with the native Sites environment tool.
3. Set the number's inbound messaging webhook to the URL/method above. Match the exact URL, including HTTPS and `/api/sms`, because the signature check binds to it.
4. Configure these hosted values: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` (secret), `TWILIO_PHONE_NUMBER` (E.164, e.g. +1…), `PUBLIC_ORIGIN` (already configured), and finally `SMS_ENABLED=true`. Keep the auth token out of browser code. Do not rotate/create credentials unnecessarily.
5. Redeploy the latest saved Site version to apply the environment revision. The existing project is `appgprj_6ad1029b4b308191b4786026d9f87b43`; do not create another Site. Runtime-only setup requires no code rebuild. Refresh the current version ID through Sites rather than inventing one.
6. Owner texts a movie request to the number. Verify one inbound webhook and one outbound reply in Twilio, no duplicated replies on retries, and expected delivery. Test HELP and STOP; confirm opted-out recipients receive no further agent messages. Only then describe public SMS as live and document the number's eligibility/registration status.

## Existing protections and behavior

The webhook validates Twilio's HMAC signature, account SID and destination number. It stores message IDs to reject duplicates and hashes the sender before using it as the guide's session ID. It acknowledges quickly and sends the agent's reply asynchronously through Twilio. HELP and STOP do not call the AI. Twilio's normal opt-out handling must remain enabled. Web and SMS histories are separate.

SMS users have 20 guide turns/day, within the shared 200/day and 8/minute app caps. Replies are capped at 600 characters and can use multiple billable segments. Provider quotas and delivery/carrier restrictions still apply. A receipt marked `sent` means Twilio accepted the outbound request; it is not a delivery confirmation. The current code does not send promotional messages.

To disable SMS, set `SMS_ENABLED=false` and redeploy the saved version. Website chat continues independently.
