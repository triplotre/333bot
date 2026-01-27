export async function prima(m, { conn, isOwner }) {
    if (m.isGroup) return !1;
    if (m.fromMe) return !0;
    if (!m.message) return !0;

    const num = m.chat.split('@')[0];

    if (global.db.data.settings[conn.user.jid]?.antiprivato && !isOwner) {
        
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        try {
            await conn.updateBlockStatus(m.chat, 'block');
        } catch (e) {
            console.log(`${e.message}`);
        }
    }
    return !1;
}