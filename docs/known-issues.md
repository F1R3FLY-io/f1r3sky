# F1R3Sky Frontend — Known Issues

## 1. Account Creation Fails — Captcha Connects to Production bsky.app

The signup flow on the f1r3sky frontend uses Bluesky's production captcha service at `bsky.app`. When running locally, this fails with `bsky.app refused to connect` and `Error receiving captcha response`.

The local dev PDS does not require captcha verification.

**Workaround:** Create accounts directly via the PDS API:

```bash
curl -X POST http://localhost:2583/xrpc/com.atproto.server.createAccount \
  -H 'Content-Type: application/json' \
  -d '{"handle": "myuser.test", "email": "user@test.com", "password": "password123"}'
```

Then sign in on the frontend at `http://localhost:8100` using the created credentials. On the login page, select custom hosting provider and enter `http://localhost:2583` as the PDS URL.

**Fix needed:** Disable captcha when connecting to a local/dev PDS, or make the captcha service URL configurable.

## 4. "Error loading post" When Clicking on a Post

Clicking on a post in the feed shows `Error loading post — Something went wrong. Please try again in a moment.` The AppView's `getPostThread` API fails because the AppView can't validate PDS tokens due to DID/signing key mismatches in the dev environment. Posts are created successfully on the PDS (visible in the feed) but thread views don't load.

**Workaround:** None currently. The post data exists — the thread view endpoint is broken in the dev-env setup.

## 2. "Could not find repo" Error on Home Feed

After logging in, the home page shows `Could not find repo: did:plc:...`. The BSKY AppView hasn't synced the newly created account data from the PDS yet, or feed generators reference DIDs that don't exist in the local dev environment.

**Root cause:** The AppView (port 2584) rejects PDS tokens with `InvalidToken: Malformed token`. The AppView and PDS are started by the dev-env with coordinated DIDs/keys, but the mock data references DIDs that change on each database reset. The frontend tries to load the suggested feed which references non-existent DIDs.

**Workaround:** Ignore the error — the profile and posting features work. Navigate directly to your profile or create a post. The "You've reached the end of your feed" message (shown in demos) appears when the feed is empty but the AppView token validation works — this suggests the demo was running against a more stable environment where the feed generators were properly seeded.

## 3. Wallet Page Crashes — Embers API URL Not Configured

The wallet feature (`/wallet` route) crashes with `TypeError: Cannot read properties of undefined (reading 'balance')`. The f1r3sky frontend connects to embers via the `EXPO_PUBLIC_EMBERS_API_URL` environment variable, which is baked into the JavaScript bundle at build time.

The pre-built Docker image (`f1r3flyindustries/firesky-frontend`) does not have this variable set, so `EmbersApiSdk` is initialized with `undefined` as the base URL and all wallet API calls fail.

**Fix needed:** Rebuild the f1r3sky frontend Docker image with `EXPO_PUBLIC_EMBERS_API_URL` set. For local dev:

```bash
EXPO_PUBLIC_EMBERS_API_URL=http://localhost:8080
```

This is a build-time variable (Expo/React Native), not a runtime env var — cannot be passed via `docker run -e`.

**To rebuild with wallet support:**

1. Set `NPM_TOKEN` env var (GitHub PAT with `read:packages` scope — needed for `@f1r3fly-io/embers-client-sdk`)

2. Add `EXPO_PUBLIC_EMBERS_API_URL` to the Dockerfile's `.env` generation (after line 66):
   ```dockerfile
   echo "EXPO_PUBLIC_EMBERS_API_URL=$EXPO_PUBLIC_EMBERS_API_URL" >> .env && \
   ```

3. Build:
   ```bash
   cd services/f1r3sky
   NPM_TOKEN=<your-github-token> docker build \
     --build-arg EXPO_PUBLIC_EMBERS_API_URL=http://localhost:8080 \
     -t f1r3flyio/firesky-frontend:local .
   ```

4. Run with the local image:
   ```bash
   docker run -d --name f1r3sky-frontend --network f1r3fly \
     -p 8100:8100 \
     -e HTTP_ADDRESS=:8100 \
     -e ATP_APPVIEW_HOST=http://f1r3sky:2584 \
     f1r3flyio/firesky-frontend:local \
     /usr/bin/bskyweb serve
   ```
