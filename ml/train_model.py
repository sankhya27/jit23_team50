import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score
import joblib
import os

ML_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(ML_DIR, 'data')
BACKEND_DIR = os.path.join(ML_DIR, '..', 'backend')

CICIDS_FILE = os.path.join(
    DATA_DIR,
    'Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'
)

FEATURE_MAP = {
    'packet_rate': 'Flow Packets/s',
    'duration': 'Flow Duration',
    'byte_count': 'Total Length of Fwd Packets'
}


def _clean_columns(df):
    df.columns = df.columns.str.strip()
    return df


def load_cicids_dataset(sample_size=15000):
    if not os.path.exists(CICIDS_FILE):
        return None

    print(f"Loading CICIDS2017 from {CICIDS_FILE}...")
    df = pd.read_csv(CICIDS_FILE, low_memory=False)
    df = _clean_columns(df)

    df = df.replace([np.inf, -np.inf], np.nan).dropna(
        subset=list(FEATURE_MAP.values()) + ['Label']
    )

    df['target'] = df['Label'].apply(
        lambda x: 0 if str(x).strip().upper() == 'BENIGN' else 1
    )

    if len(df) > sample_size:
        df = df.sample(n=sample_size, random_state=42)

    X = df[[FEATURE_MAP['packet_rate'], FEATURE_MAP['duration'], FEATURE_MAP['byte_count']]].values
    y = df['target'].values
    return X, y


def load_fallback_dataset():
    print("CICIDS2017 file not found - using fallback sample.")
    print(f"Place the CSV at: {CICIDS_FILE}")
    X = np.array([
        [10, 120000, 500], [15, 98000, 600], [8, 150000, 400],
        [12, 110000, 550], [20, 90000, 700], [5, 200000, 300],
        [50000, 100, 5000000], [80000, 50, 8000000],
        [120000, 30, 12000000], [60000, 80, 6000000],
    ])
    y = np.array([0, 0, 0, 0, 0, 0, 1, 1, 1, 1])
    return X, y


def train_model():
    print("Training ML Model for DDoS Detection (CICIDS2017)...")

    data = load_cicids_dataset()
    if data is None:
        X, y = load_fallback_dataset()
    else:
        X, y = data
        print(f"Loaded {len(y)} samples - Attacks: {y.sum()}, Normal: {len(y) - y.sum()}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    print(f"\nAccuracy: {accuracy_score(y_test, y_pred):.4f}")
    print(classification_report(y_test, y_pred, target_names=['Normal', 'Attack']))

    os.makedirs(BACKEND_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(BACKEND_DIR, 'model.pkl'))
    joblib.dump(scaler, os.path.join(BACKEND_DIR, 'scaler.pkl'))
    joblib.dump(FEATURE_MAP, os.path.join(BACKEND_DIR, 'feature_config.pkl'))

    print(f"\nModel saved to {os.path.join(BACKEND_DIR, 'model.pkl')}")


if __name__ == '__main__':
    train_model()
