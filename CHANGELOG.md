# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased](https://github.com/global-121/121-platform/compare/v0.8.6...master)

### Added
- 2020-10-01: Added `NG_AI_IKEY` and `NG_AI_ENDPOINT` to `.env`-file of PA-App
- 2020-10-07: Added `PA_API_KEY` to `services/.env`

---

## [0.8.6](https://github.com/global-121/121-platform/compare/v0.8.5...v0.8.6) - 2020-09-30

### Changed
- 2020-09-30: Input-placeholder for phone-number question as FSP custom-data
- 2020-09-30: Update UI-text/program-questions for Kenya-pilot in seed-script

## [0.8.5](https://github.com/global-121/121-platform/compare/v0.8.4...v0.8.5) - 2020-09-30

### Changed
- 2020-09-30: Input-validation for phone-number/date questions
- 2020-09-30: Update UI-text/program-questions for Kenya-pilot in seed-script

## [0.8.4](https://github.com/global-121/121-platform/compare/v0.8.3...v0.8.4) - 2020-09-28

### Fixed
- 2020-09-28: Hotfix/Patch-Releases can now be deployed automatically (again) by `webhook.js`

## [0.8.3](https://github.com/global-121/121-platform/compare/v0.8.2...v0.8.3) - 2020-09-28

### Changed
- 2020-09-28: Update program-questions for Kenya-pilot in seed-script

## [0.8.2](https://github.com/global-121/121-platform/compare/v0.8.1...v0.8.2) - 2020-09-24

### Changed
- 2020-09-24: `deploy.sh` only builds/deploys interfaces defined with a `GLOBAL_121_*_DIR`-variable in [tools/.env](tools/.env.example).

### Security
- 2020-09-24: Re-enabled TypeORM-logging by running `121-service` and `PA-accounts-service` as user `root` instead of `node`.

## [0.8.1](https://github.com/global-121/121-platform/compare/v0.8.0...v0.8.1) - 2020-09-23

### Changed
- 2020-09-23: Disable TypeORM-logging to file because of node-permissions issue

## [0.8.0](https://github.com/global-121/121-platform/compare/v0.7.1...v0.8.0) - 2020-09-23

### Added
- 2020-08-19: Added `GLOBAL_121_REF_DIR` to `tools/.env`
- 2020-09-01: `GLOBAL_121_WEB_ROOT` now also used by `webhook.service`; Needs update + restart.
- 2020-09-09: Added `INTERSOLVE.username`, `INTERSOLVE.password`, `INTERSOLVE.ean`, `INTERSOLVE.url` in `121-service/src/secrets.ts`

### Changed
- 2020-08-19: Deploy script & apache2 conf changed, so possibly need to restart
- 2020-09-03: Corrected "Samburu" language-code, need to update `NG_LOCALES` value for PA-App.
- 2020-09-07: Add "Turkana" as language, need to update `NG_LOCALES` value for PA-App.
- 2020-09-08: Change `AFRICASTALKING.productName` in `121-service/src/secrets.ts` to appropriate value (KRCS-staging server only!)
- 2020-09-12: Changed `docker-compose/Dockerfile` set-up of 121-service and PA-accounts-service to use Node.js base-image
- 2020-09-23: Refactored `secrets.ts` and `ormconfig.json` into the central `services/.env`-file

### Removed
- 2020-09-01: Remove `VERSION`-env variable used by `webhook.service`; Needs update + restart.

---

## [0.7.2](https://github.com/global-121/121-platform/compare/v0.7.1...v0.7.2) - 2020-08-27

### Changed
- 2020-08-27: Update program-data for Kenya pilot environment + required fixes to display it correctly

## [0.7.1](https://github.com/global-121/121-platform/compare/v0.7.0...v0.7.1) - 2020-08-18
- 2020-08-18: Fixes for input-validation in both PA-app and AW-app

## [0.7.0](https://github.com/global-121/121-platform/compare/v0.6.3...v0.7.0) - 2020-08-18

### Added
- 2020-08-12: Added `AFRICASTALKING` API-key to `services/121-service/src/secrets.ts`
- 2020-08-11: Added `INTERSOLVE` API-key to `services/121-service/src/secrets.ts`

### Changed
- 2020-08-12: Changed languages `ny_MW`, `et_OM` by `sa_KE` and `la2_KE`

---

## [0.6.3](https://github.com/global-121/121-platform/compare/v0.6.2...v0.6.3) - 2020-08-05

### Changed
- 2020-08-05: Fixes for input-validation in both PA-app and AW-app

## [0.6.2](https://github.com/global-121/121-platform/compare/v0.6.1...v0.6.2) - 2020-08-04

### Added
- 2020-08-04: Added initial seed-script for Kenya pilot

## [0.6.1](https://github.com/global-121/121-platform/compare/v0.6.0...v0.6.1) - 2020-08-04
- 2020-08-04: Fixed a bug, which prevented correctly running the NL-seed script
- 2020-08-04: Changed URL from `staging.121.global` to `nlrc-staging.121.global` in `services/.env` & `interfaces/*/.env`

## [0.6.0](https://github.com/global-121/121-platform/compare/v0.5.0...v0.6.0) - 2020-08-04

### Changed
- 2020-07-21: Value of `NODE_ENV` on `Test-VM` is renamed from 'staging' to 'test', as there is now a separate `Staging-VM`, which uses the value 'staging'. This is both about `services/.env` and about the value in `webhook.service`.

---

## [0.5.0](https://github.com/global-121/121-platform/compare/v0.4.0...v0.5.0) - 2020-07-16

### Changed
- 2020-07-14: Moved `NODE_ENV` variable from respective `Dockerfile`s of 121-service and PA-accounts-service to `services/docker-compose.yml` and `services/.env`

### Removed
- 2020-07-07: Removed Android build of AW-App, including all Cordova dependencies
- 2020-07-08: Removed everything appointment-related from PA-app, AW-app and 121-service. The latter requires dropping the database (e.g. through `dropSchema: true` in `ormconfig.json`) before it's (automatically) recreated by restarting 121-service.

---

## [0.4.0](https://github.com/global-121/121-platform/compare/v0.3.1...v0.4.0) - 2020-06-16

### Changed
- 2020-06-09: Add `IPV4_121_SERVICE`, `PORT_121_SERVICE`, `SUBDOMAIN_121_SERVICE`, `EXTERNAL_121_SERVICE_URL`, `URL_PA_ACCOUNTS_SERVICE_API`, `IPV4_PA_ACCOUNTS_SERVICE` , `PORT_PA_ACCOUNTS_SERVICE`, `SUBDOMAIN_PA_ACCOUNTS_SERVICE` and `URL_121_SERVICE_API`  to `services/.env` AB#1965
- 2020-05-26 - Webhook in production-mode triggers deploy-script only once per published release

---

## [0.3.1](https://github.com/global-121/121-platform/compare/v0.3.0...v0.3.1) - 2020-05-26
Hotfix to add missing variable/parameter in AW-App validation-flow.


## [0.3.0](https://github.com/global-121/121-platform/compare/v0.2.1...v0.3.0) - 2020-05-26

### Added
- 2020-05-20: Add `RESET_SECRET` to `services/.env` AB#1921

### Changed
- 2020-05-20: Renamed `program-manager` to `project-officer` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1938
- 2020-05-20: Renamed `privacy-officer` to `program-manager` throughout code, and particularly in `services/121-service/src/secrets.ts` AB#1939

### Removed
- 2020-04-23: Remove `tools/secrets.json`, set `GITHUB_WEBHOOK_SECRET` in `webhook.service`

---

## [0.2.1](https://github.com/global-121/121-platform/compare/v0.2.0...v0.2.1) - 2020-04-22
Test hotfix-release to test automatic deployment of patch-releases.


## [0.2.0](https://github.com/global-121/121-platform/compare/v0.1.1...v0.2.0) - 2020-04-22

### Added
- 2020-04-22: Add `tools/.env`-file for `tools/deploy.sh`-script AB#1640

---

## [0.1.1](https://github.com/global-121/121-platform/compare/v0.1.0...v0.1.1) - 2020-04-21

### Fixed
- 2020-04-21: Fix playText-button disappears when switching to other language then english


## [0.1.0](https://github.com/global-121/121-platform/releases/tag/v0.1.0) - 2020-04-15

### Added
- 2020-04-08: Add `EXTERNAL_121_SERVICE_URL` to `services/.env`
- 2020-03-25: Add `NG_LOCALES` to `interfaces/PA-App/.env` AB#1680
- 2020-03-19: Add `NG_ALWAYS_SHOW_TEXT_PLAYER` to `interfaces/PA-App/.env` AB#823

### Removed
- 2020-03-11: Remove usernames from `services/121-service/src/secrets.ts` AB#1641

