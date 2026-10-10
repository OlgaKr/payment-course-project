# Merchant Payment Service — QA Course Project

Testing project for the Merchant Payment Service, a payment backend with a checkout UI, Stripe test-mode integration and PostgreSQL storage. The application is supplied as a Docker image without source code.

The project includes manual testing, 10 documented bug reports, automated API tests, JSON Schema contract tests, checkout E2E tests and GitHub Actions CI.

## Test coverage

| Area                     | Coverage                                                |
| ------------------------ | ------------------------------------------------------- |
| Payments API             | Creation, retrieval, listing, capture and refunds       |
| Validation               | Invalid input, boundary values and edge cases           |
| Financial consistency    | Capture/refund failures and local payment state         |
| Idempotency              | Repeated payment requests and duplicate webhook events  |
| Targeted security checks | Webhook signature validation and client-secret exposure |
| API contracts            | Response validation using Ajv and JSON Schema           |
| E2E                      | Checkout flow using Playwright and Page Object Model    |

Known defects are covered by dedicated tests in `tests/api/defects/`.

## Requirements

- Node.js and npm (CI uses Node.js LTS).
- Docker with Docker Compose; on Windows, start Docker Desktop in Linux containers mode.
- Stripe test secret and publishable keys from the same Stripe account/test environment.
- Available local ports `3000` (application) and `5433` (PostgreSQL).
- Internet access to download dependencies and Docker images, and to access Stripe test services.

## Local setup

Run the commands below from the repository root.

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/OlgaKr/payment-course-project.git
cd payment-course-project
npm ci
npx playwright install
```

On Linux, browser system dependencies can be installed with:

```bash
npx playwright install --with-deps
```

### 2. Configure the application

Create a `.env` file next to `docker-compose.yml` with your Stripe test keys:

```env
STRIPE_SECRET_KEY=sk_test_replace_with_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_replace_with_your_key
```

Use test keys only. Do not commit `.env` or secret keys. Docker Compose reads this file and passes the keys to the application container.

The supplied Compose configuration defaults `STRIPE_WEBHOOK_SECRET` to `whsec_test` when it is not set. This is a local test placeholder, not a signing secret for events forwarded by Stripe CLI.

### 3. Start the application

```bash
docker compose up -d
docker compose ps
```

Open [the health endpoint](http://localhost:3000/api/health) and wait until it returns `status: "ok"` and `db: "connected"` before running tests.

| Service      | Address                                                          |
| ------------ | ---------------------------------------------------------------- |
| API base URL | `http://localhost:3000`                                          |
| Checkout     | [http://localhost:3000/checkout](http://localhost:3000/checkout) |
| Payments UI  | [http://localhost:3000/payments](http://localhost:3000/payments) |
| PostgreSQL   | `localhost:5433`                                                 |

The application uses `ghcr.io/yyushchenko/merchant-api:1.0`; the database uses `postgres:16-alpine`.

## Run tests

Run the complete suite:

```bash
npx playwright test
```

Run a specific group:

```bash
# API tests, including known-defect tests
npx playwright test tests/api

# Contract tests
npx playwright test tests/contracts

# E2E tests
npx playwright test tests/e2e

# Known-defect tests only
npx playwright test tests/api/defects
```

Run E2E tests with a visible browser:

```bash
npx playwright test tests/e2e --headed
```

To explicitly generate and open an HTML report:

```bash
npx playwright test --reporter=html
npx playwright show-report
```

Tests create payment data in the local database and Stripe test environment.

### Known-defect results

Tests for known bugs use `test.fail(...)`. They assert the expected correct behavior and are expected to fail while the defect remains present.

- An expected failure is accepted by Playwright and does not fail the overall run.
- An unexpected pass fails the run and requires review: the defect may have been fixed or the scenario may have changed.
- A green run does not mean that the application has no defects. Review the failure details and bug reports when assessing results.

## Project structure

| Path                               | Purpose                                                    |
| ---------------------------------- | ---------------------------------------------------------- |
| `tests/api/`                       | API integration tests                                      |
| `tests/api/defects/`               | Regression scenarios for 10 known defects                  |
| `tests/api/helpers/`               | Payment helpers, assertions, test data and database access |
| `tests/contracts/`                 | API response contract tests                                |
| `tests/contracts/schemas/`         | JSON Schemas                                               |
| `tests/contracts/helpers/`         | Schema validation helper                                   |
| `tests/e2e/`                       | Browser tests                                              |
| `tests/e2e/pages/`                 | Page Objects                                               |
| `playwright.config.ts`             | Playwright configuration                                   |
| `.github/workflows/playwright.yml` | CI workflow                                                |
| `docker-compose.yml`               | Application and database environment                       |
| `test_documents/TEST_STRATEGY.md`  | Testing scope, test types, risks and exclusions            |
| `test_documents/BUG_REPORTS.md`    | 10 bug reports with severity justification                 |

## Documentation

- [Test Strategy](test_documents/TEST_STRATEGY.md)
- [Bug Reports](test_documents/BUG_REPORTS.md)
- [API reference](API.md)
- [OpenAPI specification](openapi.yaml)

## Continuous integration

The workflow runs on pushes to `main` or `master`, and pull requests targeting these branches.

Configure the following GitHub repository Actions secrets before running CI:

| Secret                   | Value                                |
| ------------------------ | ------------------------------------ |
| `STRIPE_SECRET_KEY`      | Stripe test secret key               |
| `STRIPE_PUBLISHABLE_KEY` | Matching Stripe test publishable key |

CI installs dependencies and Playwright browsers, starts Docker Compose, waits for a successful HTTP response from `/api/health`, and runs `npx playwright test`. Docker logs are printed if the job fails. The workflow uploads `playwright-report/` as an artifact named `playwright-report`, with a retention period of 30 days.

## Database inspection

Local connection settings from `docker-compose.yml`:

| Setting  | Value         |
| -------- | ------------- |
| Host     | `localhost`   |
| Port     | `5433`        |
| Database | `payments_db` |
| Username | `payments`    |
| Password | `payments`    |

The database contains `payments`, `refunds` and `webhook_events` tables. To inspect them from the terminal:

```bash
docker compose exec db psql -U payments payments_db
```

## Optional manual webhook forwarding

The default startup command and the CI workflow do not enable the `webhooks` profile. For a separate manual investigation with Stripe CLI forwarding:

```bash
docker compose --profile webhooks up -d
docker compose logs -f stripe-cli
```

The CLI forwards events to `api:3000/api/webhooks`. For signature-verification investigations, use the signing secret shown by that listener as `STRIPE_WEBHOOK_SECRET` in `.env`, then recreate/update the API container with `docker compose up -d api`.

## Troubleshooting and shutdown

| Problem                                               | Check                                                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Application is unavailable                            | Start Docker Desktop, run `docker compose ps`, then inspect `docker compose logs api`                  |
| A port is already allocated                           | Check for another process using `3000` or `5433`                                                       |
| Stripe authentication or checkout configuration error | Check the test keys in `.env`, then run `docker compose up -d` to apply changes                        |
| Browser executable is missing                         | Run `npx playwright install`                                                                           |
| Database connection fails                             | Check the database container and use host port `5433`, database `payments_db`                          |
| A known-defect test unexpectedly passes               | Review its assertions and current application behavior before changing the expected-failure annotation |

View application logs:

```bash
docker compose logs api
```

Stop and remove the containers while retaining database data:

```bash
docker compose down
```

If the optional webhook profile was enabled, use `docker compose --profile webhooks down` to stop it as well. Adding `-v` deletes the local database volume; use it only when an intentional database reset is needed.
