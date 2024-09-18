import base64


def base64_utils_after_create(self):
    if self.operation == "encode":
        self.output_text = base64.b64encode(self.input_text.encode()).decode()
    else:
        self.output_text = base64.b64decode(self.input_text).decode()
