# heuristic_detection.py


class HeuristicDetection:
    def __init__(self):
        self.rules = {
            "syn_flag_ratio": 0.8,        # If >80% packets have SYN = suspicious
            "same_source_threshold": 100,  # Same IP >100 packets = suspicious
            "packet_size_anomaly": 1000,   # Packets >1000 bytes = suspicious
        }

    # 1️⃣ SYN FLAG CHECK
    def check_syn_flood_heuristic(self, packet_data):
        """
        Check if packet has suspicious SYN flag pattern
        """
        syn_count = packet_data.get('syn_flags', 0)
        total_packets = packet_data.get('total_packets', 1)
        syn_ratio = syn_count / total_packets if total_packets > 0 else 0

        if syn_ratio > self.rules["syn_flag_ratio"]:
            return True  # Likely SYN flood
        return False

    # 2️⃣ SAME SOURCE CHECK
    def check_repetitive_source(self, packet_data):
        """
        Check if too many packets from same IP
        """
        packets_from_source = packet_data.get('packets_from_source', 0)

        if packets_from_source > self.rules["same_source_threshold"]:
            return True  # Likely flood
        return False

    # 3️⃣ PACKET SIZE ANOMALY
    def check_packet_size_anomaly(self, packet_data):
        """
        Check if packet sizes are unusually large
        """
        avg_packet_size = packet_data.get('avg_packet_size', 0)

        if avg_packet_size > self.rules["packet_size_anomaly"]:
            return True  # Size anomaly
        return False

    def get_heuristic_score(self, packet_data):
        """
        Calculate heuristic suspicion score (0-1)
        """
        score = 0
        factors = 0

        if self.check_syn_flood_heuristic(packet_data):
            score += 0.3
            factors += 1

        if self.check_repetitive_source(packet_data):
            score += 0.3
            factors += 1

        if self.check_packet_size_anomaly(packet_data):
            score += 0.2
            factors += 1

        return score if factors > 0 else 0


heuristic = HeuristicDetection()
