/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as core from '@actions/core'
import * as tc from '@actions/tool-cache' // https://github.com/actions/toolkit/tree/main/packages/tool-cache
import * as path from 'node:path'
import * as http from './http'
import * as platform from './platform'
import * as versions from './versions'

/**
 * Get download url for Vulkan SDK.
 *
 * @export
 * @param {string} version - The SDK version to download.
 * @return {*}  {Promise<string>} Returns the download url.
 */
export async function getUrlVulkanSdk(version: string): Promise<string> {
  const platformName = platform.getPlatform() // For download urls see https://vulkan.lunarg.com/sdk/home

  // Windows:
  // Latest Version: https://sdk.lunarg.com/sdk/download/latest/windows/vulkan-sdk.exe
  // Versionized:    https://sdk.lunarg.com/sdk/download/1.3.216.0/windows/VulkanSDK-1.3.216.0-Installer.exe
  //
  // Warm (Windows ARM64):
  // Latest Version: https://sdk.lunarg.com/sdk/download/latest/warm/ ???
  // Versionized:    https://sdk.lunarg.com/sdk/download/1.4.304.0/warm/InstallVulkanARM64-1.4.304.0.exe

  const downloadBaseUrl = `https://sdk.lunarg.com/sdk/download/${version}/${platformName}`

  let vulkanSdkUrl = ''

  if (platform.IS_WINDOWS) {
    vulkanSdkUrl = `${downloadBaseUrl}/VulkanSDK-${version}-Installer.exe`
  }
  if (platform.IS_WARM) {
    vulkanSdkUrl = `${downloadBaseUrl}/InstallVulkanARM64-${version}.exe`
  }
  if (platform.IS_LINUX) {
    // For versions up to 1.3.250.1 the ending is ".tar.gz".
    // For versions after 1.3.250.1 the ending is ".tar.xz".
    let extension = 'tar.gz'
    if (1 === versions.compare(version, '1.3.250.1')) {
      extension = 'tar.xz'
    }
    vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-linux-x86_64-${version}.${extension}`
  }
  if (platform.IS_MAC) {
    vulkanSdkUrl = `${downloadBaseUrl}/vulkansdk-macos-${version}.dmg`
  }

  await http.isDownloadable('VULKAN_SDK', version, vulkanSdkUrl)

  return vulkanSdkUrl
}

/**
 * Get download url for Vulkan Runtime.
 *
 * Windows:
 * Latest Version:  https://sdk.lunarg.com/sdk/download/latest/windows/vulkan-runtime-components.zip
 * Versionized:     https://sdk.lunarg.com/sdk/download/1.3.216.0/windows/VulkanRT-1.3.216.0-Components.zip
 *
 * @export
 * @param {string} version - The runtime version to download.
 * @return {*}  {Promise<string>} Returns the download url.
 */
export async function getUrlVulkanRuntime(version: string): Promise<string> {
  const vulkanRuntimeUrl = `https://sdk.lunarg.com/sdk/download/${version}/windows/vulkan-runtime-components.zip`
  await http.isDownloadable('VULKAN_RUNTIME', version, vulkanRuntimeUrl)
  return vulkanRuntimeUrl
}

/**
 * Download Vulkan SDK.
 *
 * @export
 * @param {string} version - The version to download.
 * @return {*}  {Promise<string>} Download location.
 */
export async function downloadVulkanSdk(version: string): Promise<string> {
  core.info(`🔽 Downloading Vulkan SDK ${version}`)
  const url = await getUrlVulkanSdk(version)
  core.info(`    URL: ${url}`)
  const sdkPath = await tc.downloadTool(url, path.join(platform.TEMP_DIR, getVulkanSdkFilename(version)))
  core.info(`✔️ Download completed successfully!`)
  core.info(`   File: ${sdkPath}`)
  return sdkPath
}

/**
 * Download Vulkan Runtime (Windows only).
 *
 * @export
 * @param {string} version - The version to download.
 * @return {*}  {Promise<string>} Download location.
 */
export async function downloadVulkanRuntime(version: string): Promise<string> {
  core.info(`🔽 Downloading Vulkan Runtime ${version}`)
  const url = await getUrlVulkanRuntime(version)
  core.info(`   URL: ${url}`)
  const runtimePath = await tc.downloadTool(url, path.join(platform.TEMP_DIR, `vulkan-runtime-components.zip`))
  core.info(`✔️ Download completed successfully!`)
  core.info(`    File: ${runtimePath}`)
  return runtimePath
}

/**
 * Returns the platform-based name for the Vulkan SDK archive or installer.
 *
 * @export
 * @param {string} version- The vulkan sdk version number string.
 * @return {*}  {string} Platform-based name for the Vulkan SDK archive or installer.
 */
export function getVulkanSdkFilename(version: string): string {
  if (platform.IS_WINDOWS) {
    return `VulkanSDK-Installer.exe`
  }
  if (platform.IS_LINUX) {
    // For versions up to 1.3.250.1 the ending is ".tar.gz".
    // For versions after 1.3.250.1 the ending is ".tar.xz".
    let filename = `vulkansdk-linux-x86_64.tar.gz`
    if (1 === versions.compare(version, '1.3.250.1')) {
      filename = `vulkansdk-linux-x86_64.tar.xz`
    }
    return filename
  }
  if (platform.IS_MAC) {
    return `vulkansdk-macos.dmg`
  }
  return 'not-implemented-for-platform'
}
