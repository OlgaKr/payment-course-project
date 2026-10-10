import { expect } from '@playwright/test';
import Ajv, { AnySchema } from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

export function expectSchema(body: unknown, schema: AnySchema) {
  const validate = ajv.compile(schema);
  const isValid = validate(body);

  expect(isValid, JSON.stringify(validate.errors, null, 2)).toBe(true);
}
