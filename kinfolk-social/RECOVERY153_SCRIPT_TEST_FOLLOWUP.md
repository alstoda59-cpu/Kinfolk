# Recovery153 script-detection test follow-up

Reviewed native/scripts/prepare-web.mjs and test_native_script_detection.js on Recovery153. Commit f1ddcf9188cfb100753a0b0a037864161bb0d30e removes a brittle secondary regular-expression assertion from the test. The actual detector regex was evaluated against three synthetic HTML script variants (defer before src, single-quoted src, and type before src); all three module paths were detected as expected.

This isolated evaluation is not a full Node test run. GitHub Actions and native Android/iOS builds remain unverified. No backend, production or Kinfolksworld mutations. Previous preview dpl_7LpbhHRyHepFXh65fwmPtdFnSPRQ READY; this test-only commit was not separately deployed.
