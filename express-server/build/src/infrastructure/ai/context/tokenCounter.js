"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenCounter = exports.estimateMessageTokens = exports.countTokens = void 0;
function countTokens(text) {
    if (!text)
        return 0;
    return Math.ceil(text.length / 4);
}
exports.countTokens = countTokens;
function estimateMessageTokens(messages) {
    let count = 0;
    for (const m of messages) {
        count += 4 + countTokens(m.content);
    }
    return count;
}
exports.estimateMessageTokens = estimateMessageTokens;
class TokenCounter {
    static countTokens = countTokens;
    static estimateMessageTokens = estimateMessageTokens;
}
exports.TokenCounter = TokenCounter;
exports.default = TokenCounter;
