
/**
 * Simple markdown parser for email content.
 * Supports:
 * - **bold** -> <strong>bold</strong>
 * - *italic* -> <em>italic</em>
 * - _italic_ -> <em>italic</em>
 * - __underline__ -> <u>underline</u>
 */
export function parseSimpleMarkdown(text: string): string {
    if (!text) return '';
    
    return text
        // Bold: **text**
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        // Italic: *text* (must be done after bold to avoid conflict)
        .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
        // Italic: _text_ (must be done after underline check if we were strictly parsing, but here _ is distinct from __ so order matters less if regex is precise, but typically __ matches first)
        // Underline: __text__
        .replace(/__(.+?)__/g, '<u>$1</u>')
        // Italic: _text_ (handle simple underscores now that double underscores are handled)
        .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em>$1</em>');
}
