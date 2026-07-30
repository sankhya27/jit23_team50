# attack_classifier.py


class AttackClassifier:
    def classify_attack(self, packet_data, ensemble_result):
        """
        Determine WHAT TYPE of attack it is
        """
        attack_type = "Unknown"
        evidence = []

        # SYN FLOOD
        if packet_data.get('syn_ratio', 0) > 0.8:
            attack_type = "SYN Flood"
            evidence.append(f"SYN ratio: {packet_data['syn_ratio']*100:.1f}%")

        # UDP FLOOD
        elif packet_data.get('protocol', '').upper() == 'UDP':
            if packet_data.get('packet_size', 0) > 1000:
                attack_type = "UDP Flood"
                evidence.append(f"Large UDP packets: {packet_data['packet_size']} bytes")

        # HTTP FLOOD
        elif packet_data.get('protocol', '').upper() == 'HTTP':
            if packet_data.get('packets_from_source', 0) > 1000:
                attack_type = "HTTP GET Flood"
                evidence.append(f"High HTTP request rate: {packet_data['packets_from_source']}")

        # SLOWLORIS
        elif packet_data.get('connection_duration', 0) > 300:
            attack_type = "Slowloris"
            evidence.append(f"Long connection: {packet_data['connection_duration']}s")

        # Generic high-rate attack
        elif packet_data.get('packets_from_source', 0) > 100:
            attack_type = "Volumetric Flood"
            evidence.append(f"High packet rate: {packet_data['packets_from_source']} pkt/s")

        return {
            "attack_type": attack_type,
            "evidence": evidence,
            "confidence": ensemble_result['confidence'] if 'confidence' in ensemble_result else ensemble_result.get('ensemble_score', 0)
        }


classifier = AttackClassifier()
