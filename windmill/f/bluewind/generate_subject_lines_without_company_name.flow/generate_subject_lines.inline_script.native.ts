export async function main(
  recipient_first_name: string,
  custom_subject_lines: string
): Promise<any> {
  const subjectLines = [
    "quick question",
    `${recipient_first_name}, thoughts?`,
  ];


  if (custom_subject_lines) {
    subjectLines.push(custom_subject_lines);
  }

  const randomIndex = Math.floor(Math.random() * subjectLines.length);
  const pickedSubjectLine = subjectLines[randomIndex];

  return {
    subject_lines: subjectLines,
    picked_subject_line: pickedSubjectLine,
  };
}