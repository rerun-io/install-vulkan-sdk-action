/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as platform from './platform'

/**
 * Install the Vulkan SDK.
 *
 * @export
 * @param {string} sdk_path - Path to the Vulkan SDK installer executable.
 * @param {string} destination - Installation destination path.
 * @param {string} version - Vulkan SDK version.
 * @param {string[]} optional_components - Array of optional components to install.
 * @return {*}  {Promise<string>} - Installation path.
 */
export async function installVulkanSdk(
  sdkPath: string,
  destination: string,
  version: string,
  optionalComponents: string[]
): Promise<string> {
  let installPath = ''

  core.info(`📦 Extracting Vulkan SDK...`)

  if (platform.IS_MAC) {
    // handle version dependend installation procedure change (dmg/zip)
    if (version <= '1.3.290.0') {
      // the sdk is a .dmg
      installPath = await installVulkanSdkMacDmg(sdkPath, destination, optionalComponents)
    } else {
      // the sdk is a .zip
      installPath = await installVulkanSdkMacZip(sdkPath, destination, optionalComponents)
    }
  } else if (platform.IS_LINUX) {
    // the archive extracts a "1.3.250.1" top-level dir
    installPath = await installVulkanSdkLinux(sdkPath, destination, optionalComponents)
  } else if (platform.IS_WINDOWS || platform.IS_WARM) {
    // changing the destination to a versionzed folder "C:\VulkanSDK\1.3.250.1"
    const versionizedDestinationPath = path.normalize(`${destination}/${version}`)
    installPath = await installVulkanSdkWindows(sdkPath, versionizedDestinationPath, optionalComponents)
  }

  core.info(`   Installed into folder: ${installPath}`)

  return installPath
}

/**
 * Install the Vulkan SDK on a Linux system.
 *
 * @export
 * @param {string} sdk_path - Path to the Vulkan SDK installer executable.
 * @param {string} destination - Installation destination path.
 * @param {string[]} optional_components - Array of optional components to install.
 * @return {*}  {Promise<string>} - Installation path.
 */
export async function installVulkanSdkLinux(
  sdkPath: string,
  destination: string,
  optionalComponents: string[]
): Promise<string> {
  const installPath = await extractArchive(sdkPath, destination)

  return installPath
}

/**
 * Install the Vulkan SDK on a MAC system (dmg).
 *
 * https://vulkan.lunarg.com/doc/sdk/1.4.304.0/mac/getting_started.html
 *
 * vulkan sdk was packaged as a .dmg (disk image) up to version 1.3.290.0.
 * vulkan sdk is packaged as a .zip since version 1.3.296.0.
 *
 * @export
 * @param {string} sdk_path - Path to the Vulkan SDK installer executable.
 * @param {string} destination - Installation destination path.
 * @param {string[]} optional_components - Array of optional components to install.
 * @return {*}  {Promise<string>} - Installation path.
 */
export async function installVulkanSdkMacDmg(
  sdkPath: string,
  destination: string,
  optionalComponents: string[]
): Promise<string> {

  // mount the dmg (disk image)
  const mountCmd = `hdiutil attach ${sdkPath}`
  core.debug(`Command: ${mountCmd}`)

  try {
    await execSync(mountCmd)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    } else {
      core.error('An unknown error occurred.')
    }
    core.setFailed(`Mounting the disk image failed.`)
  }

  // find the mounted volume
  const volumes = fs.readdirSync('/Volumes')
  let mountedVolume = ''
  for (const volume of volumes) {
    if (volume.includes('VulkanSDK')) {
      mountedVolume = volume
      break
    }
  }
  if (mountedVolume === '') {
    core.setFailed('Could not find the mounted volume.')
  }

  // copy the contents of the mounted volume to TEMP_DIR
  const copyCmd = `cp -R /Volumes/${mountedVolume}/* '${platform.TEMP_DIR}'`
  core.debug(`Command: ${copyCmd}`)
  try {
    await execSync(copyCmd)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    } else {
      core.error('An unknown error occurred.')
    }
    core.setFailed(`Copying the contents of the mounted volume to '${platform.TEMP_DIR}' failed.`)
  }

  // The full CLI command looks like:
  // sudo ./InstallVulkan.app/Contents/MacOS/InstallVulkan --root "installation path" --accept-licenses --default-answer --confirm-command install
  const cmdArgs = [
    '--root',
    destination,
    '--accept-licenses',
    '--default-answer',
    '--confirm-command',
    'install',
    ...optionalComponents
  ]
  const installerArgs = cmdArgs.join(' ')

  const runAsAdminCmd = `sudo ./'${platform.TEMP_DIR}'/InstallVulkan.app/Contents/MacOS/InstallVulkan '${installerArgs}'`

  core.debug(`Command: ${runAsAdminCmd}`)

  try {
    await execSync(runAsAdminCmd)
    //let stdout: string = execSync(run_as_admin_cmd, {stdio: 'inherit'}).toString().trim()
    //process.stdout.write(stdout)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    } else {
      core.error('An unknown error occurred.')
    }
    core.setFailed(`Installer failed. Arguments used: ${installerArgs}`)
  }

  return destination
}

/**
 * Install the Vulkan SDK on a MAC system (zip).
 *
 * https://vulkan.lunarg.com/doc/sdk/1.4.304.0/mac/getting_started.html
 *
 * vulkan sdk was packaged as a .dmg (disk image) up to version 1.3.290.0.
 * vulkan sdk is packaged as a .zip since version 1.3.296.0.
 *
 * @export
 * @param {string} sdk_path - Path to the Vulkan SDK installer executable.
 * @param {string} destination - Installation destination path.
 * @param {string[]} optional_components - Array of optional components to install.
 * @return {*}  {Promise<string>} - Installation path.
 */
export async function installVulkanSdkMacZip(
  sdkPath: string,
  destination: string,
  optionalComponents: string[]
): Promise<string> {

  // vulkan sdk is packaged as a .zip since version 1.3.296.0
  // extract the zip archive to /tmp
  await extractArchive(sdkPath, platform.TEMP_DIR)

  // The full CLI command looks like:
  // sudo ./InstallVulkan.app/Contents/MacOS/InstallVulkan --root "installation path" --accept-licenses --default-answer --confirm-command install
  const cmdArgs = [
    '--root',
    destination,
    '--accept-licenses',
    '--default-answer',
    '--confirm-command',
    'install',
    ...optionalComponents
  ]
  const installerArgs = cmdArgs.join(' ')

  const runAsAdminCmd = `sudo ./'${platform.TEMP_DIR}'/InstallVulkan.app/Contents/MacOS/InstallVulkan '${installerArgs}'`

  core.debug(`Command: ${runAsAdminCmd}`)

  try {
    await execSync(runAsAdminCmd)
    //let stdout: string = execSync(run_as_admin_cmd, {stdio: 'inherit'}).toString().trim()
    //process.stdout.write(stdout)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    } else {
      core.error('An unknown error occurred.')
    }
    core.setFailed(`Installer failed. Arguments used: ${installerArgs}`)
  }

  return destination
}

/**
 * Install the Vulkan SDK on a Windows system.
 *
 * @export
 * @param {string} sdk_path- Path to the Vulkan SDK installer executable.
 * @param {string} destination - Installation destination path.
 * @param {string[]} optional_components - Array of optional components to install.
 * @return {*}  {Promise<string>} - Installation path.
 */
export async function installVulkanSdkWindows(
  sdkPath: string,
  destination: string,
  optionalComponents: string[]
): Promise<string> {
  // Warning: The installation path cannot be relative, please specify an absolute path.
  // Changing the destination to a versionzed folder "C:\VulkanSDK\1.3.250.1"

  const cmdArgs = [
    '--root',
    destination,
    '--accept-licenses',
    '--default-answer',
    '--confirm-command',
    'install',
    ...optionalComponents
  ]
  const installerArgs = cmdArgs.join(' ')

  //
  // The full CLI command looks like:
  //
  // powershell.exe Start-Process
  //  -FilePath 'C:\Users\RUNNER~1\AppData\Local\Temp\VulkanSDK-Installer.exe'
  //  -Args '--root C:\VulkanSDK\1.3.250.1 --accept-licenses --default-answer --confirm-command install com.lunarg.vulkan.vma com.lunarg.vulkan.volk'
  //  -Verb RunAs
  //  -Wait
  //
  // Alternative: "$installer = Start-Process ... -PassThru" and "$installer.WaitForExit();"
  //
  // Important:
  // 1. The installer must be run as administrator.
  // 2. Keep the "-Wait", because the installer process needs to finish writing all files and folders before we can proceed.
  const runAsAdminCmd = `powershell.exe Start-Process -FilePath '${sdkPath}' -Args '${installerArgs}' -Verb RunAs -Wait`

  core.debug(`Command: ${runAsAdminCmd}`)

  try {
    await execSync(runAsAdminCmd)
    //let stdout: string = execSync(run_as_admin_cmd, {stdio: 'inherit'}).toString().trim()
    //process.stdout.write(stdout)
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
    } else {
      core.error('An unknown error occurred.')
    }
    core.setFailed(`Installer failed. Arguments used: ${installerArgs}`)
  }

  return destination
}

/**
 * Install the Vulkan Runtime
 *
 * @export
 * @param {string} runtime_path
 * @param {string} destination
 * @param {string} version
 * @return {*}  {Promise<string>}
 */
export async function installVulkanRuntime(runtimePath: string, destination: string, version: string): Promise<string> {
  /*
   Problem: extracting the zip would create a top-level folder,
   e.g.  "C:\VulkanSDK\runtime\VulkanRT-1.3.250.1-Components\".
   So, let's extract the contents of the ZIP archive to a temporary directory,
   and then copy the contents of the top-level folder within the temp dir
   to the runtime_destination without the top-level folder itself.
   Goal is to have: C:\VulkanSDK\runtime\x64\vulkan-1.dll
  */
  core.info(`📦 Extracting Vulkan Runtime (➔ vulkan-1.dll) ...`)
  // install into temp
  const tempInstallPath = path.normalize(`${platform.TEMP_DIR}/vulkan-runtime`) // C:\Users\RUNNER~1\AppData\Local\Temp\vulkan-runtime
  await extractArchive(runtimePath, tempInstallPath)
  await wait(3000) // wait/block for 3sec for files to arrive. ugly hack.
  // copy from temp to destination
  const topLevelFolder = fs.readdirSync(tempInstallPath)[0] // VulkanRT-1.3.250.1-Components
  const tempTopLevelFolderPath = path.join(tempInstallPath, topLevelFolder) // C:\Users\RUNNER~1\AppData\Local\Temp\vulkan-runtime\VulkanRT-1.3.250.1-Components
  const installPath = path.normalize(`${destination}/${version}/runtime`) // C:\VulkanSDK\1.3.250.1\runtime
  copyFolder(tempTopLevelFolderPath, installPath)
  fs.rmSync(tempInstallPath, { recursive: true })
  core.info(`   Installed into folder: ${installPath}`)
  return installPath
}

/**
 * Extracts an archive file to a specified destination based on the platform and file type.
 *
 * @param {string} file - The path to the archive file to be extracted.
 * @param {string} destination - The destination directory where the archive contents will be extracted.
 * @return {*}  {Promise<string>} A Promise that resolves to the destination directory path after extraction.
 */
async function extractArchive(file: string, destination: string): Promise<string> {
  const flags: string[] = []

  let extract: (
    file: string,
    destination: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    flags: string[]
  ) => Promise<string> = (file, destination, flags) => {
    throw new Error('Extraction function is not properly assigned.')
  }

  if (platform.IS_WINDOWS || platform.IS_WARM) {
    if (file.endsWith('.exe')) {
      // No extraction needed for .exe files
      return destination
    } else if (file.endsWith('.zip')) {
      extract = (file, destination) => tc.extractZip(file, destination)
    } else if (file.endsWith('.7z')) {
      extract = (file, destination) => tc.extract7z(file, destination)
    }
  } else if (platform.IS_MAC) {
    extract = (file, destination) => tc.extractXar(file, destination)
  } else if (platform.IS_LINUX) {
    if (file.endsWith('.tar.gz')) {
      // extractTar defaults to 'xz' (extracting gzipped tars).
      extract = (file, destination) => tc.extractTar(file, destination)
    } else if (file.endsWith('.tar.xz')) {
      // https://www.man7.org/linux/man-pages/man1/tar.1.html
      // -J or --xz = filter archive through xz
      // -x for extract
      // note: ".tar.bz2" is "-xj"
      flags.push('-xJ')
      extract = (file, destination, flags) => tc.extractTar(file, destination, flags)
    }
  }

  return await extract(file, destination, flags)
}

/**
 * Verify the installation of the SDK.
 *
 * @export
 * @param {string} sdk_install_path - The installation path of the Vulkan SDK, e.g. "C:\VulkanSDK\1.3.250.1".
 * @return {*}  {boolean}
 */
export function verifyInstallationOfSdk(sdkInstallPath: string): boolean {
  let r = false
  let file = `${sdkInstallPath}/bin/vulkaninfo`
  if (platform.IS_LINUX || platform.IS_MAC) {
    file = `${sdkInstallPath}/x86_64/bin/vulkaninfo`
  }
  if (platform.IS_WINDOWS || platform.IS_WARM) {
    file = path.normalize(`${sdkInstallPath}/bin/vulkaninfoSDK.exe`)
  }
  r = fs.existsSync(file)

  // If the "vulkaninfo" tool exists, execute "vulkaninfo --summary".
  // Wrap the output of the summary in a collapsible section in the workflow logs.
  /*if (r) {
    core.startGroup(`Vulkan Info Summary`)
    const run_vulkaninfo = `${file} --summary`
    execSync(run_vulkaninfo)
    core.endGroup()
  }*/

  return r
}

/**
 * Verify the installation of the Vulkan Runtime.
 *
 * @export
 * @param {string} sdk_install_path - The installation path of the Vulkan SDK, e.g. "C:\VulkanSDK\1.3.250.1".
 * @return {*}  {boolean}
 */
export function verifyInstallationOfRuntime(sdkInstallPath: string): boolean {
  let r = false
  if (platform.IS_WINDOWS || platform.IS_WARM) {
    const file = `${sdkInstallPath}/runtime/x64/vulkan-1.dll`
    r = fs.existsSync(file)
  }
  return r
}

/**
 * Stripdown the installation of the Vulkan SDK (only windows).
 * This reduces the size of the SDK before caching.
 * It removes superflous files given the CI context this action runs in,
 * e.g. removing demos and removing the maintainance-tool.exe.
 *
 * @export
 * @param {string} sdk_install_path - The installation path of the Vulkan SDK, e.g. "C:\VulkanSDK\1.3.250.1".
 */
export function stripdownInstallationOfSdk(sdkInstallPath: string): void {
  if (platform.IS_WINDOWS || platform.IS_WARM) {
    core.info(`✂ Reducing Vulkan SDK size before caching`)
    let foldersToDelete: string[] = []
    foldersToDelete = [
      `${sdkInstallPath}\\Demos`,
      `${sdkInstallPath}\\Helpers`,
      `${sdkInstallPath}\\installerResources`,
      `${sdkInstallPath}\\Licenses`,
      `${sdkInstallPath}\\Templates`
      // old installers had
      //`${sdk_install_path}\\Bin32`,
      //`${sdk_install_path}\\Tools32`,
      //`${sdk_install_path}\\Lib32`,
    ]
    removeFoldersIfExist(foldersToDelete)

    // this deletes the files in the top-level folder
    // e.g. maintenancetool.exe, installer.dat, network.xml
    // which saves around ~25MB
    deleteFilesInFolder(sdkInstallPath)
  }
}
/**
 * Remove one folder, if existing.
 *
 * @param {string} folder - The folder to remove.
 * @return {*}  {boolean}
 */
function removeFolderIfExists(folder: string): boolean {
  try {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true })
      core.info(`Deleted folder: ${folder}`)
      return true
    } else {
      core.info(`Folder ${folder} doesn't exist.`)
    }
  } catch (error) {
    console.error(`Error removing folder: ${error}`)
  }

  return false
}
/**
 * Remove multiple folders, if existing.
 *
 * @param {string[]} folders - The folders to remove.
 */
function removeFoldersIfExist(folders: string[]): void {
  for (const folder of folders) {
    removeFolderIfExists(folder)
  }
}

function deleteFilesInFolder(folder: string): void {
  for (const file of fs.readdirSync(folder)) {
    const filePath = path.join(folder, file)
    if (fs.statSync(filePath).isDirectory()) {
      // biome-ignore lint/correctness/noUnnecessaryContinue: If subdirectory, skip it
      continue
    } else {
      // If file, delete it
      fs.unlinkSync(filePath)
      core.info(`Deleted file: ${filePath}`)
    }
  }
}
/**
 * Copy a folder.
 *
 * @param {string} from
 * @param {string} to
 */
function copyFolder(from: string, to: string) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true })
  }
  for (const element of fs.readdirSync(from)) {
    if (fs.lstatSync(path.join(from, element)).isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element))
    } else {
      copyFolder(path.join(from, element), path.join(to, element))
    }
  }
}
/**
 * Wait a bit...
 *
 * @param {number} [timeout=2000]
 * @return {*}
 */
function wait(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
