# mitigation.py
import time
from collections import defaultdict
from threading import Lock


class MitigationEngine:
    def __init__(self):
        self.blocked_ips = set()
        self.rate_limit_tracker = defaultdict(list)
        self.lock = Lock()

    # 1️⃣ RATE LIMITING
    def check_rate_limit(self, ip_address, max_packets_per_sec=10):
        """
        Token bucket algorithm
        - If IP sends >10 packets/sec, drop the rest
        - Returns True if packet should be dropped
        """
        current_time = time.time()

        with self.lock:
            # Clean old timestamps (older than 1 second)
            self.rate_limit_tracker[ip_address] = [
                ts for ts in self.rate_limit_tracker[ip_address]
                if current_time - ts < 1.0
            ]

            # Check if exceeds limit
            if len(self.rate_limit_tracker[ip_address]) >= max_packets_per_sec:
                return True  # DROP THIS PACKET

            # Record this packet
            self.rate_limit_tracker[ip_address].append(current_time)
            return False  # ALLOW

    # 2️⃣ IP BLOCKING
    def block_ip(self, ip_address):
        """
        Add IP to blocklist
        - Future packets from this IP are dropped immediately
        """
        with self.lock:
            self.blocked_ips.add(ip_address)
            print(f"🚫 BLOCKED: {ip_address}")

    def is_blocked(self, ip_address):
        """Check if IP is in blocklist"""
        return ip_address in self.blocked_ips

    def unblock_ip(self, ip_address):
        """Remove IP from blocklist (after threat passes)"""
        with self.lock:
            self.blocked_ips.discard(ip_address)

    # 3️⃣ MAIN MITIGATION DECISION
    def should_block_packet(self, ip_address, attack_type="unknown"):
        """
        Make blocking decision
        - If IP is already blocked -> DROP
        - If rate limit exceeded -> DROP
        - Otherwise -> ALLOW
        """
        # Check if IP is blocked
        if self.is_blocked(ip_address):
            return True

        # Check rate limit
        if self.check_rate_limit(ip_address, max_packets_per_sec=10):
            return True

        return False  # Allow packet

    # 4️⃣ GET STATUS
    def get_status(self):
        """Return mitigation status"""
        return {
            "blocked_ips": list(self.blocked_ips),
            "blocked_count": len(self.blocked_ips),
            "tracked_ips": len(self.rate_limit_tracker)
        }


# Global mitigation engine
mitigation = MitigationEngine()
