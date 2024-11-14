//
//  Helpers.swift
//  Pods
//
//  Created by revan toma on 2024-11-14.
//

public struct MotionActivity {
    public let walking: Bool
    public let running: Bool
    public let automotive: Bool
    public let stationary: Bool
    public let cycling: Bool
    public let unknown: Bool
    public let confidence: Int
    public let timestamp: Double

    // Public initializer
    public init(
        walking: Bool,
        running: Bool,
        automotive: Bool,
        stationary: Bool,
        cycling: Bool,
        unknown: Bool,
        confidence: Int,
        timestamp: Double
    ) {
        self.walking = walking
        self.running = running
        self.automotive = automotive
        self.stationary = stationary
        self.cycling = cycling
        self.unknown = unknown
        self.confidence = confidence
        self.timestamp = timestamp
    }

    // Convert MotionActivity to a dictionary for JavaScript
    public func toDictionary() -> [String: Any] {
        let confidenceString: String
        
        switch confidence {
            case 0:
                confidenceString = "low"
            case 1:
                confidenceString = "medium"
            case 2:
                confidenceString = "high"
            default:
                confidenceString = "unknown"
            }
        
        return [
            "walking": walking,
            "running": running,
            "automotive": automotive,
            "stationary": stationary,
            "cycling": cycling,
            "unknown": unknown,
            "confidence": confidenceString,
            "timestamp": timestamp
        ]
    }
}
