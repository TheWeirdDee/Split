## Description
<!-- What does this PR do? Why is it needed? -->

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] UI/UX improvement
- [ ] Performance improvement

## Testing
- [ ] Tested in MiniPay browser (required for all UI changes)
- [ ] Tested on desktop MetaMask
- [ ] No mock features — all functionality works with real wallet

## MiniPay Checklist
- [ ] No `window.alert()` or `window.confirm()` calls added
- [ ] All buttons have `touchAction: 'manipulation'` or `touch-action: manipulation`
- [ ] Share functionality uses `navigator.share()` with fallback
- [ ] No `wallet_requestPermissions` calls when `isMiniPay` is true

## cUSD Volume
- [ ] This change involves a cUSD transaction (if yes, tested end-to-end)
- [ ] N/A — no transaction involved

## Screenshots
<!-- Add screenshots or screen recordings for UI changes -->

## Related Issues
<!-- Link any related issues: Closes #123 -->
