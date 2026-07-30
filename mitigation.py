import time
from collections import defaultdict
from threading import Lock


class MitigationEngine:
    def __init__(self):
        self.blocked_ips = set()
        self.rate_limit_tracker = defaultdict(list)
        self.lock = Lock()

    def check_rate_limit(self, ip_address, max_packets_per_sec=10):
        current_time = time.time()

        with self.lock:
            self.rate_limit_tracker[ip_address] = [
                ts for ts in self.rate_limit_tracker[ip_address]
                if current_time - ts < 1.0
            ]

            if len(self.rate_limit_tracker[ip_address]) >= max_packets_per_sec:
                return True

            self.rate_limit_tracker[ip_address].append(current_time)
            return False

    def block_ip(self, ip_address):
        with self.lock:
            self.blocked_ips.add(ip_address)
            print(f"BLOCKED: {ip_address}")

    def is_blocked(self, ip_address):
        with self.lock:
            return ip_address in self.blocked_ips

    def unblock_ip(self, ip_address):
        with self.lock:
            self.blocked_ips.discard(ip_address)

    def should_block_packet(self, ip_address, attack_type="unknown"):
        if self.is_blocked(ip_address):
            return True

        if self.check_rate_limit(ip_address, max_packets_per_sec=10):
            return True

        return False

    def get_status(self):
        with self.lock:
            return {
                "blocked_ips": list(self.blocked_ips),
                "blocked_count": len(self.blocked_ips),
                "tracked_ips": len(self.rate_limit_tracker)
            }


mitigation = MitigationEngine()
