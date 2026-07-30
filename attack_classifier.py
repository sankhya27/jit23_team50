class AttackClassifier:
    def _severity_from_confidence(self, confidence):
        if confidence >= 0.9:
            return "Critical"
        if confidence >= 0.75:
            return "High"
        if confidence >= 0.5:
            return "Medium"
        return "Low"

    def classify_attack(self, packet_data, ensemble_result):
        attack_type = "Unknown"
        evidence = []

        syn_ratio = float(packet_data.get("syn_ratio", 0) or 0)
        if not syn_ratio:
            syn_flags = float(packet_data.get("syn_flags", 0) or 0)
            total_packets = float(packet_data.get("total_packets", 1) or 1)
            syn_ratio = syn_flags / total_packets if total_packets > 0 else 0

        protocol = str(packet_data.get("protocol", "")).upper()
        packet_size = float(packet_data.get("packet_size", packet_data.get("avg_packet_size", 0)) or 0)
        packets_from_source = float(packet_data.get("packets_from_source", 0) or 0)
        connection_duration = float(packet_data.get("connection_duration", packet_data.get("duration", 0)) or 0)
        icmp_ratio = float(packet_data.get("icmp_ratio", 0) or 0)
        dns_ratio = float(packet_data.get("dns_ratio", 0) or 0)
        ack_ratio = float(packet_data.get("ack_ratio", 0) or 0)

        if syn_ratio > 0.8:
            attack_type = "SYN Flood"
            evidence.append(f"SYN ratio: {syn_ratio * 100:.1f}%")
        elif protocol == "UDP" and packet_size > 1000:
            attack_type = "UDP Flood"
            evidence.append(f"Large UDP packets: {packet_size:.0f} bytes")
        elif protocol == "ICMP" or icmp_ratio > 0.6:
            attack_type = "ICMP Flood"
            evidence.append(f"ICMP ratio: {icmp_ratio * 100:.1f}%")
        elif dns_ratio > 0.6:
            attack_type = "DNS Amplification"
            evidence.append(f"DNS amplification ratio: {dns_ratio * 100:.1f}%")
        elif ack_ratio > 0.7:
            attack_type = "ACK Flood"
            evidence.append(f"ACK ratio: {ack_ratio * 100:.1f}%")
        elif protocol == "HTTP" and packets_from_source > 1000:
            attack_type = "HTTP GET Flood"
            evidence.append(f"High HTTP request rate: {packets_from_source:.0f}")
        elif connection_duration > 300:
            attack_type = "Slowloris"
            evidence.append(f"Long connection: {connection_duration:.0f}s")

        if attack_type == "Unknown" and ensemble_result.get("is_attack"):
            attack_type = "Volumetric DDoS"
            evidence.append("High combined ML, heuristic, and anomaly score")

        confidence = float(ensemble_result.get("confidence", 0) or 0)
        severity = self._severity_from_confidence(confidence)

        return {
            "attack_type": attack_type,
            "evidence": evidence,
            "confidence": confidence,
            "severity": severity,
        }


classifier = AttackClassifier()
