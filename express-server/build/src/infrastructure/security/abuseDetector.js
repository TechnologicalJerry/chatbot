"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAbuseDetector = exports.AbuseDetector = void 0;
var AbuseDetector = /** @class */ (function () {
    function AbuseDetector() {
        this.trackingMap = new Map();
        this.DECAY_MS = 10 * 60 * 1000; // 10 minutes score decay window
    }
    AbuseDetector.prototype.recordSignal = function (key, signal) {
        var now = Date.now();
        var track = this.trackingMap.get(key);
        if (!track) {
            track = { score: 0, lastUpdated: now };
        }
        else {
            // Decay score based on time passed
            var elapsed = now - track.lastUpdated;
            var decayFactor = Math.max(0, 1 - elapsed / this.DECAY_MS);
            track.score = track.score * decayFactor;
            track.lastUpdated = now;
        }
        // Add signal weight
        var weight = 1;
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
    };
    AbuseDetector.prototype.getStatus = function (key) {
        var track = this.trackingMap.get(key);
        if (!track)
            return { action: "allow", score: 0 };
        var elapsed = Date.now() - track.lastUpdated;
        var decayFactor = Math.max(0, 1 - elapsed / this.DECAY_MS);
        var score = track.score * decayFactor;
        if (score >= 25) {
            return { action: "block", score: score, reason: "Severe suspicious activity accumulated." };
        }
        else if (score >= 12) {
            return { action: "throttle", score: score, reason: "Moderate abuse score accumulated." };
        }
        return { action: "allow", score: score };
    };
    AbuseDetector.prototype.clearKey = function (key) {
        this.trackingMap.delete(key);
    };
    return AbuseDetector;
}());
exports.AbuseDetector = AbuseDetector;
exports.defaultAbuseDetector = new AbuseDetector();
