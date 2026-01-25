import re
import os

def bump_version(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find current version to display (assuming all are the same or we just take the first one)
    match = re.search(r'\?v=(\d+)', content)
    current_version = int(match.group(1)) if match else 0
    new_version = current_version + 1
    
    print(f"Bumping version from {current_version} to {new_version} in {file_path}")

    # Replace all occurrences of ?v=NUMBER with ?v=NEW_NUMBER
    new_content = re.sub(r'\?v=\d+', f'?v={new_version}', content)

    with open(file_path, 'w') as f:
        f.write(new_content)

def bump_service_worker_version(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
        
    # Find current cache version
    match = re.search(r"const CACHE_NAME = 'cron-game-v(\d+)';", content)
    if match:
        current_version = int(match.group(1))
        new_version = current_version + 1
        print(f"Bumping Service Worker cache version from {current_version} to {new_version} in {file_path}")
        
        new_content = re.sub(r"const CACHE_NAME = 'cron-game-v\d+';", f"const CACHE_NAME = 'cron-game-v{new_version}';", content)
        
        with open(file_path, 'w') as f:
            f.write(new_content)
    else:
        print(f"Warning: CACHE_NAME not found in {file_path}")

if __name__ == "__main__":
    # Bump index.html assets
    target_file = 'index.html'
    if os.path.exists(target_file):
        bump_version(target_file)
    else:
        print(f"Error: {target_file} not found")

    # Bump Service Worker cache
    sw_file = 'service-worker.js'
    if os.path.exists(sw_file):
        bump_service_worker_version(sw_file)
    else:
        print(f"Error: {sw_file} not found")
