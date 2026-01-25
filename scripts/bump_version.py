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

if __name__ == "__main__":
    target_file = 'index.html'
    if os.path.exists(target_file):
        bump_version(target_file)
    else:
        print(f"Error: {target_file} not found")
