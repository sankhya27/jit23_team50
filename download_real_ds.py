"""
Download the real CIC-IDS2017 Friday DDoS dataset.

Steps:
  1. Go to https://www.kaggle.com/datasets/cicdataset/cicids2017
  2. Download the dataset
  3. Extract and place 'Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'
     into the ml/data/ folder
  4. Run: python ml/train_model.py
"""
import os

OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ml', 'data')
TARGET_FILE = 'Friday-WorkingHours-Afternoon-DDos.pcap_ISCX.csv'
TARGET_PATH = os.path.join(OUT_DIR, TARGET_FILE)

os.makedirs(OUT_DIR, exist_ok=True)

if os.path.exists(TARGET_PATH):
    size_kb = os.path.getsize(TARGET_PATH) / 1024
    print(f"Dataset already exists at:\n  {TARGET_PATH}")
    print(f"  Size: {size_kb:.1f} KB")
    print("\nYou're all set! Run 'python ml/train_model.py' to train the model.")
else:
    print("Dataset not found!")
    print(f"\nPlease download the CIC-IDS2017 dataset manually:")
    print(f"  1. Visit: https://www.kaggle.com/datasets/cicdataset/cicids2017")
    print(f"  2. Download and extract the archive")
    print(f"  3. Copy '{TARGET_FILE}' into:\n     {OUT_DIR}")
    print(f"  4. Then run: python ml/train_model.py")
