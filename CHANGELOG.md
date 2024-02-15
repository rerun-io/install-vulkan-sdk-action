# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Changed things.

## [1.0.2] - 02-15-2024

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

## [1.0.1] - 09-28-2023

- added Changelog
- fixed "vulkan_version" to be not required and default to "latest" version
- improved docblocks

## [1.0.0] - 09-26-2023

- install and cache Vulkan SDK on Windows and Linux

## [0.9.0] - 01-31-2023

- first release
- conversion from bash and GHA action to a Typescript based action

<!-- Section for Reference Links -->

[Unreleased]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/jakoch/install-vulkan-sdk-action/compare/v0.9.0...v1.0.0
[0.9.0]: https://github.com/jakoch/install-vulkan-sdk-action/releases/tag/v0.9.0
