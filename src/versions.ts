/*---------------------------------------------------------------------------------------------
 *  SPDX-FileCopyrightText: 2021-2024 Jens A. Koch
 *  SPDX-License-Identifier: MIT
 *--------------------------------------------------------------------------------------------*/

/**
 * Compare two version numbers.
 *
 * @param {string} ver1 - The first version number string.
 * @param {string} ver2 - The second version number string.
 * @returns {number} Returns -1 if ver1 is less than ver2, 1 if ver1 is greater than ver2, or 0 if they are equal.
 */
export function compare(v1: string, v2: string): number {
  // remove dots and handle strings as integers
  const intV1 = Number.parseInt(v1.replace(/\./g, ''))
  const intV2 = Number.parseInt(v2.replace(/\./g, ''))

  // compare the integers
  if (intV1 < intV2) {
    return -1
  } else if (intV1 > intV2) {
    return 1
  } else {
    return 0
  }
}
