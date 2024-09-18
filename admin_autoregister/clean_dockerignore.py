import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def clean_dockerignore():
    dockerignore_path = os.path.join(base_dir, ".dockerignore")

    with open(dockerignore_path, "r") as f:
        lines = f.readlines()

    # Keep the first line (assumed to be the wildcard *)
    first_line = lines[0] if lines else ""

    # Remove duplicates and sort the rest of the lines
    unique_sorted_lines = sorted(set(lines[1:]))

    # Write back to the file
    with open(dockerignore_path, "w") as f:
        f.write(first_line)  # Write the first line (wildcard) unchanged
        f.writelines(unique_sorted_lines)  # Write the rest of the sorted, unique lines
