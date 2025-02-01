/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2025 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

import * as core from '@actions/core'
import * as httpm from '@actions/http-client'

export const client: httpm.HttpClient = new httpm.HttpClient('install-vulkan-sdk-action', [], {
  keepAlive: false,
  allowRedirects: true,
  maxRedirects: 3
})

/**
 * is_downloadable checks, if an URL returns HTTP Status Code 200.
 * Otherwise, the action will fail.
 *
 * @param {string} name - The nice name.
 * @param {string} version - The version of the download.
 * @param {string} url - The URL.
 */
export async function isDownloadable(name: string, version: string, url: string): Promise<void> {
  try {
    const HttpClientResponse = await client.head(url)
    const statusCode = HttpClientResponse.message.statusCode
    if (statusCode !== undefined) {
      if (statusCode >= 400) {
        core.setFailed(`❌ Http(Error): The requested ${name} ${version} is not downloadable using URL: ${url}.`)
      }
      if (statusCode === 200) {
        core.info(`✔️ Http(200): The requested ${name} ${version} is downloadable.`)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
