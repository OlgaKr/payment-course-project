# Test Strategy

**Project:** Merchant Payment Service QA  
**Test stack:** Playwright, TypeScript, Ajv and JSON Schema  
**Environment:** Docker, PostgreSQL and Stripe test mode

## 1. What was tested and why

Testing focused on payment creation, retrieval and listing, capture, refunds, webhooks, input validation, API response contracts and the main checkout UI flow.

The backend API received the most attention because it exposes the core payment logic and directly affects financial state. Coverage includes successful payment scenarios, declined payments, invalid input, boundary and edge cases, manual capture, full and partial refunds, and idempotency behavior.

Capture and refund scenarios include cases where Stripe rejects an operation. These checks are important because the local service must not report a successful financial operation when the provider has rejected it. Database state was inspected where needed to verify payment, refund and webhook behavior.

Webhook checks focus on signature validation and duplicate event handling. Since events can change payment state asynchronously, forged or repeatedly processed events can produce incorrect statuses or duplicate business effects.

API response schemas and the main checkout flow were also tested to cover contract stability and frontend/backend integration. Detailed business-rule checks were concentrated at the API level, where failures are easier to isolate.

## 2. Types of tests

- **Manual exploratory testing:** Used to investigate payment behavior, examine API responses and database state, and document reproducible defects with justified severity.
- **API integration tests:** Written with Playwright and TypeScript to exercise HTTP endpoints and verify the service's integration with Stripe and PostgreSQL. This level provides the main coverage of payment flows, validation, error handling and state consistency.
- **Contract tests:** Use Ajv and JSON Schemas stored alongside the tests to validate response structures, required fields and data types. They help detect unexpected API response changes.
- **E2E tests:** Use Playwright and Page Object Model to verify the main checkout flow through the browser and confirm that the frontend and backend work together.

Automated tests run locally and through GitHub Actions. CI starts the Docker environment, waits for the health endpoint and runs the Playwright suite. Known-defect tests use `test.fail(...)` to record expected failures. A successful CI run therefore does not mean that all reported defects have been fixed; these tests must be reviewed when application behavior changes.

## 3. Covered risks

- **Duplicate payment processing:** Repeated creation requests and duplicate webhook events are checked for idempotency to detect duplicate records or business effects.
- **Incorrect financial amounts:** Capture validation, overcapture, null capture amounts and partial refund behavior are checked to detect invalid or inconsistent amounts.
- **False financial success:** Failed capture and refund scenarios check whether the local service incorrectly records success after Stripe rejects an operation.
- **Incorrect payment state:** Payment lifecycle checks examine statuses and stored state during creation, capture, refunds and failures.
- **Security and data integrity:** Webhook signature checks address forged events; client-secret exposure is covered by a dedicated defect test. These are targeted security checks, not a comprehensive security audit.
- **Invalid input and API instability:** Validation and pagination edge cases check error handling, while JSON Schema validation checks response structure and data types.
- **UI integration failures:** Checkout E2E tests check the main customer flow across the frontend and backend.

These risks are addressed by the test coverage, but remain unresolved wherever the tests reproduce an open defect.

## 4. Out of scope

- **Unit testing:** The application is provided as a Docker black box without access to its source code, so internal functions and modules are not tested directly.
- **Stripe internals:** Stripe is treated as an external provider. Testing focuses on the Merchant Payment Service's integration behavior and handling of provider responses and events.
- **Performance and load testing:** Capacity, throughput and scalability testing are outside this project's functional testing scope.
- **Broad browser and UI coverage:** UI automation focuses on the main checkout flow; a comprehensive cross-browser matrix and exhaustive UI checks are not included.
- **Production payments:** All payment scenarios use Stripe test mode and test data. Real cards and real funds are outside the scope.
- **Comprehensive security and compliance assessment:** Penetration testing and formal PCI DSS compliance validation are not included.
- **Infrastructure and database administration:** Deployment resilience, backups and database administration are excluded. Database inspection is used only to support functional verification.
