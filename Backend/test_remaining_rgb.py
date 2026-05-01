import os
from ultralytics import YOLO

input_dir = r"V:\GIR\2104_model_rgb_final\EXTRA_folder"
output_dir = r"V:\GIR\Final model\RGB\testing_2104_with finalmodel"
predict_subdir = os.path.join(output_dir, "predict")
model_path = r"V:\GIR\Final model\RGB\train_4(final)\detect\train-4\weights\best.pt"

print(f"Loading model from {model_path}...")
model = YOLO(model_path)

os.makedirs(output_dir, exist_ok=True)

# Collect already-processed basenames from BOTH root output dir AND predict/ subfolder
processed_basenames = set()
for search_dir in [output_dir, predict_subdir]:
    if os.path.isdir(search_dir):
        for f in os.listdir(search_dir):
            if os.path.isfile(os.path.join(search_dir, f)):
                processed_basenames.add(os.path.splitext(f)[0])

print(f"Already processed: {len(processed_basenames)} files found in output folders.")

input_files = sorted([
    f for f in os.listdir(input_dir)
    if os.path.isfile(os.path.join(input_dir, f))
    and f.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm'))
])

print(f"Total input videos: {len(input_files)}")

remaining = [f for f in input_files if os.path.splitext(f)[0] not in processed_basenames]
print(f"Remaining to process: {len(remaining)}")
for f in remaining:
    print(f"  - {f}")

for input_file in remaining:
    print(f"\nProcessing: {input_file}")
    source_path = os.path.join(input_dir, input_file)

    results = model.predict(
        source=source_path,
        project=output_dir,
        name=".",
        exist_ok=True,
        device=0,
        imgsz=896,
        conf=0.35,
        iou=0.5,
        save=True,
        stream=True
    )
    for r in results:
        pass  # consume generator frame-by-frame (prevents OOM)

print("\nFinished processing all remaining videos.")
