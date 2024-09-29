import logging
import os
import re
import shutil

import chardet

logger = logging.getLogger("django.temp")  # noqa: F821


def create_flow_from_boilerplate(flow_run, flow_name, flow_to_clone):
    def copy_folder_contents(source_folder, destination_folder):
        os.makedirs(destination_folder)

        for item in os.listdir(source_folder):
            source_path = os.path.join(source_folder, item)
            destination_path = os.path.join(destination_folder, item)

            if os.path.isfile(source_path):
                shutil.copy2(source_path, destination_path)
            elif os.path.isdir(source_path):
                shutil.copytree(source_path, destination_path)

    def replace_file_contents_file_names_and_folders_recursively(
        replacement, to_be_replaced, directory
    ):
        for root, dirs, files in os.walk(directory):
            # Rename directories
            for dir_name in dirs:
                new_dir_name = replace_all_cases(dir_name, to_be_replaced, replacement)
                if new_dir_name != dir_name:
                    os.rename(
                        os.path.join(root, dir_name), os.path.join(root, new_dir_name)
                    )

            # Rename and modify files
            for file_name in files:
                file_path = os.path.join(root, file_name)
                new_file_name = replace_all_cases(
                    file_name, to_be_replaced, replacement
                )
                new_file_path = os.path.join(root, new_file_name)

                # Rename file if necessary
                if new_file_name != file_name:
                    os.rename(file_path, new_file_path)

                # Try to read and replace content in the file
                try:
                    with open(new_file_path, "rb") as file:
                        raw_content = file.read()

                    # Detect the file encoding
                    result = chardet.detect(raw_content)
                    encoding = result["encoding"]

                    # If it's a text file, proceed with replacement
                    if encoding and encoding.lower().startswith(
                        ("utf", "ascii", "iso")
                    ):
                        content = raw_content.decode(encoding)
                        content = replace_all_cases(
                            content, to_be_replaced, replacement
                        )

                        with open(new_file_path, "w", encoding=encoding) as file:
                            file.write(content)
                    else:
                        logger.warning(
                            f"Skipping binary or unknown encoding file: {new_file_path}"
                        )

                except Exception as e:
                    logger.error(f"Error processing file {new_file_path}: {str(e)}")

    def replace_all_cases(text, old, new):
        snake_old = to_snake_case(old)
        camel_old = to_camel_case(old)
        pascal_old = to_pascal_case(old)

        snake_new = to_snake_case(new)
        camel_new = to_camel_case(new)
        pascal_new = to_pascal_case(new)

        text = text.replace(snake_old, snake_new)
        text = text.replace(camel_old, camel_new)
        text = text.replace(pascal_old, pascal_new)

        return text

    def to_snake_case(string):
        return re.sub(r"(?<!^)(?=[A-Z])", "_", string).lower()

    def to_camel_case_v1(string):
        components = string.split("_")
        return components[0] + "".join(x.title() for x in components[1:])

    def to_pascal_case(string):
        return "".join(x.title() for x in string.split("_"))

    base_dir = "flows"
    source_dir = os.path.join(base_dir, flow_to_clone.name)
    destination_dir = os.path.join(base_dir, flow_name)

    copy_folder_contents(source_dir, destination_dir)

    # Replace contents, file names, and folder names
    replace_file_contents_file_names_and_folders_recursively(
        flow_name, flow_to_clone.name, destination_dir
    )

    logger.info(
        f"Created new flow '{flow_name}' from boilerplate '{flow_to_clone.name}'"
    )


# The rest of the code remains unchanged
