"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAbuseDetector = exports.AbuseDetector = void 0;
class AbuseDetector {
    trackingMap = new Map();
    DECAY_MS = 10 * 60 * 1000; // 10 minutes score decay window
    recordSignal(key, signal) {
        const now = Date.now();
        let track = this.trackingMap.get(key);
        if (!track) {
            track = { score: 0, lastUpdated: now };
        }
        else {
            // Decay score based on time passed
            const elapsed = now - track.lastUpdated;
            const decayFactor = Math.max(0, 1 - elapsed / this.DECAY_MS);
            track.score = track.score * decayFactor;
            track.lastUpdated = now;
        }
        // Add signal weight
        let weight = 1;
        switch (signal) {
            case "AUTH_FAILURE":
                weight = 5;
                break;
            case "RATE_LIMIT_TRIPPED":
                weight = 3;
                break;
            case "QUOTA_EXCEEDED":
                weight = 4;
                break;
            case "TOOL_ERROR":
                weight = 2;
                break;
            case "PAYLOAD_OVERSIZED":
                weight = 4;
                break;
        }
        track.score += weight;
        this.trackingMap.set(key, track);
        if (track.score >= 25) {
            return { action: "block", score: track.score, reason: "Severe suspicious activity accumulated." };
        }
        else if (track.score >= 12) {
            return { action: "throttle", score: track.score, reason: "Moderate abuse score accumulated." };
        }
        return { action: "allow", score: track.score };
    }
    getStatus(key) {
        const track = this.trackingMap.get(key);
        if (!track)
            return { action: "allow", score: 0 };
        const elapsed = Date.now() - track.lastUpdated;
        const decayFactor = Math.max(0, 1 - elapsed / this.DECAY_MS);
        const score = track.score * decayFactor;
        if (score >= 25) {
            return { action: "block", score, reason: "Severe suspicious activity accumulated." };
        }
        else if (score >= 12) {
            return { action: "throttle", score, reason: "Moderate abuse score accumulated." };
        }
        return { action: "allow", score };
    }
    clearKey(key) {
        this.trackingMap.delete(key);
    }
}
exports.AbuseDetector = AbuseDetector;
exports.defaultAbuseDetector = new AbuseDetector();
