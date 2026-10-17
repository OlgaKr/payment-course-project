# Merchant Payment Service — QA Course Project

My course project for testing a payment service. The application runs in Docker and uses Stripe test mode and PostgreSQL.

I tested payment creation, capture, refunds, validation, idempotency and webhooks. The project includes API tests, contract tests with Ajv and JSON Schema, and E2E tests with Page Objects. I found and documented 10 bugs.

Tools: Playwright, TypeScript, Ajv, PostgreSQL and GitHub Actions.

## 1. Setup

You need Node.js, npm, Docker Desktop and Stripe test keys.

Clone the project and install dependencies:

```bash
git clone https://github.com/OlgaKr/payment-course-project.git
cd payment-course-project
npm ci
npx playwright install
```

Create a `.env` file in the project root:

```env
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

Use keys from the same Stripe test environment. Do not commit `.env`.

Start Docker Desktop, then run:

```bash
docker compose up -d
```

Before running tests, open [health check](http://localhost:3000/api/health) and wait for `status: "ok"` and `db: "connected"`.

- [Checkout](http://localhost:3000/checkout)
- [Payments](http://localhost:3000/payments)
- Database: `localhost:5433`, name `payments_db`, user/password `payments`.

## 2. Run tests

Run all tests:

```bash
npx playwright test
```

Or run one group:

```bash
npx playwright test tests/api
npx playwright test tests/contracts
npx playwright test tests/e2e
```

Generate and open an HTML report:

```bash
npx playwright test --reporter=html
npx playwright show-report
```

Tests for known bugs are in `tests/api/defects/` and use `test.fail(...)`. These tests are expected to fail while the bugs exist. A green test run does not mean the bugs are fixed. If one of these tests unexpectedly passes, Playwright marks it as a failure so it can be reviewed.

GitHub Actions runs the tests automatically. It starts Docker, waits for the API and runs Playwright. To run CI in your own repository, add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to GitHub Actions secrets.

To check application logs or stop the application:

```bash
docker compose logs api
docker compose down
```

## 3. Documents

- [Test Strategy](test_documents/TEST_STRATEGY.md)
- [Стратегія тестування (українською)](<test_documents/Стратегія тестування.md>)
- [Bug Reports](test_documents/BUG_REPORTS.md)
- [API documentation](API.md)
- [OpenAPI specification](openapi.yaml)

## 4. Stripe test cards

Use these cards only in Stripe test mode. Enter any future expiry date
and any three-digit CVC.

| Card number           | Scenario                          |
| --------------------- | --------------------------------- |
| `4242 4242 4242 4242` | Successful payment                |
| `4000 0000 0000 0002` | Card declined                     |
| `4000 0000 0000 9995` | Insufficient funds                |
| `4000 0027 6000 3184` | 3D Secure authentication required |

For direct API requests, use a test PaymentMethod ID in the
`payment_method` field instead of a card number:

| PaymentMethod                             | Scenario                          |
| ----------------------------------------- | --------------------------------- |
| `pm_card_visa`                            | Successful payment                |
| `pm_card_chargeDeclined`                  | Card declined                     |
| `pm_card_chargeDeclinedInsufficientFunds` | Insufficient funds                |
| `pm_card_threeDSecure2Required`           | 3D Secure authentication required |
