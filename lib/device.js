/**
 * Rileva il dispositivo dal quale è stato inviato il messaggio
 * basandosi sulla struttura dell'ID del messaggio di Baileys.
 * @param {string} id - L'ID del messaggio (m.key.id)
 * @returns {string} - 'android', 'ios', 'web', 'desktop' o 'unknown'
 */
export function detectDevice(id) {
    if (!id) return 'unknown'
    if (id.length === 16) return 'android'
    if (id.startsWith('3EB0') && id.length === 12) return 'web'
    if (id.startsWith('3EB0')) return 'web'
    if (id.startsWith('BAE5') && id.length === 16) return 'ios'
    if (id.length === 20) return 'ios'
    if (id.length === 22) return 'android'
    if (id.length === 32) return 'desktop'
    return 'unknown'
}