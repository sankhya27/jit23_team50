import random
import time
from urllib import request, error
import json


class DDoSSimulator:
    """Safe local simulator that sends synthetic traffic features to the Flask API."""

    def __init__(self, target_host="127.0.0.1", target_port=5000):
        if target_host not in {"localhost", "127.0.0.1"}:
            raise ValueError("This simulator is restricted to localhost for safety.")

        self.target_host = target_host
        self.target_port = target_port
        self.endpoint = f"http://{self.target_host}:{self.target_port}/api/predict"

    def _send_sample(self, payload):
        body = json.dumps(payload).encode("utf-8")
        fake_ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
        req = request.Request(
            self.endpoint,
            data=body,
            headers={
                "Content-Type": "application/json",
                "X-Forwarded-For": fake_ip
            },
            method="POST"
        )

        try:
            with request.urlopen(req, timeout=2) as response:
                return response.status, response.read().decode("utf-8")
        except error.HTTPError as exc:
            return exc.code, exc.read().decode("utf-8")
        except Exception as exc:
            return 0, str(exc)

    def _run_profile(self, duration, rate, payload_factory):
        start_time = time.time()
        samples_sent = 0
        blocked = 0
        delay = 1 / max(rate, 1)

        while time.time() - start_time < duration:
            status, _ = self._send_sample(payload_factory())
            samples_sent += 1
            if status == 429:
                blocked += 1
            time.sleep(delay)

        return {"samples_sent": samples_sent, "blocked": blocked}

    def syn_flood(self, duration=10, rate=5):
        return self._run_profile(duration, rate, lambda: {
            "packet_rate": random.randint(40000, 120000),
            "duration": random.randint(20, 250),
            "byte_count": random.randint(2000000, 12000000),
            "protocol": "TCP",
            "syn_flags": random.randint(850, 1000),
            "total_packets": 1000,
            "packets_from_source": random.randint(500, 2000),
            "avg_packet_size": random.randint(60, 120),
            "packet_count": random.randint(800, 2000)
        })

    def udp_flood(self, duration=10, packet_size=1400, rate=5):
        return self._run_profile(duration, rate, lambda: {
            "packet_rate": random.randint(30000, 100000),
            "duration": random.randint(40, 500),
            "byte_count": random.randint(5000000, 20000000),
            "protocol": "UDP",
            "packet_size": packet_size,
            "avg_packet_size": packet_size,
            "packets_from_source": random.randint(300, 1800),
            "packet_count": random.randint(500, 2500)
        })

    def http_flood(self, duration=10, concurrent_requests=10):
        rate = min(max(concurrent_requests, 1), 10)
        return self._run_profile(duration, rate, lambda: {
            "packet_rate": random.randint(5000, 25000),
            "duration": random.randint(1000, 10000),
            "byte_count": random.randint(300000, 3000000),
            "protocol": "HTTP",
            "packets_from_source": random.randint(1000, 5000),
            "avg_packet_size": random.randint(300, 900),
            "packet_count": random.randint(1000, 5000)
        })


if __name__ == "__main__":
    simulator = DDoSSimulator()
    print("Starting safe local SYN flood simulation...")
    result = simulator.syn_flood(duration=10, rate=5)
    print(f"Simulation complete: {result['samples_sent']} samples sent, {result['blocked']} blocked")
