export async function main(
  recipient_first_name: string
): Promise<any> {
  const salutations = [
    `Hi ${recipient_first_name}, `,
    `Hi ${recipient_first_name} - `,
  ];

  const randomIndex = Math.floor(Math.random() * salutations.length);
  const pickedSalutation = salutations[randomIndex];

  return {
    salutations: salutations,
    picked_salutation: pickedSalutation,
  };
}