import time


class MetricsTracker:
    def __init__(self):
        self.detection_latencies = []
        self.packets_blocked = 0
        self.attacks_detected = 0
        self.normal_traffic = 0
        self.start_time = time.time()

    def record_detection(self, is_attack, latency_ms):
        self.detection_latencies.append(latency_ms)
        if is_attack:
            self.attacks_detected += 1
        else:
            self.normal_traffic += 1

    def record_blocked_packet(self):
        self.packets_blocked += 1

    def get_summary(self):
        if not self.detection_latencies:
            return {
                "total_packets_processed": 0,
                "attacks_detected": 0,
                "normal_traffic": 0,
                "packets_blocked": self.packets_blocked,
                "avg_detection_latency_ms": 0,
                "min_latency_ms": 0,
                "max_latency_ms": 0,
                "uptime_seconds": time.time() - self.start_time
            }

        return {
            "total_packets_processed": self.attacks_detected + self.normal_traffic,
            "attacks_detected": self.attacks_detected,
            "normal_traffic": self.normal_traffic,
            "packets_blocked": self.packets_blocked,
            "avg_detection_latency_ms": sum(self.detection_latencies) / len(self.detection_latencies),
            "min_latency_ms": min(self.detection_latencies),
            "max_latency_ms": max(self.detection_latencies),
            "uptime_seconds": time.time() - self.start_time
        }


metrics = MetricsTracker()
