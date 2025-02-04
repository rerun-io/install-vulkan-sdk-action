/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as core from '@actions/core'
import * as path from 'node:path'
import * as platform from './platform'
import * as versionsVulkan from './versions_vulkan'

/**
 * List of available Input arguments
 *
 * @export
 * @interface Inputs
 */
export interface Inputs {
  version: string
  destination: string
  installRuntime: boolean
  useCache: boolean
  optionalComponents: string[]
  stripdown: boolean
}

/**
 * Handles the incomming arguments for the action.
 *
 * If an input argument requires validation beyond a simple boolean check,
 * individual getter functions are used for incoming argument validation.
 *
 * @export
 * @return {*}  {Promise<Inputs>}
 */
export async function getInputs(): Promise<Inputs> {
  return {
    // Warning: This is intentionally "vulkan_version" to avoid unexpected behavior due to naming conflicts.
    // Do not simply use "version", because if "with: version:" is not set (default to latest is wanted),
    // but an environment variable is defined, that will be used (version = env.VERSION)
    // VERSION is often set to env for artifact names.
    version: await getInputVersion(core.getInput('vulkan_version', { required: false })),
    destination: await getInputDestination(core.getInput('destination', { required: false })),
    installRuntime: /true/i.test(core.getInput('install_runtime', { required: false })),
    useCache: /true/i.test(core.getInput('cache', { required: false })),
    optionalComponents: await getInputOptionalComponents(core.getInput('optional_components', { required: false })),
    stripdown: /true/i.test(core.getInput('stripdown', { required: false }))
  }
}

/**
 * GetInputVersion validates the "version" argument.
 * If "vulkan_version" was not set or is empty, assume "latest" version.
 *
 * @export
 * @param {string} requested_version
 * @return {*}  {Promise<string>}
 */
export async function getInputVersion(requestedVersion: string): Promise<string> {
  // if "vulkan_version" was not set or is empty, assume "latest" version
  if (requestedVersion === '') {
    requestedVersion = 'latest'
    return requestedVersion
  }

  // throw error, if requestedVersion is a crappy version number
  if (!requestedVersion && !validateVersion(requestedVersion)) {
    const availableVersions = await versionsVulkan.getAvailableVersions()
    const versions = JSON.stringify(availableVersions, null, 2)

    throw new Error(
      `Invalid format of "vulkan_version: (${requestedVersion}").
       Please specify a version using the format 'major.minor.build.rev'.
       The following versions are available: ${versions}.`
    )
  }

  return requestedVersion
}

/**
 * Validates a version number to conform with the
 * "major.minor.patch.revision" ("1.2.3.4") versioning scheme.
 *
 * @export
 * @param {string} version
 * @return {*}  {boolean}
 */
export function validateVersion(version: string): boolean {
  const re = /^\d+\.\d+\.\d+\.\d+$/
  return re.test(version)
}

/**
 * getInputDestination validates the "destination" argument.
 *
 * @param {string} destination
 * @return {string} string
 */
export function getInputDestination(destination: string): string {
  // return default install locations for platform
  if (!destination || destination === '') {
    if (platform.IS_WINDOWS || platform.IS_WINDOWS_ARM) {
      destination = `C:\\VulkanSDK\\`
    }
    // The .tar.gz file extracts the SDK into a versionized directory of the form 1.x.y.z.
    // The official docs install into the "~" ($HOME) folder.
    if (platform.IS_LINUX) {
      destination = `${platform.HOME_DIR}/vulkan-sdk`
    }
    // The macOS SDK is intended to be installed anywhere the user can place files such as the user's $HOME directory.
    if (platform.IS_MAC) {
      destination = `${platform.HOME_DIR}/vulkan-sdk`
    }
  }

  destination = path.normalize(destination)

  core.info(`Destination: ${destination}`)

  return destination
}

/**
 * getInputOptionalComponents validates the "optional_components" argument.
 *
 * https://vulkan.lunarg.com/doc/view/latest/windows/getting_started.html#user-content-installing-optional-components
 * list components on windows: "maintenancetool.exe list" or "installer.exe search"
 *
 * @export
 * @param {string} optional_components
 * @return {*}  {string[]}
 */
export function getInputOptionalComponents(optionalComponents: string): string[] {
  if (!optionalComponents) {
    return []
  }

  const optionalComponentsAllowlist: string[] = [
    'com.lunarg.vulkan.32bit',
    'com.lunarg.vulkan.sdl2',
    'com.lunarg.vulkan.glm',
    'com.lunarg.vulkan.volk',
    'com.lunarg.vulkan.vma',
    'com.lunarg.vulkan.debug32',
    // components of old installers
    'com.lunarg.vulkan.thirdparty',
    'com.lunarg.vulkan.debug'
  ]

  const inputComponents: string[] = optionalComponents
    .split(',')
    .map((item: string) => item.trim())
    .filter(Boolean)

  const invalidInputComponents: string[] = inputComponents.filter(
    item => optionalComponentsAllowlist.includes(item) === false
  )
  if (invalidInputComponents.length) {
    core.info(`❌ Please remove the following invalid optional_components: ${invalidInputComponents}`)
  }

  const validInputComponents: string[] = inputComponents.filter(
    item => optionalComponentsAllowlist.includes(item) === true
  )
  if (validInputComponents.length) {
    core.info(`✔️ Installing Optional Components: ${validInputComponents}`)
  }

  return validInputComponents
}
