# forensics.py
from datetime import datetime
import json
import os


class ForensicReport:
    def __init__(self):
        self.incidents = []

    def generate_incident_report(self,
                                  attack_id,
                                  attack_type,
                                  source_ip,
                                  start_time,
                                  duration_sec,
                                  packets_count,
                                  detection_latency_ms,
                                  mitigation_effectiveness_pct,
                                  ensemble_scores):
        """
        Create detailed forensic report
        """
        report = {
            "incident_id": attack_id,
            "timestamp": datetime.now().isoformat(),
            "attack_details": {
                "type": attack_type,
                "source_ip": source_ip,
                "start_time": start_time,
                "duration_seconds": duration_sec,
                "total_packets": packets_count,
            },
            "detection": {
                "detection_latency_ms": detection_latency_ms,
                "ml_score": ensemble_scores.get('ml_score', 0),
                "heuristic_score": ensemble_scores.get('heuristic_score', 0),
                "anomaly_score": ensemble_scores.get('anomaly_score', 0),
                "ensemble_score": ensemble_scores.get('ensemble_score', 0),
            },
            "mitigation": {
                "effectiveness_percentage": mitigation_effectiveness_pct,
                "packets_blocked": packets_count,
                "actions_taken": [
                    "IP rate-limited to 10 packets/sec",
                    f"IP {source_ip} added to blocklist",
                    "Alert sent to security team"
                ]
            },
            "recommendations": [
                "Monitor for similar attack patterns",
                "Consider GeoIP filtering if source is from unexpected region",
                "Increase monitoring sensitivity for this attack type"
            ]
        }

        self.incidents.append(report)
        return report

    def save_report(self, incident_id, filename=None):
        """Save report to JSON file"""
        if filename is None:
            filename = f"incident_{incident_id}_{datetime.now().timestamp()}.json"

        incident = next((i for i in self.incidents if i['incident_id'] == incident_id), None)

        if incident:
            with open(filename, 'w') as f:
                json.dump(incident, f, indent=2)
            return filename
        return None


forensics = ForensicReport()
