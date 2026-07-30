class HeuristicDetection:

    def __init__(self):

        self.rules = {

            # SYN flood
            "syn_ratio": 0.75,

            # Normal traffic is usually below 250
            "same_source_threshold": 500,

            # Large packets only
            "packet_size_threshold": 1200,

            # High PPS
            "packet_rate_threshold": 10000,

            # Large traffic volume
            "byte_threshold": 1000000

        }

    # -------------------------------------------------

    def check_syn_flood(self, packet_data):

        syn_count = float(packet_data.get("syn_flags", 0))

        total = float(packet_data.get("total_packets", 1))

        if total == 0:

            return False

        return (syn_count / total) >= self.rules["syn_ratio"]

    # -------------------------------------------------

    def check_packet_rate(self, packet_data):

        return float(

            packet_data.get("packet_rate", 0)

        ) >= self.rules["packet_rate_threshold"]

    # -------------------------------------------------

    def check_source_rate(self, packet_data):

        return float(

            packet_data.get("packets_from_source", 0)

        ) >= self.rules["same_source_threshold"]

    # -------------------------------------------------

    def check_packet_size(self, packet_data):

        size = max(

            float(packet_data.get("avg_packet_size", 0)),

            float(packet_data.get("packet_size", 0))

        )

        return size >= self.rules["packet_size_threshold"]

    # -------------------------------------------------

    def check_byte_volume(self, packet_data):

        return float(

            packet_data.get("byte_count", 0)

        ) >= self.rules["byte_threshold"]

    # -------------------------------------------------

    def get_heuristic_score(self, packet_data):

        score = 0.0

        if self.check_syn_flood(packet_data):

            score += 0.35

        if self.check_packet_rate(packet_data):

            score += 0.25

        if self.check_source_rate(packet_data):

            score += 0.20

        if self.check_packet_size(packet_data):

            score += 0.10

        if self.check_byte_volume(packet_data):

            score += 0.10

        return min(score, 1.0)


heuristic = HeuristicDetection()