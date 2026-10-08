import { test } from '../../fixtures/base';

test('UA-FP-NEW-REQUEST-INVALIDATES-OLD-OTP Requesting a new Forgot Password OTP invalidates the earlier one', async () => {
  test.fixme(
    true,
    'Cannot be executed as designed: the dev team fixed the OTP to a static test value (STATIC_OTP) for every request, so a ' +
      '"first" and "second" request now issue the identical code and there is no real "older code" to invalidate. Ask the dev ' +
      'team whether the static test OTP is still single-use per request, or valid indefinitely; rewrite once confirmed.',
  );
});
