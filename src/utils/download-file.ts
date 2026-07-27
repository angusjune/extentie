/**
 * Saves text as a file through the browser's download flow.
 */
export function downloadTextFile(filename: string, text: string, type = 'application/json') {
    const url = URL.createObjectURL(new Blob([text], { type }))

    const link = document.createElement('a')
    link.href = url
    link.download = filename

    document.body.appendChild(link)
    link.click()
    link.remove()

    // Revoking straight away can cancel a download that has not started yet.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
