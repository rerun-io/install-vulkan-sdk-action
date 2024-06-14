# Changelog

All changes to the project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
The date format in this file is YYYY-MM-DD.

## [Unreleased]

- Changed things.

## [1.0.4] - 2024-06-15

## Fixed

- Runtime Warning given while running with install_runtime: false, #416

## [1.0.3] - 2024-02-20

### Changed

- action: raised Node version to 20

## [1.0.2] - 2024-02-15

### Added

- action:
  - handle extraction of "tar.xz" archives, because archive type changed
    - "tar.xz" for all versions greater      1.3.261.1
    - "tar.gz" for all versions lesser/equal 1.3.250.1
- github workflows:
  - allow manual workflow triggering

### Changed

- devcontainer:
  - updated container image to node:21-bookworm-slim

## [1.0.1] - 2023-09-28

- added Changelog
- fixed "vulkan_version" to be not required and default to "latest" version
- improved docblocks

## [1.0.0] - 2023-09-25

- install and cache Vulkan SDK on Windows and Linux

## [0.9.0] - 2023-01-31

- first release
- conversion from bash and GHA action to a Typescript based action

<!-- Section for Reference Links -->

[Unreleased]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.4...HEAD
[1.0.4]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/jakoch/install-vulkan-sdk-action/releases/tag/v0.9.0
