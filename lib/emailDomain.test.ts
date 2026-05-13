import test from 'node:test';
import assert from 'node:assert/strict';
import { emailDomainMatchesWebsite, isDisposableEmail } from './emailDomain.ts';

test('emailDomainMatchesWebsite — exact match', () => {
  assert.equal(emailDomainMatchesWebsite('owner@ergoandmane.com.au', 'https://ergoandmane.com.au/'), true);
});

test('emailDomainMatchesWebsite — www prefix on website', () => {
  assert.equal(emailDomainMatchesWebsite('owner@ergoandmane.com.au', 'https://www.ergoandmane.com.au/'), true);
});

test('emailDomainMatchesWebsite — website subdomain of email apex', () => {
  assert.equal(emailDomainMatchesWebsite('owner@brand.com.au', 'https://book.brand.com.au'), true);
});

test('emailDomainMatchesWebsite — rejects .com vs .com.au mismatch', () => {
  assert.equal(emailDomainMatchesWebsite('owner@brand.com', 'https://brand.com.au'), false);
});

test('emailDomainMatchesWebsite — rejects gmail vs salon website', () => {
  assert.equal(emailDomainMatchesWebsite('owner@gmail.com', 'https://ergoandmane.com.au'), false);
});

test('emailDomainMatchesWebsite — null website returns false', () => {
  assert.equal(emailDomainMatchesWebsite('owner@example.com', null), false);
});

test('emailDomainMatchesWebsite — malformed email returns false', () => {
  assert.equal(emailDomainMatchesWebsite('not-an-email', 'https://example.com'), false);
});

test('emailDomainMatchesWebsite — website without protocol', () => {
  assert.equal(emailDomainMatchesWebsite('owner@example.com.au', 'example.com.au'), true);
});

test('isDisposableEmail — rejects mailinator', () => {
  assert.equal(isDisposableEmail('foo@mailinator.com'), true);
});

test('isDisposableEmail — accepts gmail', () => {
  assert.equal(isDisposableEmail('owner@gmail.com'), false);
});

test('isDisposableEmail — case-insensitive', () => {
  assert.equal(isDisposableEmail('Foo@MAILINATOR.com'), true);
});
