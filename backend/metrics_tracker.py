# metrics_tracker.py
import time


class MetricsTracker:
    def __init__(self):
        self.detection_latencies = []
        self.packets_blocked = 0
        self.attacks_detected = 0
        self.normal_traffic = 0
        self.start_time = time.time()

    def record_detection(self, is_attack, latency_ms):
        """Record each detection"""
        self.detection_latencies.append(latency_ms)
        if is_attack:
            self.attacks_detected += 1
        else:
            self.normal_traffic += 1

    def record_blocked_packet(self):
        """Record packet being blocked"""
        self.packets_blocked += 1

    def get_summary(self):
        """Return metrics summary"""
        total = self.attacks_detected + self.normal_traffic + self.packets_blocked
        
        if not self.detection_latencies:
            return {
                "total_packets_processed": total,
                "attacks_detected": self.attacks_detected,
                "normal_traffic": self.normal_traffic,
                "packets_blocked": self.packets_blocked,
                "avg_detection_latency_ms": 0,
                "min_latency_ms": 0,
                "max_latency_ms": 0,
                "uptime_seconds": round(time.time() - self.start_time, 2)
            }

        return {
            "total_packets_processed": total,
            "attacks_detected": self.attacks_detected,
            "normal_traffic": self.normal_traffic,
            "packets_blocked": self.packets_blocked,
            "avg_detection_latency_ms": round(sum(self.detection_latencies) / len(self.detection_latencies), 2),
            "min_latency_ms": round(min(self.detection_latencies), 2),
            "max_latency_ms": round(max(self.detection_latencies), 2),
            "uptime_seconds": round(time.time() - self.start_time, 2)
        }


metrics = MetricsTracker()
